import { useEffect, useRef, useCallback, useState } from "react";

const PAW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="21" rx="7" ry="6" fill="#C9A84C"/><circle cx="9" cy="12" r="3.5" fill="#C9A84C"/><circle cx="16" cy="9" r="3.5" fill="#C9A84C"/><circle cx="23" cy="12" r="3.5" fill="#C9A84C"/><circle cx="6" cy="18" r="2.8" fill="#C9A84C"/><circle cx="26" cy="18" r="2.8" fill="#C9A84C"/></svg>`;

const MAX_PRINTS = 20;
const MIN_DISTANCE = 150;
const FADE_DURATION = 1500;

interface PawPrint {
  id: number;
  x: number;
  y: number;
  rotation: number;
  createdAt: number;
}

export default function PawTrail() {
  const [prints, setPrints] = useState<PawPrint[]>([]);
  const lastPos = useRef({ x: 0, y: 0 });
  const nextId = useRef(0);
  const isPointerFine = useRef(false);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    isPointerFine.current = window.matchMedia("(pointer: fine)").matches;
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Cleanup faded prints
  useEffect(() => {
    if (prints.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setPrints((prev) => prev.filter((p) => now - p.createdAt < FADE_DURATION));
    }, 200);
    return () => clearInterval(timer);
  }, [prints.length]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPointerFine.current || prefersReducedMotion.current) return;

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= MIN_DISTANCE) {
      lastPos.current = { x: e.clientX, y: e.clientY };
      const rotation = Math.random() * 40 - 20; // -20 to +20 deg

      setPrints((prev) => {
        const next = [
          ...prev,
          {
            id: nextId.current++,
            x: e.clientX,
            y: e.clientY,
            rotation,
            createdAt: Date.now(),
          },
        ];
        // Pool limit
        if (next.length > MAX_PRINTS) return next.slice(-MAX_PRINTS);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  if (typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9990,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {prints.map((print) => {
        const age = Date.now() - print.createdAt;
        const opacity = Math.max(0, 0.12 * (1 - age / FADE_DURATION));

        return (
          <div
            key={print.id}
            style={{
              position: "absolute",
              left: print.x - 9,
              top: print.y - 9,
              transform: `rotate(${print.rotation}deg)`,
              opacity,
              willChange: "opacity",
              transition: "opacity 0.3s linear",
            }}
            dangerouslySetInnerHTML={{ __html: PAW_SVG }}
          />
        );
      })}
    </div>
  );
}
