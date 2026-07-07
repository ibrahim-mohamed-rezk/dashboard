"use client";

import { getData } from "@/lib/axios/server";
import { unwrapApiData } from "@/lib/api/response";
import CourseModules from "./components/CourseModules";
import { canAccessModule } from "@/lib/permissions";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { User } from "@/lib/type";
import axios from "axios";

const CoursePage = () => {
  const [courseData, setCourseData] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const courseId = params.id as string;

  useEffect(() => {
    const fetchAuthAndCourse = async () => {
      try {
        // Get token from API
        const authResponse = await axios.get("/api/auth/getToken");
        const tokenValue = authResponse.data.token;
        setToken(tokenValue);

        // Get user from localStorage
        const userDataString = localStorage.getItem("user");
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser(userData);

          // Check permissions
          const canAccessCourses = canAccessModule(userData?.modules, ["Courses", "courses"]);
          if (!canAccessCourses) {
            return; // Will show permission error
          }

          // Fetch course data
          const courseResponse = await getData(
            `courses/${courseId}`,
            {},
            {
              Authorization: `Bearer ${tokenValue}`,
            }
          );
          setCourseData(unwrapApiData(courseResponse));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthAndCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const canAccessCourses = user ? canAccessModule(user?.modules, ["Courses", "courses"]) : false;

  if (!canAccessCourses) {
    return <div>ليس لديك صلاحية لعرض هذه الصفحة</div>;
  }

  if (!courseData) {
    return <div>لم يتم العثور على الكورس</div>;
  }

  return (
    <div className="w-full">
      <div className="mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="relative h-64">
          <img
            src={
              courseData.cover?.startsWith("http") &&
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
                {courseData.modules?.length || 0}{" "}
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
        {token && <CourseModules token={token} courseId={courseId} />}
      </div>
    </div>
  );
};

export default CoursePage;
