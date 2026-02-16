import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number;
  scale?: boolean;
  mode?: "default" | "pad" | "stamp";
}

export default function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  distance = 50,
  duration = 0.8,
  scale = false,
  mode = "default",
}: ScrollRevealProps) {
  let variants;

  if (mode === "pad") {
    variants = {
      hidden: { opacity: 0, y: 30, scale: 0.85 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: "spring" as const,
          stiffness: 200,
          damping: 15,
          delay,
        },
      },
    };
  } else if (mode === "stamp") {
    variants = {
      hidden: { opacity: 0, scale: 0, rotate: -10 },
      visible: {
        opacity: 1,
        scale: 1,
        rotate: 0,
        transition: {
          type: "spring" as const,
          stiffness: 300,
          damping: 20,
          delay,
        },
      },
    };
  } else {
    variants = {
      hidden: {
        opacity: 0,
        y: direction === "up" ? distance : direction === "down" ? -distance : 0,
        x:
          direction === "left"
            ? distance
            : direction === "right"
              ? -distance
              : 0,
        scale: scale ? 0.9 : 1,
      },
      visible: {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        transition: {
          type: "spring" as const,
          stiffness: 100,
          damping: 15,
          mass: 1,
          delay,
        },
      },
    };
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
