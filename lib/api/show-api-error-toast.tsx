"use client";

import type { Dispatch, SetStateAction } from "react";
import toast from "react-hot-toast";
import {
  getApiErrorMessage,
  getValidationErrorLines,
  getValidationErrors,
  resolveApiErrorMessage,
} from "@/lib/api/response";

export function showApiErrorToast(error: unknown, fallback = "حدث خطأ") {
  const validationErrors = getValidationErrors(error);
  const lines = getValidationErrorLines(validationErrors);

  if (lines.length > 0) {
    toast.error(
      () => (
        <div className="text-sm leading-relaxed text-left rtl:text-right">
          <p className="mb-2 font-semibold">يرجى تصحيح الأخطاء التالية:</p>
          <ul className="max-h-48 space-y-1.5 overflow-y-auto">
            {lines.map((line, index) => (
              <li key={`${line}-${index}`} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
      {
        duration: 7000,
        position: "top-center",
        style: {
          zIndex: 100000,
          maxWidth: "440px",
          boxShadow:
            "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        },
      },
    );
    return;
  }

  toast.error(getApiErrorMessage(error, fallback), {
    duration: 5000,
    position: "top-center",
    style: {
      zIndex: 100000,
      maxWidth: "420px",
      boxShadow:
        "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    },
  });
}

export function handleApiFormError(
  error: unknown,
  setFieldErrors: Dispatch<SetStateAction<Record<string, string[]> | null>>,
  fallback = "حدث خطأ",
) {
  const validationErrors = getValidationErrors(error);
  const message = resolveApiErrorMessage(error, fallback);

  showApiErrorToast(error, fallback);

  setFieldErrors(
    validationErrors && Object.keys(validationErrors).length > 0
      ? validationErrors
      : { general: [message] },
  );
}

// Keep toast-only helper for non-form API actions (delete, fetch, etc.)
export function showApiActionError(error: unknown, fallback = "حدث خطأ") {
  showApiErrorToast(error, fallback);
}
