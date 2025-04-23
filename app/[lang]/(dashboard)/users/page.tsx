"use client";
import {
  ColumnDef,
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
import { fetchUsers, addUser } from "@/services/userService";

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
import { useEffect, useState } from "react";

interface User {
  id: number;
  full_name: string;
  image: string;
  phone: string;
  email: string;
  role: string;
}

const DEFAULT_IMAGE = "https://via.placeholder.com/150";
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "full_name",
    header: "الاسم الكامل",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="rounded-full">
            <AvatarImage
              src={user.image || DEFAULT_IMAGE}
              alt={user.full_name}
              onError={(e) => {
                e.currentTarget.onerror = null; // Prevents infinite loop
                e.currentTarget.src = DEFAULT_IMAGE;
              }}
            />
            <AvatarFallback>{user.full_name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
          <span>{user.full_name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "الايميل",
    cell: ({ row }) => (
      <div className="lowercase whitespace-nowrap">
        {row.getValue("email") ?? "N/A"}
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "الهاتف",
    cell: ({ row }) => <div>{row.getValue("phone") ?? "N/A"}</div>,
  },
  {
    accessorKey: "role",
    header: "دور",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.getValue("role")}
      </Badge>
    ),
  },
];

const schema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(8, "Phone is required"),
  role: z.enum(["admin", "teacher", "student"]),
});

function BasicDataTable() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "all",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const users = await fetchUsers();
      console.log("Fetched Users:", users); // Debugging line
      setData(users);
      setLoading(false);
    };

    fetchData();
  }, []);

  const onSubmit = async (formData: any) => {
    try {
      await addUser(formData);
      reset();
      alert("User added successfully!");
      location.reload(); // Refresh the table
    } catch (error) {
      alert("Failed to add user.");
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <>
      <div className=" flex items-center gap-2 px-4 mb-4">
        <Input
          placeholder="Filter by name..."
          value={
            (table.getColumn("full_name")?.getFilterValue() as string) || ""
          }
          onChange={(event) =>
            table.getColumn("full_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm min-w-[200px] h-10"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">اضافه مستخدم</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <Input {...register("full_name")} placeholder="Full Name" />
                <Input {...register("email")} placeholder="Email" />
                <Input {...register("phone")} placeholder="Phone" />
                <select
                  {...register("role")}
                  className="w-full p-2 border rounded"
                >
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
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
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default BasicDataTable;
