import { getData } from "@/lib/axios/server";
import DashboardPageView from "./page-view";
import { getDictionary } from "@/app/dictionaries";
import { AxiosHeaders } from "axios";
import { cookies } from "next/headers";

const Dashboard = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const cookiesData = await cookies();
  const token = cookiesData.get("token")?.value;

  const feachData = async () => {
    try {
      const params = await searchParams;
      const startDate = params.start_date || "2025-02-01";
      const endDate = params.end_date || "2025-06-01";
      const filterBy = params.filter_by || "month";

      const response = await getData(
        `statistics?start_date=${startDate}&end_date=${endDate}&filter_by=${filterBy}`,
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        })
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const statistics = await feachData();
  const trans = await getDictionary("ar");
  return <DashboardPageView statistics={statistics} trans={trans} />;
};

export default Dashboard;
