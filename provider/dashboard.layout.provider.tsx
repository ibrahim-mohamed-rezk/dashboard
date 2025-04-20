"use client";
import Header from "@/components/partials/header";
import Sidebar from "@/components/partials/sidebar";
import { cn } from "@/lib/utils";
import { useSidebar, } from "@/store";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Footer from "@/components/partials/footer";
import MobileSidebar from "@/components/partials/sidebar/mobile-sidebar";
import { useMounted } from "@/hooks/use-mounted";
import LayoutLoader from "@/components/layout-loader";
import { User } from "@/lib/type";

const DashBoardLayoutProvider = ({
  children,
  trans,
  user,
}: {
  children: React.ReactNode;
  trans: any;
  user: User;
}) => {
  const { collapsed } = useSidebar();
  const location = usePathname();
  const mounted = useMounted();
  if (!mounted) {
    return <LayoutLoader />;
  }
  return (
    <>
      <Header user={user} />
      <Sidebar />

      <div
        className={cn("content-wrapper transition-all duration-150 ", {
          "ltr:xl:ml-[300px] rtl:xl:mr-[300px]": !collapsed,
          "ltr:xl:ml-[72px] rtl:xl:mr-[72px]": collapsed,
        })}
      >
        <div className={cn(" layout-padding px-6 pt-6  page-min-height ")}>
          <LayoutWrapper location={location}>{children}</LayoutWrapper>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DashBoardLayoutProvider;

const LayoutWrapper = ({ children, location }: { children: React.ReactNode,  location: any }) => {
  return (
    <>
      <motion.div
        key={location}
        initial="pageInitial"
        animate="pageAnimate"
        exit="pageExit"
        variants={{
          pageInitial: {
            opacity: 0,
            y: 50,
          },
          pageAnimate: {
            opacity: 1,
            y: 0,
          },
          pageExit: {
            opacity: 0,
            y: -50,
          },
        }}
        transition={{
          type: "tween",
          ease: "easeInOut",
          duration: 0.5,
        }}
      >
        <main>{children}</main>
      </motion.div>

      <MobileSidebar className="left-[300px]" />
    </>
  );
};