import { analyseAmplitude } from './waveform';

export class ScreenRecorder {
  onAmplitude: (value: number) => void = () => {};

  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private rafId: number | null = null;

  async start(): Promise<void> {
    // Chrome requires video:true; we stop the video track immediately after
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    // Drop video tracks — we only want audio
    displayStream.getVideoTracks().forEach((t) => t.stop());

    const audioTracks = displayStream.getAudioTracks();
    if (audioTracks.length === 0) {
      displayStream.getTracks().forEach((t) => t.stop());
      throw new Error(
        'No audio track found. Make sure to tick "Share audio" in the browser prompt.',
      );
    }

    this.stream = new MediaStream(audioTracks);

    this.audioCtx = new AudioContext();
    const source = this.audioCtx.createMediaStreamSource(this.stream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm',
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.start(100);
    this.startAmplitudeLoop();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mediaRecorder!.mimeType });
        this.cleanup();
        resolve(blob);
      };
      this.mediaRecorder.stop();
      this.stopAmplitudeLoop();
    });
  }

  cancel(): void {
    this.stopAmplitudeLoop();
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  private startAmplitudeLoop(): void {
    const tick = () => {
      if (this.analyser) this.onAmplitude(analyseAmplitude(this.analyser));
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopAmplitudeLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private cleanup(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioCtx?.close();
    this.stream = null;
    this.audioCtx = null;
    this.analyser = null;
    this.mediaRecorder = null;
    this.chunks = [];
  }
}
