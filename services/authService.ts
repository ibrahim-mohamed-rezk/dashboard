import { API_ENDPOINTS } from "@/utils/apiEndpoints";

export const loginUser = async (email: string, password: string) => {
  const response = await fetch(API_ENDPOINTS.LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Invalid credentials");
  }

  return response.json(); // Expected response: { token, user }
};

export const getUserProfile = async (token: string) => {
  const response = await fetch(API_ENDPOINTS.USER_PROFILE, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  return response.json(); // Expected response: { id, email }
};
