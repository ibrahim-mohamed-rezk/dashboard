"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import LayoutLoader from "@/components/layout-loader";
import { loginWithToken, persistAuthSession } from "@/lib/auth-session";

type AutoLoginProps = {
  token: string;
  redirectTo?: string;
};

const AutoLogin = ({ token, redirectTo = "/dashboard" }: AutoLoginProps) => {
  const router = useRouter();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!token || hasStarted.current) return;
    hasStarted.current = true;

    const run = async () => {
      try {
        const response = await loginWithToken(token);
        await persistAuthSession(response);
        toast.success("Logged in successfully");
        router.replace(redirectTo);
      } catch (error) {
        console.error("Auto login failed:", error);
        toast.error("Invalid or expired login link");
        router.replace("/auth/login");
      }
    };

    run();
  }, [token, redirectTo, router]);

  return <LayoutLoader />;
};

export default AutoLogin;
