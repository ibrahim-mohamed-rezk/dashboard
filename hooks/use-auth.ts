"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { User } from "@/lib/type";

export const useAuth = () => {
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        // Get token from API (cookie)
        const response = await axios.get("/api/auth/getToken");
        setToken(response.data.token);

        // Get user from localStorage
        const userDataString = localStorage.getItem("user");
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser(userData);
        }
      } catch (err) {
        setError("Failed to fetch authentication data");
        console.error("Auth error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuth();
  }, []);

  return { token, user, loading, error };
};
