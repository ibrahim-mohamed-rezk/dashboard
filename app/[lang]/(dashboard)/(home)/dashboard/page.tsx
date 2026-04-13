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

  const startDate =
    paramsData.from && typeof paramsData.from === "string"
      ? new Date(paramsData.from).toISOString().slice(0, 10)
      : null;

  const endDate =
    paramsData.to && typeof paramsData.to === "string"
      ? new Date(paramsData.to).toISOString().slice(0, 10)
      : null;

  const filterBy = (paramsData.filter_by as string) || "month";

  const fetchData = async () => {
    try {
      const response = await getData(
        `statistics`,
        {
          start_date: startDate,
          end_date: endDate,
          filter_by: filterBy,
        },
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }),
      );
      return response;
    } catch (error) {
      console.error("Error fetching statistics:", error);
      throw error;
    }
  };

  const statistics = await fetchData();

  const trans = await getDictionary("ar");

  const { getServerSession } = await import("next-auth/next");
  const { authOptions } = await import("@/lib/auth");
  const session = await getServerSession(authOptions);
  const sessionRole = (session?.user as any)?.role || "user";

  // Detect whether the API returned teacher-specific stats
  // The teacher endpoint returns { message: "Teacher statistics", data: { ... } }
  const isTeacherStats = statistics?.message === "Teacher statistics";
  const role = isTeacherStats ? "teacher" : sessionRole;

  console.log("Dashboard Loaded", { role, isTeacherStats });

  return (
    <DashboardPageView
      statistics={isTeacherStats ? null : statistics}
      teacherStatistics={isTeacherStats ? statistics?.data : null}
      trans={trans}
      role={role}
    />
  );
};

export default Dashboard;