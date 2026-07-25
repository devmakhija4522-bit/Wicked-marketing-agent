import { motion, type HTMLMotionProps } from "framer-motion";
import clsx from "clsx";
import type { ReactNode } from "react";
import { useTilt } from "@/lib/useTilt";
import { fadeSlideUp } from "@/lib/motion";

type GlowColor = "crimson" | "cyan" | "violet" | "none";

const glowShadow: Record<GlowColor, string> = {
  crimson: "var(--shadow-glow-crimson)",
  cyan: "var(--shadow-glow-cyan)",
  violet: "0 0 24px 0 rgba(157, 107, 255, 0.3)",
  none: "0 8px 30px rgba(0, 0, 0, 0.35)",
};

interface SharedProps {
  children: ReactNode;
  glow?: GlowColor;
  tilt?: boolean;
  animateEntrance?: boolean;
}

interface GlassPanelDivProps extends SharedProps, Omit<HTMLMotionProps<"div">, keyof SharedProps> {
  as?: "div";
}

interface GlassPanelButtonProps
  extends SharedProps,
    Omit<HTMLMotionProps<"button">, keyof SharedProps | "type"> {
  as: "button";
}

export type GlassPanelProps = GlassPanelDivProps | GlassPanelButtonProps;

/**
 * Base glass-glow card used across every screen. Renders a real <button
 * type="button"> when as="button" (never a clickable div) so it stays
 * keyboard/AT accessible. Tilt is skipped entirely under
 * prefers-reduced-motion (handled inside useTilt).
 */
export function GlassPanel({
  as = "div",
  children,
  className,
  glow = "crimson",
  tilt = true,
  animateEntrance = true,
  ...rest
}: GlassPanelProps) {
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt();

  const shared = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ref: (tilt ? ref : undefined) as any,
    className: clsx(
      "glass-panel rounded-2xl transition-shadow duration-300",
      as === "button" && "min-h-11 min-w-11 cursor-pointer text-left",
      className,
    ),
    style: tilt
      ? { rotateX, rotateY, transformStyle: "preserve-3d" as const }
      : undefined,
    onMouseMove: tilt ? onMouseMove : undefined,
    onMouseLeave: tilt ? onMouseLeave : undefined,
    whileHover: {
      boxShadow: glowShadow[glow],
      ...(as === "button" ? { scale: 1.015 } : {}),
    },
    whileTap: as === "button" ? { scale: 0.985 } : undefined,
    variants: animateEntrance ? fadeSlideUp : undefined,
  };

  if (as === "button") {
    return (
      <motion.button type="button" {...shared} {...(rest as HTMLMotionProps<"button">)}>
        {children}
      </motion.button>
    );
  }

  return (
    <motion.div {...shared} {...(rest as HTMLMotionProps<"div">)}>
      {children}
    </motion.div>
  );
}
