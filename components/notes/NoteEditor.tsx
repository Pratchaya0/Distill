'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import {
  Bold, Italic, List, ListOrdered, Strikethrough,
  ImagePlus, Trash2, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Note } from '@/types';

interface NoteEditorProps {
  note: Note & { id: number };
  onSeek: (t: number) => void;
}

function ToolbarBtn({
  onClick, active, children, title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        'p-1.5 rounded text-sm transition-colors',
        active
          ? 'bg-primary/20 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

export function NoteEditor({ note, onSeek }: NoteEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Build object URLs from stored Blobs
  useEffect(() => {
    const urls = note.images.map((b) => URL.createObjectURL(b));
    setImageUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [note.images]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: note.content || '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[60px] px-3 py-2 text-sm',
      },
    },
    onBlur: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== note.content) {
        db.notes.update(note.id, { content: html });
      }
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newBlobs = files.map((f) => new Blob([f], { type: f.type }));
    await db.notes.update(note.id, { images: [...note.images, ...newBlobs] });
    e.target.value = '';
  };

  const removeImage = async (index: number) => {
    const updated = note.images.filter((_, i) => i !== index);
    await db.notes.update(note.id, { images: updated });
  };

  const deleteNote = async () => {
    await db.notes.delete(note.id);
  };

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Timestamp header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <button
          onClick={() => onSeek(note.timestamp)}
          className="flex items-center gap-1.5 text-xs font-mono text-primary hover:text-primary/80 transition-colors"
          title="Jump to this moment in the recording"
        >
          <Clock className="w-3 h-3" />
          {formatDuration(note.timestamp)}
        </button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 text-muted-foreground hover:text-destructive"
          onClick={deleteNote}
          title="Delete note"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/50">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered list"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn onClick={() => fileInputRef.current?.click()} title="Attach image">
          <ImagePlus className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Image thumbnails */}
      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pb-3 pt-1">
          {imageUrls.map((url, i) => (
            <div key={i} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Attachment ${i + 1}`}
                className="w-24 h-24 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(url, '_blank')}
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
