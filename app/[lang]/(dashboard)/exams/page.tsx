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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { deleteData, getData, postData } from "@/lib/axios/server";
import axios from "axios";
import { toast } from "react-hot-toast";

interface Question {
  id: number;
  exam: string;
  question: string;
  options: {
    id: number;
    answer: string;
  }[];
  correct_answer: number;
}

interface Exam {
  id: number;
  type: string;
  title: string;
  thumbnail: string;
  questions_count: number;
  created_at: string;
  subject_name: string;
  teacher_name: string;
  level_name: string;
  questions: Question[];
}

interface Teacher {
  id: number;
  name: string;
  user: {
    id: number;
    full_name: string;
  };
}

interface Level {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

interface ApiResponse {
  data: Exam[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

type FormData = {
  title: string;
  type: string;
  thumbnail: string;
  subject_id: string;
  teacher_id: string;
  level_id: string;
};

function ExamsDataTable() {
  const [data, setData] = useState<Exam[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const editDialogCloseRef = useRef<HTMLButtonElement>(null);
  const viewDialogCloseRef = useRef<HTMLButtonElement>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    type: "exam",
    thumbnail: "",
    subject_id: "",
    teacher_id: "",
    level_id: "",
  });

  // Refetch exams
  const refetchExams = async (page: number = 1) => {
    try {
      const response = await getData(
        `exams?page=${page}`,
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setData(response.data);
      setTotalPages(response.meta.last_page);
      setCurrentPage(response.meta.current_page);
    } catch (error) {
      console.log(error);
      toast.error("فشل في جلب البيانات");
    }
  };

  // Fetch teachers, levels, and subjects
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

      // Fetch subjects
      const subjectsResponse = await getData(
        "subjects",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setSubjects(subjectsResponse.data || subjectsResponse);
    } catch (error) {
      console.log("Error fetching teachers, levels, or subjects:", error);
    }
  };

  // Get token from Next.js API
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

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // Add exam validation schema
  const schema = z.object({
    title: z.string().min(2, "عنوان الامتحان مطلوب"),
    type: z.string().min(1, "نوع الامتحان مطلوب"),
    thumbnail: z
      .string()
      .url("رابط الصورة يجب أن يكون صحيحاً")
      .optional()
      .or(z.literal("")),
    subject_id: z.string().min(1, "المادة مطلوبة"),
    teacher_id: z.string().min(1, "المعلم مطلوب"),
    level_id: z.string().min(1, "المستوى مطلوب"),
  });

  const { register, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "all",
  });

