"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/app/_components/button";
import { InputField } from "@/app/_components/field";

type Fact = {
  label: string;
  value: string;
};

type KeyFactsEditorProps = {
  initialFacts?: Fact[];
};

export function KeyFactsEditor({
  initialFacts = [{ label: "", value: "" }],
}: KeyFactsEditorProps) {
  const [facts, setFacts] = useState<Fact[]>(
    initialFacts.length ? initialFacts : [{ label: "", value: "" }],
  );

  function updateFact(index: number, key: keyof Fact, value: string) {
    setFacts((current) =>
      current.map((fact, factIndex) =>
        factIndex === index ? { ...fact, [key]: value } : fact,
      ),
    );
  }

  function addFact() {
    setFacts((current) => [...current, { label: "", value: "" }]);
  }

  function removeFact(index: number) {
    setFacts((current) =>
      current.length === 1 ? [{ label: "", value: "" }] : current.filter((_, i) => i !== index),
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--brand-ink)]">Quick facts</p>
          <p className="text-xs text-[var(--muted-ink)]">
            Add short details like phone, location, blood group, or emergency contact.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={addFact}>
          <Plus className="mr-2 h-4 w-4" />
          Add fact
        </Button>
      </div>

      <div className="grid gap-4">
        {facts.map((fact, index) => (
          <div
            key={`${index}-${fact.label}`}
            className="grid gap-3 rounded-[28px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 md:grid-cols-[1fr_1fr_auto]"
          >
            <InputField
              label="Label"
              value={fact.label}
              onChange={(event) => updateFact(index, "label", event.target.value)}
              placeholder="Phone"
            />
            <InputField
              label="Value"
              value={fact.value}
              onChange={(event) => updateFact(index, "value", event.target.value)}
              placeholder="+91 98765 43210"
            />
            <div className="flex items-end">
              <Button type="button" variant="ghost" onClick={() => removeFact(index)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <input
        type="hidden"
        name="quickFacts"
        value={JSON.stringify(
          facts.filter((fact) => fact.label.trim() && fact.value.trim()),
        )}
      />
    </div>
  );
}
