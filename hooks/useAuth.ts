"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/authService";

export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout, hydrate } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // ✅ Sign In Function
  const signIn = async (email: string, password: string) => {
    try {
      const response = await loginUser(email, password);

      if (response.status && response.token) {
        const { token, data: user } = response;
        login(token, user);

        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(user));

        router.replace("/"); // Redirect to dashboard or home
      } else {
        console.error("Login failed", response.msg);
      }
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  // ✅ Fetch User Data if Token Exists
  const fetchUser = () => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      login(storedToken, JSON.parse(storedUser));
    }
  };

  // ✅ Hydrate State on Load
  useEffect(() => {
    hydrate();
    const storedToken = localStorage.getItem("authToken");

    if (storedToken && !isAuthenticated) {
      fetchUser();
    }

    setLoading(false); // Mark as loaded after fetching user
  }, [isAuthenticated, hydrate]);

  return { user, token, isAuthenticated, signIn, fetchUser, loading, logout };
};
