import React from "react";
import Link from "next/link";
import { cn, isLocationMatch } from "@/lib/utils";
const LinkButton = ({
  children,
  item,
  locationName,
}: {
  children: React.ReactNode;
  item: any;
  toggleMulti: any;
  index: number;
  locationName: string;
  multiIndex: number | null;
}) => {
  return (
    <>
      <Link
        href={item?.href}
        className={cn("", {
          " text-primary    rounded": isLocationMatch(item.href, locationName),
          " text-default-700 hover:text-primary ": !isLocationMatch(
            item.href,
            locationName
          ),
        })}
      >
        {children}
      </Link>
    </>
  );
};

export default LinkButton;
