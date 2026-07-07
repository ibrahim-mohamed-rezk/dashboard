"use client";

import { useCallback, useState } from "react";
import { handleApiFormError } from "@/lib/api/show-api-error-toast";
import { createFormFieldHelpers } from "@/components/form/form-field-helpers";

export function useFormApiErrors() {
  const [fieldErrors, setFieldErrors] = useState<Record<
    string,
    string[]
  > | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<
    string,
    string[]
  > | null>(null);

  const clearFieldError = useCallback((field: string) => {
    const clear = (
      setter: React.Dispatch<
        React.SetStateAction<Record<string, string[]> | null>
      >,
    ) => {
      setter((prev) => {
        if (!prev?.[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return Object.keys(next).length ? next : null;
      });
    };
    clear(setFieldErrors);
    clear(setEditFieldErrors);
  }, []);

  const onAddError = useCallback((error: unknown, fallback = "حدث خطأ") => {
    handleApiFormError(error, setFieldErrors, fallback);
  }, []);

  const onEditError = useCallback((error: unknown, fallback = "حدث خطأ") => {
    handleApiFormError(error, setEditFieldErrors, fallback);
  }, []);

  const addHelpers = createFormFieldHelpers(fieldErrors);
  const editHelpers = createFormFieldHelpers(editFieldErrors);

  const getHelpers = (isEdit: boolean) =>
    isEdit ? editHelpers : addHelpers;

  return {
    fieldErrors,
    setFieldErrors,
    editFieldErrors,
    setEditFieldErrors,
    clearFieldError,
    onAddError,
    onEditError,
    getHelpers,
    clearAddErrors: () => setFieldErrors(null),
    clearEditErrors: () => setEditFieldErrors(null),
  };
}
