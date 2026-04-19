"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashBoardLayoutProvider from "./dashboard.layout.provider";
import LayoutLoader from "@/components/layout-loader";
import { User } from "@/lib/type";

const DashboardLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get user data from localStorage
    const userDataString = localStorage.getItem("user");
    
    if (!userDataString) {
      // If no user data in localStorage, redirect to login
      router.push("/auth/login");
      return;
    }

    try {
      const userData = JSON.parse(userDataString);
      setUser(userData);
    } catch (error) {
      console.error("Error parsing user data:", error);
      // Clear invalid data and redirect to login
      localStorage.removeItem("user");
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading || !user) {
    return <LayoutLoader />;
  }

  return <DashBoardLayoutProvider user={user}>{children}</DashBoardLayoutProvider>;
};

export default DashboardLayoutWrapper;
