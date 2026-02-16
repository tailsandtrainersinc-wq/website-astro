import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface HeroClientProps {
  titleWords: string[];
  subtitle: string;
  tagline: string;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function HeroClient({ titleWords, subtitle, tagline }: HeroClientProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const titleY = useTransform(scrollY, [0, 800], [0, -150]);
  const titleOpacity = useTransform(scrollY, [0, 600], [1, 0]);

  return (
    <motion.div
      ref={ref}
      className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8 md:gap-16"
      style={{ y: titleY, opacity: titleOpacity }}
    >
      {/* Left: Tagline + Title + Subtitle */}
      <div className="flex-1 max-w-4xl">
        {/* Tagline */}
        {tagline && (
          <motion.p
            initial={{ opacity: 0, x: -20, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease, delay: 0.2 }}
            className="text-xs md:text-sm tracking-[0.25em] uppercase mb-6 md:mb-8"
            style={{ color: "var(--accent-warm)" }}
          >
            {tagline}
          </motion.p>
        )}

        {/* Title — each word cascades in */}
        <h1
          id="hero-heading"
          className="leading-[0.9] tracking-tight mb-6 md:mb-8"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "var(--text-hero)",
            color: "var(--text-primary)",
          }}
        >
          {titleWords.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.25em]"
              initial={{ opacity: 0, y: 60, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.8,
                ease,
                delay: 0.4 + i * 0.12,
              }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.8 }}
          className="text-lg md:text-xl max-w-xl leading-relaxed"
          style={{
            color: "var(--text-secondary)",
            fontSize: "var(--text-subhead)",
          }}
        >
          {subtitle}
        </motion.p>
      </div>

      {/* Right: CTA buttons */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease, delay: 1.0 }}
        className="flex flex-row md:flex-col gap-4 md:pb-2 shrink-0"
      >
        <a
          href="/contact"
          className="btn-primary heartbeat-glow"
          aria-label="Get involved with Tails and Trainers"
        >
          Get Involved
        </a>
        <a href="/about" className="btn-secondary">
          Our Mission
        </a>
      </motion.div>
    </motion.div>
  );
}
