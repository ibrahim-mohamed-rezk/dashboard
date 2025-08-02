"use client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { Button  } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { deleteData, getData, postData } from "@/lib/axios/server";
import axios, { AxiosHeaders } from "axios";
import { Upload, X } from "lucide-react";
import { Editor } from "@tinymce/tinymce-react";

interface Blog {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  image: string;
  meta_description: string;
  meta_keywords: string;
  published?: boolean;
  created_at: string;
  updated_at?: string;
}

interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
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
  data: Blog[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

interface FormData {
  title: string;
  description: string;
  content: string;
  image?: File;
  meta_description?: string;
  meta_keywords?: string;
  published: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
  content?: string;
  image?: string;
  meta_description?: string;
  meta_keywords?: string;
}

interface BlogFormProps {
  onClose: () => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  imagePreview: string | null;
  editingBlog: Blog | null;
}

function generateSlug(title: string): string {
  const baseSlug = title.toLowerCase().replace(/\s+/g, "-");
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomStr}`;
}

const BlogForm = ({
  onClose,
  formData,
  setFormData,
  handleInputChange,
  handleImageChange,
  handleSubmit,
  isSubmitting,
  imagePreview,
  editingBlog,
}: BlogFormProps) => (
  <form onSubmit={handleSubmit} className="space-y-4">
    <div className="space-y-2 flex items-center justify-center flex-col w-full">
      <label
        htmlFor="image"
        className="block text-sm font-medium dark:text-gray-200"
      >
        صورة المقال
      </label>
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            id="image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          {!imagePreview && !editingBlog?.image && (
            <label
              htmlFor="image"
              className="cursor-pointer inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Upload className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </label>
          )}
        </div>
        {(imagePreview || editingBlog?.image) && (
          <div className="relative w-20 h-20">
            <img
              src={imagePreview || editingBlog?.image}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, image: undefined }));
              }}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>

    <div>
      <label
        htmlFor="title"
        className="block text-sm font-medium mb-1 dark:text-gray-200"
      >
        العنوان *
      </label>
      <input
        id="title"
        name="title"
        type="text"
        value={formData.title}
        onChange={handleInputChange}
        placeholder="أدخل عنوان المقال"
        className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        required
      />
    </div>

    <div>
      <label
        htmlFor="description"
        className="block text-sm font-medium mb-1 dark:text-gray-200"
      >
        الوصف *
      </label>
      <textarea
        id="description"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        placeholder="وصف مختصر للمقال"
        className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg min-h-[100px] focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        required
      />
    </div>

    <div>
      <label
        htmlFor="content"
        className="block text-sm font-medium mb-1 dark:text-gray-200"
      >
        المحتوى *
      </label>
      <Editor
        apiKey="f54o6xm5i2tmb8d40jlua7dpi1ksl4b8b6sw29xc2k579ayv"
        value={formData.content}
        onEditorChange={(content: string) => {
          setFormData((prev) => ({ ...prev, content }));
        }}
        init={{
          height: 500,
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
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="meta_description"
          className="block text-sm font-medium mb-1 dark:text-gray-200"
        >
          وصف SEO
        </label>
        <textarea
          id="meta_description"
          name="meta_description"
          value={formData.meta_description}
          onChange={handleInputChange}
          placeholder="وصف المقال لمحركات البحث"
          className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg min-h-[80px] focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="meta_keywords"
          className="block text-sm font-medium mb-1 dark:text-gray-200"
        >
          كلمات SEO
        </label>
        <textarea
          id="meta_keywords"
          name="meta_keywords"
          value={formData.meta_keywords}
          onChange={handleInputChange}
          placeholder="كلمات مفتاحية، مفصولة، بفواصل"
          className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg min-h-[80px] focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
    </div>

    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id="published"
        name="published"
        checked={formData.published}
        onChange={handleInputChange}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
      />
      <label
        htmlFor="published"
        className="text-sm font-medium dark:text-gray-200"
      >
        نشر المقال
      </label>
    </div>

    <div className="mt-6 space-y-2">
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
      >
        {isSubmitting
          ? "جاري الحفظ..."
          : editingBlog
          ? "تحديث المقال"
          : "إنشاء المقال"}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:text-gray-200 dark:hover:bg-gray-700"
      >
        إلغاء
      </button>
    </div>
  </form>
);

function BlogTable() {
  const [data, setData] = useState<Blog[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    content: "",
    meta_description: "",
    meta_keywords: "",
    published: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      setFormData((prev: FormData) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev: FormData) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submitData = new FormData();

      // Generate slug from title
      const slug = generateSlug(formData.title);

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "image" && value instanceof File) {
            submitData.append(key, value);
          } else if (key === "image" && editingBlog?.image && !value) {
            submitData.append(key, editingBlog.image);
          } else if (key === "published") {
            submitData.append(key, (value as boolean) ? "1" : "0");
          } else if (typeof value === "string") {
            submitData.append(key, value);
          }
        }
      });

      // Add the generated slug
      submitData.append("slug", slug);

      if (editingBlog) {
        // Add _method: PUT for update requests
        submitData.append("_method", "PUT");
        await postData(`blogs/${editingBlog.id}`, submitData, {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        });
        toast.success("تم تحديث المقال بنجاح!");
        // Reset form and refetch data before closing dialog
        resetForm();
        await fetchData();
        setIsEditDialogOpen(false);
        setEditingBlog(null);
      } else {
        await postData("blogs", submitData, {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        });
        toast.success("تم إنشاء المقال بنجاح!");
        // Reset form and refetch data before closing dialog
        resetForm();
        await fetchData();
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.msg || "حدث خطأ");
      } else {
        toast.error("حدث خطأ غير متوقع");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      meta_description: "",
      meta_keywords: "",
      published: false,
    });
    setImagePreview(null);
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      description: blog.description,
      content: blog.content,
      meta_description: blog.meta_description || "",
      meta_keywords: blog.meta_keywords || "",
      published: blog.published || false,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteData(`blogs/${id}`, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
      toast.success("تم حذف المقال بنجاح!");
      await fetchData(); // Wait for data to be fetched
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error("فشل في حذف المقال");
    }
  };

  const openDeleteDialog = (blog: Blog) => {
    setBlogToDelete(blog);
    setIsDeleteDialogOpen(true);
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const columns: ColumnDef<Blog>[] = [
    {
      accessorKey: "image",
      header: "الصورة",
      cell: ({ row }) => {
        const imageUrl = row.getValue("image");
        return (
          <div className="flex justify-center">
            {imageUrl ? (
              <img
                src={imageUrl as string}
                alt="صورة المقال"
                className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200 shadow-sm hover:scale-110 transition-transform duration-200"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Icon
                  icon="heroicons:photo"
                  className="w-6 h-6 text-gray-400"
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold"
        >
          العنوان
          <Icon
            icon={
              column.getIsSorted() === "asc"
                ? "heroicons:chevron-up"
                : "heroicons:chevron-down"
            }
            className="ml-2 h-4 w-4"
          />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium max-w-[200px]">
          {truncateText(row.getValue("title") || "غير متوفر", 50)}
        </div>
      ),
    },
    {
      accessorKey: "slug",
      header: "الرابط",
      cell: ({ row }) => (
        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">
          {truncateText(row.getValue("slug") || "غير متوفر", 30)}
        </code>
      ),
    },
    {
      accessorKey: "description",
      header: "الوصف",
      cell: ({ row }) => (
        <div className="max-w-[250px] text-sm text-gray-600">
          {truncateText(row.getValue("description") || "غير متوفر", 80)}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold"
        >
          تاريخ الإنشاء
          <Icon
            icon={
              column.getIsSorted() === "asc"
                ? "heroicons:chevron-up"
                : "heroicons:chevron-down"
            }
            className="ml-2 h-4 w-4"
          />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.getValue("created_at")).toLocaleDateString("ar-EG")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const blog = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(blog)}
              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            >
              <Icon icon="heroicons:pencil" className="w-4 h-4 mr-1" />
              تعديل
            </Button>

            <button
              onClick={() => openDeleteDialog(blog)}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-3 py-1 border rounded-lg"
            >
              حذف
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      sorting,
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: (row, columnId, value) => {
      const content = row.getValue(columnId);
      return String(content).toLowerCase().includes(value.toLowerCase());
    },
  });

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await axios.get("/api/auth/getToken");
        setToken(response.data.token);
      } catch (error) {
        toast.error("Failed to get authentication token");
      }
    };
    fetchToken();
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await getData(
        `blogs?page=${currentPage}&per_page=${pageSize}`,
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        })
      );
      const apiResponse = response as ApiResponse;
      setData(apiResponse.data);
      setTotalPages(apiResponse.meta.last_page);
      setTotalItems(apiResponse.meta.total);
    } catch (error) {
      toast.error("Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="w-full p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold dark:text-white">
              إدارة المقالات
            </span>
            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm dark:text-gray-200">
              {data.length} مقال
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <input
                type="text"
                placeholder="البحث في المقالات..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg pl-10 dark:bg-gray-700 dark:text-white"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
                🔍
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
          >
            + إضافة مقال جديد
          </button>
        </div>

        {/* Table */}
        <div className="border dark:border-gray-600 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="dark:bg-gray-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-8 dark:text-gray-200"
                  >
                    <div className="flex items-center justify-center gap-2">
                      جاري التحميل...
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 dark:text-gray-200"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-8 text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <p>لا توجد مقالات</p>
                      <p className="text-sm">ابدأ بإضافة مقال جديد</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <span>
              عرض {(currentPage - 1) * pageSize + 1} إلى{" "}
              {Math.min(currentPage * pageSize, totalItems)} من {totalItems}{" "}
              مقال
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border dark:border-gray-600 rounded-lg disabled:opacity-50 dark:text-gray-200"
            >
              السابق
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 border dark:border-gray-600 rounded-lg ${
                    currentPage === i + 1
                      ? "bg-blue-500 text-white"
                      : "dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              )).slice(
                Math.max(0, currentPage - 3),
                Math.min(totalPages, currentPage + 2)
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border dark:border-gray-600 rounded-lg disabled:opacity-50 dark:text-gray-200"
            >
              التالي
            </button>
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">
                إضافة مقال جديد
              </h2>
              <button
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                  setImagePreview(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <BlogForm
              onClose={() => {
                setIsCreateDialogOpen(false);
                resetForm();
                setImagePreview(null);
              }}
              formData={formData}
              setFormData={setFormData}
              handleInputChange={handleInputChange}
              handleImageChange={handleImageChange}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              imagePreview={imagePreview}
              editingBlog={editingBlog}
            />
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">
                تعديل المقال
              </h2>
              <button
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingBlog(null);
                  resetForm();
                  setImagePreview(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <BlogForm
              onClose={() => {
                setIsEditDialogOpen(false);
                setEditingBlog(null);
                resetForm();
                setImagePreview(null);
              }}
              formData={formData}
              setFormData={setFormData}
              handleInputChange={handleInputChange}
              handleImageChange={handleImageChange}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              imagePreview={imagePreview}
              editingBlog={editingBlog}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">
                تأكيد الحذف
              </h2>
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 border dark:border-gray-600 rounded-lg dark:text-gray-200 dark:hover:bg-gray-700"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (blogToDelete) {
                    handleDelete(blogToDelete.id);
                    setIsDeleteDialogOpen(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogTable;
