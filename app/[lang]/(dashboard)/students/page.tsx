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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useEffect, useState } from "react";
import { getData, postData } from "@/lib/axios/server";
import axios from "axios";
import { StudentTypes } from "@/lib/type";

function BasicDataTable() {
  const [data, setData] = useState<StudentTypes[]>([]);
  const [token, setToken] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  // Function to generate student code
  const generateStudentCode = async () => {
    try {
      const response = await postData(
        "students/generate-code",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setGeneratedCode(response.code);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error generating student code:", error);
    }
  };

  // columns of table
  const columns: ColumnDef<StudentTypes>[] = [
    {
      accessorKey: "full_name",
      header: "الاسم الكامل",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="rounded-full">
              <AvatarFallback>{user.user?.avatar}</AvatarFallback>
            </Avatar>
            <span>{user.user?.name ?? "N/A"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "stu_no",
      header: "كود الطالب",
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
      <div className="flex items-center justify-between gap-2 px-4 mb-4">
        <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-2">
          <Button
            onClick={generateStudentCode}
            variant="outline"
            className="h-10"
          >
            إنشاء كود طالب
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>كود الطالب </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center text-2xl font-bold tracking-wider">
              {generatedCode}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              يرجى حفظ هذا الكود. لن يتم عرضه مرة أخرى.
            </p>
          </div>
        </DialogContent>
      </Dialog>

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
