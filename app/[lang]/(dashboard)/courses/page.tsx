"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  MoreHorizontal,
  X,
  Search,
  Download,
  Plus,
  Eye,
  EyeOff,
  ArrowUpDown,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import { useEffect, useState, useMemo } from "react";
import axios, { AxiosHeaders } from "axios";
import { deleteData, getData, postData } from "@/lib/axios/server";
import toast from "react-hot-toast";
import Link from "next/link";
import { Teacher } from "@/lib/type";

function generateSlug(title: string): string {
  const baseSlug = title.toLowerCase().replace(/\s+/g, "-");
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomStr}`;
}

interface Course {
  id: number;
  title: string;
  cour_no: string;
  level: string;
  level_id: number;
  subject: string;
  cover: string;
  created_at: string;
  description?: string;
  type?: string;
  price?: string;
  position?: string;
  slug?: string;
  status?: "active" | "inactive" | "draft";
  enrollment_count?: number;
  teacher_id: number;
  subject_id: number;
  meta_description?: string;
  meta_keywords?: string;
  is_purchased?: boolean;
  is_favorite?: boolean;
  modules?: any[];
}

interface Level {
  id: number;
  name: string;
}

interface FormData {
  teacher_id: number;
  subject_id: number;
  level_id: number;
  title: string;
  slug: string;
  description: string;
  type: "paid" | "free";
  position: "online" | "offline";
  meta_description: string;
  meta_keywords: string;
  status: string;
  price: string;
}

interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

interface ApiResponse {
  data: Course[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

const DEFAULT_IMAGE = "https://via.placeholder.com/150";

function CoursesTable() {
  const [data, setData] = useState<Course[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<number>(0);
  const [token, setToken] = useState<string | null>(null);
  const [editCourse, setEditCourse] = useState<boolean>(false);
  const [addCourse, setAddCourse] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    teacher_id: 0,
    subject_id: 0,
    level_id: 0,
    title: "",
    slug: "",
    description: "",
    type: "free",
    position: "online",
    meta_description: "",
    meta_keywords: "",
    status: "active",
    price: "0",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  );
  const [paginationLinks, setPaginationLinks] =
    useState<PaginationLinks | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();

      // Add all form fields
      formDataToSend.append("teacher_id", formData.teacher_id.toString());
      formDataToSend.append("subject_id", formData.subject_id.toString());
      formDataToSend.append("level_id", formData.level_id.toString());
      formDataToSend.append("title", formData.title);
      formDataToSend.append("slug", generateSlug(formData.title));
      formDataToSend.append("description", formData.description);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("position", formData.position);
      formDataToSend.append("meta_description", formData.meta_description);
      formDataToSend.append("meta_keywords", formData.meta_keywords);
      formDataToSend.append("status", formData.status);
      formDataToSend.append("price", formData.price);

      await postData("/courses", formDataToSend, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      toast.success("تم إضافة الكورس بنجاح");
      setAddCourse(false);
      setFormData({
        teacher_id: 0,
        subject_id: 0,
        level_id: 0,
        title: "",
        slug: "",
        description: "",
        type: "free",
        position: "online",
        meta_description: "",
        meta_keywords: "",
        status: "active",
        price: "0",
      });
      await fetchData();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to add course";
      setEditError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await axios.get("/api/auth/getToken");
        setToken(response.data.token);
        setUserId(JSON.parse(response.data.user).id);
        setUserRole(JSON.parse(response.data.user).role);
      } catch (error) {
        toast.error("Failed to get authentication token");
      }
    };
    fetchToken();
  }, []);

  // Add teachers fetching for admin
  const fetchTeachers = async () => {
    if (!token || userRole !== "admin") return;
    try {
      const response = await getData(
        "teachers",
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        })
      );
      setTeachers(response.data);
    } catch (error) {
      toast.error("Failed to fetch teachers");
    }
  };

  useEffect(() => {
    if (userRole === "admin") {
      fetchTeachers();
    }
  }, [userRole, token]);

  // Update form data when user role changes
  useEffect(() => {
    if (userRole === "teacher") {
      setFormData((prev) => ({
        ...prev,
        teacher_id: userId,
      }));
    }
  }, [userRole, userId]);

  // fetch courses form api
  const fetchData = async (page: number = 1) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await getData(
        `/courses?page=${page}`,
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        })
      );
      const apiResponse = response as ApiResponse;
      setData(apiResponse.data);
      setPaginationMeta(apiResponse.meta);
      setPaginationLinks(apiResponse.links);
    } catch (error) {
      toast.error("Failed to fetch courses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // fetch levels form api
  const fetchLevels = async () => {
    if (!token) return;
    try {
      const response = await getData(
        "levels",
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
          lang: "ar",
        })
      );
      setLevels(response.levels);
    } catch (error) {
      console.error("Error fetching levels:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLevels();
    }
  }, [token]);

  // edit course
  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    const courseData: FormData = {
      teacher_id: course.teacher_id || 0,
      subject_id: course.subject_id || 0,
      level_id: course.level_id || 0,
      title: course.title,
      slug: course.slug || generateSlug(course.title),
      description: course.description || "",
      type: (course.type as "paid" | "free") || "free",
      position: (course.position as "online" | "offline") || "online",
      meta_description: course.meta_description || "",
      meta_keywords: course.meta_keywords || "",
      status: course.status || "active",
      price: course.price || "0",
    };
    setFormData(courseData);

    // Set form values for validation
    Object.keys(courseData).forEach((key) => {
      handleInputChange({
        target: {
          name: key as keyof typeof courseData,
          value: courseData[key as keyof typeof courseData],
        },
      } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>);
    });

    setEditCourse(true);
  };

  // open delete dialog
  const handleDeleteClick = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  // delete course
  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;

    setIsLoading(true);
    try {
      await deleteData(`/courses/${courseToDelete.id}`, {
        Authorization: `Bearer ${token}`,
      });
      toast.success("تم حذف الكورس بنجاح");
      fetchData();
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    } catch (error) {
      toast.error("فشل في حذف الكورس");
    } finally {
      setIsLoading(false);
    }
  };

  // status badge
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            نشط
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" />
            غير نشط
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            مسودة
          </Badge>
        );
      default:
        return <Badge>غير محدد</Badge>;
    }
  };

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "paid":
        return <Badge variant="outline">مدفوع</Badge>;
      case "free":
        return <Badge variant="outline">مجاني</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const exportToCSV = () => {
    const headers = [
      "العنوان",
      "رقم الكورس",
      "المستوى",
      "الموضوع",
      "النوع",
      "السعر",
      "الموقع",
      "الحالة",
    ];
    const csvData = data.map((course) => [
      course.title,
      course.cour_no,
      course.level,
      course.subject,
      course.type || "",
      course.price || "",
      course.position || "",
      course.status || "",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "courses.csv";
    link.click();
  };

  const filteredData = useMemo(() => {
    return data.filter((course) => {
      const matchesType = typeFilter === "all" || course.type === typeFilter;
      const matchesPosition =
        positionFilter === "all" || course.position === positionFilter;
      const matchesGlobal =
        globalFilter === "" ||
        course.title.toLowerCase().includes(globalFilter.toLowerCase()) ||
        course.subject.toLowerCase().includes(globalFilter.toLowerCase()) ||
        course.level.toLowerCase().includes(globalFilter.toLowerCase());

      return matchesType && matchesPosition && matchesGlobal;
    });
  }, [data, typeFilter, positionFilter, globalFilter]);

  const columns: ColumnDef<Course>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          العنوان
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Link
            href={`/courses/${row.original.id}`}
            className="font-medium hover:underline max-w-[200px] truncate"
            title={row.original.title}
          >
            {row.original.title}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "cour_no",
      header: "رقم الكورس",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("cour_no")}</Badge>
      ),
    },
    {
      accessorKey: "level",
      header: "المستوى",
      cell: ({ row }) => row.getValue("level"),
    },
    {
      accessorKey: "subject",
      header: "الموضوع",
      cell: ({ row }) => (
        <span
          className="max-w-[150px] truncate"
          title={row.getValue("subject") as string}
        >
          {row.getValue("subject")}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: "النوع",
      cell: ({ row }) => getTypeBadge(row.getValue("type")),
    },
    {
      accessorKey: "price",
      header: "السعر",
      cell: ({ row }) => {
        const price = row.getValue("price") as string;
        return price ? `${price} ج.م` : "مجاني";
      },
    },
    {
      accessorKey: "position",
      header: "الموقع",
      cell: ({ row }) => {
        const position = row.getValue("position") as string;
        return position === "online"
          ? "أونلاين"
          : position === "offline"
          ? "أوفلاين"
          : "غير محدد";
      },
    },
    {
      accessorKey: "cover",
      header: "الغلاف",
      cell: ({ row }) => {
        const imageUrl: string = row.getValue("cover") || DEFAULT_IMAGE;
        return (
          <Avatar className="rounded-md w-12 h-12">
            <AvatarImage
              src={imageUrl}
              alt="Course Cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_IMAGE;
              }}
            />
            <AvatarFallback>NA</AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "تاريخ الإنشاء",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return date.toLocaleDateString("ar-EG");
      },
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onClick={() => handleEdit(item)}>
                تعديل
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/courses/${item.id}`}>عرض التفاصيل</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 hover:bg-red-50"
                onClick={() => handleDeleteClick(item)}
              >
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const formGrid = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {userRole === "admin" && (
        <div className="space-y-2">
          <label htmlFor="teacher" className="text-sm font-medium">
            المعلم *
          </label>
          <select
            id="teacher"
            name="teacher_id"
            className="w-full rounded-md text-[#000000] border border-input bg-background px-3 py-2"
            value={formData.teacher_id ? formData.teacher_id.toString() : ""}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                teacher_id: parseInt(e.target.value) || 0,
              }));
            }}
            required
          >
            <option value="">اختر المعلم</option>
            {teachers.map((teacher) => (
              <option
                className="text-[#000000]"
                key={teacher.id}
                value={teacher.id}
              >
                {teacher?.user?.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          عنوان الكورس *
        </label>
        <Input
          id="title"
          name="title"
          placeholder="أدخل عنوان الكورس"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium">
          المادة *
        </label>
        <select
          id="subject"
          name="subject_id"
          className="w-full rounded-md text-[#000000] border border-input bg-background px-3 py-2"
          value={formData.subject_id ? formData.subject_id.toString() : ""}
          onChange={(e) => {
            setFormData((prev) => ({
              ...prev,
              subject_id: parseInt(e.target.value) || 0,
            }));
          }}
          required
        >
          <option value="">اختر المادة</option>
          <option value="1">رياضيات</option>
          <option value="2">علوم</option>
          <option value="3">لغة عربية</option>
          <option value="4">لغة إنجليزية</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="level" className="text-sm font-medium">
          المستوى *
        </label>
        <select
          id="level"
          name="level_id"
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          value={formData.level_id ? formData.level_id.toString() : ""}
          onChange={(e) => {
            setFormData((prev) => ({
              ...prev,
              level_id: parseInt(e.target.value) || 0,
            }));
          }}
          required
        >
          <option value="">اختر المستوى</option>
          {levels.map((level) => (
            <option key={level.id} value={level.id}>
              {level.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium">
          النوع *
        </label>
        <select
          id="type"
          name="type"
          className="w-full rounded-md text-[#000000] border border-input bg-background px-3 py-2"
          value={formData.type}
          onChange={(e) => {
            setFormData((prev) => ({
              ...prev,
              type: e.target.value as "paid" | "free",
            }));
          }}
          required
        >
          <option value="free">مجاني</option>
          <option value="paid">مدفوع</option>
        </select>
      </div>

      {formData.type === "paid" && (
        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium">
            السعر *
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="أدخل السعر"
            value={formData.price}
            onChange={handleInputChange}
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="position" className="text-sm font-medium">
          الموقع
        </label>
        <select
          id="position"
          name="position"
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          value={formData.position || ""}
          onChange={(e) => {
            setFormData((prev) => ({
              ...prev,
              position: e.target.value as "online" | "offline",
            }));
          }}
        >
          <option value="">اختر الموقع</option>
          <option value="online">أونلاين</option>
          <option value="offline">أوفلاين</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">
          الحالة
        </label>
        <select
          id="status"
          name="status"
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          value={formData.status || ""}
          onChange={(e) => {
            setFormData((prev) => ({
              ...prev,
              status: e.target.value,
            }));
          }}
        >
          <option value="">اختر الحالة</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
          <option value="draft">مسودة</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="meta_description" className="text-sm font-medium">
          وصف الميتا
        </label>
        <Textarea
          id="meta_description"
          name="meta_description"
          placeholder="أدخل وصف الميتا"
          value={formData.meta_description}
          onChange={handleInputChange}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="meta_keywords" className="text-sm font-medium">
          كلمات الميتا
        </label>
        <Textarea
          id="meta_keywords"
          name="meta_keywords"
          placeholder="أدخل كلمات الميتا"
          value={formData.meta_keywords}
          onChange={handleInputChange}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          الوصف
        </label>
        <Textarea
          id="description"
          name="description"
          placeholder="أدخل وصف الكورس"
          value={formData.description}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );

  const updateCourse = async (id: number) => {
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();

      // Add all form fields
      formDataToSend.append("teacher_id", formData.teacher_id.toString());
      formDataToSend.append("subject_id", formData.subject_id.toString());
      formDataToSend.append("level_id", formData.level_id.toString());
      formDataToSend.append("title", formData.title);
      formDataToSend.append("slug", generateSlug(formData.title));
      formDataToSend.append("description", formData.description);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("position", formData.position);
      formDataToSend.append("meta_description", formData.meta_description);
      formDataToSend.append("meta_keywords", formData.meta_keywords);
      formDataToSend.append("status", formData.status);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("_method", "PUT");

      await postData(`/courses/${id}`, formDataToSend, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      toast.success("تم تحديث الكورس بنجاح");
      setEditCourse(false);
      setEditingCourse(null);
      setFormData({
        teacher_id: 0,
        subject_id: 0,
        level_id: 0,
        title: "",
        slug: "",
        description: "",
        type: "free",
        position: "online",
        meta_description: "",
        meta_keywords: "",
        status: "active",
        price: "0",
      });
      await fetchData();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update course";
      setEditError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Header with Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في الكورسات..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="paid">مدفوع</SelectItem>
              <SelectItem value="free">مجاني</SelectItem>
            </SelectContent>
          </Select>

          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="الموقع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المواقع</SelectItem>
              <SelectItem value="online">أونلاين</SelectItem>
              <SelectItem value="offline">أوفلاين</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            تحديث
          </Button>

          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            تصدير CSV
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <EyeOff className="h-4 w-4 mr-2" />
                الأعمدة
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>إظهار الأعمدة</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={addCourse} onOpenChange={setAddCourse}>
            <DialogTrigger asChild>
              <Button onClick={() => setAddCourse(true)}>
                <Plus className="h-4 w-4 mr-2" />
                إضافة كورس
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-w-2xl max-h-[90vh] overflow-y-auto"
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle>إضافة كورس جديد</DialogTitle>
                <DialogDescription>
                  املأ النموذج التالي لإضافة كورس جديد إلى النظام
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onSubmit}>
                <div className="space-y-6">
                  {formGrid}
                  {editError && (
                    <Alert variant="soft">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription
                        dangerouslySetInnerHTML={{ __html: editError }}
                      />
                    </Alert>
                  )}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          جاري الإضافة...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة الكورس
                        </>
                      )}
                    </Button>
                    <DialogClose asChild>
                      <Button variant="outline" disabled={isLoading}>
                        إلغاء
                      </Button>
                    </DialogClose>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">إجمالي الكورسات</p>
              <p className="text-2xl font-bold text-blue-900">{data.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">الكورسات النشطة</p>
              <p className="text-2xl font-bold text-green-900">
                {data.filter((course) => course.status === "active").length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">المسودات</p>
              <p className="text-2xl font-bold text-yellow-900">
                {data.filter((course) => course.status === "draft").length}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">الكورسات المدفوعة</p>
              <p className="text-2xl font-bold text-purple-900">
                {data.filter((course) => course.type === "paid").length}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Download className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          عرض {filteredData.length} من {data.length} كورس
          {(typeFilter !== "all" ||
            positionFilter !== "all" ||
            globalFilter) && <span className="text-blue-600"> (مفلتر)</span>}
        </div>
        <div className="flex items-center gap-2">
          <span>الصفحة</span>
          <span className="font-medium">
            {paginationMeta?.current_page || 1} من{" "}
            {paginationMeta?.last_page || 1}
          </span>
        </div>
      </div>

      {/* Edit Course Dialog */}
      <Dialog open={editCourse} onOpenChange={setEditCourse}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>تعديل الكورس</DialogTitle>
            <DialogDescription>
              قم بتعديل معلومات الكورس أدناه
            </DialogDescription>
          </DialogHeader>
          {editingCourse && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateCourse(editingCourse.id);
              }}
            >
              <div className="space-y-6">
                {formGrid}

                <div className="space-y-2">
                  <label
                    htmlFor="edit-description"
                    className="text-sm font-medium"
                  >
                    الوصف
                  </label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    placeholder="أدخل وصف الكورس"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                {editError && (
                  <Alert variant="soft">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription
                      dangerouslySetInnerHTML={{ __html: editError }}
                    />
                  </Alert>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        جاري التحديث...
                      </>
                    ) : (
                      "تحديث الكورس"
                    )}
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline" disabled={isLoading}>
                      إلغاء
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف الكورس "{courseToDelete?.title}"؟ هذا الإجراء
              لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleDeleteConfirm}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "حذف الكورس"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Data Table */}
      <div className="rounded-md border bg-white dark:bg-gray-800 shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-semibold text-gray-900 dark:text-gray-100"
                  >
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
                <TableRow
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
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
                  colSpan={columns.length}
                  className="h-24 text-center text-gray-500"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      جاري التحميل...
                    </div>
                  ) : (
                    "لا توجد نتائج."
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (
                paginationMeta?.current_page &&
                paginationMeta.current_page > 1
              ) {
                fetchData(paginationMeta.current_page - 1);
              }
            }}
            disabled={!paginationLinks?.prev}
          >
            السابق
          </Button>
          <div className="flex items-center gap-1">
            {paginationMeta?.links.map((link, index) => {
              if (
                link.label === "&laquo; Previous" ||
                link.label === "Next &raquo;"
              ) {
                return null;
              }
              return (
                <Button
                  key={index}
                  variant={link.active ? "soft" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (link.url) {
                      const page = new URL(link.url).searchParams.get("page");
                      if (page) {
                        fetchData(parseInt(page));
                      }
                    }
                  }}
                  disabled={!link.url}
                >
                  {link.label}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (
                paginationMeta?.current_page &&
                paginationMeta.current_page < paginationMeta.last_page
              ) {
                fetchData(paginationMeta.current_page + 1);
              }
            }}
            disabled={!paginationLinks?.next}
          >
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CoursesTable;
