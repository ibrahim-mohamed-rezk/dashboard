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
  EyeOff,
  ArrowUpDown,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Building2,
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Upload,
  Image as ImageIcon,
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
import { useEffect, useState, useMemo } from "react";
import { deleteData, getData, postData } from "@/lib/axios/server";
import axios, { AxiosHeaders } from "axios";
import toast from "react-hot-toast";
import { CoursesData, Teacher, User } from "@/lib/type";
import Link from "next/link";
import Image from "next/image";

interface Bank {
  id: number;
  name: string;
  price: number | null;
  banktable_id: number;
  banktable_type: "course" | "teacher";
  position: "online" | "offline";
  created_at: string;
  updated_at: string;
  level_id: string;
  image?: string | null;
}

interface FormData {
  name: string;
  price: string;
  banktable_id: number;
  banktable_type: "course" | "teacher";
  position: "online" | "offline";
  level_id: string;
  image: File | null;
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
  data: Bank[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

function BanksTable() {
  const [data, setData] = useState<Bank[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  );
  const [paginationLinks, setPaginationLinks] =
    useState<PaginationLinks | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [token, setToken] = useState<string | null>("sample_token");
  const [editBank, setEditBank] = useState<boolean>(false);
  const [addBank, setAddBank] = useState<boolean>(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [bankToDelete, setBankToDelete] = useState<Bank | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [courses, setCourses] = useState<CoursesData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    price: "",
    banktable_id: 1,
    banktable_type: "course",
    position: "online",
    level_id: levels[0]?.id || 1,
    image: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  // Enhanced filters
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [bankTypeFilter, setBankTypeFilter] = useState("all"); // course, teacher, all
  const [priceFilter, setPriceFilter] = useState("all"); // all, free, paid
  const [positionFilter, setPositionFilter] = useState("all"); // all, online, offline
  const [levelFilter, setLevelFilter] = useState("all");
  const [teacherIdFilter, setTeacherIdFilter] = useState("all");

  // get token from next api
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/auth/getToken");
        setToken(response.data.token);
        setUser(JSON.parse(response.data.user));
      } catch (error) {
        throw error;
      }
    };

    fetchData();
  }, []);

  // get data from api with pagination and filters
  const fetchData = async (page: number = 1) => {
    try {
      const params: any = {
        page,
      };
      if (subjectFilter !== "all") params.subject_id = subjectFilter;
      if (bankTypeFilter !== "all") params.banktable_type = bankTypeFilter;
      if (priceFilter !== "all") params.price = priceFilter;
      if (positionFilter !== "all") params.position = positionFilter;
      if (globalFilter) params.search = globalFilter;
      if (teacherIdFilter !== "all") params.teacher_id = teacherIdFilter;
      if (levelFilter !== "all") params.level_id = levelFilter;
      const response = await getData(`banks`, params, {
        Authorization: `Bearer ${token}`,
      });
      setData(response.data || []);
      setPaginationMeta(response.meta || null);
      setPaginationLinks(response.links || null);
      setCurrentPage(response.meta?.current_page || 1);
    } catch (error) {
      console.log(error);
    }
  };

  // useEffect to fetch data
  useEffect(() => {
    if (token) {
      fetchData(currentPage);
    }
    // eslint-disable-next-line
  }, [
    token,
    currentPage,
    subjectFilter,
    bankTypeFilter,
    priceFilter,
    positionFilter,
    globalFilter,
    teacherIdFilter,
    levelFilter,
  ]);

  // function to fetch courses
  const fetchCourses = async () => {
    if (!token) return;
    try {
      const response = await getData(
        `/courses`,
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        })
      );
      setCourses(response.courses);
    } catch (error) {
      console.log(error);
    }
  };

  // function to fetch levels
  const fetchLevels = async () => {
    if (!token) return;
    try {
      const response = await getData(
        `/levels`,
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        })
      );
      setLevels(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // function to fetch subjects
  const fetchSubjects = async () => {
    if (!token) return;
    try {
      const response = await getData(
        `/subjects`,
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        })
      );
      setSubjects(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // function to fetch teachers
  const fetchTeachers = async () => {
    if (!token) return;
    try {
      const response = await getData(
        `teachers`,
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setTeachers(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Load courses and teachers on component mount
  useEffect(() => {
    if (token) {
      fetchCourses();
      fetchTeachers();
      fetchLevels();
      fetchSubjects();
    }
  }, [token]);

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

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle banktable_type change and reset banktable_id
  const handleBanktableTypeChange = (value: "course" | "teacher") => {
    setFormData((prev) => ({
      ...prev,
      banktable_type: value,
      banktable_id: 1, // Reset to default
    }));
  };

  // submit course
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("price", formData.price ? formData.price : "");
      formDataToSend.append("banktable_id", formData.banktable_id.toString());
      formDataToSend.append("level_id", formData.level_id);
      formDataToSend.append("position", formData.position);
      formDataToSend.append("banktable_type", "course");

      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      await postData("banks", formDataToSend, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });
      setAddBank(false);
      setFormData({
        name: "",
        price: "",
        banktable_id: 1,
        banktable_type: "course",
        position: "online",
        level_id: "1",
        image: null,
      });
      setImagePreview(null);
      await fetchData(currentPage);
      toast.success("تم إضافة البنك بنجاح");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.msg || "An error occurred");
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // update course
  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({
      name: bank.name,
      price: bank.price?.toString() || "",
      banktable_id: bank.banktable_id,
      banktable_type: bank.banktable_type,
      position: bank.position || "online",
      level_id: bank.level_id || "1",
      image: null,
    });
    setImagePreview(bank.image || null);
    setEditBank(true);
  };

  const handleDeleteClick = (bank: Bank) => {
    setBankToDelete(bank);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bankToDelete) return;
    setIsLoading(true);
    try {
      await deleteData(`banks/${bankToDelete.id}`, {
        Authorization: `Bearer ${token}`,
      });
      setDeleteDialogOpen(false);
      setBankToDelete(null);
      await fetchData(currentPage);
      toast.success("تم حذف البنك بنجاح");
    } catch (error) {
      toast.error("فشل في حذف البنك");
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "course":
        return (
          <Badge className="bg-blue-100 gap-[5px] text-blue-800">
            <GraduationCap className="w-3 h-3 mr-1" />
            كورس
          </Badge>
        );
      case "teacher":
        return (
          <Badge className="bg-green-100 gap-[5px] text-green-800">
            <Users className="w-3 h-3 mr-1" />
            معلم
          </Badge>
        );
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const exportToCSV = () => {
    const headers = [
      "الاسم",
      "السعر",
      "النوع",
      "معرف الجدول",
      "تاريخ الإنشاء",
      "الموقع",
    ];
    const csvData = (data || []).map((bank) => [
      bank.name,
      bank.price?.toString() || "مجاني",
      bank.banktable_type === "course" ? "كورس" : "معلم",
      bank.banktable_id.toString(),
      bank.created_at,
      bank.position,
    ]);
    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "banks.csv";
    link.click();
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    fetchData(page);
  };

  const handlePreviousPage = () => {
    if (paginationMeta && currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (paginationMeta && currentPage < paginationMeta.last_page) {
      handlePageChange(currentPage + 1);
    }
  };

  const handleFirstPage = () => {
    handlePageChange(1);
  };

  const handleLastPage = () => {
    if (paginationMeta) {
      handlePageChange(paginationMeta.last_page);
    }
  };

  const columns: ColumnDef<Bank>[] = [
    {
      accessorKey: "image",
      header: "الصورة",
      cell: ({ row }) => {
        const image = row.getValue("image") as string | null;
        return (
          <div className="flex items-center justify-center">
            {image ? (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                <Image
                  src={image}
                  alt={row.getValue("name")}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder-bank.png"; // Fallback image
                  }}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          اسم البنك
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-[5px] space-x-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <Link href={`/ar/banks/${row.original.id}`} className="font-medium">
            {row.getValue("name")}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "السعر",
      cell: ({ row }) => {
        const price = row.getValue("price") as number | null;
        return price ? (
          <span className="font-medium text-green-600">{price} ج.م</span>
        ) : (
          <Badge variant="outline">مجاني</Badge>
        );
      },
    },
    {
      accessorKey: "level_id",
      header: "المستوي",
      cell: ({ row }) => {
        const level = levels.find((l) => l.id === row.getValue("level_id"));
        return level ? (
          <span className="font-medium text-green-600">{level.name}</span>
        ) : (
          <Badge variant="outline">غير محدد</Badge>
        );
      },
    },
    {
      accessorKey: "banktable_type",
      header: "النوع",
      cell: ({ row }) => getTypeBadge(row.getValue("banktable_type")),
    },
    {
      accessorKey: "banktable_id",
      header: "المرتبط بـ",
      cell: ({ row }) => {
        const bankType = row.getValue("banktable_type") as string;
        const bankId = row.getValue("banktable_id") as number;

        if (bankType === "course") {
          const course = courses.find((c) => c.id === bankId);
          return (
            <div className="flex items-center !justify-center gap-[5px] space-x-2">
              <GraduationCap className="w-4 h-4 text-blue-500" />
              <span className="font-medium ">
                {course?.title || `كورس #${bankId}`}
              </span>
            </div>
          );
        } else {
          const teacher = teachers.find((t) => t.id === bankId);
          return (
            <div className="flex items-center !justify-center gap-[5px] space-x-2">
              <Users className="w-4 h-4 text-green-500" />
              <span className="font-medium">
                {teacher?.user?.full_name || `معلم #${bankId}`}
              </span>
            </div>
          );
        }
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
      accessorKey: "updated_at",
      header: "تاريخ التحديث",
      cell: ({ row }) => {
        const date = new Date(row.getValue("updated_at"));
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
            <DropdownMenuContent align="center" className="w-[160px]">
              <Link href={`/ar/banks/${item.id}`}>
                <DropdownMenuItem className="!justify-center">
                  عرض
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="!justify-center"
                onClick={() => handleEdit(item)}
              >
                تعديل
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 !justify-center hover:bg-red-50"
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
    data: data, // Use data directly
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

  const updateBank = async (id: number) => {
    setIsLoading(true);
    setEditError(null);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("price", formData.price ? formData.price : "");
      formDataToSend.append("banktable_id", formData.banktable_id.toString());
      formDataToSend.append("banktable_type", "course");
      formDataToSend.append("position", formData.position);
      formDataToSend.append("level_id", formData.level_id);
      formDataToSend.append("_method", "PUT");

      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      await postData(`banks/${id}`, formDataToSend, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });
      setEditBank(false);
      setEditingBank(null);
      setFormData({
        name: "",
        price: "",
        banktable_id: 1,
        banktable_type: "course",
        position: "online",
        level_id: "1",
        image: null,
      });
      setImagePreview(null);
      await fetchData(currentPage);
      toast.success("تم تعديل البنك بنجاح");
    } catch (error: any) {
      setEditError("Failed to update bank");
      toast.error("فشل في تعديل البنك");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Header with Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-2 max-w-4xl">
          <div className="relative flex-1 order-1 sm:order-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="بحث..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Subject Filter */}
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="المادة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المواد</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Price Filter */}
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="السعر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأسعار</SelectItem>
              <SelectItem value="free">مجاني</SelectItem>
              <SelectItem value="paid">مدفوع</SelectItem>
            </SelectContent>
          </Select>

          {/* Position Filter */}
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="الموقع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المواقع</SelectItem>
              <SelectItem value="online">أونلاين</SelectItem>
              <SelectItem value="offline">أوفلاين</SelectItem>
            </SelectContent>
          </Select>

          {/* Level Filter */}
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="المستوى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المستويات</SelectItem>
              {levels.map((level) => (
                <SelectItem key={level.id} value={level.id.toString()}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Teacher Filter */}
          <Select value={teacherIdFilter} onValueChange={setTeacherIdFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="المعلم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المعلمين</SelectItem>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                  {teacher.user?.full_name || `معلم #${teacher.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(currentPage)}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            تحديث
          </Button>

          <Button
            className="flex items-center gap-2"
            variant="outline"
            size="sm"
            onClick={exportToCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير CSV
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="flex items-center gap-2"
                variant="outline"
                size="sm"
              >
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

          <Dialog open={addBank} onOpenChange={setAddBank}>
            {user?.role === "admin" && (
              <DialogTrigger asChild>
                <Button
                  className="flex items-center gap-2"
                  onClick={() => {
                    setAddBank(true);
                    setFormData({
                      name: "",
                      price: "",
                      banktable_id: 1,
                      banktable_type: "course",
                      position: "online",
                      level_id: "1",
                      image: null,
                    });
                    setImagePreview(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة بنك
                </Button>
              </DialogTrigger>
            )}
            <DialogContent
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700"
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle className="dark:text-gray-100">
                  إضافة بنك جديد
                </DialogTitle>
                <DialogDescription className="dark:text-gray-400">
                  املأ النموذج التالي لإضافة بنك جديد إلى النظام
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onSubmit}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        اسم البنك *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="أدخل اسم البنك"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="price" className="text-sm font-medium">
                        السعر
                      </label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="أدخل السعر (اتركه فارغاً للمجاني)"
                        value={formData.price}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="image" className="text-sm font-medium">
                        صورة البنك
                      </label>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <Input
                            id="image"
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="image"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            اختر صورة
                          </label>
                          {formData.image && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formData.image.name}
                            </span>
                          )}
                        </div>
                        {imagePreview && (
                          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <Image
                              src={imagePreview}
                              alt="معاينة الصورة"
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  image: null,
                                }));
                                setImagePreview(null);
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="banktable_type"
                        className="text-sm font-medium"
                      >
                        المستوى *
                      </label>
                      <select
                        id="banktable_type"
                        name="banktable_type"
                        className="w-full rounded-md text-[#000000] dark:!text-white border border-input bg-background dark:bg-gray-800 dark:border-gray-700 px-3 py-2"
                        value={formData.level_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            level_id: e.target.value,
                          }))
                        }
                        required
                      >
                        {levels.map((level) => (
                          <option
                            key={level.id}
                            value={level.id}
                            className="dark:bg-gray-800 dark:!text-white"
                          >
                            {level.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="banktable_id"
                        className="text-sm font-medium"
                      >
                        {formData.banktable_type === "course"
                          ? "الكورس"
                          : "المعلم"}{" "}
                        *
                      </label>
                      <select
                        id="banktable_id"
                        name="banktable_id"
                        className="w-full rounded-md text-[#000000] dark:!text-white border border-input bg-background dark:bg-gray-800 dark:border-gray-700 px-3 py-2"
                        value={formData.banktable_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            banktable_id: parseInt(e.target.value) || 1,
                          }))
                        }
                        required
                      >
                        <option
                          value=""
                          disabled
                          className="dark:bg-gray-800 dark:!text-white"
                        >
                          اختر{" "}
                          {formData.banktable_type === "course"
                            ? "الكورس"
                            : "المعلم"}
                        </option>
                        {formData.banktable_type === "course"
                          ? courses.map((course) => (
                              <option
                                key={course.id}
                                value={course.id}
                                className="dark:bg-gray-800 dark:!text-white"
                              >
                                {course.title}
                              </option>
                            ))
                          : teachers.map((teacher) => (
                              <option
                                key={teacher.id}
                                value={teacher.id}
                                className="dark:bg-gray-800 dark:!text-white"
                              >
                                {teacher.user?.full_name}
                              </option>
                            ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="position" className="text-sm font-medium">
                        الموقع
                      </label>
                      <select
                        id="position"
                        name="position"
                        className="w-full rounded-md text-[#000000] dark:!text-white border border-input bg-background dark:bg-gray-800 dark:border-gray-700 px-3 py-2"
                        value={formData.position}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            position: e.target.value as "online" | "offline",
                          }))
                        }
                      >
                        <option
                          value="online"
                          className="dark:bg-gray-800 dark:!text-white"
                        >
                          أونلاين
                        </option>
                        <option
                          value="offline"
                          className="dark:bg-gray-800 dark:!text-white"
                        >
                          أوفلاين
                        </option>
                      </select>
                    </div>
                  </div>

                  {editError && (
                    <Alert variant="soft">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{editError}</AlertDescription>
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
                          إضافة البنك
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
        <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg border dark:border-blue-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                إجمالي البنوك
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {paginationMeta?.total || data.length}
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-950/50 p-4 rounded-lg border dark:border-green-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">
                بنوك الكورسات
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                {data.filter((bank) => bank.banktable_type === "course").length}
              </p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950/50 p-4 rounded-lg border dark:border-yellow-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                البنوك المدفوعة
              </p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">
                {data.filter((bank) => bank.price && bank.price > 0).length}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
              <CreditCard className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 dark:from-yellow-950/60 dark:via-yellow-900/50 dark:to-yellow-950/80 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900/50 shadow-sm transition-all hover:scale-[1.025] hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                البنوك المجانية
              </p>
              <p className="text-2xl font-extrabold text-yellow-900 dark:text-yellow-100 mt-1">
                {
                  data.filter(
                    (bank) =>
                      bank.price === null ||
                      bank.price === 0 ||
                      bank.price === undefined
                  ).length
                }
              </p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/60 rounded-lg flex items-center justify-center shadow-inner">
              <CreditCard className="h-7 w-7 text-yellow-600 dark:text-yellow-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>
          عرض {paginationMeta?.from || 1} إلى{" "}
          {paginationMeta?.to || data.length} من{" "}
          {paginationMeta?.total || data.length} بنك
          {(subjectFilter !== "all" ||
            bankTypeFilter !== "all" ||
            priceFilter !== "all" ||
            positionFilter !== "all" ||
            levelFilter !== "all" ||
            teacherIdFilter !== "all" ||
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

      {/* Edit Bank Dialog */}
      <Dialog open={editBank} onOpenChange={setEditBank}>
        <DialogContent
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">
              تعديل البنك
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              قم بتعديل معلومات البنك أدناه
            </DialogDescription>
          </DialogHeader>
          {editingBank && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateBank(editingBank.id);
              }}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="edit-name" className="text-sm font-medium">
                      اسم البنك *
                    </label>
                    <Input
                      id="edit-name"
                      name="name"
                      placeholder="أدخل اسم البنك"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="edit-price" className="text-sm font-medium">
                      السعر
                    </label>
                    <Input
                      id="edit-price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="أدخل السعر (اتركه فارغاً للمجاني)"
                      value={formData.price}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="edit-image" className="text-sm font-medium">
                      صورة البنك
                    </label>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <Input
                          id="edit-image"
                          name="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="edit-image"
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          تغيير الصورة
                        </label>
                        {formData.image && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formData.image.name}
                          </span>
                        )}
                      </div>
                      {imagePreview && (
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <Image
                            src={imagePreview}
                            alt="معاينة الصورة"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, image: null }));
                              setImagePreview(null);
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="edit-price" className="text-sm font-medium">
                      المستوي
                    </label>
                    <select
                      id="edit-banktable_type"
                      name="banktable_type"
                      className="w-full rounded-md text-[#000000] dark:!text-white border border-input bg-background dark:bg-gray-800 dark:border-gray-700 px-3 py-2"
                      value={formData.level_id}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          level_id: e.target.value,
                        }))
                      }
                      required
                    >
                      {levels.map((level) => (
                        <option
                          key={level.id}
                          value={level.id}
                          className="dark:bg-gray-800 dark:!text-white"
                        >
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="banktable_id"
                      className="text-sm font-medium"
                    >
                      {formData.banktable_type === "course"
                        ? "الكورس"
                        : "المعلم"}{" "}
                      *
                    </label>
                    <select
                      id="banktable_id"
                      name="banktable_id"
                      className="w-full rounded-md text-[#000000] dark:!text-white border border-input bg-background dark:bg-gray-800 dark:border-gray-700 px-3 py-2"
                      value={formData.banktable_id}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          banktable_id: parseInt(e.target.value) || 1,
                        }))
                      }
                      required
                    >
                      <option
                        value=""
                        disabled
                        className="dark:bg-gray-800 dark:!text-white"
                      >
                        اختر{" "}
                        {formData.banktable_type === "course"
                          ? "الكورس"
                          : "المعلم"}
                      </option>
                      {formData.banktable_type === "course"
                        ? courses.map((course) => (
                            <option
                              key={course.id}
                              value={course.id}
                              className="dark:bg-gray-800 dark:!text-white"
                            >
                              {course.title}
                            </option>
                          ))
                        : teachers.map((teacher) => (
                            <option
                              key={teacher.id}
                              value={teacher.id}
                              className="dark:bg-gray-800 dark:!text-white"
                            >
                              {teacher.user?.full_name}
                            </option>
                          ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="edit-position"
                      className="text-sm font-medium"
                    >
                      الموقع
                    </label>
                    <select
                      id="edit-position"
                      name="position"
                      className="w-full rounded-md text-[#000000] dark:!text-white border border-input bg-background dark:bg-gray-800 dark:border-gray-700 px-3 py-2"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          position: e.target.value as "online" | "offline",
                        }))
                      }
                    >
                      <option
                        value="online"
                        className="dark:bg-gray-800 dark:!text-white"
                      >
                        أونلاين
                      </option>
                      <option
                        value="offline"
                        className="dark:bg-gray-800 dark:!text-white"
                      >
                        أوفلاين
                      </option>
                    </select>
                  </div>
                </div>

                {editError && (
                  <Alert variant="soft">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{editError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        جاري التعديل...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        حفظ التعديلات
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
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد أنك تريد حذف هذا البنك؟ لا يمكن التراجع عن هذا
              الإجراء.
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
                <>
                  <X className="w-4 h-4 mr-2" />
                  حذف
                </>
              )}
            </Button>
            <DialogClose asChild>
              <Button variant="outline" disabled={isLoading}>
                إلغاء
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Banks Table */}
      <div className="rounded-md border overflow-x-auto bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="!text-center">
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center">
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
                  className="h-24 text-center"
                >
                  لا توجد بيانات لعرضها
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginationMeta && paginationMeta.last_page > 1 && (
        <div className="flex items-center mx-auto justify-center gap-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFirstPage}
              disabled={currentPage === 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from(
                { length: Math.min(5, paginationMeta.last_page) },
                (_, i) => {
                  let pageNumber;
                  if (paginationMeta.last_page <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= paginationMeta.last_page - 2) {
                    pageNumber = paginationMeta.last_page - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNumber}
                      variant={"outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  );
                }
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === paginationMeta.last_page}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLastPage}
              disabled={currentPage === paginationMeta.last_page}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BanksTable;
