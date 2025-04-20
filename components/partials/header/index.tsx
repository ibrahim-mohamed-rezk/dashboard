import { cn } from "@/lib/utils";
import ThemeButton from "./theme-button";
import { useSidebar, useThemeStore } from "@/store";
import ProfileInfo from "./profile-info";
import VerticalHeader from "./vertical-header";
import NotificationMessage from "./notification-message";

import Language from "./language";
import { useMediaQuery } from "@/hooks/use-media-query";
import MobileMenuHandler from "./mobile-menu-handler";
import ClassicHeader from "./layout/classic-header";
import FullScreen from "./full-screen";
import { User } from "@/lib/type";

const NavTools = ({ isDesktop, user }: { isDesktop: boolean; user: User }) => {
  return (
    <div className="nav-tools flex items-center  gap-2">
      {isDesktop && <Language />}
      {isDesktop && <FullScreen />}

      <ThemeButton />
      <NotificationMessage />

      <div className="ltr:pl-2 rtl:pr-2">
        <ProfileInfo user={user} />
      </div>
      {!isDesktop && <MobileMenuHandler />}
    </div>
  );
};
const Header = ({ user }: { user: User }) => {
  const { collapsed } = useSidebar();
  const { navbarType } = useThemeStore();

  const isDesktop = useMediaQuery("(min-width: 1280px)");

  return (
    <ClassicHeader
      className={cn("", {
        "ltr:xl:ml-[300px] rtl:xl:mr-[300px]": !collapsed,
        "ltr:xl:ml-[72px] rtl:xl:mr-[72px]": collapsed,

        "sticky top-0": navbarType === "sticky",
      })}
    >
      <div className="w-full bg-card/90 backdrop-blur-lg md:px-6 px-[15px] py-3 border-b">
        <div className="flex justify-between items-center h-full">
          <VerticalHeader />
          <NavTools isDesktop={isDesktop} user={user} />
        </div>
      </div>
    </ClassicHeader>
  );
};

export default Header;
