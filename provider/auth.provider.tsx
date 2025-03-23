"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // Import useRouter for redirection

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter(); // Initialize useRouter

  // Check for token in local storage on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");

    // If no token is found, redirect to the login page
    if (token) {
      router.replace("/auth/login"); // Redirect to the login page
    }
  }, [router]);

  // Render children if the token exists
  return <>{children}</>;
};

export default AuthProvider;