import DashboardLayoutWrapper from "@/provider/dashboard.layout.wrapper";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) => {
  await params;
  const cookiesData = await cookies();
  const token = cookiesData.get("token")?.value;

  if (!token) {
    return redirect("/auth/login");
  }

  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
};

export default layout;
