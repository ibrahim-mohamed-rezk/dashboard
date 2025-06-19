import React, { useEffect, useState } from "react";
import { cn, isLocationMatch, getDynamicPath, translate } from "@/lib/utils";
import { menusConfig } from "@/config/menus";
import SingleIconMenu from "./single-icon-menu";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/store";
import MenuItem from "./menu-item";
import Link from "next/link";
import FooterMenu from "./footer-menu";
import { Graph, SiteLogo } from "@/components/svg";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMediaQuery } from "@/hooks/use-media-query";
import MenuOverlayPortal from "./MenuOverlayPortal";
import { User } from "@/lib/type";
import { File, UserIcon, Video, Image as ImageIcon, Code, UserCircle, Percent } from "lucide-react";

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
        {/* <div
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
        </div> */}
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
          <Link href="/dashboard">
            <h2 className="text-lg  bg-transparent   z-50   font-semibold  flex gap-4 items-center   text-default-700 sticky top-0 py-4  px-4   capitalize ">
              <svg
                width="44"
                height="43"
                viewBox="0 0 44 43"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.6144 20.3511C11.8586 15.5171 1.97076 14.2004 0.527773 17.4112C-0.153761 18.9278 1.17157 21.1816 3.89326 23.6485C2.59902 22.0364 2.07732 20.5643 2.56128 19.4252C3.93766 16.1855 12.9086 16.8983 22.5988 21.015C32.289 25.134 39.0289 31.0982 37.6525 34.3379C36.9776 35.9277 34.4691 36.5628 30.9482 36.3141C35.457 37.0602 38.6981 36.6494 39.4773 34.9152C40.9203 31.7044 33.3702 25.1828 22.6144 20.3489V20.3511Z"
                  fill="#22577D"
                ></path>
                <path
                  d="M22.4812 35.9744C29.677 35.9744 35.5103 30.1398 35.5103 22.9425C35.5103 15.7451 29.677 9.91052 22.4812 9.91052C15.2855 9.91052 9.45215 15.7451 9.45215 22.9425C9.45215 30.1398 15.2855 35.9744 22.4812 35.9744Z"
                  fill="white"
                ></path>
                <path
                  d="M28.7218 22.1386L18.8895 16.4609C18.2701 16.1034 17.4976 16.5497 17.4976 17.2647V28.6202C17.4976 29.3352 18.2701 29.7815 18.8895 29.424L28.7218 23.7462C29.3412 23.3887 29.3412 22.4961 28.7218 22.1386Z"
                  fill="#F15A22"
                ></path>
                <path
                  d="M22.4816 34.9574C15.8571 34.9574 10.4692 29.5684 10.4692 22.9425C10.4692 16.3166 15.8571 10.9275 22.4816 10.9275C29.106 10.9275 34.4939 16.3166 34.4939 22.9425C34.4939 29.5684 29.106 34.9574 22.4816 34.9574ZM22.4816 12.8704C16.9294 12.8704 12.4117 17.3891 12.4117 22.9425C12.4117 28.4959 16.9294 33.0145 22.4816 33.0145C28.0337 33.0145 32.5514 28.4959 32.5514 22.9425C32.5514 17.3891 28.0337 12.8704 22.4816 12.8704Z"
                  fill="#22577D"
                ></path>
                <path
                  d="M7.82056 20.3665L7.70068 20.9682C7.7806 20.7795 7.8139 20.5752 7.82056 20.3665Z"
                  fill="#22577D"
                ></path>
                <path
                  d="M9.72118 17.642C9.75004 16.9692 9.08627 16.5251 9.03077 16.3075C8.60009 14.5866 9.35045 11.1715 9.03077 9.24639L11.6947 10.179V16.1232C13.9613 12.5505 17.9484 10.1723 22.4816 10.1723C27.0148 10.1723 31.0041 12.5505 33.2685 16.1232V10.3122C32.9333 10.4388 31.7767 10.9584 31.6724 10.3144L42.5902 6.8505L23.4273 0.839677L21.7468 0.779724L2.37305 6.84828L7.93854 8.73568C7.77648 10.9339 8.24934 13.654 7.9785 15.7812C7.87416 16.6006 7.17708 17.0513 7.18152 17.6331C7.18596 18.1882 7.8564 19.3518 7.8231 20.3621L7.96962 19.6338L8.2338 21.4967L8.76659 20.4309L9.29495 20.7018C8.90423 19.6648 9.69232 18.3104 9.72118 17.6398V17.642Z"
                  fill="#22577D"
                ></path>
                <path
                  d="M38.7759 31.3868C40.8582 33.5806 41.7861 35.5946 41.149 37.0667C39.595 40.6595 29.3121 39.6669 18.1811 34.8507C9.6719 31.1669 3.13628 26.3174 1.22266 22.6314C1.75101 26.8148 9.05031 33.0987 19.129 37.6907C30.7107 42.9687 41.573 44.0124 43.389 40.0222C44.3702 37.8683 42.5121 34.6886 38.7736 31.389L38.7759 31.3868Z"
                  fill="#F15A22"
                ></path>
                <path
                  d="M23.5094 0.577792L21.709 0.504517L1.47607 6.84175L7.6454 8.93565C7.59212 9.90822 7.64984 10.9763 7.70312 12.011C7.77194 13.2967 7.84298 14.6267 7.69868 15.7525C7.65206 16.1122 7.46558 16.3987 7.28576 16.6762C7.09485 16.9715 6.89727 17.2757 6.89949 17.6421C6.89949 17.9152 7.02159 18.2661 7.16367 18.6724C7.34792 19.2031 7.55438 19.8026 7.54106 20.3422L7.42562 20.9151L7.88516 21.055L8.08052 22.4206L8.88637 20.8107L9.80544 21.2793L9.55236 20.6087C9.32593 20.0091 9.57456 19.2253 9.77214 18.5947C9.88536 18.2306 9.98526 17.9175 9.99636 17.6577C10.0208 17.0892 9.6678 16.6784 9.43471 16.4053C9.38143 16.3431 9.30817 16.2565 9.29707 16.2432C9.08173 15.3861 9.18163 14.0139 9.27709 12.6883C9.35257 11.6313 9.43249 10.5433 9.35701 9.65953L11.4149 10.379V17.0803L11.9277 16.2743C14.241 12.6283 18.1859 10.4522 22.4815 10.4522C26.7772 10.4522 30.7221 12.6283 33.0353 16.2743L33.5481 17.0803V10.0148L43.5136 6.85285L23.5116 0.580013L23.5094 0.577792Z"
                  fill="white"
                ></path>
                <path
                  d="M7.82056 20.3665L7.70068 20.9682C7.7806 20.7795 7.8139 20.5752 7.82056 20.3665Z"
                  fill="#22577D"
                ></path>
                <path
                  d="M9.72118 17.642C9.75004 16.9692 9.08627 16.5251 9.03077 16.3075C8.60009 14.5866 9.35045 11.1715 9.03077 9.24639L11.6947 10.179V16.1232C13.9613 12.5505 17.9484 10.1723 22.4816 10.1723C27.0148 10.1723 31.0041 12.5505 33.2685 16.1232V10.3122C32.9333 10.4388 31.7767 10.9584 31.6724 10.3144L42.5902 6.8505L23.4273 0.839677L21.7468 0.779724L2.37305 6.84828L7.93854 8.73568C7.77648 10.9339 8.24934 13.654 7.9785 15.7812C7.87416 16.6006 7.17708 17.0513 7.18152 17.6331C7.18596 18.1882 7.8564 19.3518 7.8231 20.3621L7.96962 19.6338L8.2338 21.4967L8.76659 20.4309L9.29495 20.7018C8.90423 19.6648 9.69232 18.3104 9.72118 17.6398V17.642Z"
                  fill="#22577D"
                ></path>
              </svg>
              <span className=" block ">لوحة التحكم</span>
            </h2>
          </Link>
          <ScrollArea className="h-[calc(100%-40px)]  grow ">
            <div className="px-4 " dir="rtl">
              <ul>
                <li className="mb-1.5 last:mb-0">
                  <MenuItem
                    childItem={{
                      href: "/dashboard",
                      title: "الاحصائيات",
                      icon: Graph,
                    }}
                    toggleNested={toggleNested}
                    index={0}
                    nestedIndex={nestedIndex}
                    locationName={locationName}
                  />
                </li>
                <li className="mb-1.5 last:mb-0">
                  <MenuItem
                    childItem={{
                      href: "/teachers",
                      title: "المعلمين",
                      icon: UserIcon,
                    }}
                    toggleNested={toggleNested}
                    index={7}
                    nestedIndex={nestedIndex}
                    locationName={locationName}
                  />
                </li>
                <li className="mb-1.5 last:mb-0">
                  <MenuItem
                    childItem={{
                      href: "/admins",
                      title: "الادمن",
                      icon: UserCircle,
                    }}
                    toggleNested={toggleNested}
                    index={7}
                    nestedIndex={nestedIndex}
                    locationName={locationName}
                  />
                </li>

                {user.modules.map((item) => {
                  if (item.access === false) return;
                  return (
                    <li className="mb-1.5 last:mb-0">
                      <MenuItem
                        childItem={{
                          href: item.id === 5 ? "/banners" : "/blogs",
                          title: item.id === 5 ? "البنرات" : "المقالات",
                          icon: item.id === 5 ? ImageIcon : File,
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
                <li className="mb-1.5 last:mb-0">
                  <MenuItem
                    childItem={{
                      href: "/codes",
                      title: "الاكواد",
                      icon: Code,
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
                      href: "/coupons",
                      title: "كوبونات الخصم",
                      icon: Percent,
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
