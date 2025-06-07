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

import { MoreHorizontal, Upload, X } from "lucide-react";

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
} from "@/components/ui/dropdown-menu";

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

import { useEffect, useState } from "react";
import axios, { AxiosHeaders } from "axios";
import { deleteData, getData, postData } from "@/lib/axios/server";
import toast from "react-hot-toast";
import Link from "next/link";

function generateSlug(title: string): string {
  // Convert title to lowercase and replace spaces with hyphens
  const baseSlug = title.toLowerCase().replace(/\s+/g, "-");
  // Add random string of 6 characters
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
}

interface Level {
  id: number;
  name: string;
}

const DEFAULT_IMAGE = "https://via.placeholder.com/150";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  cour_no: z.string().min(2, "Course No is required"),
  level: z.string().min(2, "Level is required"),
  subject: z.string().min(2, "Subject is required"),
  cover: z.string().url("Invalid image URL"),
});

interface FormData {
  title: string;
  cour_no: string;
  level: string;
  level_id: number;
  subject: string;
  cover: File | string | null;
  description: string;
  type: string;
  price: string;
  position: string;
  [key: string]: string | File | number | null;
}

function CoursesTable() {
  const [data, setData] = useState<Course[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [editCourse, setEditCourse] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    cour_no: "",
    level: "",
    level_id: 0,
    subject: "",
    cover: null,
    description: "",
    type: "",
    price: "",
    position: "",
  });
  const [editError, setEditError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateCourse = async (id: number) => {
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) {
          formDataToSend.append(key, String(formData[key]));
        }
      });
      // Don't modify the slug during updates
      formDataToSend.append("_method", "PUT");

      const response = await postData(`/courses/${id}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        handleCloseDialog();
        fetchData();
      }
    } catch (error: any) {
      setEditError(error.response?.data?.message || "Failed to update course");
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
  });

  //  add course
  const {
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "all",
  });

  const onSubmit = async (formData: any) => {
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) {
          formDataToSend.append(key, String(formData[key]));
        }
      });
      // Add auto-generated slug only for new courses
      formDataToSend.append("slug", generateSlug(formData.title));

      const response = await postData("/courses", formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        handleCloseDialog();
        fetchData();
      }
    } catch (error: any) {
      setEditError(error.response?.data?.message || "Failed to add course");
    }
  };

  //  fetch courses
  const fetchData = async () => {
    try {
      const response = await getData(
        "/courses",
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        })
      );
      setData(response.data);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Fetch levels
  const fetchLevels = async () => {
    try {
      const response = await getData(
        "levels-api",
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
          lang: "ar",
        })
      );
      setLevels(response.data);
    } catch (error) {
      console.error("Error fetching levels:", error);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, [token]);

  // edit course
  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      cour_no: course.cour_no,
      level: course.level,
      level_id: course.level_id,
      subject: course.subject,
      cover: course.cover,
      description: course.description || "",
      type: course.type || "",
      price: course.price || "",
      position: course.position || "",
    });
    setEditCourse(true);
  };

  const handleCloseDialog = () => {
    setEditCourse(false);
    setEditingCourse(null);
    setFormData({
      title: "",
      cour_no: "",
      level: "",
      level_id: 0,
      subject: "",
      cover: null,
      description: "",
      type: "",
      price: "",
      position: "",
    });
    setEditError(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteData(`/courses/${id}`, {
        Authorization: `Bearer ${token}`,
      });
      toast.success("تم الحذف بنجاح");
      fetchData();
    } catch (error) {
      throw error;
    }
  };

  const columns: ColumnDef<Course>[] = [
    {
      accessorKey: "title",
      header: "العنوان",
      cell: ({ row }) => {
        return (
          <Link href={`/courses/${row.original.id}`} className="lowercase whitespace-nowrap">
            {row.original.title}
          </Link>
        );
      },
    },
    {
      accessorKey: "cour_no",
      header: "عدد الكورسات",
      cell: ({ row }) => row.getValue("cour_no"),
    },
    {
      accessorKey: "level",
      header: "المستوي",
      cell: ({ row }) => row.getValue("level"),
    },
    {
      accessorKey: "subject",
      header: "الموضوع",
      cell: ({ row }) => row.getValue("subject"),
    },
    {
      accessorKey: "cover",
      header: "الغلاف",
      cell: ({ row }) => {
        const imageUrl: string = row.getValue("cover") || DEFAULT_IMAGE;
        return (
          <Avatar className="rounded-md">
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
      id: "actions",
      header: "الاجراءات",
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
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 hover:bg-red-50"
                onClick={() => handleDelete(item.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

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
        <Input
          placeholder="Filter by title..."
          value={(table.getColumn("title")?.getFilterValue() as string) || ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm min-w-[200px] h-10"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">اضافه كورس جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>اضافه كورس جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div className="space-y-2 flex items-center justify-center flex-col w-full">
                  <label htmlFor="cover" className="block text-sm font-medium">
                    صورة الكورس
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Input
                        id="cover"
                        type="file"
                        accept="image/*"
                        name="cover"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData((prev: FormData) => ({
                              ...prev,
                              cover: file,
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
                                ? formData.cover
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
                              setFormData((prev: FormData) => ({
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="title">عنوان الكورس</label>
                    <Input
                      id="title"
                      placeholder="Enter course title"
                      name="title"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="cour_no">عدد الكورسات</label>
                    <Input
                      id="cour_no"
                      placeholder="Enter course number"
                      name="cour_no"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="level">المستوى</label>
                    <select
                      id="level"
                      name="level"
                      onChange={(e) => {
                        const selectedLevel = levels.find(
                          (level) => level.name === e.target.value
                        );
                        setFormData((prev) => ({
                          ...prev,
                          level: e.target.value,
                          level_id: selectedLevel?.id || 0,
                        }));
                      }}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">اختر المستوى</option>
                      {levels.map((level) => (
                        <option key={level.id} value={level.name}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="subject">الموضوع</label>
                    <Input
                      id="subject"
                      placeholder="Enter subject"
                      name="subject"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="description">الوصف</label>
                    <Input
                      id="description"
                      placeholder="Enter course description"
                      name="description"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="type">النوع</label>
                    <select
                      id="type"
                      name="type"
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">اختر النوع</option>
                      <option value="paid">مدفوع</option>
                      <option value="free">مجاني</option>
                    </select>
                  </div>
                  {formData.type === "paid" && (
                    <div>
                      <label htmlFor="price">السعر</label>
                      <Input
                        id="price"
                        placeholder="Enter course price"
                        name="price"
                        onChange={handleInputChange}
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}
                  <div>
                    <label htmlFor="position">الموقع</label>
                    <select
                      id="position"
                      name="position"
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">اختر الموقع</option>
                      <option value="online">اونلاين</option>
                      <option value="offline">اوفلاين</option>
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
                    إضافة
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline" className="w-full">
                      إلغاء
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Course Dialog */}
      <Dialog open={editCourse} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل الكورس</DialogTitle>
          </DialogHeader>
          {editingCourse && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateCourse(editingCourse.id);
              }}
            >
              <div className="space-y-4">
                <div className="space-y-2 flex items-center justify-center flex-col w-full">
                  <label htmlFor="cover" className="block text-sm font-medium">
                    صورة الكورس
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Input
                        id="cover"
                        type="file"
                        accept="image/*"
                        name="cover"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData((prev: FormData) => ({
                              ...prev,
                              cover: file,
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
                                ? formData.cover
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
                              setFormData((prev: FormData) => ({
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="title">عنوان الكورس</label>
                    <Input
                      id="title"
                      placeholder="Enter course title"
                      name="title"
                      onChange={handleInputChange}
                      defaultValue={editingCourse.title}
                    />
                  </div>
                  <div>
                    <label htmlFor="cour_no">عدد الكورسات</label>
                    <Input
                      id="cour_no"
                      placeholder="Enter course number"
                      name="cour_no"
                      onChange={handleInputChange}
                      defaultValue={editingCourse.cour_no}
                    />
                  </div>
                  <div>
                    <label htmlFor="level">المستوى</label>
                    <select
                      id="level"
                      name="level"
                      onChange={(e) => {
                        const selectedLevel = levels.find(
                          (level) => level.name === e.target.value
                        );
                        setFormData((prev) => ({
                          ...prev,
                          level: e.target.value,
                          level_id: selectedLevel?.id || 0,
                        }));
                      }}
                      className="w-full p-2 border rounded"
                      defaultValue={editingCourse.level}
                    >
                      <option value="">اختر المستوى</option>
                      {levels.map((level) => (
                        <option key={level.id} value={level.name}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="subject">الموضوع</label>
                    <Input
                      id="subject"
                      placeholder="Enter subject"
                      name="subject"
                      onChange={handleInputChange}
                      defaultValue={editingCourse.subject}
                    />
                  </div>
                  <div>
                    <label htmlFor="description">الوصف</label>
                    <Input
                      id="description"
                      placeholder="Enter course description"
                      name="description"
                      onChange={handleInputChange}
                      defaultValue={editingCourse.description}
                    />
                  </div>
                  <div>
                    <label htmlFor="type">النوع</label>
                    <select
                      id="type"
                      name="type"
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      defaultValue={editingCourse.type}
                    >
                      <option value="">اختر النوع</option>
                      <option value="paid">مدفوع</option>
                      <option value="free">مجاني</option>
                    </select>
                  </div>
                  {formData.type === "paid" && (
                    <div>
                      <label htmlFor="price">السعر</label>
                      <Input
                        id="price"
                        placeholder="Enter course price"
                        name="price"
                        onChange={handleInputChange}
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={editingCourse.price}
                      />
                    </div>
                  )}
                  <div>
                    <label htmlFor="position">الموقع</label>
                    <select
                      id="position"
                      name="position"
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      defaultValue={editingCourse.position}
                    >
                      <option value="">اختر الموقع</option>
                      <option value="online">اونلاين</option>
                      <option value="offline">اوفلاين</option>
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
                  <DialogClose asChild>
                    <Button variant="outline" className="w-full">
                      إلغاء
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
    </>
  );
}

export default CoursesTable;
