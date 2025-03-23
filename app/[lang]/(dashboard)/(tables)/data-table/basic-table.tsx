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

interface User {
  id: number;
  full_name: string;
  image: string;
  phone: string;
  email: string;
  role: string;
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "full_name",
    header: "الاسم الكامل",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="rounded-full">
            {user.image ? (
              <AvatarImage
                src={user.image}
                alt={user.full_name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/images/default-avatar.png";
                }}
              />
            ) : (
              <AvatarFallback>{user.full_name?.[0] ?? "?"}</AvatarFallback>
            )}
          </Avatar>
          <span>{user.full_name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "البريد الإلكتروني",
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
    header: "الدور",
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

export function BasicDataTable() {
  const [data, setData] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

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
      const users = await fetchUsers();
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
      location.reload();
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
      <div className="flex items-center gap-2 px-4 mb-4">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn("full_name")?.getFilterValue() as string) || ""}
          onChange={(event) =>
            table.getColumn("full_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm min-w-[200px] h-10"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Add User</Button>
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
                <select {...register("role")} className="w-full p-2 border rounded">
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
        <Table className="bg-[#1F2937] w-full rounded-md shadow-md">
          <TableHeader className="bg-[#2D3748] text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4 py-2">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className={`${
                    index % 2 === 0 ? "bg-[#1F2937]" : "bg-[#2D3748]"
                  } hover:bg-[#4A5568] transition-colors duration-200`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-white px-4 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-white">
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
