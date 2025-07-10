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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { deleteData, getData, postData } from "@/lib/axios/server";
import axios from "axios";
import { toast } from "react-hot-toast";

interface GroupStudent {
  id: number;
  student_id: number;
  student_name: string;
  student_email?: string;
  student_phone?: string;
  joined_at: string;
  school_name: string;
  full_name: string;
  email?: string;
  phone?: string;
}

interface Student {
  id: number;
  full_name: string;
  email?: string;
  phone?: string;
}

interface GroupInfo {
  id: number;
  group_name: string;
  level_id: number;
  teacher_id: number;
}

interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  has_more_pages: boolean;
  next_page_url: string | null;
  prev_page_url: string | null;
}

interface GroupStudentsResponse {
  status: boolean;
  msg: string;
  data: {
    group_info: GroupInfo;
    students: GroupStudent[];
    pagination: PaginationInfo;
  };
}

function GroupStudentsManager() {
  const [students, setStudents] = useState<GroupStudent[]>([]);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const params = useParams();

  // Fetch group students with pagination
  const fetchGroupStudents = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = (await getData(
        `teacher-groups/${params.groupId}/students`,
        {
          page,
          per_page: 10,
          search: searchQuery,
        },
        {
          Authorization: `Bearer ${token}`,
        }
      )) as GroupStudentsResponse;

      if (response.status) {
        setStudents(response.data.students);
        setGroupInfo(response.data.group_info);
        setPagination(response.data.pagination);
        setCurrentPage(page);
      } else {
        toast.error(response.msg || "فشل في جلب قائمة الطلاب");
      }
    } catch (error) {
      console.log("Error fetching group students:", error);
      toast.error("فشل في جلب قائمة الطلاب");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available students (all students not in this group)
  const fetchAvailableStudents = async () => {
    try {
      const response = await getData(
        "students",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );

      // Filter out students already in the group
      const allStudents = response.data || response;
      const currentStudentIds = students.map((s) => s.student_id);
      const filtered = allStudents.filter(
        (student: Student) => !currentStudentIds.includes(student.id)
      );

      setAvailableStudents(filtered);
    } catch (error) {
      console.log("Error fetching available students:", error);
      toast.error("فشل في جلب قائمة الطلاب المتاحين");
    }
  };

  // Get token from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/auth/getToken");
        setToken(response.data.token);
      } catch (error) {
        console.error("Error fetching token:", error);
      }
    };

    fetchData();
  }, []);

  // Fetch data when token is available
  useEffect(() => {
    if (token && params.groupId) {
      fetchGroupStudents(currentPage);
    }
  }, [token, params.groupId]);

  // Re-fetch when search query changes (with debounce)
  useEffect(() => {
    if (token && params.groupId) {
      const timer = setTimeout(() => {
        fetchGroupStudents(1); // Reset to first page on search
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Fetch available students when students change or dialog opens
  useEffect(() => {
    if (token && isAddDialogOpen) {
      fetchAvailableStudents();
    }
  }, [token, isAddDialogOpen, students]);

  // Add student to group
  const addStudentToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedStudentId) {
      setError("يرجى اختيار طالب");
      return;
    }

    try {
      await postData(
        "student-teacher/add",
        {
          teacher_id: groupInfo?.teacher_id || params.teacherId,
          student_id: selectedStudentId,
          group_id: params.groupId,
        },
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      );

      setSelectedStudentId("");
      fetchGroupStudents(currentPage);
      toast.success("تم إضافة الطالب بنجاح");
      dialogCloseRef.current?.click();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join("<br>");
          setError(errorMessages);
        } else {
          setError(
            error.response?.data?.message || "حدث خطأ أثناء إضافة الطالب"
          );
        }
      } else {
        setError("حدث خطأ غير متوقع");
      }
    }
  };

  // Remove student from group
  const removeStudentFromGroup = async (studentId: number) => {
    if (!confirm("هل أنت متأكد من إزالة هذا الطالب من المجموعة؟")) {
      return;
    }

    try {
      await postData(
        "student-teacher/remove",
        {
          teacher_id: groupInfo?.teacher_id || params.teacherId,
          student_id: studentId.toString(),
          group_id: params.groupId,
        },
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      );

      fetchGroupStudents(currentPage);
      toast.success("تم إزالة الطالب بنجاح");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join(" ");
          toast.error(errorMessages);
        } else {
          toast.error(
            error.response?.data?.message || "حدث خطأ أثناء إزالة الطالب"
          );
        }
      } else {
        toast.error("حدث خطأ غير متوقع");
      }
    }
  };

  // Handle dialog close
  const handleAddDialogClose = () => {
    setSelectedStudentId("");
    setError(null);
    setIsAddDialogOpen(false);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchGroupStudents(page);
  };

  // Table columns
  const columns: ColumnDef<GroupStudent>[] = [
    {
      accessorKey: "student_name",
      header: "اسم الطالب",
      cell: ({ row }) => {
        return <span className="font-medium">{row.original.full_name}</span>;
      },
    },
    {
      accessorKey: "student_email",
      header: "البريد الإلكتروني/رقم الهاتف",
      cell: ({ row }) => {
        return (
          <span className={row.original.student_email ? "" : "text-gray-400"}>
            {row.original.email || row.original.phone || "غير محدد"}
          </span>
        );
      },
    },
    {
      accessorKey: "student_email",
      header: " اسم المدرسة",
      cell: ({ row }) => {
        return (
          <span className={row.original.student_email ? "" : "text-gray-400"}>
            {row.original.school_name || "غير محدد"}
          </span>
        );
      },
    },

    {
      accessorKey: "actions",
      header: "الإجراءات",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center justify-center">
          <Button
            onClick={() => removeStudentFromGroup(row.original.student_id)}
            className="bg-red-500 hover:bg-red-600"
            size="sm"
          >
            إزالة
          </Button>
        </div>
      ),
    },
  ];

  // Table setup (without pagination since we're using server-side pagination)
  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination?.last_page || 1,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {groupInfo
            ? `طلاب المجموعة: ${groupInfo.group_name}`
            : "طلاب المجموعة"}
        </h2>
        <div className="text-sm text-gray-600">
          عدد الطلاب: {pagination?.total || 0}
        </div>
      </div>

      {/* Search and Add Controls */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="بحث بالطالب..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="max-w-sm min-w-[200px] h-10"
        />

        {/* Add Student Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
              إضافة طالب
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة طالب إلى المجموعة</DialogTitle>
            </DialogHeader>
            <form onSubmit={addStudentToGroup}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="student_id"
                    className="block mb-2 text-sm font-medium"
                  >
                    الطالب
                  </label>
                  <select
                    id="student_id"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                  >
                    <option value="">اختر الطالب</option>
                    {availableStudents.map((student: any) => (
                      <option key={student.id} value={student.id.toString()}>
                        {student.user?.full_name || student.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                {error && (
                  <p
                    className="text-red-500 mt-2 text-sm"
                    dangerouslySetInnerHTML={{ __html: error }}
                  />
                )}
              </div>
              <div className="mt-6 space-y-2">
                <Button type="submit" className="w-full">
                  إضافة
                </Button>
                <DialogClose asChild>
                  <Button
                    ref={dialogCloseRef}
                    variant="outline"
                    className="w-full"
                    type="button"
                    onClick={handleAddDialogClose}
                  >
                    إلغاء
                  </Button>
                </DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Students Table */}
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id}>
                  {columns.map((column: any) => (
                    <TableCell key={column.accessorKey as string}>
                      {flexRender(column.cell, {
                        row: { original: student },
                        getValue: () =>
                          student[column.accessorKey as keyof GroupStudent],
                      })}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  لا توجد طلاب في هذه المجموعة.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Server-side Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-gray-600">
              عرض {pagination.from || 0} إلى {pagination.to || 0} من{" "}
              {pagination.total} طالب
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                السابق
              </Button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.last_page) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.last_page <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.last_page - 2) {
                      pageNum = pagination.last_page - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={"outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.has_more_pages}
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupStudentsManager;
