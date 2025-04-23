import DashboardPageView from "./page-view";
import { getDictionary } from "@/app/dictionaries";

const Dashboard = async () => {
  const trans = await getDictionary("ar");
  return <DashboardPageView trans={trans} />;
};

export default Dashboard;
