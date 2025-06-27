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
  const paramsData = await searchParams;

  // Format date as "YYYY-MM-DDTHH:mm:ss.sssZ"
  const formatDate = (date: Date) => date.toISOString();

  // Use params date if available, otherwise use current date in ISO format
  const startDate = (paramsData.from as string) || formatDate(new Date());

  // Use params end date if available, otherwise use current date + 1 month in ISO format
  const endDate =
    (paramsData.to as string) ||
    formatDate(new Date(new Date().setMonth(new Date().getMonth() + 1)));

  const filterBy = (paramsData.filter_by as string) || "month";

  const fetchData = async () => {
    try {
      const response = await getData(
        `statistics?start_date=${startDate}&end_date=${endDate}&filter_by=${filterBy}`,
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        })
      );
      return response;
    } catch (error) {
      console.error("Error fetching statistics:", error);
      throw error;
    }
  };

  const statistics = await fetchData();

  const trans = await getDictionary("ar");

  return <DashboardPageView statistics={statistics} trans={trans} />;
};

export default Dashboard;
