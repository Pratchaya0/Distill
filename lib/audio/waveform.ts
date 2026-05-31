export function analyseAmplitude(analyser: AnalyserNode): number {
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length); // RMS 0–1
}

export function drawBars(
  canvas: HTMLCanvasElement,
  history: number[],
  color = '#6366f1',
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const barWidth = Math.max(2, width / history.length - 1);
  const gap = 1;

  history.forEach((amplitude, i) => {
    const barHeight = Math.max(3, amplitude * height * 0.9);
    const x = i * (barWidth + gap);
    const y = (height - barHeight) / 2;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, 2);
    ctx.fill();
  });
}
