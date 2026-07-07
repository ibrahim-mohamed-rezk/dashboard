"use client";

import { cn } from "@/lib/utils";

export function getFieldErrorMessage(
  errors: Record<string, string[]> | null | undefined,
  field: string,
): string | undefined {
  return errors?.[field]?.[0];
}

export function formInputClass(hasError: boolean, extra = "") {
  return cn(
    "w-full rounded border p-2 transition-colors outline-none focus:ring-2",
    extra,
    hasError
      ? "border-destructive bg-destructive/5 text-destructive focus:border-destructive focus:ring-destructive/20"
      : "border-input focus:border-primary focus:ring-primary/20",
  );
}

export function formFileButtonClass(hasError: boolean) {
  return cn(
    "cursor-pointer rounded border px-3 py-2 text-sm font-medium transition-colors",
    hasError
      ? "border-destructive bg-destructive/5 text-destructive"
      : "border-input bg-gray-100 hover:bg-gray-200",
  );
}

export function FormFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-destructive">{message}</p>;
}

export function FormGeneralError({
  errors,
}: {
  errors: Record<string, string[]> | null | undefined;
}) {
  const message = errors?.general?.[0];
  if (!message) return null;
  return <p className="mt-4 text-sm text-destructive">{message}</p>;
}

export function createFormFieldHelpers(
  errors: Record<string, string[]> | null | undefined,
) {
  const getFieldError = (field: string) => getFieldErrorMessage(errors, field);
  const inputClass = (field: string, extra = "") =>
    formInputClass(Boolean(getFieldError(field)), extra);
  const fileButtonClass = (field: string) =>
    formFileButtonClass(Boolean(getFieldError(field)));
  const FieldError = ({ field }: { field: string }) => (
    <FormFieldError message={getFieldError(field)} />
  );

  return { getFieldError, inputClass, fileButtonClass, FieldError };
}
