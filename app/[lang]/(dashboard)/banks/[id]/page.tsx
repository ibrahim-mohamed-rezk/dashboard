import { getData } from "@/lib/axios/server";
import { cookies } from "next/headers";
import BankModulesComponent from "./components/BankModulesComponent";


const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const cookiesData = await cookies();
  const token = cookiesData.get("token")?.value;
  const paramsData = await params;

  const fetchData = async () => {
    try {
      const response = await getData(
        `banks/${paramsData.id}`,
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const bankData = await fetchData();

  return (
    <div className="w-full">
      <BankModulesComponent
        bankId={paramsData.id}
        token={token as string}
        initialBankData={bankData}
      />
    </div>
  );
};

export default page;
