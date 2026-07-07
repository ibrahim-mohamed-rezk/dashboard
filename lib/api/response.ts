import axios from "axios";
import { User } from "@/lib/type";

export interface ApiResponse<T = unknown> {
  status: boolean;
  msg: string;
  data: T;
}

export interface ApiPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export type PaginatedPayload<TKey extends string, TItem> = {
  [K in TKey]: TItem[];
} & {
  pagination: ApiPagination;
};

type LegacyPaginatedResponse<T> = {
  data: T[];
  meta?: Partial<ApiPagination> & { links?: unknown };
  links?: unknown;
};

export class ApiError extends Error {
  statusCode?: number;
  validationErrors?: Record<string, string[]> | null;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      validationErrors?: Record<string, string[]> | null;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = options?.statusCode;
    this.validationErrors = options?.validationErrors ?? null;
  }
}

export function isApiResponse(value: unknown): value is ApiResponse {
  return (
    !!value &&
    typeof value === "object" &&
    "status" in value &&
    "msg" in value &&
    "data" in value
  );
}

function toValidationErrors(
  value: unknown,
): Record<string, string[]> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, fieldValue]) => Array.isArray(fieldValue),
  );

  if (!entries.length) return null;

  return Object.fromEntries(
    entries.map(([key, fieldValue]) => [key, fieldValue as string[]]),
  );
}

export function normalizeApiResponse<T>(body: unknown): ApiResponse<T> {
  if (isApiResponse(body)) {
    return body as ApiResponse<T>;
  }

  return {
    status: true,
    msg: "",
    data: body as T,
  };
}

export function assertApiSuccess<T>(response: ApiResponse<T>): ApiResponse<T> {
  if (!response.status) {
    throw new ApiError(response.msg, {
      validationErrors: toValidationErrors(response.data),
    });
  }

  return response;
}

export function unwrapApiData<T>(response: unknown): T {
  if (isApiResponse(response)) {
    assertApiSuccess(response);
    return response.data as T;
  }

  return response as T;
}

function legacyPagination(
  meta?: Partial<ApiPagination>,
  itemsLength = 0,
): ApiPagination | null {
  if (!meta) return null;

  return {
    current_page: meta.current_page ?? 1,
    last_page: meta.last_page ?? 1,
    per_page: meta.per_page ?? itemsLength,
    total: meta.total ?? itemsLength,
    from: meta.from ?? 1,
    to: meta.to ?? itemsLength,
  };
}

export function extractPaginatedList<T>(
  response: unknown,
  itemsKey: string,
): { items: T[]; pagination: ApiPagination | null } {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray((response as LegacyPaginatedResponse<T>).data) &&
    !isApiResponse(response)
  ) {
    const legacy = response as LegacyPaginatedResponse<T>;
    return {
      items: legacy.data,
      pagination: legacyPagination(legacy.meta, legacy.data.length),
    };
  }

  const payload = unwrapApiData<unknown>(response);

  if (Array.isArray(payload)) {
    return { items: payload as T[], pagination: null };
  }

  if (!payload || typeof payload !== "object") {
    return { items: [], pagination: null };
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record[itemsKey])) {
    return {
      items: record[itemsKey] as T[],
      pagination: (record.pagination as ApiPagination) ?? null,
    };
  }

  const arrayKeys = Object.keys(record).filter(
    (key) =>
      key !== "pagination" &&
      key !== "statistics" &&
      key !== "links" &&
      key !== "meta" &&
      Array.isArray(record[key]),
  );

  if (arrayKeys.length === 1) {
    return {
      items: record[arrayKeys[0]] as T[],
      pagination: (record.pagination as ApiPagination) ?? null,
    };
  }

  return { items: [], pagination: null };
}

export function extractListData<T>(response: unknown, itemsKey: string): T[] {
  return extractPaginatedList<T>(response, itemsKey).items;
}

