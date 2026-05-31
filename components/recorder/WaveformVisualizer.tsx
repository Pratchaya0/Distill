'use client';

import { useEffect, useRef } from 'react';
import { drawBars } from '@/lib/audio/waveform';

interface WaveformVisualizerProps {
  history: number[];
  isRecording: boolean;
}

export function WaveformVisualizer({ history, isRecording }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx?.scale(dpr, dpr);

    if (!isRecording && history.every((v) => v === 0)) {
      // Draw idle flat line
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, rect.width, rect.height);
        context.strokeStyle = 'hsl(var(--border))';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, rect.height / 2);
        context.lineTo(rect.width, rect.height / 2);
        context.stroke();
      }
      return;
    }

    drawBars(canvas, history, 'hsl(var(--primary))');
  }, [history, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-20 rounded-lg bg-muted/30"
      style={{ display: 'block' }}
    />
  );
}
