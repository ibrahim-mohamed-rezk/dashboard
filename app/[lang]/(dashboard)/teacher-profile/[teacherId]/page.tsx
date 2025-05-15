import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, User } from "@/components/svg";
import { cookies } from "next/headers";
import Header from "./components/header";
const Overview = async () => {
  const cookiesData = await cookies();
  const user = JSON.parse(cookiesData.get("user")?.value || "{}");

  return (
    <>
      <Header />
      <div className="py-5">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle className="text-lg font-medium text-default-800 flex gap-2 items-center">
              <User className="w-5 h-5 text-primary mr-2" />
              معلومات المستخدم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-5 mt-4">
              <li className="flex gap-2 items-center p-2 rounded-md hover:bg-slate-700">
                <User className="w-5 h-5 text-primary mr-3" />
                <span className="font-medium text-default-800 w-32">
                  الاسم:{" "}
                </span>
                <span className="text-white">{user?.full_name}</span>
              </li>
              <li className="flex gap-2 items-center p-2 rounded-md hover:bg-slate-700">
                <Phone className="w-5 h-5 text-primary mr-3" />
                <span className="font-medium text-default-800 w-32">
                  رقم الهاتف:
                </span>
                <span className="text-white">{user?.phone}</span>
              </li>
              <li className="flex gap-2 items-center p-2 rounded-md hover:bg-slate-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-primary mr-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span className="font-medium text-default-800 w-32">
                  البريد الإلكتروني:
                </span>
                <span className="text-white">{user?.email}</span>
              </li>
              <li className="flex gap-2 items-center p-2 rounded-md hover:bg-slate-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-primary mr-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="font-medium text-default-800 w-32">
                  الدور:
                </span>
                <span className="text-white">{user?.role}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Overview;