export function getApiMessage(response: unknown, fallback = ""): string {
  if (isApiResponse(response)) return response.msg;
  return fallback;
}

function getBodyMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.msg === "string" && record.msg.trim()) return record.msg;
  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }
  return null;
}

function extractValidationErrorsFromBody(
  body: unknown,
): Record<string, string[]> | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;

  if (isApiResponse(body)) {
    return toValidationErrors(body.data);
  }

  return (
    toValidationErrors(record.errors) ??
    toValidationErrors(record.data) ??
    null
  );
}

export function getValidationErrors(
  error: unknown,
): Record<string, string[]> | null {
  if (error instanceof ApiError) {
    return error.validationErrors ?? null;
  }

  if (axios.isAxiosError(error)) {
    return extractValidationErrorsFromBody(error.response?.data);
  }

  return null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "حدث خطأ",
): string {
  const validationErrors = getValidationErrors(error);
  const validationMessage = formatValidationErrors(validationErrors);
  if (validationMessage) return validationMessage;

  if (error instanceof ApiError) {
    if (
      error.message &&
      !error.message.startsWith("Request failed with status code")
    ) {
      return error.message;
    }
  }

  if (axios.isAxiosError(error)) {
    const bodyMessage = getBodyMessage(error.response?.data);
    if (bodyMessage) return bodyMessage;

    if (error.response?.status === 422) {
      return "خطأ في البيانات المرسلة";
    }
  }

  if (error instanceof Error && error.message) {
    if (!error.message.startsWith("Request failed with status code")) {
      return error.message;
    }
  }

  return fallback;
}

export function resolveApiErrorMessage(
  error: unknown,
  fallback = "حدث خطأ",
): string {
  return getApiErrorMessage(error, fallback);
}

export function formatValidationErrors(
  errors: Record<string, string[]> | null,
): string {
  if (!errors) return "";
  return Object.values(errors).flat().join(" ");
}

export function getValidationErrorLines(
  errors: Record<string, string[]> | null,
): string[] {
  if (!errors) return [];
  return Object.values(errors).flat().filter(Boolean);
}

export function normalizeLoginResponse(
  response: unknown,
): { token: string; data: User } {
  if (!response || typeof response !== "object") {
    throw new ApiError("Invalid login response");
  }

  const record = response as Record<string, unknown>;

  if (typeof record.token === "string") {
    const userData = isApiResponse(record)
      ? record.data
      : record.data ?? record.user;

    if (userData && typeof userData === "object") {
      return {
        token: record.token,
        data: userData as User,
      };
    }
  }

  if (isApiResponse(record)) {
    assertApiSuccess(record);
    const data = record.data as Record<string, unknown>;
    const token = data?.token ?? record.token;
    const user = (data?.user ?? data) as User;

    if (typeof token === "string" && user) {
      return { token, data: user };
    }
  }

  throw new ApiError(getApiMessage(response, "Invalid login response"));
}

export function parseAxiosApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    const body = error.response?.data;
    const statusCode = error.response?.status;
    const validationErrors = extractValidationErrorsFromBody(body);
    const validationMessage = formatValidationErrors(validationErrors);
    const bodyMessage = getBodyMessage(body);

    if (isApiResponse(body)) {
      return new ApiError(body.msg || validationMessage || "حدث خطأ", {
        statusCode,
        validationErrors,
      });
    }

    if (validationErrors || bodyMessage || statusCode) {
      return new ApiError(
        validationMessage ||
          bodyMessage ||
          (statusCode === 422 ? "خطأ في البيانات المرسلة" : "حدث خطأ"),
        {
          statusCode,
          validationErrors,
        },
      );
    }
  }

  if (error instanceof Error) {
    if (error.message.startsWith("Request failed with status code")) {
      return new ApiError("حدث خطأ غير متوقع");
    }
    return new ApiError(error.message);
  }

  return new ApiError("حدث خطأ غير متوقع");
}
