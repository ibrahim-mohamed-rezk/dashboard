import { getData } from "@/lib/axios/server";
import { extractListData, isApiResponse, unwrapApiData } from "@/lib/api/response";
import DashboardPageView from "./page-view";
import { getDictionary } from "@/app/dictionaries";
import { Statistics, TeacherStatistics } from "@/lib/type";
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
  const teacherId =
    typeof paramsData.teacher_id === "string" ? paramsData.teacher_id : undefined;
  const search =
    typeof paramsData.search === "string" ? paramsData.search : undefined;
  const category =
    typeof paramsData.category === "string" ? paramsData.category : undefined;
  const period =
    typeof paramsData.period === "string" ? paramsData.period : undefined;

  const authHeaders = new AxiosHeaders({
    Authorization: `Bearer ${token}`,
  });

  const fetchData = async () => {
    try {
      const response = await getData(
        `statistics`,
        {
          start_date: startDate,
          end_date: endDate,
          filter_by: filterBy,
          ...(teacherId ? { teacher_id: teacherId } : {}),
          ...(search ? { search } : {}),
          ...(category && category !== "all" ? { category } : {}),
          ...(period && period !== "all" ? { period } : {}),
        },
        authHeaders,
      );
      return response;
    } catch (error) {
      console.error("Error fetching statistics:", error);
      throw error;
    }
  };

  const statisticsResponse = await fetchData();

  const trans = await getDictionary("ar");

  const { getServerSession } = await import("next-auth/next");
  const { authOptions } = await import("@/lib/auth");
  const session = await getServerSession(authOptions);
  const sessionRole = (session?.user as any)?.role || "user";

  const isTeacherStats =
    (isApiResponse(statisticsResponse) &&
      statisticsResponse.msg === "Teacher statistics") ||
    (statisticsResponse as { message?: string })?.message ===
      "Teacher statistics";
  const role = isTeacherStats
    ? "teacher"
    : String(sessionRole || "user").toLowerCase();

  const statsPayload = isTeacherStats
    ? null
    : (unwrapApiData(statisticsResponse) as Statistics);

  let teachersForFilter: { id: number; user: { full_name: string } }[] = [];
  if (!isTeacherStats && role !== "teacher") {
    try {
      const teachersRes = await getData("teachers", {}, authHeaders);
      teachersForFilter = extractListData(teachersRes, "teachers");
    } catch {
      teachersForFilter = [];
    }
  }

  return (
    <DashboardPageView
      statistics={statsPayload}
      teacherStatistics={
        isTeacherStats
          ? (unwrapApiData(statisticsResponse) as TeacherStatistics)
          : null
      }
      teachersForFilter={teachersForFilter}
      trans={trans}
      role={role}
    />
  );
};

export default Dashboard;