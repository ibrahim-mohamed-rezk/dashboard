"use client";
import { User } from "@/lib/type";
import ModuleSidebar from "./module";

const Sidebar = ({user}: {user: User}) => {
  return (
    <div>
      <ModuleSidebar user={user} />
    </div>
  );
};

export default Sidebar;
