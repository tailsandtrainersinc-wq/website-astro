import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

const FLOATING_ICONS = [
  {
    svg: `<svg viewBox="0 0 32 32" fill="currentColor"><ellipse cx="16" cy="21" rx="7" ry="6"/><circle cx="9" cy="12" r="3.5"/><circle cx="16" cy="9" r="3.5"/><circle cx="23" cy="12" r="3.5"/><circle cx="6" cy="18" r="2.8"/><circle cx="26" cy="18" r="2.8"/></svg>`,
    x: "8%",
    y: "15%",
    size: 28,
    opacity: 0.06,
    duration: 25,
    delay: 0,
  },
  {
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    x: "85%",
    y: "20%",
    size: 22,
    opacity: 0.05,
    duration: 30,
    delay: 5,
  },
  {
    svg: `<svg viewBox="0 0 32 32" fill="currentColor"><rect x="8" y="13" width="16" height="6" rx="3"/><circle cx="7" cy="12" r="4"/><circle cx="7" cy="20" r="4"/><circle cx="25" cy="12" r="4"/><circle cx="25" cy="20" r="4"/></svg>`,
    x: "75%",
    y: "65%",
    size: 26,
    opacity: 0.04,
    duration: 35,
    delay: 8,
  },
  {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="20" r="2.5" fill="currentColor" stroke="none"/></svg>`,
    x: "15%",
    y: "70%",
    size: 24,
    opacity: 0.05,
    duration: 28,
    delay: 3,
  },
  {
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="2" width="2" height="20" rx="1"/><path d="M6 4h12l-3 4 3 4H6z"/></svg>`,
    x: "90%",
    y: "45%",
    size: 20,
    opacity: 0.04,
    duration: 40,
    delay: 12,
  },
  {
    svg: `<svg viewBox="0 0 32 32" fill="currentColor"><ellipse cx="16" cy="21" rx="7" ry="6"/><circle cx="9" cy="12" r="3.5"/><circle cx="16" cy="9" r="3.5"/><circle cx="23" cy="12" r="3.5"/><circle cx="6" cy="18" r="2.8"/><circle cx="26" cy="18" r="2.8"/></svg>`,
    x: "50%",
    y: "80%",
    size: 18,
    opacity: 0.04,
    duration: 22,
    delay: 15,
  },
];

const PAW_BUBBLES = [
  { x: "10%", size: 14, duration: 25, delay: 0, rotation: 15, opacity: 0.04 },
  { x: "30%", size: 12, duration: 30, delay: 8, rotation: -20, opacity: 0.03 },
  { x: "55%", size: 16, duration: 22, delay: 4, rotation: 10, opacity: 0.05 },
  { x: "75%", size: 10, duration: 28, delay: 12, rotation: -15, opacity: 0.04 },
  { x: "92%", size: 14, duration: 35, delay: 18, rotation: 25, opacity: 0.03 },
];

const SMALL_PAW = `<svg viewBox="0 0 32 32" fill="currentColor"><ellipse cx="16" cy="21" rx="7" ry="6"/><circle cx="9" cy="12" r="3.5"/><circle cx="16" cy="9" r="3.5"/><circle cx="23" cy="12" r="3.5"/><circle cx="6" cy="18" r="2.8"/><circle cx="26" cy="18" r="2.8"/></svg>`;

export default function HeroInteractive() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 50, damping: 30 };
  const rotateX = useSpring(
    useTransform(mouseY, [0, 1], [8, -8]),
    springConfig,
  );
  const rotateY = useSpring(
    useTransform(mouseX, [0, 1], [-8, 8]),
    springConfig,
  );

  useEffect(() => {
    const isFine = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!isFine || reducedMotion) return;

    const handler = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Parallax paw watermark */}
      <div
        style={{ perspective: "1000px" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <motion.div
          style={{ rotateX, rotateY }}
          className="w-[50vh] h-[50vh] max-w-[500px] max-h-[500px]"
        >
          <svg
            viewBox="0 0 32 32"
            fill="#C9A84C"
            className="w-full h-full"
            style={{ opacity: 0.05 }}
          >
            <ellipse cx="16" cy="21" rx="7" ry="6" />
            <circle cx="9" cy="12" r="3.5" />
            <circle cx="16" cy="9" r="3.5" />
            <circle cx="23" cy="12" r="3.5" />
            <circle cx="6" cy="18" r="2.8" />
            <circle cx="26" cy="18" r="2.8" />
          </svg>
        </motion.div>
      </div>

      {/* Floating decorative icons */}
      {FLOATING_ICONS.map((icon, i) => (
        <div
          key={i}
          className="absolute hidden md:block"
          style={{
            left: icon.x,
            top: icon.y,
            width: icon.size,
            height: icon.size,
            opacity: icon.opacity,
            color: "#C9A84C",
            animation: `float-drift ${icon.duration}s ease-in-out infinite`,
            animationDelay: `${icon.delay}s`,
          }}
          dangerouslySetInnerHTML={{ __html: icon.svg }}
        />
      ))}

      {/* Rising paw bubbles */}
      {PAW_BUBBLES.map((bubble, i) => (
        <div
          key={`bubble-${i}`}
          className="absolute hidden md:block"
          style={
            {
              left: bubble.x,
              bottom: "-20px",
              width: bubble.size,
              height: bubble.size,
              color: "#C9A84C",
              animation: `float-up ${bubble.duration}s linear infinite`,
              animationDelay: `${bubble.delay}s`,
              "--float-rotation": `${bubble.rotation}deg`,
              "--float-opacity": `${bubble.opacity}`,
            } as React.CSSProperties
          }
          dangerouslySetInnerHTML={{ __html: SMALL_PAW }}
        />
      ))}
    </div>
  );
}
