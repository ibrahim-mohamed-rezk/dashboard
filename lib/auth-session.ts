import axios from "axios";
import { postData } from "@/lib/axios/server";

export type LoginResponse = {
  token: string;
  data: Record<string, unknown>;
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

export async function loginWithToken(token: string): Promise<LoginResponse> {
  const data = new FormData();
  data.append("token", token);

  const response = await postData("login-with-token", data, {
    Authorization: "Bearer token",
  });

  return response as LoginResponse;
}
