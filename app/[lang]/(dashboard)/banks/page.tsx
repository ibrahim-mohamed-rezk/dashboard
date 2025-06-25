"use client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
import { getData, postData } from "@/lib/axios/server";
import axios, { AxiosHeaders } from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Bank {
  id: number;
  name: string;
  price: number | null;
  banktable_id: number;
  banktable_type: string;
  created_at: string;
  updated_at: string;
}

const columns: ColumnDef<Bank>[] = [
  {
    accessorKey: "name",
    header: "الاسم",
    cell: ({ row }) => row.getValue("name") ?? "N/A",
  },
  {
    accessorKey: "price",
    header: "السعر",
    cell: ({ row }) =>
      row.getValue("price") !== null ? row.getValue("price") : "Free",
  },
  {
    accessorKey: "banktable_id",
    header: "معرف الجدول",
    cell: ({ row }) => row.getValue("banktable_id") ?? "N/A",
  },
  {
    accessorKey: "banktable_type",
    header: "نوع الجدول",
    cell: ({ row }) => row.getValue("banktable_type") ?? "N/A",
  },
  {
    accessorKey: "created_at",
    header: "تاريخ الانشاء",
    cell: ({ row }) =>
      new Date(row.getValue("created_at")).toLocaleDateString(),
  },
  {
    accessorKey: "updated_at",
    header: "تاريخ التحديث",
    cell: ({ row }) =>
      new Date(row.getValue("updated_at")).toLocaleDateString(),
  },
];

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  price: z.union([
    z.number().positive().nullable(),
    z
      .string()
      .length(0)
      .transform(() => null),
  ]),
});

function BankTable() {
  const [data, setData] = useState<Bank[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [token, setToken] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "all",
  });

  // get token from next api
  const feachData = async () => {
    try {
      const response = await axios.get("/api/auth/getToken");
      setToken(response.data.token);
    } catch (error) {
      throw error;
    }
  };
  useEffect(() => {
    feachData();
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const response = await getData(
          "banks",
          {},
          new AxiosHeaders({ Authorization: `Bearer ${token}` })
        );
        setData(response.data);
      } catch (error) {
        throw error;
      }

      setLoading(false);
    };

    fetchData();
  }, [token]);

  const onSubmit = async (formData: any) => {
    try {
      try {
        await postData("", data, {
          Authorization: `Bearer token`,
          "Content-Type": "multipart/form-data",
        });
        feachData();
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.msg || "An error occurred");
        } else {
          toast.error("An unexpected error occurred");
        }
        throw error;
      }

      reset();
      toast.success("تمإضافة بنك الاسئلة بنجاح");
    } catch (error) {
      alert("Failed to add bank.");
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
          placeholder="Search banks..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm min-w-[200px] h-10"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">اضافه بنك</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>اضافه بنك</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <Input
                  {...register("name")}
                  placeholder="Bank Name"
                  className={errors.name ? "border-red-500" : ""}
                />
                <Input
                  {...register("price")}
                  type="number"
                  placeholder="Price (Leave empty for Free)"
                  className={errors.price ? "border-red-500" : ""}
                />
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No banks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default BankTable;
