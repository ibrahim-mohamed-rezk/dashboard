import { cookies } from "next/headers";
import BankModulesComponent from "./components/BankModulesComponent";


const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const cookiesData = await cookies();
  const token = cookiesData.get("token")?.value;
  const paramsData = await params;

  return (
    <div className="w-full">
      <BankModulesComponent
        bankId={paramsData.id}
        token={token as string}
      />
    </div>
  );
};

export default page;
