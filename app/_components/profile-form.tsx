"use client";

import { useActionState } from "react";

import { Button } from "@/app/_components/button";
import { InputField } from "@/app/_components/field";
import { StatusBanner } from "@/app/_components/status-banner";
import type { FormState } from "@/lib/validators";

type ProfileFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues: {
    fullName: string;
    avatarUrl?: string | null;
  };
};

const initialState: FormState = {};

export function ProfileForm({ action, defaultValues }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <InputField
        label="Full name"
        name="fullName"
        defaultValue={defaultValues.fullName}
        required
      />
      <InputField
        label="Avatar URL"
        name="avatarUrl"
        defaultValue={defaultValues.avatarUrl ?? ""}
        placeholder="https://..."
        hint="Optional for v1. You can leave this empty."
      />
      <StatusBanner tone="success" message={state.success} />
      <StatusBanner message={state.error} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
