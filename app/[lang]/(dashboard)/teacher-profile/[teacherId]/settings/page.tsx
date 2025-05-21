import UserMeta from "./user-meta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalDetails from "./personal-details";
import ChangePassword from "./change-password";
import { cookies } from "next/headers";
import Header from "../components/header";
import { getData } from "@/lib/axios/server";

const Settings = async ({ params }: { params: Promise<{ teacherId: string }> }) => {
  const cookiesData = await cookies();
  const token = cookiesData.get("token")?.value;
  const { teacherId } = await params;

    const feachData = async () => {
      try {
        const response = await getData( 
          `teachers/${teacherId}`,
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

  const user = await feachData();

  const tabs: {
    label: string;
    value: string;
  }[] = [
    {
      label: "البيانات الشخصية",
      value: "personal",
    },
    {
      label: "تغيير كلمة المرور",
      value: "password",
    },
  ];

  return (
    <>
      <Header user={user.user} teacherId={teacherId} />
      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <UserMeta token={token as string} user={user.user} />
        </div>
        <div className="col-span-12 lg:col-span-8">
          <Tabs defaultValue="personal" className="p-0 px-1">
            <TabsList className="bg-card  flex-1 overflow-x-auto md:overflow-hidden  w-full px-5 pt-6 pb-2.5 h-fit border-b border-default-200  rounded-none justify-start gap-12 rounded-t-md">
              {tabs.map((tab, index) => (
                <TabsTrigger
                  className="capitalize px-0 data-[state=active]:shadow-none  data-[state=active]:bg-transparent data-[state=active]:text-primary transition duration-150 before:transition-all before:duration-150 relative before:absolute before:left-1/2 before:-bottom-[11px] before:h-[2px] before:-translate-x-1/2 before:w-0 data-[state=active]:before:bg-primary data-[state=active]:before:w-full"
                  value={tab.value}
                  key={`tab-${index}`}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="personal" className="mt-0">
              <PersonalDetails token={token as string} user={user} />
            </TabsContent>
            <TabsContent value="password" className="mt-0">
              <ChangePassword />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Settings;
