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
      <div className="mx-auto bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="relative h-64">
          <img
            src={courseData.cover}
            alt={courseData.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{courseData.title}</h1>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600">رقم الدورة</p>
              <p className="font-semibold">{courseData.cour_no}</p>
            </div>
            <div>
              <p className="text-gray-600">الموضوع</p>
              <p className="font-semibold">{courseData.subject}</p>
            </div>
            <div>
              <p className="text-gray-600">المستوى</p>
              <p className="font-semibold">{courseData.level}</p>
            </div>
            <div>
              <p className="text-gray-600">السعر</p>
              <p className="font-semibold">{courseData.price} </p>
            </div>
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">الوصف</h2>
            <p className="text-gray-700">{courseData.description}</p>
          </div>
        </div>
        <CourseModules
          token={token as string}
          modules={courseData.modules}
          courseId={paramsData.id}
        />
      </div>

      {/* Course Modules Section */}
    </div>
  );
};

export default page;
