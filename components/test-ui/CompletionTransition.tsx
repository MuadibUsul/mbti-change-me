"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useVisualSystem } from "@/components/visual-system-provider";

type CompletionTransitionProps = {
  open: boolean;
  finalType: string;
  onDone: () => void;
};

export function CompletionTransition({ open, finalType, onDone }: CompletionTransitionProps) {
  const { profile } = useVisualSystem();
  const reduced = profile.motionSystem.reducedMotion;
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => onDoneRef.current(), reduced ? 40 : 760);
    return () => window.clearTimeout(timer);
  }, [open, reduced]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduced ? { duration: 0.01 } : { duration: 0.24, ease: "easeOut" }}
          style={{
            background: "color-mix(in oklab, var(--color-bg) 58%, transparent)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div className="relative flex flex-col items-center">
            <motion.p
              initial={{ opacity: 1, letterSpacing: "0.42em", y: 0 }}
              animate={reduced ? { opacity: 0 } : { opacity: [1, 1, 0], letterSpacing: ["0.42em", "0.34em", "0.16em"], y: [0, 0, -4] }}
              transition={reduced ? { duration: 0.01 } : { duration: 0.46, times: [0, 0.62, 1], ease: "easeInOut" }}
              className="text-sm uppercase text-[var(--color-surface)]/74"
            >
              E S T J
            </motion.p>
            <motion.p
              className="absolute top-6 text-4xl font-semibold tracking-[0.08em] text-[var(--color-surface)] md:text-5xl"
              initial={{ opacity: 0, scale: 0.97, y: 4 }}
              animate={reduced ? { opacity: 1 } : { opacity: [0, 0, 1], scale: [0.97, 0.98, 1], y: [4, 3, 0] }}
              transition={reduced ? { duration: 0.01 } : { duration: 0.6, times: [0, 0.48, 1], ease: [0.22, 1, 0.36, 1] }}
              style={{
                textShadow: "0 0 24px color-mix(in oklab, var(--color-glow) 46%, transparent)",
              }}
            >
              {finalType}
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
