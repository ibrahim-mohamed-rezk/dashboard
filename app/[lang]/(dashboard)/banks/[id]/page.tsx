"use client";

import BankModulesComponent from "./components/BankModulesComponent";
import { canAccessModule } from "@/lib/permissions";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/lib/type";
import axios from "axios";

const BankPage = () => {
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const bankId = params.id as string;

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        // Get token from API
        const authResponse = await axios.get("/api/auth/getToken");
        const tokenValue = authResponse.data.token;
        setToken(tokenValue);

        // Get user from localStorage
        const userDataString = localStorage.getItem("user");
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser(userData);
        } else {
          router.push("/auth/login");
          return;
        }
      } catch (error) {
        console.error("Error fetching auth:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!token || !user) {
    return null; // Will redirect to login
  }

  if (!canAccessModule(user?.modules, ["Banks", "banks"])) {
    return <div>ليس لديك صلاحية لعرض هذه الصفحة</div>;
  }

  return (
    <div className="w-full">
      <BankModulesComponent bankId={bankId} token={token} />
    </div>
  );
};

export default BankPage;
