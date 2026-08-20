/**
 * Aurora — src/components/ui/Button.tsx
 *
 * Reusable button primitive with spring-scale motion feedback.
 * Variants: filled, ghost, gold, icon | Sizes: sm, md, lg
 */

"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils/cn";

type ButtonVariant = "filled" | "ghost" | "gold" | "icon";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Visual styles per variant. */
const buttonStyles: Record<ButtonVariant, string> = {
  filled:
    "bg-bg-ink text-text-inverted hover:bg-text-primary border border-bg-ink",
  ghost:
    "bg-transparent text-text-primary border border-text-primary hover:bg-text-primary hover:text-text-inverted",
  gold: "bg-accent-primary text-white hover:bg-accent-vivid border border-accent-primary hover:border-accent-vivid",
  icon: "bg-white border border-border-subtle hover:border-border-medium",
};

/** Padding and font-size per size tier. */
const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-5 py-2.5 text-sm",
  md: "px-7 py-3.5 text-sm",
  lg: "px-9 py-4 text-base",
};

/** Primary CTA button with spring-scale feedback on hover and tap. */
export function Button({
  variant = "filled",
  size = "md",
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      disabled={disabled}
      className={cn(
        "rounded-full font-medium transition-colors duration-300 inline-flex items-center justify-center gap-2 select-none focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer",
        buttonStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
