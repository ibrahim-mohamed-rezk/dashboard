import { Card, CardContent } from "@/components/ui/card";
import coverImage from "@/public/images/all-img/user-cover.png";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import User from "@/public/images/avatar/user.png";
import { cn } from "@/lib/utils";
import { Fragment } from "react";
import { cookies } from "next/headers";
import { User as UserTypes } from "@/lib/type";
const Header = async ({
  teacherId,
  user,
}: {
  teacherId: string;
  user: UserTypes;
}) => {

  return (
    <Fragment>
      <Card className="mt-6 rounded-t-2xl ">
        <CardContent className="p-0">
          <div
            className="relative h-[200px] lg:h-[296px] rounded-t-2xl w-full object-cover bg-no-repeat"
            style={{ backgroundImage: `url(${coverImage.src})` }}
          >
            <div className="flex items-center gap-4 absolute ltr:left-10 rtl:right-10 -bottom-2 lg:-bottom-8">
              <div>
                <Image
                  src={
                    /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(user?.avatar)
                      ? user.avatar
                      : User
                  }
                  alt="user"
                  width={80}
                  height={80}
                  className="h-20 w-20 lg:w-32 lg:h-32 rounded-full"
                />
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-semibold text-primary-foreground mb-1">
                  {user?.full_name}
                </div>
                <div className="text-xs lg:text-sm font-medium text-default-100 dark:text-default-900 pb-1.5">
                  {user?.role}
                </div>
              </div>
            </div>
            <Button
              asChild
              className="absolute bottom-5 ltr:right-6 rtl:left-6 rounded px-5 hidden lg:flex"
              size="sm"
            >
              <Link href={`/teacher-profile/${teacherId}/settings`}>تعديل</Link>
            </Button>
          </div>
          <div className="flex flex-wrap justify-end gap-4 lg:gap-8 pt-7 lg:pt-5 pb-4 px-6">
            {[
              {
                title: "بيانات المستخدم",
                link: `/teacher-profile/${teacherId}`,
              },
              {
                title: "الاعدادات",
                link: `/teacher-profile/${teacherId}/settings`,
              },
            ].map((item, index) => (
              <Link
                key={`user-teacher-link-${index}`}
                href={item.link}
                className={cn(
                  "text-sm font-semibold text-default-500 hover:text-primary relative lg:before:absolute before:-bottom-4 before:left-0 before:w-full lg:before:h-[1px] before:bg-transparent"
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </Fragment>
  );
};

export default Header;
