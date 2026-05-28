"use client";

import { useEffect, useState } from "react";

type IntegerInputProps = {
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  className?: string;
  onValueChange?: (value: string) => void;
};

export function IntegerInput({
  name,
  value = "",
  placeholder,
  required,
  min,
  className,
  onValueChange,
}: IntegerInputProps) {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  return (
    <input
      name={name}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={internalValue}
      placeholder={placeholder}
      required={required}
      className={className}
      onChange={(event) => {
        const nextValue = event.target.value;

        if (!/^\d*$/.test(nextValue)) {
          return;
        }

        setInternalValue(nextValue);
        onValueChange?.(nextValue);
      }}
      onBlur={() => {
        if (!internalValue || min === undefined) {
          return;
        }

        const parsed = Number(internalValue);

        if (parsed < min) {
          const nextValue = String(min);
          setInternalValue(nextValue);
          onValueChange?.(nextValue);
        }
      }}
    />
  );
}
