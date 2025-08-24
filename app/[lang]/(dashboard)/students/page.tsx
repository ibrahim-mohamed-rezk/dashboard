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
import { DateRange } from "react-day-picker";
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
  Users,
  GraduationCap,
  Phone,
  School,
  Edit,
  X,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getData, postData } from "@/lib/axios/server";
import axios, { AxiosHeaders } from "axios";
import { StudentTypes, SubscriptionCodeTypes, Teacher, User } from "@/lib/type";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DatePickerWithRange from "@/components/date-picker-with-range";
// === NEW ===
import { Toaster, toast } from "react-hot-toast";

// Helper to check if a string is a valid image URL
function isImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  // Accept http(s) and starts with / (for local images)
  return (
    /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(url) ||
    /^https?:\/\/.+\/.+\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?.*)?$/i.test(
      url
    ) ||
    /^\/.+\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(url)
  );
}

// Statistics Card Component
const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "blue",
}: {
  title: string;
  value: string | number;
  icon: any;
  color?: string;
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green:
      "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    orange:
      "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div
          className={`p-3 rounded-full ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// Student Update Modal Component
const StudentUpdateModal = ({
  isOpen,
  onClose,
  student,
  onUpdate,
  token,
  governorates,
  areas,
  levels,
}: {
  isOpen: boolean;
  onClose: () => void;
  student: StudentTypes | null;
  onUpdate: () => void;
  token: string;
  governorates: any[];
  areas: any[];
  levels: any[];
}) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    avatar: "",
    password: "",
    level_id: "",
    governorate_id: "",
    area_id: "",
    father_phone: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.user?.full_name || "",
        email: student.user?.email || "",
        phone: student.user?.phone || "",
        avatar: student.user?.avatar || "",
        password: "",
        level_id: student.level_id.toString() || "",
        governorate_id: student.governorate_id?.toString() || "",
        area_id: student.area_id?.toString() || "",
        father_phone: student.father_phone || "",
      });
      setAvatarFile(null);
      // If user image is a valid image URL, show it, else null
      setAvatarPreview(
        isImageUrl(student.user?.avatar) ? student.user?.avatar ?? null : null
      );
    }
  }, [student]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setLoading(true);
    setErrors({});
    try {
      // Prepare FormData for multipart/form-data
      const form = new FormData();
      // Always send these fields
      form.append("full_name", formData.full_name);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("level_id", formData.level_id);
      form.append("governorate_id", formData.governorate_id);
      form.append("area_id", formData.area_id);
      form.append("father_phone", formData.father_phone);
      // Only send password if not empty
      if (formData.password && formData.password.trim() !== "") {
        form.append("password", formData.password);
      }
      // Handle avatar: if a new file is selected, send it; if removed, send empty string; else, don't send
      if (avatarFile) {
        form.append("avatar", avatarFile);
      } else if (formData.avatar === "" && !avatarPreview) {
        // If avatar is removed, send empty string to remove on backend
        form.append("avatar", "");
      }
      // Laravel expects _method: PUT for update
      form.append("_method", "PUT");
      await postData(`students/${student.user?.id}`, form, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });
      onUpdate();
      onClose();
      // === NEW ===
      toast.success("تم تحديث بيانات الطالب بنجاح");
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        console.error("Failed to update student:", error);
        // === NEW ===
        toast.error("فشل في تحديث الطالب");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (field: string, value: string | File | null) => {
    if (field === "avatar") {
      if (value instanceof File && value) {
        setAvatarFile(value);
        setFormData((prev) => ({ ...prev, avatar: "" }));
        setAvatarPreview(URL.createObjectURL(value));
      } else if (value === null) {
        setAvatarFile(null);
        setFormData((prev) => ({ ...prev, avatar: "" }));
        setAvatarPreview(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: null }));
    }
  };
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setFormData((prev) => ({ ...prev, avatar: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            تحديث بيانات الطالب
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">الاسم الكامل</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              placeholder="أدخل الاسم الكامل"
              className={errors.full_name ? "border-red-500" : ""}
            />
            {errors.full_name && (
              <p className="text-sm text-red-500">{errors.full_name[0]}</p>
            )}
          </div>
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="أدخل البريد الإلكتروني"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email[0]}</p>
            )}
          </div>
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="أدخل رقم الهاتف"
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone[0]}</p>
            )}
          </div>
          {/* Father Phone */}
          <div className="space-y-2">
            <Label htmlFor="father_phone">هاتف الأب</Label>
            <Input
              id="father_phone"
              value={formData.father_phone}
              onChange={(e) =>
                handleInputChange("father_phone", e.target.value)
              }
              placeholder="أدخل هاتف الأب"
              className={errors.father_phone ? "border-red-500" : ""}
            />
            {errors.father_phone && (
              <p className="text-sm text-red-500">{errors.father_phone[0]}</p>
            )}
          </div>
          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور (اختياري)</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="أدخل كلمة مرور جديدة"
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password[0]}</p>
            )}
          </div>
          {/* Avatar */}
          <div className="space-y-2">
            <Label htmlFor="avatar">الصورة الشخصية</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  isImageUrl(avatarPreview) ? (
                    <img
                      src={avatarPreview}
                      alt="صورة الطالب"
                      className="w-16 h-16 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border">
                      <span>لا صورة</span>
                    </div>
                  )
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border">
                    <span>لا صورة</span>
                  </div>
                )}
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    title="إزالة الصورة"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  handleInputChange("avatar", file || null);
                }}
                className={errors.avatar ? "border-red-500" : ""}
              />
            </div>
            {errors.avatar && (
              <p className="text-sm text-red-500">{errors.avatar[0]}</p>
            )}
          </div>
          {/* Governorate */}
          <div className="space-y-2">
            <Label htmlFor="governorate_id">المحافظة</Label>
            <select
              id="governorate_id"
              value={formData.governorate_id}
              onChange={(e) =>
                handleInputChange("governorate_id", e.target.value)
              }
              className={`w-full px-3 flex justify-between items-center read-only:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition duration-300 border-default-300 text-default-500 focus:outline-none focus:border-default-500/50 disabled:bg-default-200 placeholder:text-accent-foreground/50 border rounded-lg h-10 text-sm ${
                errors.governorate_id ? "border-red-500" : ""
              }`}
            >
              <option value="">اختر المحافظة</option>
              {governorates?.map((gov: any) => (
                <option key={gov.id} value={gov.id.toString()}>
                  {gov.name}
                </option>
              ))}
            </select>
            {errors.governorate_id && (
              <p className="text-sm text-red-500">{errors.governorate_id[0]}</p>
            )}
          </div>
          {/* Area */}
          <div className="space-y-2">
            <Label htmlFor="area_id">المنطقة</Label>
            <select
              id="area_id"
              value={formData.area_id}
              onChange={(e) => handleInputChange("area_id", e.target.value)}
              className={`w-full px-3 flex justify-between items-center read-only:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition duration-300 border-default-300 text-default-500 focus:outline-none focus:border-default-500/50 disabled:bg-default-200 placeholder:text-accent-foreground/50 border rounded-lg h-10 text-sm ${
                errors.area_id ? "border-red-500" : ""
              }`}
            >
              <option value="">اختر المنطقة</option>
              {areas?.map((area: any) => (
                <option key={area.id} value={area.id.toString()}>
                  {area.name}
                </option>
              ))}
            </select>
            {errors.area_id && (
              <p className="text-sm text-red-500">{errors.area_id[0]}</p>
            )}
          </div>
          {/* Level */}
          <div className="space-y-2">
            <Label htmlFor="level_id">المرحلة</Label>
            <select
              id="level_id"
              value={formData.level_id}
              onChange={(e) => handleInputChange("level_id", e.target.value)}
              className={`w-full px-3 flex justify-between items-center read-only:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition duration-300 border-default-300 text-default-500 focus:outline-none focus:border-default-500/50 disabled:bg-default-200 placeholder:text-accent-foreground/50 border rounded-lg h-10 text-sm ${
                errors.level_id ? "border-red-500" : ""
              }`}
            >
              <option value="">اختر المرحلة</option>
              {levels?.map((level: any) => (
                <option key={level.id} value={level.id.toString()}>
                  {level.name}
                </option>
              ))}
            </select>
            {errors.level_id && (
              <p className="text-sm text-red-500">{errors.level_id[0]}</p>
            )}
          </div>
          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "جاري التحديث..." : "تحديث"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// === NEW === Delete Confirmation Modal with Toast
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isMultiple = false,
  count = 1,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isMultiple?: boolean;
  count?: number;
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      } transition-opacity`}
    >
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 z-10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          تأكيد الحذف
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          {isMultiple
            ? `هل أنت متأكد أنك تريد حذف ${count} طالب(طلاب)؟ لا يمكن التراجع عن هذا الإجراء.`
            : "هل أنت متأكد أنك تريد حذف هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء."}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="outline" size="sm" onClick={onConfirm}>
            حذف
          </Button>
        </div>
      </div>
    </div>
  );
};

