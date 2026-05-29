import { useEffect, useRef } from 'react';
import { audioService } from '../audioEngine';

export default function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set correct scaling for high-res screens
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Dynamic wave generators for idle/dream state
    let idlePhase = 0;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      
      // Clear with dark tech gradient overlay
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Add a clean tech cyber grid in the background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSpacing = 20;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const analyser = audioService.analyser;
      
      if (analyser && audioService.ctx && audioService.ctx.state === 'running') {
        // Active analysis drawing
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // 1. Draw elegant neon bars from bottom
        analyser.getByteFrequencyData(dataArray);
        
        const barWidth = (width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * height * 0.95;
          
          // Render beautiful index-based gradient
          const percent = i / bufferLength;
          let color = '#ec4899'; // defaultpink
          if (percent < 0.3) {
            color = `rgba(6, 182, 212, ${0.45 * (dataArray[i]/255)})`; // cyan fading
          } else if (percent < 0.7) {
            color = `rgba(139, 92, 246, ${0.45 * (dataArray[i]/255)})`; // purple fading
          } else {
            color = `rgba(236, 72, 153, ${0.45 * (dataArray[i]/255)})`; // pink fading
          }

          ctx.fillStyle = color;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
          
          x += barWidth;
        }

        // 2. Draw high frequency clean oscilloscope line of current waveform
        const waveData = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(waveData);

        ctx.lineWidth = 2.5;
        // Cyan glow line
        ctx.strokeStyle = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.7)';
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let waveX = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = waveData[i] / 128.0;
          const y = (v * height) / 2.0;

          if (i === 0) {
            ctx.moveTo(waveX, y);
          } else {
            ctx.lineTo(waveX, y);
          }

          waveX += sliceWidth;
        }

        ctx.lineTo(width, height / 2.0);
        ctx.stroke();
        
        // Reset shadows to avoid canvas performance bottlenecks
        ctx.shadowBlur = 0;

      } else {
        // Ambient Dreaming State (Draw beautifully floating sine waves)
        idlePhase += 0.03;
        
        // Render 3 overlapping sinewaves with differing speeds & frequencies
        const drawSine = (amplitude: number, speed: number, color: string, thickness: number, freq: number) => {
          ctx.lineWidth = thickness;
          ctx.strokeStyle = color;
          ctx.beginPath();
          
          for (let x = 0; x < width; x++) {
            const y = height / 2 + Math.sin(x * freq + idlePhase * speed) * amplitude;
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        };

        // Redundant layer glows
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(99, 102, 241, 0.4)';
        drawSine(12, 1.0, 'rgba(99, 102, 241, 0.35)', 2, 0.007);
        
        ctx.shadowColor = 'rgba(236, 72, 153, 0.4)';
        drawSine(18, -0.7, 'rgba(236, 72, 153, 0.3)', 1.5, 0.012);
        
        ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
        drawSine(7, 1.5, 'rgba(6, 182, 212, 0.45)', 2.5, 0.005);
        
        ctx.shadowBlur = 0;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="w-full flex flex-col space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
          Stereo Spectrum Visualizer
        </span>
      </div>
      <div className="h-28 w-full bg-neutral-950 rounded-2xl border border-neutral-805 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
}
