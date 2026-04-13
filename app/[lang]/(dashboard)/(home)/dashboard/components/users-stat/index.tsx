"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import UsersDataChart from "./users-data-chart";
import UsersDataTable from "./users-data-table";
import { Statistics } from "@/lib/type";
import { translate } from "@/lib/utils";

interface UsersStatProps {
  statistics: Statistics | null;
  trans: { [key: string]: string };
}

const UsersStat = ({ statistics, trans }: UsersStatProps) => {
  const usersData = [
    {
      id: 1,
      country: translate("الطلاب", trans),
      count: (statistics?.students?.total || 0).toString(),
    },
    {
      id: 2,
      country: translate("المعلمون", trans),
      count: (statistics?.teachers?.total || 0).toString(),
    },
    {
      id: 3,
      country: translate("الدورات", trans),
      count: (statistics?.courses?.total || 0).toString(),
    },
    {
      id: 4,
      country: translate("المواد", trans),
      count: (statistics?.subjects?.total || 0).toString(),
    },
    {
      id: 5,
      country: translate("الوحدات", trans),
      count: (statistics?.modules?.total || 0).toString(),
    },
  ];

  return (
    <Card>
      <CardHeader className="border-none pb-0 mb-5">
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <div className="text-xl font-semibold text-default-900">
              {translate("المستخدمون", trans)}
            </div>
            <span className="text-xs text-default-600 ml-1">
              {translate("في آخر 30 دقيقة", trans)}
            </span>
          </div>
          <div className="flex-none flex items-center gap-1">
            <span className="text-4xl font-semibold text-primary">
              {statistics?.users?.total || 0}
            </span>
            <span className="text-2xl text-success">
              <Icon icon="heroicons:arrow-trending-up-16-solid" />
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-0">
        <p className="text-xs font-medium text-default-800">
          {translate("المستخدمون في الدقيقة", trans)}
        </p>
        <UsersDataChart />
        <UsersDataTable users={usersData} />
      </CardContent>
    </Card>
  );
};

export default UsersStat;