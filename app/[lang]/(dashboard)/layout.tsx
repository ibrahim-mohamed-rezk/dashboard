import DashboardLayoutWrapper from "@/provider/dashboard.layout.wrapper";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const layout = async ({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: any };
}) => {
  const cookiesData = await cookies();
  const token = cookiesData.get("token")?.value;

  if (!token) {
    return redirect("/auth/login");
  }

  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
};

export default layout;
