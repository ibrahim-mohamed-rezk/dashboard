import axios from "axios";
import { postData } from "@/lib/axios/server";
import { User } from "@/lib/type";
import { normalizeLoginResponse } from "@/lib/api/response";

export type LoginResponse = {
  token: string;
  data: User;
};

export async function persistAuthSession(
  response: LoginResponse,
): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(response.data));
  }

  await axios.post(
    "/api/auth/setToken",
    { token: response.token },
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}

export async function clearAuthSession(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }

  try {
    await axios.post("/api/auth/removeToken");
  } catch {
    // ignore cleanup errors
  }
}

export async function loginWithToken(token: string): Promise<LoginResponse> {
  const response = await postData(
    "login-with-token",
    new FormData(),
    {
      Authorization: `Bearer ${token}`,
    },
    { throwOnFailure: false },
  );

  return normalizeLoginResponse(response);
}

export async function refreshAuthSession(): Promise<LoginResponse> {
  const tokenResponse = await axios.get("/api/auth/getToken");
  const token = tokenResponse.data?.token;

  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await loginWithToken(token);
  await persistAuthSession(response);
  return response;
}
