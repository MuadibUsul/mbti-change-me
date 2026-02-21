"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useVisualSystem } from "@/components/visual-system-provider";

type WeakFeedbackProps = {
  id: number;
  message: string | null;
};

export function WeakFeedback({ id, message }: WeakFeedbackProps) {
  const { profile } = useVisualSystem();
  const reduced = profile.motionSystem.reducedMotion;

  return (
    <AnimatePresence mode="wait">
      {message ? (
        <motion.div
          key={`${id}-${message}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={
            reduced
              ? { duration: 0.01 }
              : {
                  duration: 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
          className="pointer-events-none absolute right-4 top-4 z-20 max-w-[70%] rounded-full border px-3 py-1.5 text-xs text-[var(--color-surface)]"
          style={{
            borderColor: "color-mix(in oklab, var(--color-glow) 30%, transparent)",
            background: "color-mix(in oklab, var(--color-bg) 56%, transparent)",
            boxShadow: "0 8px 22px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

