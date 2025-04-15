import React from "react";
import { cn, translate } from "@/lib/utils";

const MenuLabel = ({ item, className }: {
  item: any,
  className?: string,
}) => {
  return (
    <div
      className={cn(
        "text-default-900 font-semibold uppercase mb-3 text-xs  mt-4",
        className
      )}
    >
      {item.title}
    </div>
  );
};

export default MenuLabel;
