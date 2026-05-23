import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: ReactNode;
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--brand-ink)] text-white shadow-[0_18px_45px_rgba(13,23,43,0.24)] hover:bg-[#091325]",
  secondary:
    "border border-[var(--line)] bg-white text-[var(--brand-ink)] hover:bg-[var(--panel-soft)]",
  ghost: "text-[var(--brand-ink)] hover:bg-[var(--panel-soft)]",
  danger: "bg-[#991b1b] text-white hover:bg-[#7f1d1d]",
};

export function Button({
  className,
  variant = "primary",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
