import DashBoardLayoutProvider from "@/provider/dashboard.layout.provider";
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
  const user = JSON.parse(cookiesData.get("user")?.value || "{}");

  if (!token) {
    return redirect("/auth/login");
  }

  return (
    <DashBoardLayoutProvider user={user}>{children}</DashBoardLayoutProvider>
  );
};

export default layout;
