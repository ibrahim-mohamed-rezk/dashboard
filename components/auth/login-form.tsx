"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

const schema = z.object({
  email: z.string().email({ message: "Your email is invalid." }),
  password: z.string().min(4),
});

const LogInForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const [passwordType, setPasswordType] = useState("password");
  const { signIn, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const togglePasswordType = () => {
    setPasswordType((prev) => (prev === "text" ? "password" : "text"));
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ email: string; password: string }>({
    resolver: zodResolver(schema),
    mode: "all",
  });

  const onSubmit = (data: { email: string; password: string }) => {
    startTransition(async () => {
      try {
        await signIn(data.email, data.password);
        toast.success("Login Successful");
        reset();
      } catch (error) {
        toast.error("Login failed. Please check your credentials.");
      }
    });
  };

  if (loading) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-5 2xl:mt-7">
      <div>
        <Label htmlFor="email" className="mb-2 font-medium text-default-600">
          Email{" "}
        </Label>
        <Input
          disabled={isPending}
          {...register("email")}
          type="email"
          id="email"
          className={cn("", {
            "border-destructive": errors.email,
          })}
        />
        {errors.email && (
          <div className="text-destructive mt-2">{typeof  errors.email.message === "string" && errors.email.message}</div>
        )}
      </div>

      <div className="mt-3.5">
        <Label htmlFor="password" className="mb-2 font-medium text-default-600">
          Password{" "}
        </Label>
        <Input
          disabled={isPending}
          {...register("password")}
          type={passwordType}
          id="password"
          className="peer"
        />
      </div>
      {errors.password && (
        <div className="text-destructive mt-2">
          {typeof errors.password?.message === "string" && errors.password.message}
        </div>
      )}

      <Button className="w-full mt-5" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Loading..." : "Sign In"}
      </Button>
    </form>
  );
};

export default LogInForm;