  // Handle submit for adding new exam
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await postData("exams", formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
      reset();
      setFormData({
        title: "",
        type: "exam",
        thumbnail: "",
        subject_id: "",
        teacher_id: "",
        level_id: "",
      });
      refetchExams();
      toast.success("تم إضافة الامتحان بنجاح");
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

  // Update exam
  const updateExam = async (id: number) => {
    setEditError(null);
    try {
      await postData(
        `exams/${id}`,
        { ...formData, _method: "PUT" },
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      );
      reset();
      setEditingExam(null);
      refetchExams();
      toast.success("تم تحديث الامتحان بنجاح");
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

  // Delete exam (single)
  const deleteExam = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الامتحان؟")) {
      return;
    }
    try {
      await deleteData(`exams/${id}`, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
      refetchExams();
      toast.success("تم حذف الامتحان بنجاح");
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

  // Bulk delete (no per-item confirm)
  const deleteSelectedExams = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;

    const ids = selectedRows.map((row) => row.original.id);
    const message = `هل أنت متأكد من حذف ${ids.length} امتحان(امتحانات)؟`;
    if (!confirm(message)) return;

    // Perform deletions one by one (same logic as single delete)
    for (const id of ids) {
      try {
        await deleteData(`exams/${id}`, {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        });
      } catch (err) {
        const errorMsg = axios.isAxiosError(err)
          ? Object.values(err.response?.data?.errors || {})
              .flat()
              .join(" ")
          : "حذف فاشل";
        toast.error(`فشل في حذف الامتحان ${id}: ${errorMsg}`);
      }
    }

    refetchExams();
    toast.success(`تم حذف ${ids.length} امتحان(امتحانات) بنجاح`);
    table.toggleAllPageRowsSelected(false);
  };

  // Fetch exams from API
  useEffect(() => {
    if (token) {
      refetchExams(currentPage);
      fetchTeachersAndLevels();
    }
  }, [token, currentPage]);

  // Update form data when editing exam changes
  useEffect(() => {
    if (editingExam) {
      // Find the IDs based on names
      const subjectId =
        subjects
          .find((s) => s.name === editingExam.subject_name)
          ?.id?.toString() || "";
      const teacherId =
        teachers
          .find((t) => t.name === editingExam.teacher_name)
          ?.id?.toString() || "";
      const levelId =
        levels.find((l) => l.name === editingExam.level_name)?.id?.toString() ||
        "";

      setFormData({
        title: editingExam.title,
        type: editingExam.type,
        thumbnail: editingExam.thumbnail,
        subject_id: subjectId,
        teacher_id: teacherId,
        level_id: levelId,
      });
    }
  }, [editingExam, subjects, teachers, levels]);

  // Reset form when dialog closes
  const handleAddDialogClose = () => {
    setFormData({
      title: "",
      type: "exam",
      thumbnail: "",
      subject_id: "",
      teacher_id: "",
      level_id: "",
    });
    setError(null);
  };

  const handleEditDialogClose = () => {
    setEditingExam(null);
    setFormData({
      title: "",
      type: "exam",
      thumbnail: "",
      subject_id: "",
      teacher_id: "",
      level_id: "",
    });
    setEditError(null);
  };

  const handleViewDialogClose = () => {
    setSelectedExam(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG");
  };

  // Columns with multi-select checkbox
  const columns: ColumnDef<Exam>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="w-4 h-4 accent-blue-600"
          checked={table.getIsAllPageRowsSelected()}
          onChange={() => table.toggleAllPageRowsSelected()}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="w-4 h-4 accent-blue-600"
          checked={row.getIsSelected()}
          onChange={() => row.toggleSelected()}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "عنوان الامتحان",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            <img
              src={row.original.thumbnail}
              alt={row.original.title}
              className="w-12 h-12 object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-image.png";
              }}
            />
            <span className="font-medium">{row.original.title}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "النوع",
      cell: ({ row }) => {
        return <span className="capitalize">{row.original.type}</span>;
      },
    },
    {
      accessorKey: "subject_name",
      header: "المادة",
      cell: ({ row }) => {
        return <span className="font-medium">{row.original.subject_name}</span>;
      },
    },
    {
      accessorKey: "teacher_name",
      header: "المعلم",
      cell: ({ row }) => {
        return <span className="font-medium">{row.original.teacher_name}</span>;
      },
    },
    {
      accessorKey: "level_name",
      header: "المستوى",
      cell: ({ row }) => {
        return <span className="font-medium">{row.original.level_name}</span>;
      },
    },
    {
      accessorKey: "questions_count",
      header: "عدد الأسئلة",
      cell: ({ row }) => {
        return (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
            {row.original.questions_count}
          </span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "تاريخ الإنشاء",
      cell: ({ row }) => {
        return <span>{formatDate(row.original.created_at)}</span>;
      },
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center justify-center">
          <Button
            onClick={() => setSelectedExam(row.original)}
            size="sm"
            variant="outline"
            className="bg-green-50 hover:bg-green-100 text-green-700"
          >
            عرض الأسئلة
          </Button>
          <Button
            onClick={() => setEditingExam(row.original)}
            size="sm"
            variant="outline"
          >
            تعديل
          </Button>
          <Button
            onClick={() => deleteExam(row.original.id)}
            className="bg-red-500 hover:bg-red-600"
            size="sm"
          >
            حذف
          </Button>
        </div>
      ),
    },
  ];

  // Table instance with selection
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true, // Enable multi-select
  });

  return (
    <>
      <div className="flex items-center gap-2 px-4 mb-4">
        {/* Search Input */}
        <Input
          placeholder="بحث بالعنوان..."
          value={(table.getColumn("title")?.getFilterValue() as string) || ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm min-w-[200px] h-10"
        />

        {/* Bulk Delete Button */}
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <Button variant="outline" size="sm" onClick={deleteSelectedExams}>
            حذف المحدد ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
        )}

