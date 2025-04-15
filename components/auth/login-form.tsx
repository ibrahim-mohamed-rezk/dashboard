"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { postData } from "@/lib/axios/server";
import axios from "axios";

const LogInForm = () => {
  const [isPending, setIsPending] = useState(false);
  const [formdDat, setFormData] = useState<{ email: string; password: string }>(
    {
      email: "",
      password: "",
    }
  );
  const router = useRouter();

  const handleSubmit = async () => {
    setIsPending(true);
    const data = new FormData();
    data.append("email", formdDat.email);
    data.append("password", formdDat.password);
    try {
      const response = await postData("login", data, {
        Authorization: `Bearer token`,
      });

      await axios.post(
        "/api/auth/setToken",
        { token: response.token },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      router.push("/dashboard");

      toast.success("Logged in successfully");
    } catch (error) {
      toast.error("Invalid email or password");
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form className="mt-5 2xl:mt-7">
      <div>
        <Label htmlFor="email" className="mb-2 font-medium text-default-600">
          Email{" "}
        </Label>
        <Input
          disabled={isPending}
          onChange={(e) => setFormData({ ...formdDat, email: e.target.value })}
          type="email"
          id="email"
        />
      </div>

      <div className="mt-3.5">
        <Label htmlFor="password" className="mb-2 font-medium text-default-600">
          Password{" "}
        </Label>
        <Input
          disabled={isPending}
          onChange={(e) =>
            setFormData({ ...formdDat, password: e.target.value })
          }
          type={"password"}
          id="password"
          className="peer"
        />
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full mt-5"
        disabled={isPending}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Loading..." : "Sign In"}
      </Button>
    </form>
  );
};

export default LogInForm;