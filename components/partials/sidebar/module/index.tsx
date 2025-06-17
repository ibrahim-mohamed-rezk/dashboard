import React, { useEffect, useState } from "react";
import { cn, isLocationMatch, getDynamicPath, translate } from "@/lib/utils";
import { menusConfig } from "@/config/menus";
import SingleIconMenu from "./single-icon-menu";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/store";
import MenuItem from "./menu-item";
import Link from "next/link";
import FooterMenu from "./footer-menu";
import { SiteLogo } from "@/components/svg";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMediaQuery } from "@/hooks/use-media-query";
import MenuOverlayPortal from "./MenuOverlayPortal";
import { User } from "@/lib/type";
import { File, UserIcon, Video } from "lucide-react";
import Image from "next/image";

const ModuleSidebar = ({ user }: { user: User }) => {
  const menus = menusConfig?.sidebarNav?.modern || [];
  const { subMenu, setSubmenu, collapsed, setCollapsed, sidebarBg } =
    useSidebar();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [currentSubMenu, setCurrentSubMenu] = useState<any[]>([]);
  const [nestedIndex, setNestedIndex] = useState<number | null>(null);
  // mobile menu overlay
  const [menuOverlay, setMenuOverlay] = useState<boolean>(false);
  const isDesktop = useMediaQuery("(min-width: 1280px)");

  const pathname = usePathname();
  const locationName = getDynamicPath(pathname);

  const toggleSubMenu = (index: number) => {
    setActiveIndex(index);
    if (menus[index].child) {
      setCurrentSubMenu(menus[index].child);
      setSubmenu(false);
      setCollapsed(false);
      if (!isDesktop) {
        setMenuOverlay(true);
      }
    } else {
      setSubmenu(true);
      setCollapsed(true);

      if (!isDesktop) {
        // when location match need to close the sub menu
        if (isLocationMatch(menus[index].title, locationName)) {
          setSubmenu(false);
        }
      }
    }
  };
  // for second level  menu
  const toggleNested = (subIndex: number) => {
    if (nestedIndex === subIndex) {
      setNestedIndex(null);
    } else {
      setNestedIndex(subIndex);
    }
  };

  function setActiveMenu(menuIndex: number, childMenu: any) {
    setActiveIndex(menuIndex);
    setCurrentSubMenu(childMenu);
    setSubmenu(false);
    setCollapsed(false);
  }
  function setActiveNestedMenu(
    menuIndex: number,
    nestedMenuIndex: number,
    childMenu: any
  ) {
    setActiveIndex(menuIndex);
    setNestedIndex(nestedMenuIndex);
    setCurrentSubMenu(childMenu);
    setSubmenu(false);
    setCollapsed(false);
  }

  useEffect(() => {
    let isMenuMatched = false;
    menus.forEach((item: any, i: number) => {
      if (item?.href) {
        if (isLocationMatch(item.href, locationName)) {
          isMenuMatched = true;
          setSubmenu(true);
          setCollapsed(true);
          setMenuOverlay(false);
        }
      }

      item?.child?.forEach((childItem: any, j: number) => {
        if (isLocationMatch(childItem.href, locationName)) {
          setActiveMenu(i, item.child);
          setMenuOverlay(false);
          isMenuMatched = true;
        }

        if (childItem.nested) {
          childItem.nested.forEach((nestedItem: any) => {
            if (isLocationMatch(nestedItem.href, locationName)) {
              setActiveNestedMenu(i, j, item.child);
              setMenuOverlay(false);
              isMenuMatched = true;
            }
            if (nestedItem.child) {
              nestedItem.child.forEach((multiItem: any, k: number) => {
                if (isLocationMatch(multiItem.href, locationName)) {
                  setActiveNestedMenu(i, j, item.child);
                  setMenuOverlay(false);
                  isMenuMatched = true;
                }
              });
            }
          });
        }
      });
    });
    if (!isMenuMatched) {
      setSubmenu(false);
    }
    if (!isDesktop) {
      setSubmenu(true);
    }
  }, [locationName, isDesktop]);

  return (
    <>
      <div className="main-sidebar  pointer-events-none fixed start-0 top-0 z-[60] flex h-full xl:z-10 print:hidden">
        <div
          className={cn(
            "border-default-200  dark:border-default-300 pointer-events-auto relative z-20 flex h-full w-[72px] flex-col border-r border-dashed   bg-card transition-all duration-300",
            {
              "ltr:-translate-x-full rtl:translate-x-full ltr:xl:translate-x-0  rtl:xl:translate-x-0":
                !collapsed && subMenu,
              "translate-x-0": collapsed,
            }
          )}
        >
          <div className=" pt-4 ">
            <Link href="/dashboard">
              <SiteLogo className=" mx-auto text-primary h-8 w-8" />
            </Link>
          </div>
          {/* end logo */}
          <ScrollArea className=" pt-6 grow ">
            {menus.map((item, i) => (
              <div
                key={i}
                onClick={() => toggleSubMenu(i)}
                className=" mb-3 last:mb-0"
              >
                <SingleIconMenu
                  index={i}
                  activeIndex={activeIndex}
                  item={item}
                  locationName={locationName}
                />
              </div>
            ))}
          </ScrollArea>
          <FooterMenu />
        </div>
        {/* end small menu */}

        <div
          className={cn(
            "border-default-200 pointer-events-auto relative z-10 flex flex-col h-full w-[228px] border-r  bg-card   transition-all duration-300",
            {
              "rtl:translate-x-[calc(100%_+_72px)] translate-x-[calc(-100%_-_72px)]":
                collapsed || subMenu,
            }
          )}
        >
          <h2 className="text-lg  bg-transparent   z-50   font-semibold  flex gap-4 items-center   text-default-700 sticky top-0 py-4  px-4   capitalize ">
            <span className=" block ">لوحة التحكم</span>
          </h2>
          <ScrollArea className="h-[calc(100%-40px)]  grow ">
            <div className="px-4 " dir="rtl">
              <ul>
                {currentSubMenu?.map((childItem, j) => (
                  <li key={j} className="mb-1.5 last:mb-0">
                    <MenuItem
                      childItem={childItem}
                      toggleNested={toggleNested}
                      index={j}
                      nestedIndex={nestedIndex}
                      locationName={locationName}
                    />
                  </li>
                ))}
                {user.modules.map((item) => {
                  if (item.access === false) return;
                  return (
                    <li className="mb-1.5 last:mb-0">
                      <MenuItem
                        childItem={{
                          href: item.id === 5 ? "/banners" : "/blogs",
                          title: item.id === 5 ? "البنرات" : "المقالات",
                          icon: item.id === 5 ? Image : File,
                        }}
                        toggleNested={toggleNested}
                        index={1}
                        nestedIndex={nestedIndex}
                        locationName={locationName}
                      />
                    </li>
                  );
                })}

                <li className="mb-1.5 last:mb-0">
                  <MenuItem
                    childItem={{
                      href: "/courses",
                      title: "الكورسات",
                      icon: Video,
                    }}
                    toggleNested={toggleNested}
                    index={1}
                    nestedIndex={nestedIndex}
                    locationName={locationName}
                  />
                </li>
                <li className="mb-1.5 last:mb-0">
                  <MenuItem
                    childItem={{
                      href: "/students",
                      title: "الطلاب",
                      icon: UserIcon,
                    }}
                    toggleNested={toggleNested}
                    index={1}
                    nestedIndex={nestedIndex}
                    locationName={locationName}
                  />
                </li>
              </ul>
            </div>
          </ScrollArea>
        </div>
        {/* end main panel */}
      </div>
      {/* mobile sidebar overlay */}
      {!isDesktop && (
        <MenuOverlayPortal
          isOpen={menuOverlay || collapsed}
          onClose={() => {
            setMenuOverlay(false);
            setSubmenu(true);
            setCollapsed(false);
          }}
        />
      )}
    </>
  );
};

export default ModuleSidebar;
