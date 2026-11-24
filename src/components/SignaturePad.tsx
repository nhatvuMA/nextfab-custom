"use client";
import { useEffect, useRef } from "react";

export default function SignaturePad({ onChange, invalid }: { onChange: (dataUrl: string) => void; invalid?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    const c = ref.current!;
    const resize = () => {
      const r = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = r.width * dpr;
      c.height = r.height * dpr;
      const ctx = c.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0b1d27";
      dirty.current = false;
      onChange("");
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [onChange]);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  const down = (e: React.PointerEvent) => {
    ref.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = ref.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(...pos(e));
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = ref.current!.getContext("2d")!;
    ctx.lineTo(...pos(e));
    ctx.stroke();
    dirty.current = true;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (dirty.current) onChange(ref.current!.toDataURL("image/png"));
  };
  const clear = () => {
    const c = ref.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    dirty.current = false;
    onChange("");
  };

  return (
    <div>
      <div className={`relative h-40 border-2 border-dashed bg-white ${invalid ? "border-red-400" : "border-[#c9d3d9]"}`}>
        <canvas
          ref={ref}
          className="h-full w-full touch-none cursor-crosshair"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          aria-label="Signature pad: draw your signature"
        />
        <span className="pointer-events-none absolute bottom-3 left-4 right-4 border-t border-gray-300 pt-1 text-xs text-gray-400">Sign above</span>
      </div>
      <button type="button" onClick={clear} className="mt-2 text-sm text-nf-blue underline">Clear signature</button>
    </div>
  );
}
