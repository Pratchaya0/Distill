'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  LayoutTemplate, Plus, Pencil, Trash2, Save, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import type { PromptTemplate } from '@/types';

// ── Built-in templates (read-only, can be cloned) ───────────────────────────

const BUILT_IN_TEMPLATES: PromptTemplate[] = [
  {
    id: 'weekly-sync',
    name: 'Weekly Sync',
    description: 'Extract key updates, blockers, and team action items from a weekly standup or sync.',
    tags: ['Team', 'Meeting'],
    systemPrompt: 'Focus on: team updates, blockers, decisions made, and action items with owners.',
    isBuiltIn: true,
  },
  {
    id: 'brainstorm',
    name: 'Brainstorming Session',
    description: 'Capture ideas, cluster themes, and surface the most promising concepts.',
    tags: ['Creative', 'Ideas'],
    systemPrompt: 'Focus on: ideas proposed, themes that emerged, and the most promising concepts to pursue.',
    isBuiltIn: true,
  },
  {
    id: 'interview',
    name: 'Interview',
    description: 'Summarise candidate responses, highlight strengths and concerns, suggest next steps.',
    tags: ['HR', 'Hiring'],
    systemPrompt: 'Focus on: candidate responses to key questions, strengths demonstrated, concerns raised, and recommended next steps.',
    isBuiltIn: true,
  },
  {
    id: 'lecture',
    name: 'Lecture / Lesson',
    description: 'Produce structured notes, key concepts, and a study Q&A from a lecture recording.',
    tags: ['Education'],
    systemPrompt: 'Focus on: key concepts explained, important definitions, and notable examples. Action items should be study questions.',
    isBuiltIn: true,
  },
  {
    id: '1on1',
    name: '1-on-1',
    description: 'Capture personal development points, feedback, and follow-up items from a 1-on-1.',
    tags: ['Management', 'Meeting'],
    systemPrompt: 'Focus on: personal development points, feedback exchanged, commitments made, and follow-up items.',
    isBuiltIn: true,
  },
];

// ── Built-in card ────────────────────────────────────────────────────────────

function BuiltInCard({ template }: { template: PromptTemplate }) {
  const [expanded, setExpanded] = useState(false);

  const cloneToCustom = async () => {
    const customId = `custom-${Date.now()}`;
    await db.templates.put({
      id: customId,
      name: `${template.name} (Custom)`,
      description: template.description,
      tags: [...template.tags],
      systemPrompt: template.systemPrompt,
    });
    toast.success('Template cloned — edit it in the Custom section below.');
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <LayoutTemplate className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-sm">{template.name}</h3>
            {template.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">{tag}</Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" onClick={cloneToCustom}>
            <Plus className="w-3 h-3" />
            Customize
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? 'Hide prompt' : 'Show prompt'}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4">
          <Separator className="mb-3" />
          <p className="text-xs text-muted-foreground font-mono bg-muted rounded-lg p-3">
            {template.systemPrompt}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Custom card (editable) ───────────────────────────────────────────────────

function CustomCard({ template }: { template: PromptTemplate }) {
  const [editing, setEditing] = useState(template.name === '' || template.systemPrompt === '');
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [prompt, setPrompt] = useState(template.systemPrompt);
  const [tagInput, setTagInput] = useState(template.tags.join(', '));

  const save = async () => {
    if (!name.trim()) { toast.error('Template name is required.'); return; }
    await db.templates.put({
      ...template,
      name: name.trim(),
      description: description.trim(),
      systemPrompt: prompt.trim(),
      tags: tagInput.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setEditing(false);
    toast.success('Template saved.');
  };

  const remove = async () => {
    if (!confirm(`Delete "${template.name}"?`)) return;
    await db.templates.delete(template.id);
    toast.success('Template deleted.');
  };

  if (!editing) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
          <LayoutTemplate className="w-4 h-4 text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-sm">{template.name}</h3>
            {template.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">{tag}</Badge>
            ))}
          </div>
          {template.description && (
            <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
          )}
          <p className="text-xs font-mono text-muted-foreground mt-2 line-clamp-2 bg-muted rounded px-2 py-1">
            {template.systemPrompt || <em>No prompt set</em>}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-destructive hover:text-destructive"
            onClick={remove}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/40 bg-card p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tags (comma-separated)</Label>
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Meeting, Team" className="h-8 text-sm" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this template for?" className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">System Prompt Hint *</Label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Focus on: key decisions, action items, and follow-ups…"
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(false)}>
          <X className="w-3.5 h-3.5" /> Cancel
        </Button>
        <Button size="sm" className="gap-1.5" onClick={save}>
          <Save className="w-3.5 h-3.5" /> Save
        </Button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const customTemplates = useLiveQuery(
    () => db.templates.toArray(),
    [],
  ) as PromptTemplate[] | undefined;

  const addCustom = async () => {
    await db.templates.put({
      id: `custom-${Date.now()}`,
      name: '',
      description: '',
      systemPrompt: '',
      tags: [],
    });
  };

  return (
    <div className="px-8 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Prompt hints that shape how AI processes your recordings. Click a recording&apos;s template field to apply one.
        </p>
      </div>

      {/* Built-in */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Built-in
        </h2>
        <div className="flex flex-col gap-3">
          {BUILT_IN_TEMPLATES.map((t) => (
            <BuiltInCard key={t.id} template={t} />
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Custom */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Custom ({customTemplates?.length ?? 0})
          </h2>
          <Button variant="outline" size="sm" className="gap-2" onClick={addCustom}>
            <Plus className="w-3.5 h-3.5" />
            New Template
          </Button>
        </div>

        {!customTemplates || customTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No custom templates yet. Click &quot;Customize&quot; on a built-in to start from a copy, or create one from scratch.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {customTemplates.map((t) => (
              <CustomCard key={t.id} template={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
