"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "next-themes";

export default function DatePickerWithRange({
  className,
  value,
  onChange,
}: {
  className?: string;
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme: mode } = useTheme();

  const from = searchParams.get("from")
    ? new Date(searchParams.get("from")!)
    : undefined;
  const to = searchParams.get("to")
    ? new Date(searchParams.get("to")!)
    : undefined;
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(
    {
      from,
      to,
    }
  );

  const date = value !== undefined ? value : internalDate;

  const handleSelect = (newDate: DateRange | undefined) => {
    if (onChange) {
      onChange(newDate);
    } else {
      setInternalDate(newDate);
    }
    const params = new URLSearchParams(searchParams.toString());

    if (newDate?.from) {
      params.set("from", newDate.from.toISOString());
    } else {
      params.delete("from");
    }

    if (newDate?.to) {
      params.set("to", newDate.to.toISOString());
    } else {
      params.delete("to");
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            color={mode === "dark" ? "secondary" : "default"}
            className={cn(" font-normal", {
              " bg-white text-default-600": mode !== "dark",
            })}
          >
            <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>اختر التاريخ</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
