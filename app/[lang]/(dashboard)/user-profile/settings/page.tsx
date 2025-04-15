import UserMeta from "./user-meta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalDetails from "./personal-details";
import ChangePassword from "./change-password";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const Settings = async () => {
  const cookiesData = cookies();
  const token = cookiesData.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const tabs: {
    label: string;
    value: string;
  }[] = [
    {
      label: "Personal Details",
      value: "personal",
    },
    {
      label: "Change Password",
      value: "password",
    },
  ];

  console.log(token)


  return (
    <div className="grid grid-cols-12 gap-6 mt-6">
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <UserMeta />
      </div>
      <div className="col-span-12 lg:col-span-8">
        <Tabs defaultValue="personal" className="p-0 px-1">
          <TabsList className="bg-card  flex-1 overflow-x-auto md:overflow-hidden  w-full px-5 pt-6 pb-2.5 h-fit border-b border-default-200  rounded-none justify-start gap-12 rounded-t-md">
            {tabs.map((tab, index) => (
              <TabsTrigger
                className="capitalize px-0  data-[state=active]:shadow-none  data-[state=active]:bg-transparent data-[state=active]:text-primary transition duration-150 before:transition-all before:duration-150 relative before:absolute
           before:left-1/2 before:-bottom-[11px] before:h-[2px]
             before:-translate-x-1/2 before:w-0 data-[state=active]:before:bg-primary data-[state=active]:before:w-full"
                value={tab.value}
                key={`tab-${index}`}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="personal" className="mt-0">
            <PersonalDetails token={token}  />
          </TabsContent>
          <TabsContent value="password" className="mt-0">
            <ChangePassword />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
