"use client";
import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fetchBanners, addBanner } from "@/services/bannerService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface Banner {
  id: number;
  image: string;
  status: string;
  type: string;
  teacher: number | null;
}

const DEFAULT_IMAGE = "https://via.placeholder.com/300x200";

const columns: ColumnDef<Banner>[] = [
  {
    accessorKey: "image",
    header: "صوره",
    cell: ({ row }) => {
      const banner = row.original;
      return (
        <Avatar className="rounded-md w-24 h-24">
          <AvatarImage
            src={banner.image || DEFAULT_IMAGE}
            alt="Banner"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_IMAGE;
            }}
          />
          <AvatarFallback>Img</AvatarFallback>
        </Avatar>
      );
    },
  },
  {
    accessorKey: "status",
    header: "موضوع",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.getValue("status")}
      </Badge>
    ),
  },
  {
    accessorKey: "type",
    header: "نوع",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.getValue("type")}
      </Badge>
    ),
  },
  {
    accessorKey: "teacher",
    header: "مدرس",
    cell: ({ row }) => (
      <div>{row.getValue("teacher") ? row.getValue("teacher") : "N/A"}</div>
    ),
  },
];

const schema = z.object({
  image: z.string().url("Invalid image URL"),
  status: z.enum(["banner", "ad"]),
  type: z.enum(["online", "offline"]),
  teacher: z.union([z.number(), z.null()]).optional(),
});

export function BannerTable() {
  const [data, setData] = React.useState<Banner[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  const [globalFilter, setGlobalFilter] = React.useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "all",
  });

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const banners = await fetchBanners();
      console.log("Fetched Banners:", banners);
      setData(banners);
      setLoading(false);
    };

    fetchData();
  }, []);

  const onSubmit = async (formData: any) => {
    try {
      await addBanner(formData);
      reset();
      alert("Banner added successfully!");
      location.reload();
    } catch (error) {
      alert("Failed to add banner.");
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, value) => {
      const content = row.getValue(columnId);
      return String(content).toLowerCase().includes(value.toLowerCase());
    },
  });

  return (
    <>
      <div className="flex items-center gap-2 px-4 mb-4">
        <Input
          placeholder="Search banners..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm min-w-[200px] h-10"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">اضافه لوحه اعلانيه</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Banner</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <Input
                  {...register("image")}
                  placeholder="Image URL"
                  className={errors.image ? "border-red-500" : ""}
                />
                <select {...register("status")} className="w-full p-2 border rounded">
                  <option value="banner">Banner</option>
                  <option value="ad">Ad</option>
                </select>
                <select {...register("type")} className="w-full p-2 border rounded">
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
                <Input {...register("teacher")} placeholder="Teacher ID (Optional)" />
              </div>
              <Button type="submit" className="mt-4 w-full">
                Submit
              </Button>
              <DialogClose asChild>
                <Button variant="outline" className="mt-2 w-full">
                  Cancel
                </Button>
              </DialogClose>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <Table className="dark:bg-[#1F2937] w-full rounded-md shadow-md">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No banners found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default BannerTable;
