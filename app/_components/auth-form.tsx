"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/app/_components/button";
import { InputField } from "@/app/_components/field";
import { StatusBanner } from "@/app/_components/status-banner";
import type { FormState } from "@/lib/validators";

type AuthFormProps = {
  title: string;
  description: string;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  mode: "login" | "signup";
};

const initialState: FormState = {};

export function AuthForm({
  title,
  description,
  action,
  mode,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="w-full rounded-[32px] border border-white/50 bg-white/95 p-8 shadow-[0_32px_100px_rgba(15,23,42,0.14)] backdrop-blur">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
        Privacy workspace
      </p>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[var(--brand-ink)]">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-7 text-[var(--muted-ink)]">
        {description}
      </p>

      <form action={formAction} className="mt-8 grid gap-5">
        {mode === "signup" ? (
          <InputField
            label="Full name"
            name="fullName"
            autoComplete="name"
            placeholder="Aarav Nair"
            required
          />
        ) : null}
        <InputField
          label="Email address"
          name="email"
          autoComplete="email"
          type="email"
          placeholder="you@example.com"
          required
        />
        <InputField
          label="Password"
          name="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          type="password"
          placeholder="At least 8 characters"
          required
        />
        <StatusBanner message={state.error} />
        <Button type="submit" disabled={pending}>
          {pending
            ? mode === "login"
              ? "Signing in..."
              : "Creating account..."
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-[var(--muted-ink)]">
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <Link
          href={mode === "login" ? "/signup" : "/login"}
          className="font-semibold text-[var(--accent-deep)]"
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
