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

// Removed shadcn Select imports

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { deleteData, getData, postData } from "@/lib/axios/server";
import axios from "axios";
import { toast } from "react-hot-toast";

interface TeacherGroup {
  id: number;
  teacher: string | null;
  group: string;
  level: string;
  created_at: string | null;
}

interface Teacher {
  id: number;
  full_name: string;
}

interface Level {
  id: number;
  name: string;
}

type FormData = {
  group: string;
  teacher_id: string;
  level_id: string;
};

function TeacherGroupsDataTable() {
  const [data, setData] = useState<TeacherGroup[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<TeacherGroup | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const editDialogCloseRef = useRef<HTMLButtonElement>(null);
  const [formData, setFormData] = useState<FormData>({
    group: "",
    teacher_id: "",
    level_id: "",
  });

  const router = useRouter();
  const params = useParams();
  // teacherId from URL
  const teacherId = params?.teacherId?.toString() || "";

  // refetch teacher groups
  const refetchGroups = async (page: number = 1) => {
    try {
      const response = await getData(
        `teacher-groups/${teacherId}`,
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );

      // Handle both array response and paginated response
      if (Array.isArray(response)) {
        setData(response);
        setTotalPages(1);
        setCurrentPage(1);
      } else {
        setData(response.data || response);
        if (response.meta) {
          setTotalPages(response.meta.last_page || 1);
          setCurrentPage(response.meta.current_page || 1);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("فشل في جلب البيانات");
    }
  };

  // fetch teachers and levels for dropdowns
  const fetchTeachersAndLevels = async () => {
    try {
      // Fetch teachers
      const teachersResponse = await getData(
        "teachers",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setTeachers(teachersResponse.data || teachersResponse);

      // Fetch levels
      const levelsResponse = await getData(
        "levels",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setLevels(levelsResponse.data || levelsResponse);
    } catch (error) {
      console.log("Error fetching teachers or levels:", error);
    }
  };

  // get token from next api
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/auth/getToken");
        setToken(response.data.token);
      } catch (error) {
        throw error;
      }
    };

    fetchData();
  }, []);

  // handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // handle select change (no longer needed, but kept for compatibility)
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // validation schema
  const schema = z.object({
    group: z.string().min(1, "اسم المجموعة مطلوب"),
    teacher_id: z.string().min(1, "المعلم مطلوب"),
    level_id: z.string().min(1, "المستوى مطلوب"),
  });

  const { register, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "all",
  });

  // handle submit for adding new group
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await postData("teacher-groups", formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });

      reset();
      setFormData({
        group: "",
        teacher_id: "",
        level_id: "",
      });
      refetchGroups();
      toast.success("تم إضافة المجموعة بنجاح");
      dialogCloseRef.current?.click();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join("<br>");
          setError(errorMessages);
        } else {
          setError("حدث خطأ أثناء الإضافة");
        }
      } else {
        setError("حدث خطأ غير متوقع");
      }
    }
  };

  // update group
  const updateGroup = async (id: number) => {
    setEditError(null);

    try {
      await postData(
        `teacher-groups/${id}`,
        { ...formData, _method: "PUT" },
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      );

      reset();
      setEditingGroup(null);
      refetchGroups();
      toast.success("تم تحديث المجموعة بنجاح");
      editDialogCloseRef.current?.click();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join("<br>");
          setEditError(errorMessages);
        } else {
          setEditError("حدث خطأ أثناء التحديث");
        }
      } else {
        setEditError("حدث خطأ غير متوقع");
      }
    }
  };

  // delete group
  const deleteGroup = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه المجموعة؟")) {
      return;
    }

    try {
      await deleteData(`teacher-groups/${id}`, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });

      refetchGroups();
      toast.success("تم حذف المجموعة بنجاح");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join(" ");
          toast.error(errorMessages);
        } else {
          toast.error("حدث خطأ أثناء الحذف");
        }
      } else {
        toast.error("حدث خطأ غير متوقع");
      }
    }
  };

  // fetch data when token is available
  useEffect(() => {
    if (token) {
      refetchGroups(currentPage);
      fetchTeachersAndLevels();
    }
  }, [token, currentPage]);

  // Update form data when editing group changes
  useEffect(() => {
    if (editingGroup) {
      // Find the teacher and level IDs based on names
      const teacher = teachers.find(
        (t) => t.full_name === editingGroup.teacher
      );
      const level = levels.find((l) => l.name === editingGroup.level);

      setFormData({
        group: editingGroup.group,
        teacher_id: teacher?.id.toString() || "",
        level_id: level?.id.toString() || "",
      });
    }
  }, [editingGroup, teachers, levels]);

  // Reset form when dialog closes
  const handleAddDialogClose = () => {
    setFormData({
      group: "",
      teacher_id: "",
      level_id: "",
    });
    setError(null);
  };

  const handleEditDialogClose = () => {
    setEditingGroup(null);
    setFormData({
      group: "",
      teacher_id: "",
      level_id: "",
    });
    setEditError(null);
  };

  // columns of table
  const columns: ColumnDef<TeacherGroup>[] = [
    {
      accessorKey: "group",
      header: "اسم المجموعة",
      cell: ({ row }) => {
        return <span className="font-medium">{row.original.group}</span>;
      },
    },
    {
      accessorKey: "teacher",
      header: "المعلم",
      cell: ({ row }) => {
        return (
          <span className={row.original.teacher ? "" : "text-gray-400"}>
            {row.original.teacher || "غير محدد"}
          </span>
        );
      },
    },
    {
      accessorKey: "level",
      header: "المستوى",
      cell: ({ row }) => {
        return <span>{row.original.level}</span>;
      },
    },
    {
      accessorKey: "created_at",
      header: "تاريخ الإنشاء",
      cell: ({ row }) => {
        if (!row.original.created_at) return <span>-</span>;
        const date = new Date(row.original.created_at);
        return date.toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      },
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center justify-center">
          <Button
            onClick={() => setEditingGroup(row.original)}
            size="sm"
            variant="outline"
          >
            تعديل
          </Button>
          <Button
            onClick={() => deleteGroup(row.original.id)}
            className="bg-red-500 hover:bg-red-600"
            size="sm"
          >
            حذف
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Use teacherId from URL and groupId from row
              if (teacherId && row.original.id) {
                router.push(`/teachers/teacher-groups/${teacherId}/${row.original.id}`);
              }
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            تفاصيل
          </Button>
        </div>
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
      <div className="flex items-center gap-2 px-4 mb-4">
        {/* search input */}
        <Input
          placeholder="بحث بالمجموعة..."
          value={(table.getColumn("group")?.getFilterValue() as string) || ""}
          onChange={(event) =>
            table.getColumn("group")?.setFilterValue(event.target.value)
          }
          className="max-w-sm min-w-[200px] h-10"
        />

        {/* add group Dialog */}
        <Dialog onOpenChange={(open) => !open && handleAddDialogClose()}>
          <DialogTrigger asChild>
            <Button variant="outline">إضافة مجموعة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة مجموعة جديدة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="group"
                    className="block mb-2 text-sm font-medium"
                  >
                    اسم المجموعة
                  </label>
                  <Input
                    {...register("group")}
                    id="group"
                    placeholder="أدخل اسم المجموعة"
                    name="group"
                    value={formData.group}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="teacher_id"
                    className="block mb-2 text-sm font-medium"
                  >
                    المعلم
                  </label>
                  <select
                    id="teacher_id"
                    name="teacher_id"
                    value={formData.teacher_id}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                  >
                    <option value="">اختر المعلم</option>
                    {teachers.map((teacher: any) => (
                      <option key={teacher.id} value={teacher.id.toString()}>
                        {teacher.user.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="level_id"
                    className="block mb-2 text-sm font-medium"
                  >
                    المستوى
                  </label>
                  <select
                    id="level_id"
                    name="level_id"
                    value={formData.level_id}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                  >
                    <option value="">اختر المستوى</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id.toString()}>
                        {level.name}
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
                  >
                    إلغاء
                  </Button>
                </DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Group Dialog */}
      <Dialog
        open={!!editingGroup}
        onOpenChange={(open) => !open && handleEditDialogClose()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل المجموعة</DialogTitle>
          </DialogHeader>
          {editingGroup && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateGroup(editingGroup.id);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="edit_group"
                    className="block mb-2 text-sm font-medium"
                  >
                    اسم المجموعة
                  </label>
                  <Input
                    id="edit_group"
                    placeholder="أدخل اسم المجموعة"
                    name="group"
                    value={formData.group}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit_teacher_id"
                    className="block mb-2 text-sm font-medium"
                  >
                    المعلم
                  </label>
                  <select
                    id="edit_teacher_id"
                    name="teacher_id"
                    value={formData.teacher_id}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                  >
                    <option value="">اختر المعلم</option>
                    {teachers.map((teacher: any) => (
                      <option key={teacher.id} value={teacher.id.toString()}>
                        {teacher.user.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="edit_level_id"
                    className="block mb-2 text-sm font-medium"
                  >
                    المستوى
                  </label>
                  <select
                    id="edit_level_id"
                    name="level_id"
                    value={formData.level_id}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                  >
                    <option value="">اختر المستوى</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id.toString()}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                {editError && (
                  <p
                    className="text-red-500 mt-2 text-sm"
                    dangerouslySetInnerHTML={{ __html: editError }}
                  />
                )}
              </div>
              <div className="mt-6 space-y-2">
                <Button type="submit" className="w-full">
                  تحديث
                </Button>
                <DialogClose asChild>
                  <Button
                    ref={editDialogCloseRef}
                    variant="outline"
                    className="w-full"
                    type="button"
                  >
                    إلغاء
                  </Button>
                </DialogClose>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* teacher groups table */}
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
                  لا توجد نتائج.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls - only show if we have pagination data */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchGroups(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 px-4 font-medium"
              >
                السابق
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={"outline"}
                      size="sm"
                      onClick={() => refetchGroups(pageNumber)}
                      className={`w-9 h-9 font-medium transition-all duration-200 ${
                        pageNumber === currentPage
                          ? "scale-110"
                          : "hover:scale-105"
                      }`}
                    >
                      {pageNumber}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchGroups(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 px-4 font-medium"
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default TeacherGroupsDataTable;
