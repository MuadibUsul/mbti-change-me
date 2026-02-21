"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AvatarPet3D } from "@/components/AvatarPet3D";
import type { PetModel } from "@/lib/types";

type ScreenPetDockProps = {
  petModel?: PetModel | null;
};

export function ScreenPetDock({ petModel }: ScreenPetDockProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!petModel) return null;

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-40">
      <motion.div
        className="pointer-events-auto rounded-[var(--radius-md)] border border-white/18 bg-black/24 p-2 backdrop-blur-md"
        initial={{ opacity: 0, y: 24, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-1 flex items-center justify-between gap-2 px-1">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-surface)]/78">AI 屏幕宠物</p>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="rounded border border-white/22 px-1.5 py-0.5 text-[10px] text-[var(--color-surface)]/78"
          >
            {collapsed ? "展开" : "收起"}
          </button>
        </div>
        {!collapsed ? (
          <div className="h-36 w-36">
            <AvatarPet3D petModel={petModel} compact />
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
