import { cookies } from "next/headers";
import BankModulesComponent from "./components/BankModulesComponent";
import { redirect } from "next/navigation";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const cookiesData = await cookies();
  const token = cookiesData.get("token")?.value;
  const user = JSON.parse(cookiesData.get("user")?.value || "{}");
  const paramsData = await params;

  if (!token || !user) {
    return redirect("/auth/login");
  }

  if (
    !user.modules.some((item: any) => {
      item.name === "Banks";
      item.access === true;
    })
  ) {
    return <div>ليس لديك صلاحية لعرض هذه الصفحة</div>;
  }

  return (
    <div className="w-full">
      <BankModulesComponent bankId={paramsData.id} token={token as string} />
    </div>
  );
};

export default page;
