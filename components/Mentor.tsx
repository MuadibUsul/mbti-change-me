"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/Card";
import { useVisualSystem } from "@/components/visual-system-provider";

type MentorProps = {
  actions: string[];
  reflectionQuestion: string;
  microPlan: string[];
};

export function Mentor({ actions, reflectionQuestion, microPlan }: MentorProps) {
  const { profile } = useVisualSystem();

  return (
    <Card className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.65 / profile.motionSystem.speed }}
      >
        <div className="mb-4 flex items-center gap-3">
          <motion.div
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: "var(--color-glow)" }}
            animate={
              profile.motionSystem.reducedMotion
                ? undefined
                : {
                    opacity: [0.4, 1, 0.4],
                    scale: [1, 1.7, 1],
                  }
            }
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
          <h3 className="text-lg font-semibold tracking-[var(--tracking-heading)] text-[var(--color-surface)]">
            导师建议
          </h3>
        </div>

        <div className="space-y-2 text-sm text-[var(--color-surface)]/88">
          {actions.slice(0, 3).map((item, index) => (
            <motion.p
              key={item}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.14 * index, duration: 0.4 }}
            >
              {index + 1}. {item}
            </motion.p>
          ))}
        </div>

        <div className="mt-4 rounded-[var(--radius-md)] border border-white/20 bg-white/8 p-3 text-sm text-[var(--color-surface)]">
          反思问题：{reflectionQuestion}
        </div>

        <div className="mt-4 grid gap-2 text-sm text-[var(--color-surface)]/88 md:grid-cols-2">
          {microPlan.slice(0, 7).map((item) => (
            <p key={item} className="rounded-[var(--radius-sm)] border border-white/16 bg-white/6 px-3 py-2">
              {item}
            </p>
          ))}
        </div>
      </motion.div>
    </Card>
  );
}
