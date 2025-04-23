"use client";
import * as React from "react";
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

import { fetchBanks, addBank } from "@/services/bankService";

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

interface Bank {
  id: number;
  name: string;
  price: number | null;
  created_at: string;
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
    cell: ({ row }) => (row.getValue("price") !== null ? row.getValue("price") : "Free"),
  },
  {
    accessorKey: "created_at",
    header: "تاريخ الانشاء",
    cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString(),
  },
];

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  price: z.union([z.number().positive().nullable(), z.string().length(0).transform(() => null)]),
});

function BankTable() {
  const [data, setData] = React.useState<Bank[]>([]);
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
      const banks = await fetchBanks();
      console.log("Fetched Banks:", banks); // Debugging line
      setData(banks);
      setLoading(false);
    };

    fetchData();
  }, []);

  const onSubmit = async (formData: any) => {
    try {
      await addBank(formData);
      reset();
      alert("Bank added successfully!");
      location.reload();
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
