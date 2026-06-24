'use client';
import { useEffect, useRef } from 'react';

export default function Background3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W: number, H: number, particles: any[], raf: number;
    const isMobile = window.innerWidth < 600;
    const COUNT = isMobile ? 28 : 60;

    function resize() {
      if (!canvas) return;
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function initParticles() {
      particles = Array.from({ length: COUNT }, (_, i) => {
        const a = (Math.random() * Math.PI * 2);
        const tilt = Math.random() * 0.4 + 0.1;
        const rx = W * (0.15 + Math.random() * 0.7);
        const ry = rx * tilt;
        const cx = Math.random() * W;
        const cy = Math.random() * H;
        const speed = 0.0003 + Math.random() * 0.0005;
        const r = 2 + Math.random() * 4;
        const hue = (i % 2 === 0) ? '254,44,85' : '131,58,180';
        return { a, rx, ry, cx, cy, speed, r, hue };
      });
    }

    let t = 0;
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      t += 1;

      const vignette = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.72);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(7,7,14,0.55)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      for (const p of particles) {
        p.a += p.speed;
        const x = p.cx + Math.cos(p.a) * p.rx;
        const y = p.cy + Math.sin(p.a) * p.ry;
        const depthT = (Math.sin(p.a) + 1) / 2;
        const alpha = 0.12 + depthT * 0.22;
        const size = p.r * (0.6 + depthT * 0.8);

        const g = ctx.createRadialGradient(x, y, 0, x, y, size * 6);
        g.addColorStop(0, `rgba(${p.hue},${alpha})`);
        g.addColorStop(1, `rgba(${p.hue},0)`);
        ctx.beginPath();
        ctx.arc(x, y, size * 6, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue},${alpha + 0.2})`;
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth = 1;
      const rows = 8, cols = 12;
      const cellW = W / cols, cellH = H / rows;
      const waveAmp = 6;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          const wave = Math.sin(t * 0.008 + c * 0.5) * waveAmp;
          const px = c * cellW, py = r * cellH + wave;
          c === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        for (let r = 0; r <= rows; r++) {
          const wave = Math.sin(t * 0.009 + r * 0.6) * waveAmp;
          const px = c * cellW + wave, py = r * cellH;
          r === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    initParticles();
    draw();

    let resizeTimer: any;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        initParticles();
      }, 200);
    };

    window.addEventListener('resize', handleResize);
    
    const handleVisChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        draw();
      }
    };
    document.addEventListener('visibilitychange', handleVisChange);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisChange);
    };
  }, []);

  return <canvas id="bg3d" ref={canvasRef} />;
}
