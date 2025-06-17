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

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Printer } from "lucide-react";

import { useEffect, useState } from "react";
import { getData, postData } from "@/lib/axios/server";
import axios, { AxiosHeaders } from "axios";
import { StudentTypes, SubscriptionCodeTypes, Teacher, User } from "@/lib/type";
import toast from "react-hot-toast";

function BasicDataTable() {
  const [data, setData] = useState<StudentTypes[]>([]);
  const [token, setToken] = useState("");
  const [generatedCode, setGeneratedCode] = useState<
    SubscriptionCodeTypes[] | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTeacherSelectOpen, setIsTeacherSelectOpen] = useState(false);
  const [codeCount, setCodeCount] = useState<string | number | null>(1);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(
    null
  );

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("تم نسخ الكود بنجاح");
  };

  // Fetch teachers for admin
  const fetchTeachers = async () => {
    if (user?.role !== "admin") return;
    try {
      const response = await getData(
        "teachers",
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        })
      );
      setTeachers(response);
    } catch (error) {
      console.log("Failed to fetch teachers");
    }
  };

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
        const userData = JSON.parse(response.data.user);
        setUser(userData);
        if (userData.role === "admin") {
          fetchTeachers();
        }
      } catch (error) {
        throw error;
      }
    };

    feachData();
  }, [token]);

  // Function to generate student code
  const generateStudentCode = async () => {
    if (user?.role === "admin") {
      setIsTeacherSelectOpen(true);
      return;
    }

    try {
      const response = await postData(
        "subscription_codes",
        {
          count: codeCount,
          teacher_id: user?.id,
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setGeneratedCode(response.data);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error generating student code:", error);
    }
  };

  const handleTeacherSelect = async (teacherId: number) => {
    setSelectedTeacherId(teacherId);
  };

  const handleGenerateCodes = async () => {
    if (!selectedTeacherId) return;

    try {
      const response = await postData(
        "subscription_codes",
        {
          count: codeCount,
          teacher_id: selectedTeacherId,
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setGeneratedCode(response.data);
      setIsTeacherSelectOpen(false);
      setIsDialogOpen(true);
      setSelectedTeacherId(null);
    } catch (error) {
      console.error("Error generating student code:", error);
    }
  };

  const printCodes = () => {
    if (!generatedCode) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>Student Codes</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              text-align: center;
            }
            .codes-container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .code {
              font-size: 24px;
              padding: 15px;
              border: 1px solid #ccc;
              border-radius: 4px;
              background-color: #f9f9f9;
            }
            @media print {
              .no-print {
                display: none;
              }
              @page {
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <h1>أكواد الطلاب</h1>
          <div class="codes-container">
            ${generatedCode
              .map(
                (code) => `
              <div class="code">${code.code}</div>
            `
              )
              .join("")}
          </div>
          <div class="no-print">
            <button style="margin-top: 20px;" onclick="window.print()">Print</button>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
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
            {generatedCode?.map((code) => (
              <div
                key={code.id}
                className="flex items-center justify-center gap-2 mb-2"
              >
                <div className="text-center text-2xl font-bold tracking-wider">
                  {code.code}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(code.code)}
                  className="h-8 w-8"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex justify-center mt-4">
              <Button
                onClick={printCodes}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                طباعة الأكواد
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              يرجى حفظ هذا الكود. لن يتم عرضه مرة أخرى.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTeacherSelectOpen} onOpenChange={setIsTeacherSelectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>اختر المعلم</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <select
              className="w-full p-2 border rounded-md"
              onChange={(e) => handleTeacherSelect(Number(e.target.value))}
              value={selectedTeacherId || ""}
            >
              <option value="">اختر المعلم</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher?.user.full_name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-sm">عدد الأكواد:</label>
              <Input
                type="number"
                min="1"
                value={codeCount as string}
                onChange={(e) => {
                  setCodeCount(e.target.value);
                }}
                className="w-20"
              />
            </div>
            <Button
              onClick={handleGenerateCodes}
              disabled={!selectedTeacherId || !codeCount}
              className="w-full"
            >
              إنشاء الأكواد
            </Button>
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
