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
import TeacherGroupsDataTable from "./teacher-groups/[teacherId]/page";
import { useRouter, useSearchParams } from "next/navigation";
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
import Link from "next/link";
import { SubjectsData } from "@/lib/type";
import {
  Upload,
  X,
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Users2,
} from "lucide-react";
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
    levels?: number | string;
    created_at?: string;
    type?: "online" | "offline" | "both" | string;
    subject_id?: string;
    online_courses_count?: number;
    has_offline_courses?: boolean;
  };
  type?: "online" | "offline" | "both" | string;
  online_courses_count?: number;
  has_offline_courses?: boolean;
  tech_no?: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

interface ApiResponse {
  data: User[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

interface LevelOption {
  id: number;
  name: string;
}

type FormData = {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
  subject_id?: string;
  type: "online" | "offline" | "both" | "";
  levels: string;
  cover: string | File | null;
  avatar: string | File | null;
};

const DEFAULT_IMAGE = "https://via.placeholder.com/150x150";

function BasicDataTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<SubjectsData[]>([]);
  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [selectedLevelIds, setSelectedLevelIds] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [rawData, setRawData] = useState<User[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tab, setTab] = useState<boolean | null>(null);
  const [tabReady, setTabReady] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "teachers" | "groups" | "dashboard"
  >("teachers");
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    role: "teacher",
    type: "",
    levels: "",
    cover: "",
    password: "",
    avatar: "",
  });
  const [filters, setFilters] = useState({
    subject_id: "",
    to_date: "",
    from_date: "",
    search: "",
    course_type: "",
  });

  // Statistics data
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalSubjects: 0,
    activeUsers: 0,
    growthRate: 0,
  });

  // Student-teachers data for dashboard tab
  const [studentTeachers, setStudentTeachers] = useState<any[]>([]);
  const [studentTeachersLoading, setStudentTeachersLoading] = useState(false);
  const [studentTeachersError, setStudentTeachersError] = useState<
    string | null
  >(null);

  // Student-teachers selection state
  const [studentTeachersSelection, setStudentTeachersSelection] = useState<
    Record<string, boolean>
  >({});
  const [isStudentBulkDeleteDialogOpen, setIsStudentBulkDeleteDialogOpen] =
    useState(false);

  // Add student to group modal state
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({
    student_id: "",
    teacher_id: "",
    subject_id: "",
    level_id: "",
    group_id: "",
  });

  // Filter options for student-teachers
  const [studentTeachersFilters, setStudentTeachersFilters] = useState({
    teacher_id: "",
    level_id: "",
    subject_id: "",
    group_search: "",
  });

  // Filter options data
  const [teachers, setTeachers] = useState<any[]>([]);
  const [filterLevels, setFilterLevels] = useState<any[]>([]);
  const [filterSubjects, setFilterSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // ✅ Multi-select state
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  // Reset form data
  const resetFormData = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      role: "teacher",
      type: "",
      levels: "",
      cover: "",
      password: "",
      avatar: "",
    });
  };
  // Apply client-side filtering
  useEffect(() => {
    let filtered = [...rawData];

    const { course_type, search } = filters;

    // Text search filter
    if (search) {
      filtered = filtered.filter(
        (user) =>
          user.user.full_name.toLowerCase().includes(search.toLowerCase()) ||
          user.user.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Course type filter
    if (course_type) {
      if (course_type === "online") {
        filtered = filtered.filter(
          (user) => (user.online_courses_count ?? 0) > 0
        );
      } else if (course_type === "offline") {
        filtered = filtered.filter((user) => user.has_offline_courses === true);
      } else if (course_type === "both") {
        filtered = filtered.filter(
          (user) =>
            (user.online_courses_count ?? 0) > 0 &&
            user.has_offline_courses === true
        );
      }
    }

    setData(filtered);
  }, [rawData, filters.course_type, filters.search]);
  // refetch users
  useEffect(() => {
    const initialTab = searchParams.get("tab") === "true";
    setTab(initialTab);
    setTabReady(true); // Mark that tab is now ready
  }, [searchParams]);

  // Fetch student-teachers data
  const fetchStudentTeachers = async () => {
    if (!token) return;

    setStudentTeachersLoading(true);
    setStudentTeachersError(null);

    try {
      const response = await getData(
        "student-teachers",
        { ...studentTeachersFilters },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setStudentTeachers(response.data || response);
    } catch (error) {
      console.error("Error fetching student-teachers:", error);
      setStudentTeachersError("Failed to fetch student-teachers data");
    } finally {
      setStudentTeachersLoading(false);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    if (!token) return;

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
      setFilterLevels(levelsResponse.data || levelsResponse);

      // Fetch subjects
      const subjectsResponse = await getData(
        "subjects",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setFilterSubjects(subjectsResponse.data || subjectsResponse);

      // Fetch students
      const studentsResponse = await getData(
        "students",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setStudents(studentsResponse.data.students || studentsResponse);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };
  const refetchUsers = async (page: number = 1) => {
    try {
      const response = await getData(
        `teachers?page=${page}`,
        { ...filters },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setData(response.data);
      setTotalPages(response.meta.last_page);
      setCurrentPage(response.meta.current_page);
      setTotalUsers(response.meta.total);
      // Update stats
      setStats((prev) => ({
        ...prev,
        totalTeachers: response.meta.total,
        activeUsers: response.data.length,
      }));
    } catch (error) {
      console.log(error);
    }
  };

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
  }, []);

  // handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // handle select change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // handle multi-select levels: update selected ids and join names into formData.levels
  const handleLevelsMultiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    setSelectedLevelIds(selected);
    const levelNames = levels
      .filter((lvl) => selected.includes(lvl.id.toString()))
      .map((lvl) => lvl.name)
      .join("-");
    setFormData((prev) => ({ ...prev, levels: levelNames }));
  };

  // checkbox toggle handler for levels (for non-Ctrl multi selection UIs)
  const toggleLevelSelection = (levelId: string, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...selectedLevelIds, levelId]))
      : selectedLevelIds.filter((id) => id !== levelId);
    setSelectedLevelIds(next);
    const levelNames = levels
      .filter((lvl) => next.includes(lvl.id.toString()))
      .map((lvl) => lvl.name)
      .join("-");
    setFormData((prev) => ({ ...prev, levels: levelNames }));
  };

  // add user
  const schema = z.object({
    full_name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(8, "Phone is required"),
    role: z.enum(["teacher", "student"]),
    type: z.enum(["online", "offline", "both"]),
    levels: z.string().min(1, "المستوى مطلوب"),
    cover: z.string().url("Invalid image URL"),
    avatar: z.string().url("Invalid image URL"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    subject_id: z.string().optional(),
  });
  const { register, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "all",
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await postData("teachers", formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });
      reset();
      resetFormData();
      refetchUsers();
      toast.success("تم إضافة المستخدم بنجاح");
      dialogCloseRef.current?.click();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join("<br>");
          setError(errorMessages);
        } else {
          setError("An error occurred");
        }
      } else {
        setError("An unexpected error occurred");
      }
      throw error;
    }
  };

  // update user
  const updateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload: any = { ...(formData as any), _method: "PUT" };
      // Do not send avatar unless it's a File (new upload)
      if (payload.avatar && !(payload.avatar instanceof File)) {
        delete payload.avatar;
      }
      await postData(`teachers/${editingUser.user.id}`, payload, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });
      reset();
      resetFormData();
      setEditingUser(null);
      setShowEditModal(false);
      refetchUsers();
      toast.success("تم تحديث المستخدم بنجاح");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join("<br>");
          setEditError(errorMessages);
        } else {
          setEditError("An error occurred");
        }
      } else {
        setEditError("An unexpected error occurred");
      }
      throw error;
    }
  };

  // delete user
  const deleteUser = async (id: number) => {
    try {
      await deleteData(`teachers/${id}`, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });
      reset();
      setEditingUser(null);
      refetchUsers();
      toast.success("تم حذف المستخدم بنجاح");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join("<br>");
          setError(errorMessages);
        } else {
          setError("An error occurred");
        }
      } else {
        setError("An unexpected error occurred");
      }
      throw error;
    }
  };

  // ✅ Bulk delete handler
  // ✅ Fixed bulk delete handler - gets real user IDs instead of table indices
  const handleBulkDelete = async () => {
    // Get the actual user IDs from selected rows
    const selectedUserIds = Object.keys(rowSelection)
      .map((rowId) => {
        // Find the user data by row ID
        const user = data.find((user) => String(user.id) === rowId);
        return user ? user.user.id : null; // Return the actual user.id, not the table row id
      })
      .filter(Boolean); // Remove any null values

    console.log("Selected user IDs:", selectedUserIds); // Debug log

    try {
      await Promise.all(
        selectedUserIds.map((userId) =>
          deleteData(`teachers/${userId}`, {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          })
        )
      );
      toast.success(`تم حذف ${selectedUserIds.length} مستخدم(ين) بنجاح!`);
      setRowSelection({}); // Clear selection
      refetchUsers();
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("فشل في حذف بعض المستخدمين");
    } finally {
      setIsBulkDeleteDialogOpen(false);
    }
  };

  // Excel import/export handlers
  const handleExportToExcel = () => {
    try {
      // Create Excel content using HTML table format that Excel can open
      const headers = [
        "ID",
        "Student ID",
        "Student Name",
        "Teacher ID",
        "Teacher Name",
        "Subject ID",
        "Subject Name",
        "Level ID",
        "Level Name",
        "Group ID",
        "Group Name",
      ];

      // Create HTML table for Excel
      const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:x="urn:schemas-microsoft-com:office:excel" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <meta name="ExcelCreated" content="01/01/2024">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Student Teachers</x:Name>
                  <x:WorksheetOptions>
                    <x:DefaultRowHeight>285</x:DefaultRowHeight>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
        </head>
        <body>
          <table>
            <tr>
              ${headers.map((header) => `<td><b>${header}</b></td>`).join("")}
            </tr>
            ${studentTeachers
              .map(
                (row) => `
              <tr>
                <td>${row.id}</td>
                <td>${row.student_id}</td>
                <td>${row.student_name || ""}</td>
                <td>${row.teacher_id}</td>
                <td>${row.teacher_name || ""}</td>
                <td>${row.subject_id}</td>
                <td>${row.subject_name || ""}</td>
                <td>${row.level_id}</td>
                <td>${row.level_name || ""}</td>
                <td>${row.group_id}</td>
                <td>${row.group_name || ""}</td>
              </tr>
            `
              )
              .join("")}
          </table>
        </body>
        </html>
      `;

      // Create and download file
      const blob = new Blob([htmlContent], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `student-teachers-${new Date().toISOString().split("T")[0]}.xls`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("تم تصدير البيانات إلى Excel بنجاح");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("فشل في تصدير البيانات");
    }
  };

  const handleImportFromExcel = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xls,.xlsx,.csv";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileImport(file);
      }
    };
    input.click();
  };

  const handleFileImport = async (file: File) => {
    try {
      let dataRows: string[][] = [];

      // Handle different file types
      if (file.name.endsWith(".csv")) {
        // Parse CSV file
        const text = await file.text();
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          toast.error("الملف فارغ أو لا يحتوي على بيانات");
          return;
        }

        dataRows = lines.map((line) =>
          line.split(",").map((v) => v.trim().replace(/"/g, ""))
        );
      } else if (file.name.endsWith(".xls") || file.name.endsWith(".xlsx")) {
        // For Excel files, we'll parse the HTML table format we created
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");
        const table = doc.querySelector("table");

        if (!table) {
          toast.error("لا يمكن قراءة بيانات Excel من الملف");
          return;
        }

        const rows = Array.from(table.querySelectorAll("tr"));
        dataRows = rows.map((row) =>
          Array.from(row.querySelectorAll("td")).map(
            (cell) => cell.textContent || ""
          )
        );
      } else {
        toast.error("نوع الملف غير مدعوم. يرجى استخدام CSV أو XLS");
        return;
      }

      if (dataRows.length < 2) {
        toast.error("الملف فارغ أو لا يحتوي على بيانات");
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Process each row (skip header row)
      for (let i = 1; i < dataRows.length; i++) {
        const values = dataRows[i];

        if (!values || values.length < 11) continue;

        // Map columns to our data structure based on our export format
        const rowData = {
          student_id: values[1] || "", // Student ID column
          teacher_id: values[3] || "", // Teacher ID column
          subject_id: values[5] || "", // Subject ID column
          level_id: values[7] || "", // Level ID column
          group_id: values[9] || "", // Group ID column
        };

        // Validate required fields
        if (
          !rowData.student_id ||
          !rowData.teacher_id ||
          !rowData.subject_id ||
          !rowData.level_id ||
          !rowData.group_id
        ) {
          errorCount++;
          continue;
        }

        try {
          // Add student to group one by one
          await postData("student-teachers", rowData, {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          });
          successCount++;
        } catch (error) {
          console.error("Error adding student to group:", error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`تم إضافة ${successCount} طالب(ين) للمجموعات بنجاح`);
        fetchStudentTeachers(); // Refresh data
      }

      if (errorCount > 0) {
        toast.error(`فشل في إضافة ${errorCount} طالب(ين) - تحقق من البيانات`);
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("فشل في قراءة الملف");
    }
  };

  // Add student to group handler
  const handleAddStudentToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await postData("student-teachers", addStudentForm, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });

      toast.success("تم إضافة الطالب للمجموعة بنجاح");
      setIsAddStudentModalOpen(false);
      setAddStudentForm({
        student_id: "",
        teacher_id: "",
        subject_id: "",
        level_id: "",
        group_id: "",
      });
      fetchStudentTeachers(); // Refresh data
    } catch (error) {
      console.error("Add student to group error:", error);
      toast.error("فشل في إضافة الطالب للمجموعة");
    }
  };

  const handleDeleteStudentFromGroup = async (studentTeacherId: number) => {
    if (confirm("هل أنت متأكد من إزالة الطالب من هذه المجموعة؟")) {
      try {
        await deleteData(`student-teachers/${studentTeacherId}`, {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        });
        toast.success("تم إزالة الطالب من المجموعة بنجاح");
        fetchStudentTeachers(); // Refresh the data
      } catch (error) {
        console.error("Remove student from group error:", error);
        toast.error("فشل في إزالة الطالب من المجموعة");
      }
    }
  };

  // Bulk remove students from groups
  const handleBulkRemoveStudentsFromGroups = async () => {
    const selectedStudentTeacherIds = Object.keys(studentTeachersSelection)
      .map((rowId) => {
        const student = studentTeachers.find((s) => String(s.id) === rowId);
        return student ? student.id : null;
      })
      .filter(Boolean);

    console.log("Selected student-teacher IDs:", selectedStudentTeacherIds);

    try {
      await Promise.all(
        selectedStudentTeacherIds.map((studentTeacherId) =>
          deleteData(`student-teachers/${studentTeacherId}`, {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          })
        )
      );
      toast.success(
        `تم إزالة ${selectedStudentTeacherIds.length} طالب(ين) من المجموعات بنجاح!`
      );
      setStudentTeachersSelection({}); // Clear selection
      fetchStudentTeachers();
    } catch (error) {
      console.error("Bulk remove students from groups error:", error);
      toast.error("فشل في إزالة بعض الطلاب من المجموعات");
    } finally {
      setIsStudentBulkDeleteDialogOpen(false);
    }
  };

  // Handle edit user click
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    // derive type from data if not present
    const derivedType = (() => {
      const onlineCount =
        typeof user.online_courses_count === "number"
          ? user.online_courses_count
          : typeof user.user.online_courses_count === "number"
          ? user.user.online_courses_count
          : 0;
      const hasOffline =
        typeof user.has_offline_courses === "boolean"
          ? user.has_offline_courses
          : typeof user.user.has_offline_courses === "boolean"
          ? user.user.has_offline_courses
          : false;
      if (onlineCount > 0 && hasOffline) return "both";
      if (onlineCount > 0) return "online";
      if (hasOffline) return "offline";
      return "";
    })();
    setFormData({
      full_name: user.user.full_name,
      email: user.user.email,
      phone: user.user.phone,
      role: user.user.role,
      type: (user.user as any)?.type || (user as any)?.type || derivedType,
      levels: (user.user.levels && String(user.user.levels)) || ("" as string),
      cover: user.user.avatar,
      password: "",
      avatar: user.user.avatar,
      subject_id: user.user.subject_id?.toString() || "",
    });
    setShowEditModal(true);
    setEditError(null);
  };

  // sync selectedLevelIds from formData.levels (names joined by '-') when levels list is available
  useEffect(() => {
    if (!formData.levels) {
      setSelectedLevelIds([]);
      return;
    }
    const names = formData.levels
      .split("-")
      .map((n) => n.trim())
      .filter(Boolean);
    const ids = levels
      .filter((lvl) => names.includes(lvl.name))
      .map((lvl) => lvl.id.toString());
    setSelectedLevelIds(ids);
  }, [levels, formData.levels]);

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    resetFormData();
    setEditError(null);
  };

  // feach users from api
  useEffect(() => {
    refetchUsers(currentPage);
  }, [token, currentPage]);

  // Refetch users when filters change
  useEffect(() => {
    refetchUsers(1); // Reset to first page on filter change
    setCurrentPage(1);
  }, [filters]);

  // feach subjects from api
  useEffect(() => {
    const feachData = async () => {
      try {
        const response = await getData(
          "subjects",
          {},
          {
            Authorization: `Bearer ${token}`,
          }
        );
        setSubjects(response.data);
        setStats((prev) => ({
          ...prev,
          totalSubjects: response.data.length,
        }));
        // fetch levels
        const levelsResponse = await getData(
          "levels",
          {},
          {
            Authorization: `Bearer ${token}`,
          }
        );
        setLevels(levelsResponse.data || levelsResponse);
      } catch (error) {
        console.log(error);
      }
    };
    feachData();
  }, [token]);

  // Calculate growth rate (mock calculation)
  useEffect(() => {
    if (totalUsers > 0) {
      const mockGrowthRate = Math.floor(Math.random() * 20) + 5; // Mock 5-25% growth
      setStats((prev) => ({
        ...prev,
        growthRate: mockGrowthRate,
      }));
    }
  }, [totalUsers]);

  // Fetch student-teachers data when dashboard tab is active
  useEffect(() => {
    if (activeTab === "dashboard" && token) {
      fetchStudentTeachers();
      fetchFilterOptions();
    }
  }, [activeTab, token]);

  // Refetch data when filters change
  useEffect(() => {
    if (activeTab === "dashboard" && token) {
      fetchStudentTeachers();
    }
  }, [studentTeachersFilters]);

  // columns of table
  const columns: ColumnDef<User>[] = [
    // ✅ Select Column
    {
      id: "select",
      header: ({ table }) => {
        const isAllSelected = table.getIsAllPageRowsSelected();
        const isSomeSelected = table.getIsSomePageRowsSelected();
        const ref = useRef<HTMLButtonElement>(null);

        return (
          <div className="flex items-center">
            <div className="relative">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={() => table.toggleAllPageRowsSelected()}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              {isSomeSelected && !isAllSelected && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3 h-0.5 bg-white rounded"></div>
                </div>
              )}
            </div>
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={() => row.toggleSelected()}
            className="w-4 h-4 text-blue-600 rounded border-gray-300"
          />
        </div>
      ),
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">{row.original.user.id}</span>
      ),
    },
    {
      accessorKey: "tech_no",
      header: "كود المعلم",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {row.original.tech_no || "-"}
        </span>
      ),
    },
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
              <AvatarImage
                src={
                  user.user.avatar !== "https://safezone-co.top/"
                    ? user.user.avatar
                    : DEFAULT_IMAGE
                }
                alt={user.user.full_name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_IMAGE;
                }}
              />
              <AvatarFallback>{user.user.full_name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <span>{user.user.full_name}</span>
          </Link>
        );
      },
    },
    {
      accessorKey: "email",
      header: "الايميل",
      cell: ({ row }) => (
        <div className="lowercase whitespace-nowrap">
          {row.original.user.email ?? "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "الهاتف",
      cell: ({ row }) => <div>{row.original.user.phone ?? "N/A"}</div>,
    },
    {
      accessorKey: "subject",
      header: "المادة",
      cell: ({ row }) => {
        return (
          <span className="text-sm">
            {(row.original as any)?.subject
              ? (row.original as any)?.subject
              : "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "online_courses_count",
      header: "عدد الدورات أونلاين",
      cell: ({ row }) => {
        const count =
          typeof row.original.online_courses_count === "number"
            ? row.original.online_courses_count
            : typeof row.original.user.online_courses_count === "number"
            ? row.original.user.online_courses_count
            : 0;
        return <div>{count}</div>;
      },
    },
    {
      accessorKey: "has_offline_courses",
      header: "دورات أوفلاين؟",
      cell: ({ row }) => {
        const hasOffline =
          typeof row.original.has_offline_courses === "boolean"
            ? row.original.has_offline_courses
            : typeof row.original.user.has_offline_courses === "boolean"
            ? row.original.user.has_offline_courses
            : false;
        return (
          <Badge
            variant={hasOffline ? "soft" : "outline"}
            className={hasOffline ? "bg-green-100 text-green-700" : ""}
          >
            {hasOffline ? "نعم" : "لا"}
          </Badge>
        );
      },
    },
    // Level column
    {
      accessorKey: "level",
      header: "المرحلة",
      cell: ({ row }) => {
        const raw =
          (row.original.user as any)?.levels ??
          (row.original as any)?.levels ??
          (row.original.user as any)?.level_id;
        if (!raw && raw !== 0) return <span>-</span>;
        // If raw is non-numeric string, assume it's already a name
        const rawStr = String(raw);
        const isNumeric = /^\d+$/.test(rawStr);
        if (!isNumeric) {
          return <span className="text-sm">{rawStr}</span>;
        }
        const levelId = parseInt(rawStr, 10);
        const level = levels.find((l) => l.id === levelId);
        return <span className="text-sm">{level ? level.name : rawStr}</span>;
      },
    },
    {
      accessorKey: "type",
      header: "الموقع",
      cell: ({ row }) => {
        const onlineCount =
          typeof row.original.online_courses_count === "number"
            ? row.original.online_courses_count
            : typeof row.original.user.online_courses_count === "number"
            ? row.original.user.online_courses_count
            : 0;
        const hasOffline =
          typeof row.original.has_offline_courses === "boolean"
            ? row.original.has_offline_courses
            : typeof row.original.user.has_offline_courses === "boolean"
            ? row.original.user.has_offline_courses
            : false;
        const explicitType =
          (row.original.user as any)?.type || (row.original as any)?.type;
        const computedType = explicitType
          ? explicitType
          : onlineCount > 0 && hasOffline
          ? "both"
          : onlineCount > 0
          ? "online"
          : hasOffline
          ? "offline"
          : "";
        const label =
          computedType === "online"
            ? "أونلاين"
            : computedType === "offline"
            ? "أوفلاين"
            : computedType === "both"
            ? "الاثنين"
            : "";
        return <div>{label}</div>;
      },
    },
    {
      accessorKey: "created_at",
      header: "تاريخ الإنشاء",
      cell: ({ row }) => {
        const createdAt = (row.original as any)?.created_at;
        if (!createdAt) return <div>—</div>;
        try {
          const date = new Date(createdAt);
          return <div>{date.toLocaleDateString()}</div>;
        } catch {
          return <div>{createdAt}</div>;
        }
      },
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center justify-center">
          <Button onClick={() => handleEditUser(row.original)}>تعديل</Button>
          <Button
            onClick={() => deleteUser(row.original.user.id)}
            className="bg-red-500 hover:bg-red-600"
          >
            حذف
          </Button>
          <Link
            href={`/teachers/teacher-groups/${row.original.id}`}
            passHref
            legacyBehavior
          >
            <Button variant="outline" className="flex items-center gap-1">
              <Users2 className="w-4 h-4" />
              المجموعات
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  // Student-teachers table columns
  const studentTeachersColumns: ColumnDef<any>[] = [
    // Select Column
    {
      id: "select",
      header: ({ table }) => {
        const isAllSelected = table.getIsAllPageRowsSelected();
        const isSomeSelected = table.getIsSomePageRowsSelected();

        return (
          <div className="flex items-center">
            <div className="relative">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={() => table.toggleAllPageRowsSelected()}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              {isSomeSelected && !isAllSelected && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3 h-0.5 bg-white rounded"></div>
                </div>
              )}
            </div>
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={() => row.toggleSelected()}
            className="w-4 h-4 text-blue-600 rounded border-gray-300"
          />
        </div>
      ),
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 font-mono">
          {row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "student_id",
      header: "معرف الطالب",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 font-mono">
          {row.original.student_id || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "student_name",
      header: "اسم الطالب",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="rounded-full">
            <AvatarImage
              src={DEFAULT_IMAGE}
              alt={row.original.student_name || "Student"}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_IMAGE;
              }}
            />
            <AvatarFallback>
              {row.original.student_name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span>{row.original.student_name || "N/A"}</span>
        </div>
      ),
    },
    {
      accessorKey: "teacher_id",
      header: "معرف المعلم",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 font-mono">
          {row.original.teacher_id || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "teacher_name",
      header: "اسم المعلم",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="rounded-full">
            <AvatarImage
              src={DEFAULT_IMAGE}
              alt={row.original.teacher_name || "Teacher"}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_IMAGE;
              }}
            />
            <AvatarFallback>
              {row.original.teacher_name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span>{row.original.teacher_name || "N/A"}</span>
        </div>
      ),
    },
    {
      accessorKey: "subject_id",
      header: "معرف المادة",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 font-mono">
          {row.original.subject_id || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "subject_name",
      header: "المادة",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.subject_name || "N/A"}</span>
      ),
    },
    {
      accessorKey: "level_id",
      header: "معرف المرحلة",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 font-mono">
          {row.original.level_id || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "level_name",
      header: "المرحلة",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.level_name || "N/A"}</span>
      ),
    },
    {
      accessorKey: "group_id",
      header: "معرف المجموعة",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 font-mono">
          {row.original.group_id || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "group_name",
      header: "المجموعة",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-blue-100 text-blue-700">
          {row.original.group_name || "N/A"}
        </Badge>
      ),
    },
    {
      accessorKey: "actions",
      header: "الإجراءات",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteStudentFromGroup(row.original.id)}
            className="text-red-600 hover:text-red-700"
          >
            إزالة من المجموعة
          </Button>
        </div>
      ),
    },
  ];

  // ✅ Table with row selection
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row) => String(row.id),
  });

  // ✅ Get selected count
  const selectedCount = Object.keys(rowSelection).length;

  // Student-teachers table
  const studentTeachersTable = useReactTable({
    data: studentTeachers,
    columns: studentTeachersColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      rowSelection: studentTeachersSelection,
    },
    onRowSelectionChange: setStudentTeachersSelection,
    enableRowSelection: true,
    getRowId: (row) => String(row.id),
  });

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي المعلمين
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalTeachers}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي المواد
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalSubjects}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                المستخدمين النشطين
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeUsers}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                معدل النمو
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.growthRate}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-300" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1 mb-4">
        <button
          onClick={() => setActiveTab("teachers")}
          className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
            activeTab === "teachers"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          معلمين
        </button>
        <button
          onClick={() => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set("tab", "true");
            router.push(`${window.location.pathname}?${newParams.toString()}`);

            // Wait 5 seconds before setting active tab
            setTimeout(() => {
              setActiveTab("groups");
            }, 1000);
          }}
          className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
            activeTab === "groups"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          مجموعات
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
            activeTab === "dashboard"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          طلاب المجموعة
        </button>
      </div>

      {activeTab === "teachers" ? (
        <div className="flex flex-wrap items-center gap-2 px-4 mb-4">
          {/* Filter: Search */}
          <Input
            removeWrapper={true}
            placeholder="بحث بالاسم أو البريد..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="!max-w-sm min-w-[200px] h-10"
          />
          {/* Filter: Subject */}
          <select
            value={filters.subject_id}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, subject_id: e.target.value }))
            }
            className="min-w-[150px] p-2 border rounded"
          >
            <option value="">كل المواد</option>
            {subjects?.map((subject) => (
              <option key={subject?.id} value={subject?.id}>
                {subject?.name}
              </option>
            ))}
          </select>
          {/* Filter: From Date */}
          <input
            type="date"
            value={filters.from_date}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, from_date: e.target.value }))
            }
            className="p-2 border rounded"
          />
          {/* Filter: To Date */}
          <input
            type="date"
            value={filters.to_date}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, to_date: e.target.value }))
            }
            className="p-2 border rounded"
          />
          {/* Filter: Course Type */}
          <select
            value={filters.course_type}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, course_type: e.target.value }))
            }
            className="min-w-[160px] p-2 border rounded"
          >
            <option value="">الكل</option>
            <option value="online">أونلاين</option>
            <option value="offline">أوفلاين</option>
            <option value="both">الاثنين معاً</option>
          </select>
          {/* Reset Filters Button */}
          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                subject_id: "",
                to_date: "",
                from_date: "",
                search: "",
                course_type: "",
              });
            }}
            className="h-10 px-4"
          >
            إعادة تعيين الفلاتر
          </Button>
          {/* Conditional Button */}
          {selectedCount > 0 ? (
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteDialogOpen(true)}
              className="ms-auto h-10"
            >
              حذف المحدد ({selectedCount})
            </Button>
          ) : (
            <div className="ms-auto">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">اضافه مستخدم</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>اضافه مستخدم</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div className="space-y-2 flex items-center justify-center flex-col w-full">
                        <label
                          htmlFor="cover"
                          className="block text-sm font-medium"
                        >
                          صورة المستخدم
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Input
                              {...register("cover")}
                              id="cover"
                              type="file"
                              accept="image/*"
                              name="cover"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    cover: file,
                                    avatar: file,
                                  }));
                                }
                              }}
                            />
                            {(!formData.cover ||
                              formData.cover === "https://safezone-co.top/" ||
                              formData.cover ===
                                "https://via.placeholder.com/150x150") && (
                              <label
                                htmlFor="cover"
                                className="cursor-pointer inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200"
                              >
                                <Upload className="w-5 h-5 text-gray-600" />
                              </label>
                            )}
                          </div>
                          {formData.cover &&
                            formData.cover !== "https://safezone-co.top/" &&
                            formData.cover !==
                              "https://via.placeholder.com/150x150" && (
                              <div className="relative w-20 h-20">
                                <img
                                  src={
                                    typeof formData.cover === "string"
                                      ? formData.cover !==
                                          "https://safezone-co.top/" &&
                                        formData.cover !==
                                          "https://via.placeholder.com/150x150"
                                        ? formData.cover
                                        : DEFAULT_IMAGE
                                      : formData.cover instanceof File
                                      ? URL.createObjectURL(formData.cover)
                                      : DEFAULT_IMAGE
                                  }
                                  alt="Preview"
                                  className="w-full h-full object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      cover: null,
                                    }))
                                  }
                                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="full_name">اسم المستخدم</label>
                        <Input
                          {...register("full_name")}
                          id="full_name"
                          placeholder="Enter full name"
                          name="full_name"
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="email">الايميل</label>
                        <Input
                          {...register("email")}
                          id="email"
                          type="email"
                          placeholder="Enter email"
                          name="email"
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="phone">رقم الهاتف</label>
                        <Input
                          {...register("phone")}
                          id="phone"
                          placeholder="Enter phone number"
                          name="phone"
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="password">كلمة المرور</label>
                        <Input
                          {...register("password")}
                          id="password"
                          type="password"
                          placeholder="Enter password"
                          name="password"
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="subject_id">Subject</label>
                        <select
                          {...register("subject_id")}
                          id="subject_id"
                          className="w-full p-2 border rounded"
                          name="subject_id"
                          onChange={handleSelectChange}
                        >
                          <option value="">Select subject</option>
                          {subjects?.map((subject) => (
                            <option key={subject?.id} value={subject?.id}>
                              {subject?.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="levels">المرحلة</label>
                        <div id="levels" className="mt-2 flex flex-wrap gap-2">
                          {levels?.map((level) => {
                            const id = level.id.toString();
                            const selected = selectedLevelIds.includes(id);
                            return (
                              <button
                                type="button"
                                key={id}
                                onClick={() =>
                                  toggleLevelSelection(id, !selected)
                                }
                                className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                                  selected
                                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                    : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                                }`}
                              >
                                {level.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="type">نوع الدورات</label>
                        <select
                          {...register("type")}
                          id="type"
                          className="w-full p-2 border rounded"
                          name="type"
                          onChange={handleSelectChange}
                          value={formData.type}
                        >
                          <option value="">اختر النوع</option>
                          <option value="online">أونلاين</option>
                          <option value="offline">أوفلاين</option>
                          <option value="both">الاثنين معاً</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      {error && (
                        <p
                          className="text-red-500"
                          dangerouslySetInnerHTML={{ __html: error }}
                        />
                      )}
                    </div>
                    <div className="mt-6 space-y-2">
                      <Button type="submit" className="w-full">
                        Submit
                      </Button>
                      <DialogClose asChild>
                        <Button
                          ref={dialogCloseRef}
                          variant="outline"
                          className="w-full"
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      ) : null}

      {/* Native Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  تعديل المعلم
                </h2>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={updateUser}>
                <div className="space-y-4">
                  {/* Image Upload */}
                  <div className="space-y-2 flex items-center justify-center flex-col w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      صورة المستخدم
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="edit-cover"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData((prev) => ({
                                ...prev,
                                cover: file,
                                avatar: file,
                              }));
                            }
                          }}
                        />
                        {(!formData.cover ||
                          formData.cover === "https://safezone-co.top/" ||
                          formData.cover ===
                            "https://via.placeholder.com/150x150") && (
                          <label
                            htmlFor="edit-cover"
                            className="cursor-pointer inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                          >
                            <Upload className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          </label>
                        )}
                      </div>
                      {formData.cover &&
                        formData.cover !== "https://safezone-co.top/" &&
                        formData.cover !==
                          "https://via.placeholder.com/150x150" && (
                          <div className="relative w-20 h-20">
                            <img
                              src={
                                typeof formData.cover === "string"
                                  ? formData.cover !==
                                      "https://safezone-co.top/" &&
                                    formData.cover !==
                                      "https://via.placeholder.com/150x150"
                                    ? formData.cover
                                    : DEFAULT_IMAGE
                                  : formData.cover instanceof File
                                  ? URL.createObjectURL(formData.cover)
                                  : DEFAULT_IMAGE
                              }
                              alt="Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  cover: null,
                                  avatar: null,
                                }))
                              }
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      اسم المستخدم
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter full name"
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      الايميل
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter email"
                    />
                  </div>
                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      رقم الهاتف
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter phone number"
                    />
                  </div>
                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      كلمة المرور
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter new password (leave empty to keep current)"
                    />
                  </div>
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      المادة
                    </label>
                    <select
                      name="subject_id"
                      value={formData.subject_id}
                      onChange={handleSelectChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">اختر المادة</option>
                      {subjects?.map((subject) => (
                        <option key={subject?.id} value={subject?.id}>
                          {subject?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      المرحلة
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {levels?.map((level) => {
                        const id = level.id.toString();
                        const selected = selectedLevelIds.includes(id);
                        return (
                          <button
                            type="button"
                            key={id}
                            onClick={() => toggleLevelSelection(id, !selected)}
                            className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                              selected
                                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                            }`}
                          >
                            {level.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      نوع الدورات
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleSelectChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">اختر النوع</option>
                      <option value="online">أونلاين</option>
                      <option value="offline">أوفلاين</option>
                      <option value="both">الاثنين معاً</option>
                    </select>
                  </div>
                </div>
                <div>
                  {editError && (
                    <p
                      className="text-red-500"
                      dangerouslySetInnerHTML={{ __html: editError || "" }}
                    />
                  )}
                </div>
                <div className="mt-6 space-y-2">
                  <Button type="submit" className="w-full">
                    تحديث
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleCloseEditModal}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* users table */}
      {activeTab === "teachers" && (
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

          {/* Pagination Controls */}
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchUsers(currentPage - 1)}
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
                      variant={pageNumber === currentPage ? "soft" : "outline"}
                      size="sm"
                      onClick={() => refetchUsers(pageNumber)}
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
                onClick={() => refetchUsers(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 px-4 font-medium"
              >
                التالي
              </Button>
            </div>
          </div>
        </div>
      )}
      {activeTab === "groups" && (
        <div className="container mx-auto py-8 px-4">
          <TeacherGroupsDataTable />
        </div>
      )}

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              علاقات الطلاب والمعلمين
            </h2>
            <div className="flex items-center gap-2">
              {/* Student Management Buttons */}
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleExportToExcel}
              >
                <Upload className="w-4 h-4" />
                تصدير إلى Excel
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleImportFromExcel}
              >
                <Users className="w-4 h-4" />
                استيراد من Excel
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setIsAddStudentModalOpen(true)}
              >
                <Users2 className="w-4 h-4" />
                إضافة طالب للمجموعة
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 px-4 mb-4">
            {/* Group Search Filter */}
            <Input
              removeWrapper={true}
              placeholder="بحث بالمجموعة..."
              value={studentTeachersFilters.group_search}
              onChange={(e) =>
                setStudentTeachersFilters((prev) => ({
                  ...prev,
                  group_search: e.target.value,
                }))
              }
              className="!max-w-sm min-w-[200px] h-10"
            />

            {/* Teacher Filter */}
            <select
              value={studentTeachersFilters.teacher_id}
              onChange={(e) =>
                setStudentTeachersFilters((prev) => ({
                  ...prev,
                  teacher_id: e.target.value,
                }))
              }
              className="min-w-[150px] p-2 border rounded"
            >
              <option value="">كل المعلمين</option>
              {teachers?.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user?.full_name || teacher.name}
                </option>
              ))}
            </select>

            {/* Level Filter */}
            <select
              value={studentTeachersFilters.level_id}
              onChange={(e) =>
                setStudentTeachersFilters((prev) => ({
                  ...prev,
                  level_id: e.target.value,
                }))
              }
              className="min-w-[150px] p-2 border rounded"
            >
              <option value="">كل المستويات</option>
              {filterLevels?.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>

            {/* Subject Filter */}
            <select
              value={studentTeachersFilters.subject_id}
              onChange={(e) =>
                setStudentTeachersFilters((prev) => ({
                  ...prev,
                  subject_id: e.target.value,
                }))
              }
              className="min-w-[150px] p-2 border rounded"
            >
              <option value="">كل المواد</option>
              {filterSubjects?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>

            {/* Reset Filters Button */}
            <Button
              variant="outline"
              onClick={() => {
                setStudentTeachersFilters({
                  teacher_id: "",
                  level_id: "",
                  subject_id: "",
                  group_search: "",
                });
              }}
              className="h-10 px-4"
            >
              إعادة تعيين الفلاتر
            </Button>

            {/* Bulk Remove Button */}
            {Object.keys(studentTeachersSelection).length > 0 && (
              <Button
                variant="outline"
                onClick={() => setIsStudentBulkDeleteDialogOpen(true)}
                className="h-10 px-4 text-red-600 hover:text-red-700"
              >
                إزالة المحدد من المجموعات (
                {Object.keys(studentTeachersSelection).length})
              </Button>
            )}
          </div>

          {studentTeachersLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">جاري تحميل البيانات...</p>
              </div>
            </div>
          ) : studentTeachersError ? (
            <div className="text-center py-10">
              <div className="text-red-500 mb-4">
                <p className="text-lg font-medium">خطأ في تحميل البيانات</p>
                <p className="text-sm">{studentTeachersError}</p>
              </div>
              <Button onClick={fetchStudentTeachers} variant="outline">
                إعادة المحاولة
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="dark:bg-[#1F2937] w-full rounded-md shadow-md">
                <TableHeader>
                  {studentTeachersTable.getHeaderGroups().map((headerGroup) => (
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
                  {studentTeachersTable.getRowModel().rows?.length ? (
                    studentTeachersTable.getRowModel().rows.map((row) => (
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
                      <TableCell
                        colSpan={studentTeachersColumns.length}
                        className="text-center py-10"
                      >
                        <div className="text-gray-500">
                          <p className="text-lg font-medium">لا توجد بيانات</p>
                          <p className="text-sm">
                            لم يتم العثور على علاقات طلاب ومعلمين
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination for student-teachers table */}
              {studentTeachersTable.getPageCount() > 1 && (
                <div className="flex items-center justify-center py-6">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => studentTeachersTable.previousPage()}
                      disabled={!studentTeachersTable.getCanPreviousPage()}
                      className="h-9 px-4 font-medium"
                    >
                      السابق
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        صفحة{" "}
                        {studentTeachersTable.getState().pagination.pageIndex +
                          1}{" "}
                        من {studentTeachersTable.getPageCount()}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => studentTeachersTable.nextPage()}
                      disabled={!studentTeachersTable.getCanNextPage()}
                      className="h-9 px-4 font-medium"
                    >
                      التالي
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ✅ Bulk Delete Confirmation Dialog */}
      {isBulkDeleteDialogOpen && (
        <Dialog
          open={isBulkDeleteDialogOpen}
          onOpenChange={setIsBulkDeleteDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد الحذف الجماعي</DialogTitle>
            </DialogHeader>
            <p>
              هل أنت متأكد من حذف <strong>{selectedCount}</strong> مستخدم(ين)؟
              لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsBulkDeleteDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button variant="outline" onClick={handleBulkDelete}>
                حذف المحدد
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Student Bulk Remove Confirmation Dialog */}
      {isStudentBulkDeleteDialogOpen && (
        <Dialog
          open={isStudentBulkDeleteDialogOpen}
          onOpenChange={setIsStudentBulkDeleteDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد الإزالة الجماعية من المجموعات</DialogTitle>
            </DialogHeader>
            <p>
              هل أنت متأكد من إزالة{" "}
              <strong>{Object.keys(studentTeachersSelection).length}</strong>{" "}
              طالب(ين) من المجموعات؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsStudentBulkDeleteDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                variant="outline"
                onClick={handleBulkRemoveStudentsFromGroups}
              >
                إزالة المحدد
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Student to Group Modal */}
      {isAddStudentModalOpen && (
        <Dialog
          open={isAddStudentModalOpen}
          onOpenChange={setIsAddStudentModalOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة طالب للمجموعة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStudentToGroup}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    الطالب
                  </label>
                  <select
                    value={addStudentForm.student_id}
                    onChange={(e) =>
                      setAddStudentForm((prev) => ({
                        ...prev,
                        student_id: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">اختر الطالب</option>
                    {students?.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.user?.full_name ||
                          student.name ||
                          `الطالب ${student.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    معرف المعلم
                  </label>
                  <select
                    value={addStudentForm.teacher_id}
                    onChange={(e) =>
                      setAddStudentForm((prev) => ({
                        ...prev,
                        teacher_id: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">اختر المعلم</option>
                    {teachers?.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.user?.full_name || teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    المادة
                  </label>
                  <select
                    value={addStudentForm.subject_id}
                    onChange={(e) =>
                      setAddStudentForm((prev) => ({
                        ...prev,
                        subject_id: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">اختر المادة</option>
                    {filterSubjects?.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    المرحلة
                  </label>
                  <select
                    value={addStudentForm.level_id}
                    onChange={(e) =>
                      setAddStudentForm((prev) => ({
                        ...prev,
                        level_id: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">اختر المرحلة</option>
                    {filterLevels?.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    معرف المجموعة
                  </label>
                  <input
                    type="number"
                    value={addStudentForm.group_id}
                    onChange={(e) =>
                      setAddStudentForm((prev) => ({
                        ...prev,
                        group_id: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddStudentModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit">إضافة</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default BasicDataTable;
