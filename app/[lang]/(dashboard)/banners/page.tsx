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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

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
import axios, { AxiosError } from "axios";
import { Teacher, User } from "@/lib/type";
import { useEffect, useState } from "react";
import { getData, postData, deleteData } from "@/lib/axios/server";
import toast from "react-hot-toast";

// Enhanced interfaces with error handling
interface Banner {
  id: number;
  image: string;
  status: string;
  type: string;
  teacher: number | null;
}

// Error state interface
interface ErrorState {
  type: "network" | "validation" | "auth" | "server" | "file" | "unknown";
  message: string;
  code?: string | number;
  retryable: boolean;
}

// Loading states
interface LoadingState {
  banners: boolean;
  teachers: boolean;
  submitting: boolean;
  deleting: number | null;
  auth: boolean;
}

const DEFAULT_IMAGE = "https://via.placeholder.com/300x200";

// Enhanced schema with better validation - FIXED
const schema = z
  .object({
    image: z
      .instanceof(File, { message: "يرجى رفع ملف صورة صالح" })
      .refine(
        (file) => file.size <= 5 * 1024 * 1024,
        "يجب أن يكون حجم الصورة أقل من 5 ميجابايت"
      )
      .refine(
        (file) => file.type.startsWith("image/"),
        "يرجى رفع ملف صورة فقط"
      ),
    type: z.enum(["online", "offline"], { message: "يرجى اختيار نوع البانر" }),
    teacher: z
      .union([
        z.string().min(1, "يرجى اختيار المدرس"), // For string values from select
        z.number().min(1, "يرجى اختيار المدرس"), // For number values
        z.literal(""), // Allow empty string for online type
        z.null(), // Allow null for online type
      ])
      .optional(),
  })
  .refine(
    (data) => {
      // Custom validation: if type is offline, teacher must be selected
      if (data.type === "offline") {
        return data.teacher && data.teacher !== "" && data.teacher !== null;
      }
      return true;
    },
    {
      message: "يرجى اختيار المدرس للبانر الاوفلاين",
      path: ["teacher"],
    }
  );

// Error handling utility functions
const handleApiError = (error: any): ErrorState => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (!navigator.onLine) {
      return {
        type: "network",
        message:
          "لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.",
        retryable: true,
      };
    }

    if (axiosError.code === "ECONNABORTED") {
      return {
        type: "network",
        message: "انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.",
        retryable: true,
      };
    }

    const status = axiosError.response?.status;
    const data = axiosError.response?.data as any;

    switch (status) {
      case 401:
        return {
          type: "auth",
          message: "انتهت جلسة المستخدم. يرجى تسجيل الدخول مرة أخرى.",
          code: status,
          retryable: false,
        };
      case 403:
        return {
          type: "auth",
          message: "ليس لديك صلاحية للقيام بهذا الإجراء.",
          code: status,
          retryable: false,
        };
      case 404:
        return {
          type: "server",
          message: "المورد المطلوب غير موجود.",
          code: status,
          retryable: false,
        };
      case 422:
        const errors = data?.errors || {};
        const errorMessages = Object.values(errors).flat().join("، ");
        return {
          type: "validation",
          message: errorMessages || "بيانات غير صالحة.",
          code: status,
          retryable: false,
        };
      case 429:
        return {
          type: "server",
          message:
            "تم تجاوز حد الطلبات. يرجى الانتظار قليلاً والمحاولة مرة أخرى.",
          code: status,
          retryable: true,
        };
      case 500:
      case 502:
      case 503:
        return {
          type: "server",
          message: "خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.",
          code: status,
          retryable: true,
        };
      default:
        return {
          type: "unknown",
          message: data?.message || "حدث خطأ غير متوقع.",
          code: status,
          retryable: true,
        };
    }
  }

  if (error instanceof Error) {
    return {
      type: "unknown",
      message: error.message || "حدث خطأ غير متوقع.",
      retryable: true,
    };
  }

  return {
    type: "unknown",
    message: "حدث خطأ غير متوقع.",
    retryable: true,
  };
};

// Retry mechanism
const withRetry = async function <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorState = handleApiError(error);

      if (!errorState.retryable || i === maxRetries) {
        throw error;
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, i))
      );
    }
  }

  throw lastError;
};

