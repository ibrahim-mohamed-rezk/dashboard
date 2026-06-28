import { redirect } from "next/navigation";
import AutoLogin from "@/components/auth/auto-login";

const LoginWithTokenPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = await searchParams;
  const token =
    typeof params.token === "string" ? params.token.trim() : undefined;
  const redirectTo =
    typeof params.redirect === "string" && params.redirect.startsWith("/")
      ? params.redirect
      : "/dashboard";

  if (!token) {
    return redirect("/auth/login");
  }

  return <AutoLogin token={token} redirectTo={redirectTo} />;
};

export default LoginWithTokenPage;
