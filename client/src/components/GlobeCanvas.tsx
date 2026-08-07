import { useEffect, useRef } from 'react';

/** Animated wireframe globe drawn on Canvas. Accepts `size` in CSS px. */
export default function GlobeCanvas({ size = 120 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let rotation = 0;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - (size > 60 ? 4 : 2);

    function draw() {
      ctx.clearRect(0, 0, size, size);

      // Glow
      const glow = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.4);
      glow.addColorStop(0, 'rgba(163, 230, 53, 0.15)');
      glow.addColorStop(0.5, 'rgba(163, 230, 53, 0.05)');
      glow.addColorStop(1, 'rgba(163, 230, 53, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      // Globe body
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      grad.addColorStop(0, '#2a3a1a');
      grad.addColorStop(0.5, '#1a2a10');
      grad.addColorStop(1, '#0a1408');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.clip();

      // Grid lines (longitude)
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.2)';
      ctx.lineWidth = size > 60 ? 0.6 : 0.4;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI + rotation;
        const xOff = Math.cos(angle) * r;
        ctx.beginPath();
        ctx.ellipse(cx + xOff * 0.1, cy, Math.abs(xOff) * 0.5 + 2, r, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Grid lines (latitude)
      for (let i = 1; i < 6; i++) {
        const yPos = cy - r + (2 * r * i) / 6;
        const latR = Math.sqrt(r * r - (yPos - cy) * (yPos - cy));
        ctx.beginPath();
        ctx.ellipse(cx, yPos, latR, latR * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Continent-like patches (abstract)
      ctx.fillStyle = 'rgba(163, 230, 53, 0.12)';
      const patches = [
        { x: 0.3, y: 0.35, w: 0.25, h: 0.2 },
        { x: 0.55, y: 0.4, w: 0.2, h: 0.25 },
        { x: 0.2, y: 0.6, w: 0.15, h: 0.15 },
        { x: 0.6, y: 0.65, w: 0.18, h: 0.12 },
      ];
      patches.forEach(p => {
        const px = cx - r + (p.x + Math.sin(rotation) * 0.05) * 2 * r;
        const py = cy - r + p.y * 2 * r;
        ctx.beginPath();
        ctx.ellipse(px, py, p.w * r, p.h * r, rotation * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Bright dots (cities / nodes)
      ctx.fillStyle = '#a3e635';
      ctx.shadowColor = '#a3e635';
      ctx.shadowBlur = size > 60 ? 4 : 2;
      const dots = [
        { a: rotation, lat: 0.3 },
        { a: rotation + 1.2, lat: -0.2 },
        { a: rotation + 2.5, lat: 0.1 },
        { a: rotation + 3.8, lat: -0.35 },
        { a: rotation + 5.0, lat: 0.25 },
      ];
      dots.forEach(d => {
        const cosA = Math.cos(d.a);
        if (cosA < 0) return; // behind globe
        const x = cx + Math.sin(d.a) * r * 0.8 * Math.cos(d.lat);
        const y = cy + d.lat * r * 1.5;
        if (x < cx - r || x > cx + r || y < cy - r || y > cy + r) return;
        ctx.beginPath();
        ctx.arc(x, y, size > 60 ? 1.5 : 1, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      ctx.restore();

      // Edge ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.3)';
      ctx.lineWidth = size > 60 ? 1 : 0.7;
      ctx.stroke();

      rotation += 0.003;
      frameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
    />
  );
}
