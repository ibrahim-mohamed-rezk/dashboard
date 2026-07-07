"use client";

import UserMeta from "./user-meta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalDetails from "./personal-details";
import ChangePassword from "./change-password";
import Header from "../components/header";
import { getData } from "@/lib/axios/server";
import { unwrapApiData } from "@/lib/api/response";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "@/lib/type";
import axios from "axios";

const Settings = () => {
  const [token, setToken] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const teacherId = params.teacherId as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get token from API
        const authResponse = await axios.get("/api/auth/getToken");
        const tokenValue = authResponse.data.token;
        setToken(tokenValue);

        // Get user from localStorage
        const userDataString = localStorage.getItem("user");
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setCurrentUser(userData);

          // Fetch teacher data
          const response = await getData(
            `teachers/${teacherId}`,
            {},
            {
              Authorization: `Bearer ${tokenValue}`,
            }
          );
          setTeacherData(unwrapApiData(response));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherId]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!teacherData) {
    return <div>لم يتم العثور على بيانات المعلم</div>;
  }

  return (
    <>
      <Header user={teacherData.user} teacherId={teacherId} />
      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {currentUser && (
            <UserMeta
              token={token}
              user={teacherData.user}
              id={teacherId}
              currentUser={currentUser}
            />
          )}
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
              <PersonalDetails token={token} user={teacherData} />
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
