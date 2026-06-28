"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashBoardLayoutProvider from "./dashboard.layout.provider";
import LayoutLoader from "@/components/layout-loader";
import { User } from "@/lib/type";
import { clearAuthSession, refreshAuthSession } from "@/lib/auth-session";

const DashboardLayoutWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const syncSession = async () => {
      try {
        const response = await refreshAuthSession();
        if (!cancelled) {
          setUser(response.data);
        }
      } catch (error) {
        console.error("Failed to refresh auth session:", error);
        await clearAuthSession();
        if (!cancelled) {
          router.replace("/auth/login");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    syncSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !user) {
    return <LayoutLoader />;
  }

  return <DashBoardLayoutProvider user={user}>{children}</DashBoardLayoutProvider>;
};

export default DashboardLayoutWrapper;
