"use client";

import { useEffect, useRef } from "react";

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  isSteel: boolean;
}

interface DocNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  checkAt: number;
  t: number;
  scale: number;
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function hexToRgb(hex: string) {
  hex = hex.replace("#", "");
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  const num = parseInt(hex, 16);
  if (isNaN(num)) return { r: 180, g: 60, b: 60 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

interface Palette {
  accent: string;
  accentRGB: { r: number; g: number; b: number };
  steelRGB: { r: number; g: number; b: number };
}

/** Fondo animado de puntos, líneas y "documentos" flotantes — línea gráfica de Sumivensa. */
export function AnimatedBackground({ density = 1 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteRef = useRef<Palette>({
    accent: "#D6293A",
    accentRGB: { r: 214, g: 41, b: 58 },
    steelRGB: { r: 107, g: 110, b: 120 },
  });

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const accent = cs.getPropertyValue("--color-accent").trim() || "#D6293A";
    const steel = cs.getPropertyValue("--color-steel-deep").trim() || "#6b6e78";
    paletteRef.current = { accent, accentRGB: hexToRgb(accent), steelRGB: hexToRgb(steel) };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let DPR = 1;
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W * DPR;
      canvas!.height = H * DPR;
      canvas!.style.width = W + "px";
      canvas!.style.height = H + "px";
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N_DOTS = Math.min(46, Math.floor((W * H) / (34000 / density)));
    const N_DOCS = Math.max(3, Math.round(6 * density));

    const dots: Dot[] = Array.from({ length: N_DOTS }, () => ({
      x: rand(0, W),
      y: rand(0, H),
      vx: rand(-0.018, 0.018),
      vy: rand(-0.014, 0.014),
      r: rand(1.1, 2.6),
      isSteel: Math.random() < 0.42,
    }));

    const DOC_W = 30;
    const DOC_H = 38;
    const docs: DocNode[] = Array.from({ length: N_DOCS }, () => ({
      x: rand(DOC_W, W - DOC_W),
      y: rand(DOC_H, H - DOC_H),
      vx: rand(-0.009, 0.009),
      vy: rand(-0.007, 0.007),
      phase: rand(0, Math.PI * 2),
      checkAt: rand(22, 42),
      t: rand(0, 10),
      scale: rand(0.85, 1.15),
    }));

    function drawDoc(d: DocNode) {
      const palette = paletteRef.current;
      const w = DOC_W * d.scale;
      const h = DOC_H * d.scale;
      const bob = Math.sin(d.t * 0.12 + d.phase) * 2.5;
      ctx!.save();
      ctx!.translate(d.x, d.y + bob);
      ctx!.globalAlpha = 0.5;
      ctx!.strokeStyle = `rgba(${palette.steelRGB.r},${palette.steelRGB.g},${palette.steelRGB.b},0.55)`;
      ctx!.lineWidth = 1.3;
      const fold = 8;
      ctx!.beginPath();
      ctx!.moveTo(-w / 2, -h / 2);
      ctx!.lineTo(w / 2 - fold, -h / 2);
      ctx!.lineTo(w / 2, -h / 2 + fold);
      ctx!.lineTo(w / 2, h / 2);
      ctx!.lineTo(-w / 2, h / 2);
      ctx!.closePath();
      ctx!.stroke();
      ctx!.beginPath();
      ctx!.moveTo(w / 2 - fold, -h / 2);
      ctx!.lineTo(w / 2 - fold, -h / 2 + fold);
      ctx!.lineTo(w / 2, -h / 2 + fold);
      ctx!.stroke();
      ctx!.globalAlpha = 0.32;
      ctx!.beginPath();
      for (let li = 0; li < 3; li++) {
        const ly = -h / 2 + fold + 7 + li * 6;
        ctx!.moveTo(-w / 2 + 5, ly);
        ctx!.lineTo(w / 2 - 5 - (li === 2 ? 10 : 0), ly);
      }
      ctx!.stroke();

      const FADE = 3.2;
      const cyclePos = d.t % d.checkAt;
      if (cyclePos > d.checkAt - FADE) {
        const p = (cyclePos - (d.checkAt - FADE)) / FADE;
        const alpha = p < 0.4 ? p / 0.4 : p > 0.7 ? (1 - p) / 0.3 : 1;
        ctx!.save();
        ctx!.globalAlpha = alpha * 0.6;
        ctx!.translate(w / 2 + 4, h / 2 - 6);
        ctx!.beginPath();
        ctx!.arc(0, 0, 7, 0, Math.PI * 2);
        ctx!.fillStyle = palette.accent;
        ctx!.fill();
        ctx!.strokeStyle = "#fff";
        ctx!.lineWidth = 1.6;
        ctx!.beginPath();
        ctx!.moveTo(-3.4, 0);
        ctx!.lineTo(-1, 2.6);
        ctx!.lineTo(3.6, -3);
        ctx!.stroke();
        ctx!.restore();
      }
      ctx!.restore();
    }

    function step(dt: number) {
      const palette = paletteRef.current;
      ctx!.clearRect(0, 0, W, H);

      for (const d of dots) {
        if (!reduced) {
          d.x += d.vx * dt;
          d.y += d.vy * dt;
        }
        if (d.x < -20) d.x = W + 20;
        if (d.x > W + 20) d.x = -20;
        if (d.y < -20) d.y = H + 20;
        if (d.y > H + 20) d.y = -20;
      }
      const maxDist = Math.min(150, W / 6);
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i];
          const b = dots[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.16;
            const c = a.isSteel && b.isSteel ? palette.steelRGB : palette.accentRGB;
            ctx!.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
            ctx!.lineWidth = 0.7;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }
      for (const d of dots) {
        const c = d.isSteel ? palette.steelRGB : palette.accentRGB;
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${c.r},${c.g},${c.b},0.4)`;
        ctx!.fill();
      }

      for (const d of docs) {
        if (!reduced) {
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d.t += dt / 1000;
          if (d.x < DOC_W) d.vx *= -1;
          if (d.x > W - DOC_W) d.vx *= -1;
          if (d.y < DOC_H) d.vy *= -1;
          if (d.y > H - DOC_H) d.vy *= -1;
        } else {
          d.t += 0.004;
        }
        drawDoc(d);
      }
    }

    let last = performance.now();
    let raf = 0;
    function loop(now: number) {
      const dt = Math.min(now - last, 42);
      last = now;
      step(dt);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [density]);

  return (
    <>
      <canvas ref={canvasRef} className="bg-canvas" />
      <div className="ground-wash" />
    </>
  );
}
