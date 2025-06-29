import { getData } from "@/lib/axios/server";
import { cookies } from "next/headers";
import CourseModules from "./components/CourseModules";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const cookiesData = await cookies();
  const token = cookiesData.get("token")?.value;
  const paramsData = await params;
  const feachData = async () => {
    try {
      const response = await getData(
        `courses/${paramsData.id}`,
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
  const courseData = await feachData();

  return (
    <div className="w-full">
      <div className="mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="relative h-64">
          <img
            src={
              courseData.cover.startsWith("http") &&
              courseData.cover.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                ? courseData.cover
                : "/images/all-img/user-cover.png"
            }
            alt={courseData.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            {courseData.title}
          </h1>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600 dark:text-gray-400">رقم الدورة</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {courseData.cour_no}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">الموضوع</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {courseData.subject}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">المستوى</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {courseData.level}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">السعر</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {courseData.price}{" "}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">عدد الدروس</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {courseData.modules.length}{" "}
              </p>
            </div>
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              الوصف
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {courseData.description}
            </p>
          </div>
        </div>
        <CourseModules token={token as string} courseId={paramsData.id} />
      </div>
    </div>
  );
};

export default page;