        {/* Add Exam Dialog */}
        <Dialog onOpenChange={(open) => !open && handleAddDialogClose()}>
          <DialogTrigger asChild>
            <Button variant="outline">إضافة امتحان</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة امتحان جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block mb-2 text-sm font-medium"
                  >
                    عنوان الامتحان
                  </label>
                  <Input
                    {...register("title")}
                    id="title"
                    placeholder="أدخل عنوان الامتحان"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="type"
                    className="block mb-2 text-sm font-medium"
                  >
                    نوع الامتحان
                  </label>
                  <select
                    {...register("type")}
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="exam">امتحان</option>
                    <option value="quiz">اختبار</option>
                    <option value="test">تقييم</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="thumbnail"
                    className="block mb-2 text-sm font-medium"
                  >
                    رابط الصورة
                  </label>
                  <Input
                    {...register("thumbnail")}
                    id="thumbnail"
                    placeholder="أدخل رابط الصورة"
                    name="thumbnail"
                    value={formData.thumbnail}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="subject_id"
                    className="block mb-2 text-sm font-medium"
                  >
                    المادة
                  </label>
                  <select
                    {...register("subject_id")}
                    id="subject_id"
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">اختر المادة</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="teacher_id"
                    className="block mb-2 text-sm font-medium"
                  >
                    المعلم
                  </label>
                  <select
                    {...register("teacher_id")}
                    id="teacher_id"
                    name="teacher_id"
                    value={formData.teacher_id}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">اختر المعلم</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
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
                    {...register("level_id")}
                    id="level_id"
                    name="level_id"
                    value={formData.level_id}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">اختر المستوى</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
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

      {/* Edit Exam Dialog */}
      <Dialog
        open={!!editingExam}
        onOpenChange={(open) => !open && handleEditDialogClose()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل الامتحان</DialogTitle>
          </DialogHeader>
          {editingExam && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateExam(editingExam.id);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="edit_title"
                    className="block mb-2 text-sm font-medium"
                  >
                    عنوان الامتحان
                  </label>
                  <Input
                    id="edit_title"
                    placeholder="أدخل عنوان الامتحان"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit_type"
                    className="block mb-2 text-sm font-medium"
                  >
                    نوع الامتحان
                  </label>
                  <select
                    id="edit_type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="exam">امتحان</option>
                    <option value="quiz">اختبار</option>
                    <option value="test">تقييم</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="edit_thumbnail"
                    className="block mb-2 text-sm font-medium"
                  >
                    رابط الصورة
                  </label>
                  <Input
                    id="edit_thumbnail"
                    placeholder="أدخل رابط الصورة"
                    name="thumbnail"
                    value={formData.thumbnail}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit_subject_id"
                    className="block mb-2 text-sm font-medium"
                  >
                    المادة
                  </label>
                  <select
                    id="edit_subject_id"
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">اختر المادة</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">اختر المعلم</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">اختر المستوى</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
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

      {/* View Questions Dialog */}
      <Dialog
        open={!!selectedExam}
        onOpenChange={(open) => !open && handleViewDialogClose()}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>أسئلة الامتحان: {selectedExam?.title}</DialogTitle>
          </DialogHeader>
          {selectedExam && (
            <div className="space-y-6">
              {selectedExam.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <h4 className="font-semibold mb-3 text-right">
                    السؤال {index + 1}: {question.question}
                  </h4>
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div
                        key={option.id}
                        className={`p-2 rounded border text-right ${
                          option.id === question.correct_answer
                            ? "bg-green-100 border-green-500 text-green-800"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <span className="font-medium">
                          {option.id === question.correct_answer && "✓ "}
                          {option.answer}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <DialogClose asChild>
                <Button
                  ref={viewDialogCloseRef}
                  variant="outline"
                  className="w-full"
                >
                  إغلاق
                </Button>
              </DialogClose>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Exams Table */}
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

        {/* Pagination Controls */}
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchExams(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-9 px-4 font-medium"
            >
              السابق
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant="outline"
                    size="sm"
                    onClick={() => refetchExams(pageNumber)}
                    className={`w-9 h-9 font-medium transition-all duration-200 ${
                      pageNumber === currentPage
                        ? "scale-110 bg-blue-100 dark:bg-blue-900"
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
              onClick={() => refetchExams(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-9 px-4 font-medium"
            >
              التالي
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ExamsDataTable;