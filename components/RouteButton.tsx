"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/Button";

type RouteButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "solid" | "ghost" | "outline";
  magnetic?: boolean;
  className?: string;
};

export function RouteButton({
  href,
  children,
  variant = "solid",
  magnetic = false,
  className,
}: RouteButtonProps) {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant={variant}
      magnetic={magnetic}
      className={className}
      onClick={() => router.push(href)}
    >
      {children}
    </Button>
  );
}
