"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { forwardRef, useRef } from "react";
import type { HTMLMotionProps } from "framer-motion";
import { useVisualSystem } from "@/components/visual-system-provider";

type ButtonVariant = "solid" | "ghost" | "outline";

type ButtonProps = HTMLMotionProps<"button"> & {
  variant?: ButtonVariant;
  magnetic?: boolean;
};

function resolveVariant(variant: ButtonVariant) {
  if (variant === "ghost") {
    return "bg-white/6 text-[var(--color-surface)] border border-white/20 hover:bg-white/16";
  }
  if (variant === "outline") {
    return "bg-transparent text-[var(--color-surface)] border border-white/35 hover:bg-white/10";
  }
  return "bg-[var(--color-primary)] text-white border border-transparent hover:brightness-110";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "solid", magnetic = false, children, ...props },
  ref,
) {
  const { profile } = useVisualSystem();
  const elementRef = useRef<HTMLButtonElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, {
    stiffness: 220 + profile.motionSystem.elasticity * 320,
    damping: 24,
  });
  const springY = useSpring(y, {
    stiffness: 220 + profile.motionSystem.elasticity * 320,
    damping: 24,
  });
  const boxShadow = useTransform(
    [springX, springY],
    ([vx, vy]) =>
      `${Number(vx) * -0.16}px ${Number(vy) * -0.22}px 24px color-mix(in oklab, var(--color-glow) 45%, transparent)`,
  );

  return (
    <motion.button
      ref={(node) => {
        elementRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      style={magnetic ? { x: springX, y: springY, boxShadow } : undefined}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseMove={(event) => {
        if (!magnetic || !elementRef.current || profile.motionSystem.reducedMotion) return;
        const rect = elementRef.current.getBoundingClientRect();
        const offsetX = event.clientX - rect.left - rect.width / 2;
        const offsetY = event.clientY - rect.top - rect.height / 2;
        x.set(offsetX * 0.12);
        y.set(offsetY * 0.12);
      }}
      onMouseLeave={() => {
        if (!magnetic) return;
        x.set(0);
        y.set(0);
      }}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] px-4 py-2 text-sm font-semibold tracking-[var(--tracking-main)] transition will-change-transform disabled:cursor-not-allowed disabled:opacity-55 ${resolveVariant(
        variant,
      )} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
});
