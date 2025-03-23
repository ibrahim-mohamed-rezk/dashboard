"use client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ThemeChange from "./theme-change";
import SelectTheme from "./select-theme";
import RtlSwitcher from "./rtl-switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import RadiusInit from "./radius";
import { Settings } from "@/components/svg";
import { useThemeStore } from "@/store";

const ThemeCustomize = ({
  trigger = (
    <div className="fixed ltr:right-4 rtl:left-4 bottom-14 z-50">
      <Button size="icon" className=" relative h-12 w-12  rounded-full ">
        <Settings className="h-7 w-7 animate-spin" />
      </Button>
    </div>
  ),
}) => {
  const { isRtl } = useThemeStore();

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side={isRtl ? "left" : "right"}
        overlayClass=" bg-transparent backdrop-blur-none"
        className="lg:w-3/4 w-full max-w-full md:max-w-sm px-6 pt-0 pb-6"
      >
        <SheetHeader className=" text-start border-b -mx-6 px-6 py-4 shadow-sm md:shadow-none">
          <SheetTitle className=" text-base  font-medium ">
            Theme Customizer
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-40px)] -mx-6 px-6">
          <div className=" space-y-8 mt-3">
            {/* <SelectLayout /> */}
            <SelectTheme />
            <RtlSwitcher />
            <ThemeChange />
            {/* <SidebarChange /> */}
            {/* <SidebarImage /> */}
            <RadiusInit />
            {/* <HeaderStyle /> */}
            {/* <FooterStyle /> */}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ThemeCustomize;