function BasicDataTable() {
  const [data, setData] = useState<StudentTypes[]>([]);
  const [token, setToken] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [area, setArea] = useState<any[]>([]);
  const [level, setLevel] = useState<any[]>([]);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentTypes | null>(
    null
  );
  // const [subjects, setSubjects] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    governorate_id: "",
    area_id: "",
    level_id: "",
    // subject_id: "",
    teacher_id: "",
    gender: "",
    to_date: "",
    from_date: "",
    search: "",
  });
  const [user, setUser] = useState<User | null>(null);
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalSchools: 0,
    studentsWithPhone: 0,
  });
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
    total: 0,
    lastPage: 1,
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  // === NEW === Selection & Delete
  const [selectedToDelete, setSelectedToDelete] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate statistics
  const calculateStatistics = (studentsData: StudentTypes[], paginate: any) => {
    const activeStudents = studentsData.filter(
      (student) => student.status === "active"
    ).length;
    const uniqueSchools = new Set(
      studentsData?.map((student) => student.school_name).filter(Boolean)
    ).size;
    const studentsWithPhone = studentsData.filter(
      (student) => student.user?.phone
    ).length;
    setStatistics({
      totalStudents: paginate.total,
      activeStudents,
      totalSchools: uniqueSchools,
      studentsWithPhone,
    });
  };

  // feach governornment data
  const feachGovernorData = async () => {
    try {
      const response = await getData(
        "governorates",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setGovernorates(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  // feach governornment data
  const feachLevelsData = async () => {
    try {
      const response = await getData(
        "levels",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setLevel(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  // feach governornment data
  const feachAreaData = async () => {
    try {
      const response = await getData(
        "areas",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setArea(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  // const feachSubjectsData = async () => {
  //   try {
  //     const response = await getData(
  //       "subjects",
  //       {},
  //       {
  //         Authorization: `Bearer ${token}`,
  //       }
  //     );
  //     setSubjects(response.data);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  useEffect(() => {
    feachAreaData();
    feachLevelsData();
    feachGovernorData();
    // feachSubjectsData();
  }, [token]);

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
      setTeachers(response.data);
    } catch (error) {
      console.log("Failed to fetch teachers");
    }
  };

  // refetch users
  const refetchUsers = async () => {
    try {
      const response = await getData(
        "students",
        {
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          ...filters,
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );

      const studentsData = response.data.students;
      const paginate = response.data.paginate;

      setData(studentsData);
      setPagination((prev) => ({
        ...prev,
          total: paginate.total,
      lastPage: paginate.last_page,
      }));

      calculateStatistics(studentsData, paginate);
    } catch (error) {
      console.log(error);
    }
  };

  // feach users from api
  useEffect(() => {
    refetchUsers();
  }, [pagination.pageIndex, pagination.pageSize, token, filters]);

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
  }, []);

  const handleUpdateClick = (student: StudentTypes) => {
    setSelectedStudent(student);
    setUpdateModalOpen(true);
  };

  const handleUpdateModalClose = () => {
    setUpdateModalOpen(false);
    setSelectedStudent(null);
  };

  // === NEW === Delete with Toast
  const handleDeleteStudents = async () => {
    if (!selectedToDelete.length) return;
    setIsDeleting(true);
    try {
      await Promise.all(
        selectedToDelete.map((userId) =>
          axios.delete(`/api/students/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      refetchUsers();
      setDeleteModalOpen(false);
      table.resetRowSelection();
      // === NEW ===
      toast.success(
        selectedToDelete.length === 1
          ? "تم حذف الطالب بنجاح"
          : `تم حذف ${selectedToDelete.length} طلاب بنجاح`
      );
    } catch (error) {
      console.error("فشل في حذف الطلاب:", error);
      // === NEW ===
      toast.error("تعذر حذف بعض الطلاب. يرجى المحاولة لاحقًا.");
    } finally {
      setIsDeleting(false);
    }
  };

  // columns of table
  const columns: ColumnDef<StudentTypes>[] = [
    // === NEW === Selection Column
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={() => table.toggleAllPageRowsSelected()}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={() => row.toggleSelected()}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "full_name",
      header: "الاسم الكامل",
      cell: ({ row }) => {
        const user = row.original;
        const avatarUrl = user.user?.avatar;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="rounded-full">
              {isImageUrl(avatarUrl) ? (
                // Show image if it's a valid image URL
                <img
                  src={avatarUrl}
                  alt={user.user?.full_name || "Avatar"}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <AvatarFallback>
                  {/* Show initials or fallback */}
                  {user.user?.full_name
                    ? user.user.full_name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)
                    : "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <span>{user.user?.full_name ?? "N/A"}</span>
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
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleUpdateClick(row.original)}
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
        </Button>
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
  manualPagination: true,
  pageCount: pagination.lastPage,
  state: {
    pagination: {
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
    },
    rowSelection: selectedToDelete.reduce((acc, id) => {
      const index = data.findIndex((d) => d.user?.id === Number(id));
      if (index !== -1) acc[index] = true;
      return acc;
    }, {} as Record<number, boolean>),
  },
  onPaginationChange: (updater) => {
    const newPagination = updater instanceof Function ? updater(pagination) : updater;
    setPagination((prev) => ({
      ...prev,
      pageIndex: newPagination.pageIndex,
      pageSize: newPagination.pageSize,
    }));
  },
  onRowSelectionChange: (updater) => {
    const selection = updater instanceof Function ? updater(table.getState().rowSelection) : updater;
  const selectedIds = Object.keys(selection)
    .filter((key) => selection[parseInt(key)])
    .map((key) => {
      const userId = data[parseInt(key)]?.user?.id;
      return userId !== undefined ? userId.toString() : undefined;
    })
    .filter((id): id is string => id !== undefined);

  setSelectedToDelete(selectedIds);
  },
  enableRowSelection: true,
});

  return (
    <>
      {/* Statistics Section */}
      <div className="mb-8 px-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          إحصائيات الطلاب
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="إجمالي الطلاب"
            value={statistics?.totalStudents?.toLocaleString()}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="الطلاب النشطون"
            value={statistics?.activeStudents?.toLocaleString()}
            icon={GraduationCap}
            color="green"
          />
          <StatCard
            title="عدد المدارس"
            value={statistics?.totalSchools?.toLocaleString()}
            icon={School}
            color="purple"
          />
          <StatCard
            title="طلاب لديهم هاتف"
            value={statistics?.studentsWithPhone?.toLocaleString()}
            icon={Phone}
            color="orange"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 px-4 mb-4">
        {/* Filters Bar */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          {/* Governorate Filter */}
          <div className="min-w-[180px]">
            <Label htmlFor="governorate">المحافظة</Label>
            <select
              id="governorate"
              value={filters.governorate_id}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  governorate_id: e.target.value,
                  area_id: "",
                }));
                setArea([]); // Optionally clear area if governorate changes
                feachAreaData();
                refetchUsers();
              }}
              className="w-full px-3 flex justify-between items-center read-only:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition duration-300 border-default-300 text-default-500 focus:outline-none focus:border-default-500/50 disabled:bg-default-200 placeholder:text-accent-foreground/50 border rounded-lg h-10 text-sm"
            >
              <option value="">الكل</option>
              {governorates?.map((g: any) => (
                <option key={g.id} value={g.id + ""}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          {/* Area Filter */}
          <div className="min-w-[180px]">
            <Label htmlFor="area">المنطقة</Label>
            <select
              id="area"
              value={filters.area_id}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, area_id: e.target.value }));
                refetchUsers();
              }}
              className="w-full px-3 flex justify-between items-center read-only:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition duration-300 border-default-300 text-default-500 focus:outline-none focus:border-default-500/50 disabled:bg-default-200 placeholder:text-accent-foreground/50 border rounded-lg h-10 text-sm"
            >
              <option value="">الكل</option>
              {area?.map((a: any) => (
                <option key={a.id} value={a.id + ""}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          {/* Level Filter */}
          <div className="min-w-[180px]">
            <Label htmlFor="level">المرحلة</Label>
            <select
              id="level"
              value={filters.level_id}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, level_id: e.target.value }));
                refetchUsers();
              }}
              className="w-full px-3 flex justify-between items-center read-only:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition duration-300 border-default-300 text-default-500 focus:outline-none focus:border-default-500/50 disabled:bg-default-200 placeholder:text-accent-foreground/50 border rounded-lg h-10 text-sm"
            >
              <option value="">الكل</option>
              {level?.map((l: any) => (
                <option key={l.id} value={l.id + ""}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          {/* Subject Filter */}
          {/* <div className="min-w-[180px]">
            <Label htmlFor="subject">المادة</Label>
            <select
              id="subject"
              value={filters.subject_id}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, subject_id: e.target.value }));
                refetchUsers();
              }}
              className="w-full px-3 flex justify-between items-center read-only:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition duration-300 border-default-300 text-default-500 focus:outline-none focus:border-default-500/50 disabled:bg-default-200 placeholder:text-accent-foreground/50 border rounded-lg h-10 text-sm"
            >
              <option value="">الكل</option>
              {subjects?.map((s: any) => (
                <option key={s.id} value={s.id + ""}>
                  {s.name}
                </option>
              ))}
            </select>
          </div> */}
          {/* Teacher Filter (admin only) */}
          {user?.role === "admin" && (
            <div className="min-w-[180px]">
              <Label htmlFor="teacher">المعلم</Label>
              <select
                id="teacher"
                value={filters.teacher_id}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    teacher_id: e.target.value,
                  }));
                  refetchUsers();
                }}
                className="w-full px-3 flex justify-between items-center read-only:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition duration-300 border-default-300 text-default-500 focus:outline-none focus:border-default-500/50 disabled:bg-default-200 placeholder:text-accent-foreground/50 border rounded-lg h-10 text-sm"
              >
                <option value="">الكل</option>
                {teachers?.map((t: any) => (
                  <option key={t.id} value={t.id + ""}>
                    {t.user.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Gender Filter */}
          <div className="min-w-[180px] flex flex-col">
            <Label>الجنس</Label>
            <RadioGroup
              value={filters.gender}
              onValueChange={(value) => {
                setFilters((prev) => ({ ...prev, gender: value }));
                refetchUsers();
              }}
              className="flex flex-row gap-2 mt-1"
            >
              <RadioGroupItem value="" id="gender-all">
                الكل
              </RadioGroupItem>
              <RadioGroupItem value="male" id="gender-male">
                ذكر
              </RadioGroupItem>
              <RadioGroupItem value="female" id="gender-female">
                أنثى
              </RadioGroupItem>
            </RadioGroup>
          </div>
          {/* Date Range Filter */}
          <div className="min-w-[220px] flex flex-col">
            <Label>الفترة الزمنية</Label>
            <DatePickerWithRange
              className="w-full"
              value={dateRange}
              onChange={(range) => {
                setDateRange(range);
                setFilters((prev) => ({
                  ...prev,
                  from_date: range?.from
                    ? range.from.toISOString().split("T")[0]
                    : "",
                  to_date: range?.to
                    ? range.to.toISOString().split("T")[0]
                    : "",
                }));
                refetchUsers();
              }}
            />
          </div>
          {/* Reset Filters Button */}
          <div className="flex items-end">
            <Button
              variant="outline"
              color="warning"
              size="sm"
              onClick={() => {
                setFilters({
                  governorate_id: "",
                  area_id: "",
                  level_id: "",
                  // subject_id: "",
                  teacher_id: "",
                  gender: "",
                  to_date: "",
                  from_date: "",
                  search: "",
                });
                setDateRange(undefined);
                refetchUsers();
              }}
            >
              إعادة تعيين الفلاتر
            </Button>
          </div>
        </div>
        {/* search input */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by name..."
            value={filters.search}
            onChange={(event) => {
              setFilters((prev) => ({ ...prev, search: event.target.value }));
              refetchUsers();
            }}
            className="max-w-sm min-w-[200px] h-10"
          />

          {/* === NEW === Delete Button */}
          {selectedToDelete.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              حذف ({selectedToDelete.length})
            </Button>
          )}
        </div>
      </div>
      {/* users table */}
      <div className="overflow-x-auto">
        <Table className="dark:bg-[#1F2937] w-full rounded-md shadow-md">
          <TableHeader>
            {table.getHeaderGroups()?.map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers?.map((header) => (
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
              table.getRowModel().rows?.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells()?.map((cell) => (
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
      {/* Pagination Controls */}
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-9 px-4 font-medium"
          >
            السابق
          </Button>
          {/* Page Numbers */}
          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.lastPage }, (_, i) => i + 1)?.map(
              (pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={
                    pageNumber === table.getState().pagination.pageIndex + 1
                      ? "soft"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => table.setPageIndex(pageNumber - 1)}
                  className={`w-9 h-9 font-medium transition-all duration-200 ${
                    pageNumber === table.getState().pagination.pageIndex + 1
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
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-9 px-4 font-medium"
          >
            التالي
          </Button>
        </div>
      </div>
      {/* Student Update Modal */}
      <StudentUpdateModal
        isOpen={updateModalOpen}
        onClose={handleUpdateModalClose}
        student={selectedStudent}
        onUpdate={refetchUsers}
        token={token}
        governorates={governorates}
        areas={area}
        levels={level}
      />

      {/* === NEW === Delete Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteStudents}
        isMultiple={selectedToDelete.length > 1}
        count={selectedToDelete.length}
      />
    </>
  );
}

export default BasicDataTable;
