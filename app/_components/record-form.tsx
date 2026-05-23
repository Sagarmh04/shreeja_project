import { Button } from "@/app/_components/button";
import { InputField, SelectField, TextareaField } from "@/app/_components/field";
import { KeyFactsEditor } from "@/app/_components/key-facts-editor";
import { StatusBanner } from "@/app/_components/status-banner";
import type { FormState } from "@/lib/validators";

type RecordFormProps = {
  action: (formData: FormData) => Promise<void>;
  state?: FormState;
  submitLabel: string;
  defaultValues?: {
    title?: string;
    category?: string;
    description?: string;
    quickFacts?: Array<{ label: string; value: string }>;
  };
};

const categories = [
  "Identity",
  "Emergency",
  "Medical",
  "Education",
  "Contact",
  "Other",
];

export function RecordForm({
  action,
  state,
  submitLabel,
  defaultValues,
}: RecordFormProps) {
  return (
    <form action={action} className="grid gap-5">
      <InputField
        label="Record title"
        name="title"
        defaultValue={defaultValues?.title}
        placeholder="Primary emergency contact"
        required
      />
      <SelectField
        label="Category"
        name="category"
        defaultValue={defaultValues?.category ?? "Contact"}
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </SelectField>
      <TextareaField
        label="Description"
        name="description"
        defaultValue={defaultValues?.description}
        placeholder="Add the details your customer will value seeing quickly."
        required
      />
      <KeyFactsEditor initialFacts={defaultValues?.quickFacts} />
      <div className="grid gap-2">
        <label className="text-sm font-medium text-[var(--brand-ink)]">
          Attachments
        </label>
        <input
          className="rounded-[28px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-4 py-5 text-sm text-[var(--muted-ink)]"
          type="file"
          name="attachments"
          multiple
        />
      </div>
      <StatusBanner message={state?.error} />
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
