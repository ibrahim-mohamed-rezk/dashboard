import axios, { AxiosHeaders } from "axios";
import {
  ApiError,
  ApiResponse,
  assertApiSuccess,
  normalizeApiResponse,
  parseAxiosApiError,
} from "@/lib/api/response";

const backendServer = axios.create({
  baseURL: "https://safezone-co.top/api/v1/dashboard/",
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

async function request<T>(
  promise: Promise<{ data: unknown }>,
  throwOnFailure = true,
): Promise<ApiResponse<T>> {
  try {
    const response = await promise;
    const normalized = normalizeApiResponse<T>(response.data);

    if (throwOnFailure) {
      assertApiSuccess(normalized);
    }

    return normalized;
  } catch (error) {
    throw parseAxiosApiError(error);
  }
}

export const getData = async <T = unknown>(
  endpoint: string,
  params?: Record<string, unknown>,
  headers?: AxiosHeaders | Record<string, string>,
  options?: { throwOnFailure?: boolean },
): Promise<ApiResponse<T>> => {
  return request<T>(
    backendServer.get(endpoint, { params, headers }),
    options?.throwOnFailure !== false,
  );
};

export const postData = async <T = unknown>(
  endpoint: string,
  data: unknown,
  headers?: AxiosHeaders | Record<string, string>,
  options?: { throwOnFailure?: boolean },
): Promise<ApiResponse<T>> => {
  return request<T>(
    backendServer.post(endpoint, data, { headers: { ...headers } }),
    options?.throwOnFailure !== false,
  );
};

export const deleteData = async <T = unknown>(
  endpoint: string,
  headers?: AxiosHeaders | Record<string, string>,
  options?: { throwOnFailure?: boolean },
): Promise<ApiResponse<T>> => {
  return request<T>(
    backendServer.delete(endpoint, { headers: { ...headers } }),
    options?.throwOnFailure !== false,
  );
};

export type { ApiResponse };
export { ApiError };
export default backendServer;
