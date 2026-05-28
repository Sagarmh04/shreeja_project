"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
};

export function SubmitButton({ children, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className ?? "rounded-full bg-[var(--accent)] px-4 py-2 font-medium text-white transition hover:bg-[var(--accent-deep)] disabled:cursor-not-allowed disabled:opacity-60"}
    >
      {pending ? "Working..." : children}
    </button>
  );
}
