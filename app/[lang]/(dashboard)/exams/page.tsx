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
import { Editor } from "@tinymce/tinymce-react";
import { siteConfig } from "@/config/site";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { deleteData, getData, postData } from "@/lib/axios/server";
import axios from "axios";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import useAuthrization from "@/hooks/useAuthrization";
import { User } from "@/lib/type";

// ... (interfaces and types remain unchanged)

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

interface Event {
  start_at: string;
  end_at: string;
  group_id: string;
  duration: string;
}

interface Group {
  id: number;
  name: string;
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

// Helper to convert "YYYY-MM-DDTHH:mm" to "YYYY-MM-DD HH:mm:ss"
function toYMDHIS(datetimeLocal: string): string {
  if (!datetimeLocal) return "";
  // Accepts "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss"
  const [date, time] = datetimeLocal.split("T");
  if (!date || !time) return datetimeLocal;
  // If time already has seconds, return as is (with space instead of T)
  if (time.length === 8) return `${date} ${time}`;
  // If time is "HH:mm", add ":00"
  if (time.length === 5) return `${date} ${time}:00`;
  // Fallback
  return `${date} ${time}`;
}

function ExamsDataTable() {
  const [user, setUser] = useState<User | null>(null);
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
  const [groups, setGroups] = useState<any>([]);
  const [filteredGroups, setFilteredGroups] = useState<any>([]);
  const [events, setEvents] = useState<Event[]>([
    {
      start_at: "",
      end_at: "",
      group_id: "",
      duration: "",
    },
  ]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    questionType: "text",
    options: [
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
    ],
    degree: 1,
  });
  const [examImage, setExamImage] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    type: "exam",
    thumbnail: "",
    subject_id: "",
    teacher_id: "",
    level_id: "",
  });

  // ... (refetchExams, fetchTeachersAndLevels, useEffect for token, handleInputChange, schema, useForm, handleExcelUpload remain unchanged)

  // Refetch exams
  const refetchExams = async (page: number = 1) => {
    try {
      const response = await getData(
        `exams?page=${page}`,
        {},
        {
          Authorization: `Bearer ${token}`,
        },
      );
      setData(response.data);
      setTotalPages(response.meta.last_page);
      setCurrentPage(response.meta.current_page);
    } catch (error) {
      console.log(error);
      toast.error("فشل في جلب البيانات");
    }
  };

  // Fetch teachers, levels, subjects, and groups
  const fetchTeachersAndLevels = async () => {
    try {
      // Fetch teachers
      const teachersResponse = await getData(
        "teachers",
        {},
        {
          Authorization: `Bearer ${token}`,
        },
      );
      setTeachers(teachersResponse.data || teachersResponse);

      // Fetch levels
      const levelsResponse = await getData(
        "levels",
        {},
        {
          Authorization: `Bearer ${token}`,
        },
      );
      setLevels(levelsResponse.data || levelsResponse);

      // Fetch subjects
      const subjectsResponse = await getData(
        "subjects",
        {},
        {
          Authorization: `Bearer ${token}`,
        },
      );
      setSubjects(subjectsResponse.data || subjectsResponse);

      // Fetch all groups
      const groupsResponse = await getData(
        "teacher-groups",
        {},
        {
          Authorization: `Bearer ${token}`,
        },
      );
      setGroups(groupsResponse.data || groupsResponse);
    } catch (error) {
      console.log(
        "Error fetching teachers, levels, subjects, or groups:",
        error,
      );
    }
  };

  // Filter groups by teacher ID
  const filterGroupsByTeacher = (teacherId: string) => {
    if (!teacherId || !groups?.groups) {
      setFilteredGroups([]);
      return;
    }

    // Debug: Log the first group to see its structure
    if (groups.groups.length > 0) {
      console.log("First group structure:", groups.groups[0]);
      console.log("Looking for teacher ID:", teacherId);
    }

    // Filter groups by teacher ID
    const teacherGroups = groups.groups.filter(
      (group: any) => `${group.teacher}` === teacherId,
    );

    console.log("Filtered groups:", teacherGroups);
    setFilteredGroups(teacherGroups);
  };

  // Get token from Next.js API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/auth/getToken");
        setToken(response.data.token);
        const userData = JSON.parse(response.data.user);
        setUser(userData);
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
    >,
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

  // Handle Excel upload for adding exams
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Expected format: Question, Option1, Option2, Option3, Option4, Correct Answer (1-4), Type (optional), Degree (optional)
      const importedQuestions = json
        .slice(1)
        .map((row) => {
          const [question, opt1, opt2, opt3, opt4, correct, type, degree] = row;
          const options = [
            { answer: opt1 || "", is_correct: correct == 1 },
            { answer: opt2 || "", is_correct: correct == 2 },
            { answer: opt3 || "", is_correct: correct == 3 },
            { answer: opt4 || "", is_correct: correct == 4 },
          ];
          return {
            question: question || "",
            questionType: (type?.toString().trim().toLowerCase() === "image"
              ? "image"
              : "text") as "text" | "image",
            options,
            degree: parseInt(degree) || 1,
          };
        })
        .filter((q) => q.question); // Filter out empty rows

      setQuestions([...questions, ...importedQuestions]);
      toast.success(`تم استيراد ${importedQuestions.length} سؤال من Excel`);
    };
    reader.readAsBinaryString(file);
  };

  // Handle submit for adding new exam
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (
      !formData.title ||
      !formData.teacher_id ||
      !examImage ||
      questions.length === 0 ||
      events.length === 0
    ) {
      setError(
        "يرجى ملء جميع الحقول المطلوبة: العنوان، المعلم، الصورة، الأسئلة، والأحداث",
      );
      return;
    }

    // Validate events
    for (const event of events) {
      if (
        !event.start_at ||
        !event.end_at ||
        !event.group_id ||
        !event.duration
      ) {
        setError("يرجى ملء جميع بيانات الأحداث");
        return;
      }
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("teacher_id", formData.teacher_id);
      formDataToSend.append("image", examImage);
      formDataToSend.append("questions_count", questions.length.toString());

      // Add events (convert datetime-local to Y-m-d H:i:s)
      events.forEach((event, index) => {
        formDataToSend.append(
          `events[${index}][start_at]`,
          toYMDHIS(event.start_at),
        );
        formDataToSend.append(
          `events[${index}][end_at]`,
          toYMDHIS(event.end_at),
        );
        formDataToSend.append(`events[${index}][group_id]`, event.group_id);
        formDataToSend.append(`events[${index}][duration]`, event.duration);
      });

      // Add questions
      questions.forEach((question, index) => {
        const questionNumber = index + 1;
        formDataToSend.append(
          `questions[${questionNumber}][question]`,
          question.question,
        );
        formDataToSend.append(
          `questions[${questionNumber}][questionType]`,
          question.questionType || "text",
        );
        formDataToSend.append(
          `questions[${questionNumber}][degree]`,
          (question.degree || 1).toString(),
        );

        question.options.forEach((option: any, optIndex: number) => {
          formDataToSend.append(
            `questions[${questionNumber}][${optIndex + 1}]`,
            option.answer,
          );
        });

        const correctAnswerIndex = question.options.findIndex(
          (opt: any) => opt.is_correct,
        );
        formDataToSend.append(
          `questions[${questionNumber}][answer]`,
          (correctAnswerIndex + 1).toString(),
        );
      });

      await postData("store-scheduled-exam", formDataToSend, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
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
      setQuestions([]);
      setEvents([
        {
          start_at: "",
          end_at: "",
          group_id: "",
          duration: "",
        },
      ]);
      setExamImage(null);
      setFilteredGroups([]);
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

  // ... (rest of the code remains unchanged)

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
        },
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

  // Filter groups when teacher selection changes
  useEffect(() => {
    if (formData.teacher_id && groups?.groups) {
      filterGroupsByTeacher(formData.teacher_id);
    } else {
      setFilteredGroups([]);
    }
  }, [formData.teacher_id, groups]);

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
    setQuestions([]);
    setEvents([
      {
        start_at: "",
        end_at: "",
        group_id: "",
        duration: "",
      },
    ]);
    setExamImage(null);
    setFilteredGroups([]);
    setCurrentQuestion({
      question: "",
      questionType: "text",
      options: [
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
      ],
      degree: 1,
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
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.id}</span>
      ),
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
          {/* <Button
            onClick={() => setEditingExam(row.original)}
            size="sm"
            variant="outline"
          >
            تعديل
          </Button> */}
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

  const isAuthrized = useAuthrization({
    user: user as User,
    module: ["Exams", "exams"],
  });
  if (!isAuthrized) {
    return <div>ليس لديك صلاحية لعرض هذه الصفحة</div>;
  }

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
          <DialogContent className="md:max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة امتحان جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="title"
                      className="block mb-2 text-sm font-medium"
                    >
                      عنوان الامتحان *
                    </label>
                    <Input
                      {...register("title")}
                      id="title"
                      placeholder="أدخل عنوان الامتحان"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="teacher_id"
                      className="block mb-2 text-sm font-medium"
                    >
                      المعلم *
                    </label>
                    <select
                      {...register("teacher_id")}
                      id="teacher_id"
                      name="teacher_id"
                      value={formData.teacher_id}
                      onChange={handleInputChange}
                      required
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
                </div>

                <div>
                  <label
                    htmlFor="image"
                    className="block mb-2 text-sm font-medium"
                  >
                    صورة الامتحان *
                  </label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setExamImage(e.target.files[0]);
                      }
                    }}
                    required
                  />
                  {examImage && (
                    <p className="text-sm text-green-600 mt-1">
                      تم اختيار: {examImage.name}
                    </p>
                  )}
                </div>

                {/* Events Section */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">الأحداث (المواعيد) *</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEvents([
                          ...events,
                          {
                            start_at: "",
                            end_at: "",
                            group_id: "",
                            duration: "",
                          },
                        ]);
                      }}
                    >
                      إضافة حدث
                    </Button>
                  </div>
                  {events.map((event, index) => (
                    <div
                      key={index}
                      className="grid gap-3 mb-3 p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <label className="block text-xs mb-1">المدة *</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[100px]">
                            <label className="block text-xs mb-1 text-gray-500">
                              دقائق
                            </label>
                            <Input
                              type="number"
                              min={0}
                              max={59}
                              placeholder="00"
                              value={
                                event.duration
                                  ? parseInt(event.duration.split(":")[1]) || 0
                                  : 0
                              }
                              onChange={(e) => {
                                const newEvents = [...events];
                                const mins = Math.max(
                                  0,
                                  Math.min(59, parseInt(e.target.value) || 0),
                                );
                                const currentHours = event.duration
                                  ? parseInt(event.duration.split(":")[0]) || 0
                                  : 0;
                                newEvents[index].duration =
                                  `${String(currentHours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
                                setEvents(newEvents);
                              }}
                              required
                            />
                          </div>

                          <span className="text-lg font-bold mt-4">:</span>

                          <div className="flex-1 max-w-[100px]">
                            <label className="block text-xs mb-1 text-gray-500">
                              ساعات
                            </label>
                            <Input
                              type="number"
                              min={0}
                              max={23}
                              placeholder="00"
                              value={
                                event.duration
                                  ? parseInt(event.duration.split(":")[0]) || 0
                                  : 0
                              }
                              onChange={(e) => {
                                const newEvents = [...events];
                                const hours = Math.max(
                                  0,
                                  Math.min(23, parseInt(e.target.value) || 0),
                                );
                                const currentMins = event.duration
                                  ? parseInt(event.duration.split(":")[1]) || 0
                                  : 0;
                                newEvents[index].duration =
                                  `${String(hours).padStart(2, "0")}:${String(currentMins).padStart(2, "0")}`;
                                setEvents(newEvents);
                              }}
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-nowrap text-xs mb-1">
                          وقت البداية *
                        </label>
                        <Input
                          type="datetime-local"
                          value={event.start_at}
                          onChange={(e) => {
                            const newEvents = [...events];
                            newEvents[index].start_at = e.target.value;
                            setEvents(newEvents);
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-nowrap text-xs mb-1">
                          وقت النهاية *
                        </label>
                        <Input
                          type="datetime-local"
                          value={event.end_at}
                          onChange={(e) => {
                            const newEvents = [...events];
                            newEvents[index].end_at = e.target.value;
                            setEvents(newEvents);
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1">المجموعة *</label>
                        <select
                          value={event.group_id}
                          onChange={(e) => {
                            const newEvents = [...events];
                            newEvents[index].group_id = e.target.value;
                            setEvents(newEvents);
                          }}
                          required
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">
                            {filteredGroups?.length === 0 && formData.teacher_id
                              ? "لا توجد مجموعات لهذا المعلم"
                              : "اختر المجموعة"}
                          </option>
                          {filteredGroups?.map((group: any) => (
                            <option key={group.id} value={group.id}>
                              {group.group || group.group_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        {events.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEvents(events.filter((_, i) => i !== index));
                            }}
                            className="text-red-500"
                          >
                            حذف
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Questions Section */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">
                      الأسئلة * ({questions.length} سؤال)
                    </h3>
                    <div className="flex gap-2">
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer bg-yellow-600 hover:bg-yellow-700 text-white text-sm">
                        <span>استيراد من Excel</span>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleExcelUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Display added questions */}
                  {questions.length > 0 && (
                    <div className="max-h-60 overflow-y-auto mb-3 space-y-3">
                      {questions.map((q, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm mb-2">
                                السؤال {index + 1}:{" "}
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: q.question,
                                  }}
                                />
                              </h4>
                              <div className="text-xs text-gray-600 mb-2">
                                النوع:{" "}
                                {q.questionType === "text" ? "نص" : "صورة"} |
                                الدرجة: {q.degree}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setQuestions(
                                  questions.filter((_, i) => i !== index),
                                )
                              }
                              className="text-red-500 hover:bg-red-50"
                            >
                              حذف
                            </Button>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              الخيارات:
                            </div>
                            {q.options.map((option: any, optIndex: number) => (
                              <div
                                key={optIndex}
                                className={`p-2 rounded text-xs ${
                                  option.is_correct
                                    ? "bg-green-100 border border-green-300 text-green-800"
                                    : "bg-white border border-gray-200"
                                }`}
                              >
                                <span className="font-medium">
                                  {option.is_correct && "✓ "}
                                  {optIndex + 1}. {option.answer}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add question form */}
                  <div className="space-y-3 border-t pt-3">
                    <div>
                      <label className="block text-sm mb-1">نوع السؤال</label>
                      <select
                        value={currentQuestion.questionType}
                        onChange={(e) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            questionType: e.target.value as "text" | "image",
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="text">نص</option>
                        <option value="image">صورة</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm mb-1">
                        {currentQuestion.questionType === "text"
                          ? "نص السؤال"
                          : "رابط الصورة"}
                      </label>
                      {currentQuestion.questionType === "text" ? (
                        <Editor
                          apiKey={siteConfig.tinymceApiKey}
                          value={currentQuestion.question}
                          onEditorChange={(content: string) => {
                            setCurrentQuestion({
                              ...currentQuestion,
                              question: content,
                            });
                          }}
                          init={{
                            height: 300,
                            menubar: true,
                            directionality: "rtl",
                            skin: "oxide-dark",
                            content_css: "dark",
                            plugins: [
                              "advlist",
                              "autolink",
                              "lists",
                              "link",
                              "image",
                              "charmap",
                              "preview",
                              "anchor",
                              "searchreplace",
                              "visualblocks",
                              "code",
                              "fullscreen",
                              "insertdatetime",
                              "media",
                              "table",
                              "code",
                              "help",
                              "wordcount",
                            ],
                            toolbar:
                              "undo redo | blocks | " +
                              "bold italic forecolor | alignleft aligncenter " +
                              "alignright alignjustify | bullist numlist outdent indent | " +
                              "removeformat | help",
                            content_style:
                              "body { font-family:Helvetica,Arial,sans-serif; font-size:14px; color: #fff; background-color: #1f2937; }",
                            branding: false,
                            promotion: false,
                          }}
                        />
                      ) : (
                        <Input
                          value={currentQuestion.question}
                          onChange={(e) =>
                            setCurrentQuestion({
                              ...currentQuestion,
                              question: e.target.value,
                            })
                          }
                          placeholder="https://example.com/image.jpg"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm mb-1">الدرجة</label>
                      <Input
                        type="number"
                        min="1"
                        value={currentQuestion.degree}
                        onChange={(e) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            degree: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm">الخيارات</label>
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option.answer}
                            onChange={(e) => {
                              const newOptions = [...currentQuestion.options];
                              newOptions[index].answer = e.target.value;
                              setCurrentQuestion({
                                ...currentQuestion,
                                options: newOptions,
                              });
                            }}
                            placeholder={`الخيار ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant={"outline"}
                            size="sm"
                            onClick={() => {
                              const newOptions = currentQuestion.options.map(
                                (opt, i) => ({
                                  ...opt,
                                  is_correct: i === index,
                                }),
                              );
                              setCurrentQuestion({
                                ...currentQuestion,
                                options: newOptions,
                              });
                            }}
                          >
                            {option.is_correct ? "صحيح ✓" : "تحديد"}
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        if (
                          currentQuestion.question &&
                          currentQuestion.options.some((opt) => opt.is_correct)
                        ) {
                          setQuestions([...questions, { ...currentQuestion }]);
                          setCurrentQuestion({
                            question: "",
                            questionType: "text",
                            options: [
                              { answer: "", is_correct: false },
                              { answer: "", is_correct: false },
                              { answer: "", is_correct: false },
                              { answer: "", is_correct: false },
                            ],
                            degree: 1,
                          });
                        }
                      }}
                      className="w-full"
                      disabled={
                        !currentQuestion.question ||
                        !currentQuestion.options.some((opt) => opt.is_correct)
                      }
                    >
                      إضافة السؤال
                    </Button>
                  </div>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                {/* Show existing questions if available */}
                {editingExam.questions && editingExam.questions.length > 0 && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold mb-3 text-blue-800">
                      الأسئلة الحالية ({editingExam.questions.length} سؤال)
                    </h3>
                    <div className="max-h-60 overflow-y-auto space-y-3">
                      {editingExam.questions.map((question, index) => (
                        <div
                          key={question.id}
                          className="border rounded-lg p-3 bg-white"
                        >
                          <h4 className="font-semibold text-sm mb-2">
                            السؤال {index + 1}:{" "}
                            <span
                              dangerouslySetInnerHTML={{
                                __html: question.question,
                              }}
                            />
                          </h4>
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              الخيارات:
                            </div>
                            {question.options.map((option) => (
                              <div
                                key={option.id}
                                className={`p-2 rounded text-xs ${
                                  option.id === question.correct_answer
                                    ? "bg-green-100 border border-green-300 text-green-800"
                                    : "bg-white border border-gray-200"
                                }`}
                              >
                                <span className="font-medium">
                                  {option.id === question.correct_answer &&
                                    "✓ "}
                                  {option.id}. {option.answer}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                    السؤال {index + 1}:{" "}
                    <span
                      dangerouslySetInnerHTML={{ __html: question.question }}
                    />
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
                          header.getContext(),
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
                        cell.getContext(),
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
                ),
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
