import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

type FieldShellProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

function FieldShell({ label, hint, children }: FieldShellProps) {
  return (
    <label className="grid gap-2 text-sm text-[var(--muted-ink)]">
      <span className="font-medium text-[var(--brand-ink)]">{label}</span>
      {children}
      {hint ? <span className="text-xs text-[var(--muted-ink)]">{hint}</span> : null}
    </label>
  );
}

const fieldStyles =
  "w-full rounded-3xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--brand-ink)] outline-none transition placeholder:text-[var(--muted-ink)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color:rgba(13,148,136,0.15)]";

export function InputField({
  label,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <FieldShell label={label} hint={hint}>
      <input className={cn(fieldStyles, className)} {...props} />
    </FieldShell>
  );
}

export function TextareaField({
  label,
  hint,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <FieldShell label={label} hint={hint}>
      <textarea
        className={cn(fieldStyles, "min-h-32 resize-y rounded-[28px]", className)}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }) {
  return (
    <FieldShell label={label} hint={hint}>
      <select className={cn(fieldStyles, className)} {...props}>
        {children}
      </select>
    </FieldShell>
  );
}
