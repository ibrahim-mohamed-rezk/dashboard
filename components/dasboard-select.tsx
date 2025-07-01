"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useRouter, useSearchParams } from "next/navigation";

const FILTER_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const DashboardSelect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterBy = searchParams.get("filter_by") || "month";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filter_by", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <Select value={filterBy} onValueChange={handleChange}>
      <SelectTrigger className="w-[124px]">
        <SelectValue placeholder="Filter By" className="whitespace-nowrap" />
      </SelectTrigger>
      <SelectContent>
        {FILTER_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default DashboardSelect;