function BannerTable() {
  const [data, setData] = useState<Banner[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    banners: false,
    teachers: false,
    submitting: false,
    deleting: null,
    auth: true,
  });
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
    lastPage: 1,
  });

  const columns: ColumnDef<Banner>[] = [
    {
      accessorKey: "image",
      header: "الصورة",
      cell: ({ row }) => {
        const banner = row.original;
        return (
          <Avatar className="rounded-md w-24 h-24">
            <AvatarImage
              src={banner.image || DEFAULT_IMAGE}
              alt="بانر"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_IMAGE;
              }}
            />
            <AvatarFallback>صورة</AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue("status") === "banner"
            ? "بانر"
            : row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "type",
      header: "النوع",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue("type") === "online" ? "اونلاين" : "اوفلاين"}
        </Badge>
      ),
    },
    {
      accessorKey: "teacher",
      header: "المدرس",
      cell: ({ row }) => (
        <div>
          {row.getValue("teacher") ? row.getValue("teacher") : "غير محدد"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const banner = row.original;
        const isDeleting = loading.deleting === banner.id;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(banner)}
              disabled={loading.submitting || isDeleting}
            >
              تعديل
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => handleDelete(banner.id)}
              disabled={loading.submitting || isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "حذف"
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    mode: "all",
  });

  const watchType = watch("type");

  // FIXED: Better handling of type changes
  useEffect(() => {
    if (watchType === "online") {
      setValue("teacher", null);
    } else if (watchType === "offline" && !editingBanner) {
      setValue("teacher", "");
    }
  }, [watchType, setValue, editingBanner]);

  // Enhanced token fetching with error handling
  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        setLoading((prev) => ({ ...prev, auth: true }));
        setError(null);

        const response = await withRetry(() => axios.get("/api/auth/getToken"));

        if (!response.data?.token) {
          throw new Error("لم يتم العثور على رمز المصادقة");
        }

        setToken(response.data.token);
        const userData = JSON.parse(response.data.user);
        setUser(userData);

        if (userData.role === "admin") {
          await fetchTeachers(response.data.token);
        }
      } catch (error) {
        const errorState = handleApiError(error);
        setError(errorState);
        toast.error(errorState.message);
      } finally {
        setLoading((prev) => ({ ...prev, auth: false }));
      }
    };

    fetchAuthData();
  }, [token]);

  // Enhanced teachers fetching
  const fetchTeachers = async (authToken?: string) => {
    const tokenToUse = authToken || token;
    if (!user?.role || user.role !== "admin" || !tokenToUse) return;

    try {
      setLoading((prev) => ({ ...prev, teachers: true }));
      setError(null);

      const response = await withRetry(() =>
        getData("teachers", {}, { Authorization: `Bearer ${tokenToUse}` })
      );

      if (!Array.isArray(response.data)) {
        throw new Error("تنسيق بيانات المدرسين غير صحيح");
      }

      setTeachers(response.data);
    } catch (error) {
      const errorState = handleApiError(error);
      console.error("Failed to fetch teachers:", error);
      toast.error(`فشل في جلب بيانات المدرسين: ${errorState.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, teachers: false }));
    }
  };

  // Enhanced banners fetching
  const fetchBanners = async () => {
    if (!token) return;

    try {
      setLoading((prev) => ({ ...prev, banners: true }));
      setError(null);

      const response = await withRetry(() =>
        getData(
          "banners",
          {
            page: pagination.pageIndex + 1,
            per_page: pagination.pageSize,
          },
          { Authorization: `Bearer ${token}` }
        )
      );

      if (!response?.data || !Array.isArray(response.data)) {
        throw new Error("تنسيق بيانات البانرات غير صحيح");
      }

      setData(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.meta?.total || 0,
        lastPage: response.meta?.last_page || 1,
      }));
    } catch (error) {
      const errorState = handleApiError(error);
      setError(errorState);
      console.error("Error fetching banners:", error);
    } finally {
      setLoading((prev) => ({ ...prev, banners: false }));
    }
  };

  useEffect(() => {
    if (token) {
      fetchBanners();
    }
  }, [pagination.pageIndex, pagination.pageSize, token]);

  // FIXED: Enhanced form submission with proper validation
  const onSubmit = async (formData: any) => {
    try {
      setLoading((prev) => ({ ...prev, submitting: true }));
      setError(null);

      // Additional validation for offline banners
      if (
        formData.type === "offline" &&
        (!formData.teacher || formData.teacher === "")
      ) {
        toast.error("يرجى اختيار المدرس للبانر الاوفلاين");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("image", formData.image);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("status", "banner");

      // FIXED: Handle teacher data for offline banners
      if (formData.type === "offline" && formData.teacher) {
        const teacherId =
          typeof formData.teacher === "string"
            ? parseInt(formData.teacher, 10)
            : formData.teacher;

        if (!isNaN(teacherId) && teacherId > 0) {
          formDataToSend.append("teacher_id", teacherId.toString());
          console.log("Sending offline banner with teacher:", teacherId);
        } else {
          toast.error("معرف المدرس غير صالح");
          return;
        }
      }

      console.log("Form data being sent:", {
        type: formData.type,
        teacher: formData.teacher,
        hasImage: !!formData.image,
      });

      if (editingBanner) {
        formDataToSend.append("_method", "PUT");
        const response = await withRetry(() =>
          postData(`banners/${editingBanner.id}`, formDataToSend, {
            Authorization: `Bearer ${token}`,
          })
        );
        console.log("Update response:", response);
        toast.success("تم تحديث البانر بنجاح!");
      } else {
        const response = await withRetry(() =>
          postData("banners", formDataToSend, {
            Authorization: `Bearer ${token}`,
          })
        );
        console.log("Create response:", response);
        toast.success("تم إضافة البانر بنجاح!");
      }

      await fetchBanners();
      reset();
      setImagePreview(null);
      setEditingBanner(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Form submission error:", error);
      const errorState = handleApiError(error);
      setError(errorState);
      toast.error(errorState.message);
    } finally {
      setLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Enhanced image handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // File validation
      if (file.size > 5 * 1024 * 1024) {
        toast.error("يجب أن يكون حجم الصورة أقل من 5 ميجابايت");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("يرجى رفع ملف صورة فقط");
        return;
      }

      setValue("image", file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.onerror = () => {
        toast.error("فشل في قراءة الملف");
        setImagePreview(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("حدث خطأ أثناء معالجة الصورة");
      setImagePreview(null);
    }
  };

  const handleEdit = (banner: Banner) => {
    try {
      setEditingBanner(banner);
      setValue("type", banner.type);
      if (banner.teacher) {
        setValue("teacher", banner.teacher.toString()); // Convert to string for select
      }
      setImagePreview(banner.image);
      setIsEditDialogOpen(true);
    } catch (error) {
      toast.error("حدث خطأ أثناء تحميل بيانات البانر");
    }
  };

  // Enhanced delete with confirmation
  const handleDelete = async (bannerId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا البانر؟")) {
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, deleting: bannerId }));
      setError(null);

      await withRetry(() =>
        deleteData(`banners/${bannerId}`, {
          Authorization: `Bearer ${token}`,
        })
      );

      toast.success("تم حذف البانر بنجاح!");
      await fetchBanners();
    } catch (error) {
      const errorState = handleApiError(error);
      toast.error(errorState.message);
    } finally {
      setLoading((prev) => ({ ...prev, deleting: null }));
    }
  };

  // Retry function for failed operations
  const handleRetry = () => {
    setError(null);
    if (token) {
      fetchBanners();
    } else {
      window.location.reload();
    }
  };

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
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
        });
        setPagination((prev) => ({
          ...prev,
          pageIndex: newState.pageIndex,
        }));
      }
    },
  });

  // Loading state for initial auth
  if (loading.auth) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (error && error.type === "auth") {
    return (
      <div className="flex items-center justify-center py-12">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="mb-4">{error.message}</AlertDescription>
          <Button onClick={() => window.location.reload()} size="sm">
            تسجيل الدخول مرة أخرى
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {error && error.retryable && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error.message}</span>
            <Button onClick={handleRetry} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة المحاولة
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2 px-4 mb-4">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              onClick={() => {
                setEditingBanner(null);
                reset();
                setImagePreview(null);
              }}
              disabled={loading.submitting}
            >
              إضافة بانر
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? "تعديل البانر" : "إضافة بانر"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-2 border rounded"
                    disabled={loading.submitting}
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="معاينة"
                      className="mt-2 w-32 h-32 object-cover rounded"
                    />
                  )}
                  {errors.image && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.image.message as string}
                    </p>
                  )}
                </div>
                <div>
                  <select
                    {...register("type")}
                    className="w-full p-2 border rounded"
                    disabled={loading.submitting}
                  >
                    <option value="online">اونلاين</option>
                    <option value="offline">اوفلاين</option>
                  </select>
                  {errors.type && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.type.message as string}
                    </p>
                  )}
                </div>
                {watchType === "offline" && (
                  <div>
                    <select
                      {...register("teacher")}
                      className="w-full p-2 border rounded"
                      disabled={loading.submitting || loading.teachers}
                    >
                      <option value="">اختر المدرس</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id.toString()}>
                          {teacher.user.full_name}
                        </option>
                      ))}
                    </select>
                    {loading.teachers && (
                      <p className="text-sm text-gray-500 mt-1">
                        جاري تحميل قائمة المدرسين...
                      </p>
                    )}
                    {errors.teacher && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.teacher.message as string}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <Button
                type="submit"
                className="mt-4 w-full"
                disabled={loading.submitting}
              >
                {loading.submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    جاري الحفظ...
                  </>
                ) : editingBanner ? (
                  "تحديث"
                ) : (
                  "إرسال"
                )}
              </Button>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => {
                    setEditingBanner(null);
                    reset();
                    setImagePreview(null);
                  }}
                  disabled={loading.submitting}
                >
                  إلغاء
                </Button>
              </DialogClose>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
            {loading.banners ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    جاري تحميل البانرات...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8"
                >
                  <div className="text-gray-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    لم يتم العثور على بانرات.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-center py-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || loading.banners}
            className="h-9 px-4 font-medium"
          >
            السابق
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map(
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
                  disabled={loading.banners}
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
            disabled={!table.getCanNextPage() || loading.banners}
            className="h-9 px-4 font-medium"
          >
            التالي
          </Button>
        </div>
      </div>
    </>
  );
}

export default BannerTable;
