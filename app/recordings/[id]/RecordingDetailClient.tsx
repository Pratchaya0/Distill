'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import {
  Play, Pause, SkipBack, Volume2, Sparkles, FileText,
  CheckSquare, Network, StickyNote, ArrowLeft, Star, Loader2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MindMapView } from '@/components/ai/MindMapView';
import { NotesPanel } from '@/components/notes/NotesPanel';
import { db } from '@/lib/db';
import { transcribeAudio } from '@/lib/ai/transcribe';
import { processTranscript } from '@/lib/ai/process';
import { formatDuration, formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Recording } from '@/types';

// ── Audio Player ────────────────────────────────────────────────────────────

interface SeekTarget { time: number; nonce: number }

interface AudioPlayerProps {
  blob: Blob;
  seekTarget?: SeekTarget;
  onTimeUpdate?: (t: number) => void;
  getCurrentTime: React.MutableRefObject<() => number>;
}

function AudioPlayer({ blob, seekTarget, onTimeUpdate, getCurrentTime }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [url, setUrl] = useState<string | null>(null);

  // Expose a stable getCurrentTime function via ref so NotesPanel can snapshot it
  useEffect(() => {
    getCurrentTime.current = () => audioRef.current?.currentTime ?? 0;
  });

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  // Seek only when nonce changes — safe to repeat same timestamp
  useEffect(() => {
    if (seekTarget && audioRef.current) {
      audioRef.current.currentTime = seekTarget.time;
      audioRef.current.play();
    }
  }, [seekTarget?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    playing ? el.pause() : el.play();
  };

  const handleTimeUpdate = () => {
    const t = audioRef.current?.currentTime ?? 0;
    setCurrentTime(t);
    onTimeUpdate?.(t);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <audio
        ref={audioRef}
        src={url ?? undefined}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
      />

      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.1}
        value={currentTime}
        onChange={(e) => {
          if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
        }}
        className="w-full h-1.5 rounded-full accent-primary cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; }}
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button size="icon" className="w-10 h-10 rounded-full" onClick={toggle}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </Button>
        <Button variant="ghost" size="icon" title="Volume (use system controls)">
          <Volume2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────

function EmptyTabState({ label, onGenerate }: { label: string; onGenerate?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">{label} not generated yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Transcribe this recording first, then generate AI insights.
        </p>
      </div>
      {onGenerate && (
        <Button variant="outline" size="sm" className="gap-2 mt-2" onClick={onGenerate}>
          <Sparkles className="w-3.5 h-3.5" />
          Generate now
        </Button>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function RecordingDetailClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [seekTarget, setSeekTarget] = useState<SeekTarget | undefined>();
  const [activeTime, setActiveTime] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Stable ref so NotesPanel can read currentTime without being a reactive dep
  const getCurrentTimeRef = useRef<() => number>(() => 0);

  const seek = useCallback((t: number) => {
    setSeekTarget((prev) => ({ time: t, nonce: (prev?.nonce ?? 0) + 1 }));
  }, []);

  const recording = useLiveQuery(
    () => db.recordings.get(Number(id)),
    [id],
  ) as (Recording & { id: number }) | undefined | null;

  const language = recording?.language ?? 'th';

  const toggleLanguage = async () => {
    if (!recording) return;
    await db.recordings.update(recording.id, {
      language: language === 'th' ? 'en' : 'th',
    });
  };

  const getKey = (key: string) =>
    typeof window !== 'undefined' ? localStorage.getItem(key) : null;

  const handleTranscribe = useCallback(async () => {
    if (!recording) return;
    const localKey = getKey('groq_api_key') ?? getKey('openai_api_key') ?? undefined;
    setTranscribing(true);
    try {
      const segments = await transcribeAudio(recording.audioBlob, localKey, recording.language ?? 'th');
      await db.recordings.update(recording.id, { transcript: segments });
      toast.success('Transcription complete!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Transcription failed.');
    } finally {
      setTranscribing(false);
    }
  }, [recording]);

  const handleGenerate = useCallback(async () => {
    if (!recording?.transcript?.length) {
      toast.error('Transcribe the recording first.');
      return;
    }
    const localKey = getKey('groq_api_key') ?? getKey('openai_api_key') ?? undefined;
    setProcessing(true);
    try {
      const result = await processTranscript(
        recording.transcript,
        localKey,
        recording.templateId,
        recording.language ?? 'th',
      );
      await db.recordings.update(recording.id, {
        summary: result.summary,
        actionItems: result.actionItems,
        mindMap: result.mindMap,
      });
      toast.success('AI insights generated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI processing failed.');
    } finally {
      setProcessing(false);
    }
  }, [recording]);

  const toggleFavorite = async () => {
    if (!recording) return;
    await db.recordings.update(recording.id, { isFavorite: !recording.isFavorite });
  };

  const hasTranscript = (recording?.transcript?.length ?? 0) > 0;
  const hasInsights = !!recording?.summary;

  if (recording === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-muted-foreground">Recording not found.</p>
        <Button variant="link" onClick={() => router.push('/recordings')}>
          Back to recordings
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:h-screen md:overflow-hidden">
      {/* ── SAP Object Page Header ── */}
      <div className="sticky top-12 md:top-0 z-10 bg-card border-b border-border shrink-0">
        {/* Title row */}
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.push('/recordings')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">{recording.title}</h1>
            <p className="text-xs text-muted-foreground">
              {formatRelativeDate(recording.createdAt)} · {formatDuration(recording.duration)}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={toggleFavorite}>
            <Star className={cn('w-4 h-4', recording.isFavorite ? 'fill-amber-400 text-amber-400' : '')} />
          </Button>
        </div>

        {/* Action toolbar */}
        <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto">
          <button
            onClick={toggleLanguage}
            disabled={transcribing || processing}
            className="flex items-center gap-1 shrink-0 px-2 h-7 rounded-sm border border-border bg-muted text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            <span>{language === 'th' ? '🇹🇭' : '🇬🇧'}</span>
            <span className="hidden sm:inline">{language === 'th' ? 'ไทย' : 'English'}</span>
          </button>

          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs shrink-0"
            onClick={handleTranscribe} disabled={transcribing || processing}>
            {transcribing ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
            {transcribing ? 'Transcribing…' : hasTranscript ? 'Re-transcribe' : 'Transcribe'}
          </Button>

          {hasTranscript && (
            <Button size="sm" className="gap-1.5 h-7 text-xs shrink-0"
              onClick={handleGenerate} disabled={processing || transcribing}>
              {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {processing ? 'Generating…' : hasInsights ? 'Regenerate' : 'Generate AI'}
            </Button>
          )}

          {recording.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] h-5 rounded-sm shrink-0">{tag}</Badge>
          ))}
        </div>
      </div>

      {/* ── Split layout: stacked on mobile, side-by-side on desktop ── */}
      <div className="flex flex-col md:flex-row md:flex-1 md:overflow-hidden">
        {/* Left: player + transcript */}
        <div className="md:w-[40%] flex flex-col gap-3 p-4 md:border-r border-border md:overflow-y-auto">
          <AudioPlayer
            blob={recording.audioBlob}
            seekTarget={seekTarget}
            onTimeUpdate={setActiveTime}
            getCurrentTime={getCurrentTimeRef}
          />

          <div className="border border-border bg-card rounded-sm flex flex-col">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transcript</span>
              {hasTranscript && (
                <span className="ml-auto text-xs text-muted-foreground">{recording.transcript!.length} segments</span>
              )}
            </div>

            <div className="p-3 max-h-64 md:max-h-none md:flex-1 overflow-y-auto">
              {hasTranscript ? (
                <div className="space-y-0.5">
                  {recording.transcript!.map((seg, i) => {
                    const active = activeTime >= seg.start && activeTime < (seg.end || Infinity);
                    return (
                      <button
                        key={i}
                        onClick={() => seek(seg.start)}
                        className={cn(
                          'w-full text-left px-2 py-1 rounded-sm text-sm leading-relaxed transition-colors group',
                          active ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground',
                        )}
                      >
                        <span className="text-[10px] font-mono text-muted-foreground mr-2 group-hover:text-primary/70">
                          {formatDuration(seg.start)}
                        </span>
                        {seg.text}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center gap-2">
                  <p className="text-xs text-muted-foreground">No transcript yet.</p>
                  <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs"
                    onClick={handleTranscribe} disabled={transcribing}>
                    {transcribing ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                    {transcribing ? 'Transcribing…' : 'Transcribe'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: AI tabs */}
        <div className="flex-1 p-4 md:overflow-y-auto">
          <Tabs defaultValue="summary" className="flex flex-col">
            <TabsList className="w-full justify-start mb-3 shrink-0 h-8 text-xs">
              <TabsTrigger value="summary" className="gap-1 text-xs h-7 px-3">
                <Sparkles className="w-3 h-3" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-1 text-xs h-7 px-3">
                <CheckSquare className="w-3 h-3" />
                <span className="hidden sm:inline">Action </span>Items
              </TabsTrigger>
              <TabsTrigger value="mindmap" className="gap-1 text-xs h-7 px-3">
                <Network className="w-3 h-3" />
                <span className="hidden sm:inline">Mind </span>Map
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1 text-xs h-7 px-3">
                <StickyNote className="w-3 h-3" />
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              {recording.summary ? (
                <div className="border border-border bg-card rounded-sm p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{recording.summary}</p>
                </div>
              ) : (
                <EmptyTabState label="Summary" onGenerate={hasTranscript ? handleGenerate : undefined} />
              )}
            </TabsContent>

            <TabsContent value="actions">
              {recording.actionItems && recording.actionItems.length > 0 ? (
                <div className="border border-border bg-card rounded-sm p-4 space-y-2">
                  {recording.actionItems.map((item) => (
                    <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        defaultChecked={item.done}
                        onChange={async (e) => {
                          const updated = recording.actionItems!.map((a) =>
                            a.id === item.id ? { ...a, done: e.target.checked } : a,
                          );
                          await db.recordings.update(recording.id, { actionItems: updated });
                        }}
                        className="mt-0.5 accent-primary"
                      />
                      <span className="text-sm leading-relaxed group-has-[:checked]:line-through group-has-[:checked]:text-muted-foreground">
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <EmptyTabState label="Action Items" onGenerate={hasTranscript ? handleGenerate : undefined} />
              )}
            </TabsContent>

            <TabsContent value="mindmap">
              {recording.mindMap ? (
                <MindMapView markdown={recording.mindMap} />
              ) : (
                <EmptyTabState label="Mind Map" onGenerate={hasTranscript ? handleGenerate : undefined} />
              )}
            </TabsContent>

            <TabsContent value="notes">
              <NotesPanel
                recordingId={recording.id}
                getCurrentTime={() => getCurrentTimeRef.current()}
                onSeek={seek}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
