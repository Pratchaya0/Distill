'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Monitor, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModeToggle } from './ModeToggle';
import { WaveformVisualizer } from './WaveformVisualizer';
import { MicRecorder } from '@/lib/audio/recorder';
import { ScreenRecorder } from '@/lib/audio/screenCapture';
import { db } from '@/lib/db';
import { formatDuration, generateTitle } from '@/lib/utils';
import { toast } from 'sonner';
import type { RecorderState, CaptureMode } from '@/types';

const HISTORY_SIZE = 80;

type AnyRecorder = MicRecorder | ScreenRecorder;

export function RecorderPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [state, setState] = useState<RecorderState>('idle');
  const [mode, setMode] = useState<CaptureMode>('mic');
  const [elapsed, setElapsed] = useState(0);
  const [title, setTitle] = useState('');
  const [waveHistory, setWaveHistory] = useState<number[]>(Array(HISTORY_SIZE).fill(0));

  const recorderRef = useRef<AnyRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => stopTimer(), []);

  const handleStart = useCallback(async () => {
    try {
      const recorder: AnyRecorder =
        mode === 'screen' ? new ScreenRecorder() : new MicRecorder();
      recorderRef.current = recorder;

      recorder.onAmplitude = (value) => {
        setWaveHistory((prev) => [...prev.slice(1), value]);
      };

      await recorder.start();
      setState('recording');
      startTimer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (mode === 'screen') {
        toast.error(msg || 'Could not capture screen audio. Make sure to tick "Share audio".');
      } else {
        toast.error('Could not access microphone. Check browser permissions.');
      }
    }
  }, [mode]);

  const handleStop = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    setState('processing');
    stopTimer();

    try {
      const blob = await recorder.stop();
      const finalTitle = title.trim() || generateTitle();

      const id = await db.recordings.add({
        title: finalTitle,
        duration: elapsed,
        audioBlob: blob,
        tags: [],
        isFavorite: false,
        language: 'th',
        createdAt: new Date(),
      });

      setState('saved');
      toast.success('Recording saved!');
      onClose();
      router.push(`/recordings/${id}`);
    } catch {
      toast.error('Failed to save recording.');
      setState('idle');
    }
  }, [elapsed, title, onClose, router]);

  const handleCancel = useCallback(() => {
    recorderRef.current?.cancel();
    stopTimer();
    setState('idle');
    setElapsed(0);
    setWaveHistory(Array(HISTORY_SIZE).fill(0));
  }, []);

  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';

  return (
    <div className="flex flex-col gap-6 p-6">
      <ModeToggle mode={mode} onChange={setMode} disabled={isRecording || isProcessing} />

      <WaveformVisualizer history={waveHistory} isRecording={isRecording} />

      <div className="text-center">
        <span className="text-4xl font-mono font-light tabular-nums tracking-tight">
          {formatDuration(elapsed)}
        </span>
        {isRecording && (
          <span className="ml-3 inline-flex items-center gap-1 text-sm text-destructive">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            Recording
          </span>
        )}
      </div>

      {(isRecording || isProcessing) && (
        <Input
          placeholder="Recording title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isProcessing}
        />
      )}

      <div className="flex justify-center gap-3">
        {!isRecording && !isProcessing && (
          <Button size="lg" className="gap-2 px-8 rounded-full" onClick={handleStart}>
            {mode === 'mic' ? (
              <Mic className="w-5 h-5" />
            ) : (
              <Monitor className="w-5 h-5" />
            )}
            Start Recording
          </Button>
        )}

        {isRecording && (
          <>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="gap-2 px-8 rounded-full"
              onClick={handleStop}
            >
              <Square className="w-4 h-4 fill-current" />
              Stop & Save
            </Button>
          </>
        )}

        {isProcessing && (
          <Button size="lg" disabled className="gap-2 px-8 rounded-full">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving…
          </Button>
        )}
      </div>

      {!isRecording && !isProcessing && (
        <p className="text-center text-xs text-muted-foreground">
          {mode === 'mic'
            ? 'Your microphone will be requested when you start.'
            : 'A browser picker will ask which tab or window to capture. Tick "Share audio" in the dialog.'}
        </p>
      )}
    </div>
  );
}
