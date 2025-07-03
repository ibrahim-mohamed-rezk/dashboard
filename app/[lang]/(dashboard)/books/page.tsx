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

import { Badge } from "@/components/ui/badge";

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

interface Book {
  id: number;
  name: string;
  author: string;
  subject: string;
  level: string;
  teacher: string;
  description: string;
  image: string;
  min_file: string;
  file: string;
  price: number;
  count: number;
  is_favorite: boolean;
  is_purchased: boolean;
}

type FormData = {
  name: string;
  author: string;
  subject_id: number;
  level_id: number;
  teacher_id: number;
  description: string;
  type: "free" | "paid";
  price: number;
  count: number;
  image: File | null;
  min_file: File | null;
  file: File | null;
};

function BooksDataTable() {
  const [data, setData] = useState<Book[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    author: "",
    subject_id: 0,
    level_id: 0,
    teacher_id: 0,
    description: "",
    type: "free",
    price: 0,
    count: 0,
    image: null,
    min_file: null,
    file: null,
  });

  const [filters, setFilters] = useState({
    subject_id: "",
    search: "",
    teacher_id: "",
    level_id: "",
    type: "",
  });

  // Mock data for dropdowns - replace with actual API calls
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [levels, setLevels] = useState<{ id: number; name: string }[]>([]);
  const [teachers, setTeachers] = useState<
    { id: number; user: { full_name: string } }[]
  >([]);

  // refetch books
  const refetchBooks = async () => {
    try {
      const response = await getData(
        `books`,
        { page: currentPage, ...filters },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setData(response.data);
      setTotalPages(response.meta.last_page);
      setCurrentPage(response.meta.current_page);
    } catch (error) {
      console.log(error);
    }
  };

  // feach levels
  const feachLevelsData = async () => {
    try {
      const response = await getData(
        "levels",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setLevels(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // feach teachers
  const fetchTeachers = async () => {
    try {
      const response = await getData(
        "teachers",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setTeachers(response.data);
    } catch (error) {
      console.log("Failed to fetch teachers");
    }
  };

  // feach subjects data
  const feachSubjectsData = async () => {
    try {
      const response = await getData(
        "subjects",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setSubjects(response.data);
    } catch (error) {
      console.log(error);
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

  // feach filters data
  useEffect(() => {
    feachSubjectsData();
    feachLevelsData();
    fetchTeachers();
  }, [token]);

  // feach data
  useEffect(() => {
    refetchBooks();
  }, [token, filters, currentPage]);

  // handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]:
        name === "price" || name === "count" ? parseInt(value) || 0 : value,
    }));
  };

  // handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: files[0],
      }));
    }
  };

  // handle select change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]:
        name === "subject_id" || name === "level_id" || name === "teacher_id"
          ? parseInt(value) || 0
          : value,
    }));
  };

  // add book validation schema
  const schema = z.object({
    name: z.string().min(2, "اسم الكتاب مطلوب"),
    author: z.string().min(2, "اسم المؤلف مطلوب"),
    subject_id: z.number().min(1, "الموضوع مطلوب"),
    level_id: z.number().min(1, "المستوى مطلوب"),
    teacher_id: z.number().min(1, "المعلم مطلوب"),
    description: z.string().min(10, "الوصف يجب أن يكون على الأقل 10 أحرف"),
    type: z.enum(["free", "paid"], { required_error: "نوع الكتاب مطلوب" }),
    price: z.number().min(0, "السعر يجب أن يكون أكبر من أو يساوي 0"),
    count: z.number().min(0, "الكمية يجب أن تكون أكبر من أو تساوي 0"),
  });

  const { register, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "all",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          if (value instanceof File) {
            formDataToSend.append(key, value);
          } else {
            formDataToSend.append(key, value.toString());
          }
        }
      });

      await postData("books", formDataToSend, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      reset();
      setFormData({
        name: "",
        author: "",
        subject_id: 0,
        level_id: 0,
        teacher_id: 0,
        description: "",
        type: "free",
        price: 0,
        count: 0,
        image: null,
        min_file: null,
        file: null,
      });
      refetchBooks();
      toast.success("تم إضافة الكتاب بنجاح");
      dialogCloseRef.current?.click();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join("<br>");
          setError(errorMessages);
        } else {
          setError("حدث خطأ");
        }
      } else {
        setError("حدث خطأ غير متوقع");
      }
      throw error;
    }
  };

  // update book
  const updateBook = async (id: number) => {
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          if (value instanceof File) {
            formDataToSend.append(key, value);
          } else {
            formDataToSend.append(key, value.toString());
          }
        }
      });
      formDataToSend.append("_method", "PUT");

      await postData(`books/${id}`, formDataToSend, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      reset();
      setEditingBook(null);
      refetchBooks();
      toast.success("تم تحديث الكتاب بنجاح");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join("<br>");
          setEditError(errorMessages);
        } else {
          setEditError("حدث خطأ");
        }
      } else {
        setEditError("حدث خطأ غير متوقع");
      }
      throw error;
    }
  };

  // delete book
  const deleteBook = async (id: number) => {
    try {
      await deleteData(`books/${id}`, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });

      reset();
      setEditingBook(null);
      refetchBooks();
      toast.success("تم حذف الكتاب بنجاح");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join("<br>");
          setError(errorMessages);
        } else {
          setError("حدث خطأ");
        }
      } else {
        setError("حدث خطأ غير متوقع");
      }
      throw error;
    }
  };

  // Update useEffect to set form data when editing book changes
  useEffect(() => {
    if (editingBook) {
      setFormData({
        name: editingBook.name,
        author: editingBook.author,
        subject_id:
          subjects.find((s) => s.name === editingBook.subject)?.id || 0,
        level_id: levels.find((l) => l.name === editingBook.level)?.id || 0,
        teacher_id:
          teachers.find((t) => t.user.full_name === editingBook.teacher)?.id ||
          0,
        description: editingBook.description,
        type: editingBook.price > 0 ? "paid" : "free",
        price: editingBook.price,
        count: editingBook.count,
        image: null,
        min_file: null,
        file: null,
      });
    }
  }, [editingBook, subjects, levels, teachers]);

  // columns of table
  const columns: ColumnDef<Book>[] = [
    {
      accessorKey: "name",
      header: "اسم الكتاب",
      cell: ({ row }) => {
        const book = row.original;
        return (
          <div className="flex items-center gap-3">
            <img
              src={book.image}
              alt={book.name}
              className="w-12 h-12 object-cover rounded"
            />
            <div className="flex flex-col">
              <span className="font-medium">{book.name}</span>
              <span className="text-sm text-gray-500">{book.author}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "subject",
      header: "الموضوع",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.subject}</Badge>
      ),
    },
    {
      accessorKey: "level",
      header: "المستوى",
      cell: ({ row }) => <span className="text-sm">{row.original.level}</span>,
    },
    {
      accessorKey: "teacher",
      header: "المعلم",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.teacher}</span>
      ),
    },
    {
      accessorKey: "price",
      header: "السعر",
      cell: ({ row }) => (
        <Badge variant={"outline"}>
          {row.original.price > 0 ? `$${row.original.price}` : "مجاني"}
        </Badge>
      ),
    },
    {
      accessorKey: "count",
      header: "الكمية",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.count}</span>
      ),
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center justify-center">
          <Button
            onClick={() => setViewingBook(row.original)}
            size="sm"
            variant="outline"
          >
            عرض
          </Button>
          <Button onClick={() => setEditingBook(row.original)} size="sm">
            تعديل
          </Button>
          <Button
            onClick={() => deleteBook(row.original.id)}
            className="bg-red-500 hover:bg-red-600"
            size="sm"
          >
            حذف
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

  const renderBookForm = (isEdit: boolean = false) => (
    <form
      onSubmit={
        isEdit
          ? (e) => {
              e.preventDefault();
              editingBook && updateBook(editingBook.id);
            }
          : handleSubmit
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={isEdit ? "edit_name" : "name"}>اسم الكتاب</label>
            <input
              id={isEdit ? "edit_name" : "name"}
              placeholder="أدخل اسم الكتاب"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor={isEdit ? "edit_author" : "author"}>المؤلف</label>
            <input
              id={isEdit ? "edit_author" : "author"}
              placeholder="أدخل اسم المؤلف"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label>الموضوع</label>
            <select
              name="subject_id"
              value={formData.subject_id}
              onChange={handleSelectChange}
              className="w-full p-2 border rounded"
            >
              <option value={0}>اختر الموضوع</option>
              {subjects.map((subject: { id: number; name: string }) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>المستوى</label>
            <select
              name="level_id"
              value={formData.level_id}
              onChange={handleSelectChange}
              className="w-full p-2 border rounded"
            >
              <option value={0}>اختر المستوى</option>
              {levels.map((level: { id: number; name: string }) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>المعلم</label>
            <select
              name="teacher_id"
              value={formData.teacher_id}
              onChange={handleSelectChange}
              className="w-full p-2 border rounded"
            >
              <option value={0}>اختر المعلم</option>
              {teachers.map(
                (teacher: { id: number; user: { full_name: string } }) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.user.full_name}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor={isEdit ? "edit_description" : "description"}>
            وصف الكتاب
          </label>
          <textarea
            id={isEdit ? "edit_description" : "description"}
            placeholder="أدخل وصف مفصل للكتاب"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded min-h-[100px] resize-vertical"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label>نوع الكتاب</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleSelectChange}
              className="w-full p-2 border rounded"
            >
              <option value="free">مجاني</option>
              <option value="paid">مدفوع</option>
            </select>
          </div>
          <div>
            <label htmlFor={isEdit ? "edit_price" : "price"}>السعر</label>
            <input
              id={isEdit ? "edit_price" : "price"}
              type="number"
              step="0.01"
              placeholder="0.00"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              disabled={formData.type === "free"}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor={isEdit ? "edit_count" : "count"}>الكمية</label>
            <input
              id={isEdit ? "edit_count" : "count"}
              type="number"
              placeholder="0"
              name="count"
              value={formData.count}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Enhanced file inputs */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor={isEdit ? "edit_image" : "image"}>صورة الكتاب</label>
            {isEdit && editingBook && editingBook.image && (
              <div className="mb-2">
                <img
                  src={editingBook.image}
                  alt="صورة الكتاب الحالية"
                  className="w-20 h-20 object-cover rounded border"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <label
                htmlFor={isEdit ? "edit_image" : "image"}
                className="cursor-pointer px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                اختر صورة
              </label>
              <span className="text-xs text-gray-600 truncate max-w-[120px]">
                {formData.image ? formData.image.name : "لم يتم اختيار ملف"}
              </span>
              <input
                id={isEdit ? "edit_image" : "image"}
                type="file"
                accept="image/*"
                name="image"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
          <div>
            <label htmlFor={isEdit ? "edit_min_file" : "min_file"}>
              ملف العينة
            </label>
            {isEdit && editingBook && editingBook.min_file && (
              <div className="mb-2">
                <a
                  href={editingBook.min_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  عرض ملف العينة الحالي
                </a>
              </div>
            )}
            <div className="flex items-center gap-2">
              <label
                htmlFor={isEdit ? "edit_min_file" : "min_file"}
                className="cursor-pointer px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                اختر ملف
              </label>
              <span className="text-xs text-gray-600 truncate max-w-[120px]">
                {formData.min_file
                  ? formData.min_file.name
                  : "لم يتم اختيار ملف"}
              </span>
              <input
                id={isEdit ? "edit_min_file" : "min_file"}
                type="file"
                accept=".pdf,.doc,.docx"
                name="min_file"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
          <div>
            <label htmlFor={isEdit ? "edit_file" : "file"}>الملف الكامل</label>
            {isEdit && editingBook && editingBook.file && (
              <div className="mb-2">
                <a
                  href={editingBook.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  عرض الملف الكامل الحالي
                </a>
              </div>
            )}
            <div className="flex items-center gap-2">
              <label
                htmlFor={isEdit ? "edit_file" : "file"}
                className="cursor-pointer px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                اختر ملف
              </label>
              <span className="text-xs text-gray-600 truncate max-w-[120px]">
                {formData.file ? formData.file.name : "لم يتم اختيار ملف"}
              </span>
              <input
                id={isEdit ? "edit_file" : "file"}
                type="file"
                accept=".pdf,.doc,.docx"
                name="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
      <div>
        {(isEdit ? editError : error) && (
          <p
            className="text-red-500 mt-2"
            dangerouslySetInnerHTML={{
              __html: isEdit ? editError || "" : error || "",
            }}
          />
        )}
      </div>
      <div className="mt-6 space-y-2">
        <Button type="submit" className="w-full">
          {isEdit ? "تحديث" : "إضافة"}
        </Button>
        <DialogClose asChild>
          <Button
            ref={!isEdit ? dialogCloseRef : undefined}
            variant="outline"
            className="w-full"
          >
            إلغاء
          </Button>
        </DialogClose>
      </div>
    </form>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 px-4 mb-4">
        {/* search input */}
        <Input
          placeholder="بحث بالاسم..."
          value={filters.search}
          onChange={(event) => {
            setFilters((prev) => ({ ...prev, search: event.target.value }));
          }}
          className="max-w-sm min-w-[200px] h-10"
        />
        {/* subject filter */}
        <select
          value={filters.subject_id}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, subject_id: e.target.value }));
          }}
          className="min-w-[140px] h-10 border rounded px-2"
        >
          <option value="">كل المواضيع</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        {/* level filter */}
        <select
          value={filters.level_id}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, level_id: e.target.value }));
          }}
          className="min-w-[120px] h-10 border rounded px-2"
        >
          <option value="">كل المستويات</option>
          {levels.map((level) => (
            <option key={level.id} value={level.id}>
              {level.name}
            </option>
          ))}
        </select>
        {/* teacher filter */}
        <select
          value={filters.teacher_id}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, teacher_id: e.target.value }));
          }}
          className="min-w-[140px] h-10 border rounded px-2"
        >
          <option value="">كل المعلمين</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.user.full_name}
            </option>
          ))}
        </select>
        {/* type filter */}
        <select
          value={filters.type}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, type: e.target.value }));
          }}
          className="min-w-[100px] h-10 border rounded px-2"
        >
          <option value="">كل الأنواع</option>
          <option value="free">مجاني</option>
          <option value="paid">مدفوع</option>
        </select>
        {/* add book Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">إضافة كتاب</Button>
          </DialogTrigger>
          <DialogContent className="!max-w-7xl">
            <DialogHeader>
              <DialogTitle>إضافة كتاب جديد</DialogTitle>
            </DialogHeader>
            {renderBookForm()}
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Book Dialog */}
      <Dialog open={!!editingBook} onOpenChange={() => setEditingBook(null)}>
        <DialogContent className="!max-w-7xl">
          <DialogHeader>
            <DialogTitle>تعديل الكتاب</DialogTitle>
          </DialogHeader>
          {editingBook && renderBookForm(true)}
        </DialogContent>
      </Dialog>

      {/* Show Book Dialog */}
      <Dialog open={!!viewingBook} onOpenChange={() => setViewingBook(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>عرض تفاصيل الكتاب</DialogTitle>
          </DialogHeader>
          {viewingBook && (
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <img
                  src={viewingBook.image}
                  alt={viewingBook.name}
                  className="w-24 h-24 object-cover rounded border"
                />
                <div>
                  <div className="font-bold text-lg mb-1">
                    {viewingBook.name}
                  </div>
                  <div className="text-gray-600 text-sm mb-1">
                    المؤلف: {viewingBook.author}
                  </div>
                  <div className="text-gray-600 text-sm mb-1">
                    الموضوع: {viewingBook.subject}
                  </div>
                  <div className="text-gray-600 text-sm mb-1">
                    المستوى: {viewingBook.level}
                  </div>
                  <div className="text-gray-600 text-sm mb-1">
                    المعلم: {viewingBook.teacher}
                  </div>
                  <div className="text-gray-600 text-sm mb-1">
                    السعر:{" "}
                    {viewingBook.price > 0 ? `$${viewingBook.price}` : "مجاني"}
                  </div>
                  <div className="text-gray-600 text-sm mb-1">
                    الكمية: {viewingBook.count}
                  </div>
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">الوصف:</div>
                <div className="text-gray-800 text-sm whitespace-pre-line">
                  {viewingBook.description}
                </div>
              </div>
              <div className="flex gap-4 mt-2">
                {viewingBook.min_file && (
                  <a
                    href={viewingBook.min_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm"
                  >
                    عرض ملف العينة
                  </a>
                )}
                {viewingBook.file && (
                  <a
                    href={viewingBook.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm"
                  >
                    عرض الملف الكامل
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* books table */}
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
              onClick={() => setCurrentPage(currentPage - 1)}
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
                    onClick={() => setCurrentPage(pageNumber)}
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
              onClick={() => setCurrentPage(currentPage + 1)}
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

export default BooksDataTable;
