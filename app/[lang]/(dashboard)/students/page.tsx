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
import { deleteData, getData, postData } from "@/lib/axios/server";
import axios from "axios";
import Link from "next/link";
import { SubjectsData } from "@/lib/type";
import { Upload, X } from "lucide-react";
import { toast } from "react-hot-toast";

interface User {
  id: number;
  user: {
    id: number;
    avatar: string;
    role: string;
    full_name: string;
    phone: string;
    email: string;
  } | null;
  level_id: number;
  stu_no: string;
  governorate_id: number;
  area_id: number;
  school_name: string;
  father_phone: string;
  status: string;
}

type FormData = {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
  subject_id?: string;
  cover: string | File | null;
  avatar: string | File | null;
};

const DEFAULT_IMAGE = "https://via.placeholder.com/150x150";

function BasicDataTable() {
  const [data, setData] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<SubjectsData[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    role: "teacher",
    cover: "",
    password: "",
    avatar: "",
  });

  // refetch users
  const refetchUsers = async () => {
    try {
      const response = await getData(
        "students",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setData(response);
    } catch (error) {
      console.log(error);
    }
  };
  // feach users from api
  useEffect(() => {
    refetchUsers();
  }, [token]);

  // get token from next api
  useEffect(() => {
    const feachData = async () => {
      try {
        const response = await axios.get("/api/auth/getToken");
        setToken(response.data.token);
      } catch (error) {
        throw error;
      }
    };

    feachData();
  });

  // columns of table
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "full_name",
      header: "الاسم الكامل",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Link
            href={"/teacher-profile/" + user.id}
            className="flex items-center gap-3"
          >
            <Avatar className="rounded-full">
              <AvatarFallback>
                {user.user?.full_name?.[0] ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span>{user.user?.full_name ?? "N/A"}</span>
          </Link>
        );
      },
    },
    {
      accessorKey: "stu_no",
      header: "رقم الطالب",
      cell: ({ row }) => <div>{row.original.stu_no}</div>,
    },
    {
      accessorKey: "school_name",
      header: "اسم المدرسة",
      cell: ({ row }) => <div>{row.original.school_name}</div>,
    },
    {
      accessorKey: "father_phone",
      header: "هاتف الأب",
      cell: ({ row }) => <div>{row.original.father_phone}</div>,
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "active" ? "soft" : "outline"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "email",
      header: "الايميل",
      cell: ({ row }) => (
        <div className="lowercase whitespace-nowrap">
          {row.original.user?.email ?? "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "الهاتف",
      cell: ({ row }) => <div>{row.original.user?.phone ?? "N/A"}</div>,
    },
    {
      accessorKey: "role",
      header: "دور",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.user?.role ?? "student"}
        </Badge>
      ),
    },
  ];

  // table
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
        {/* search input */}
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
      </div>

      {/* users table */}
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
