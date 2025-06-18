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
import { Upload, X } from "lucide-react";
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
    subject_id?: string;
  };
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

type FormData = {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
  subject_id?: string;
  cover: string | File | null;
  avatar: string | File | null;
};

const DEFAULT_IMAGE = "https://via.placeholder.com/150x150";

function BasicDataTable() {
  const [data, setData] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<SubjectsData[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    role: "teacher",
    cover: "",
    password: "",
    avatar: "",
  });

  // refetch users
  const refetchUsers = async (page: number = 1) => {
    try {
      const response = await getData(
        `teachers?page=${page}`,
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

  // handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // add user
  const schema = z.object({
    full_name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(8, "Phone is required"),
    role: z.enum(["teacher", "student"]),
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
  const updateUser = async (id: number) => {
    try {
      await postData(`teachers/${id}`, formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      reset();
      setEditingUser(null);
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

  // feach users from api
  useEffect(() => {
    refetchUsers(currentPage);
  }, [token, currentPage]);

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
      } catch (error) {
        console.log(error);
      }
    };

    feachData();
  }, [token]);

  // Update useEffect to set form data when editing user changes
  useEffect(() => {
    if (editingUser) {
      setFormData({
        full_name: editingUser.user.full_name,
        email: editingUser.user.email,
        phone: editingUser.user.phone,
        role: editingUser.user.role,
        cover: editingUser.user.avatar,
        password: "",
        avatar: editingUser.user.avatar,
        subject_id: editingUser.user.subject_id?.toString() || "",
      });
    }
  }, [editingUser]);

  // columns of table
  const columns: ColumnDef<User>[] = [
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
                  e.currentTarget.onerror = null; // Prevents infinite loop
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
      accessorKey: "role",
      header: "دور",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.user.role}
        </Badge>
      ),
    },
    {
      accessorKey: "role",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center justify-center">
          <Button onClick={() => setEditingUser(row.original)}>تعديل</Button>
          <Button
            onClick={() => deleteUser(row.original.user.id)}
            className="bg-red-500"
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

  return (
    <>
      <div className=" flex items-center gap-2 px-4 mb-4">
        {/* search input */}
        <Input
          placeholder="Filter by name..."
          value={
            (table.getColumn("full_name")?.getFilterValue() as string) || ""
          }
          onChange={(event) =>
            table.getColumn("full_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm min-w-[200px] h-10"
        />
        {/* add user Dialog */}
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
                  <label htmlFor="cover" className="block text-sm font-medium">
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
                              setFormData((prev) => ({ ...prev, cover: null }))
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
                    name="full_name"
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData((prev) => ({
                        ...prev,
                        subject_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select subject</option>
                    {subjects?.map((subject) => (
                      <option key={subject?.id} value={subject?.id}>
                        {subject?.name}
                      </option>
                    ))}
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

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل المعلم</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUser(editingUser.id);
              }}
            >
              <div className="space-y-4">
                <div className="space-y-2 flex items-center justify-center flex-col w-full">
                  <label htmlFor="cover" className="block text-sm font-medium">
                    صورة المستخدم
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
                <div>
                  <label htmlFor="full_name">اسم المستخدم</label>
                  <Input
                    {...register("full_name")}
                    id="full_name"
                    placeholder="Enter full name"
                    name="full_name"
                    onChange={handleInputChange}
                    value={formData.full_name}
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
                    value={formData.email}
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
                    value={formData.phone}
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
                  <label htmlFor="subject_id">المادة</label>
                  <select
                    {...register("subject_id")}
                    id="subject_id"
                    className="w-full p-2 border rounded"
                    name="subject_id"
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData((prev) => ({
                        ...prev,
                        subject_id: e.target.value,
                      }))
                    }
                    value={formData.subject_id}
                  >
                    <option value="">اختر المادة</option>
                    {subjects?.map((subject) => (
                      <option key={subject?.id} value={subject?.id}>
                        {subject?.name}
                      </option>
                    ))}
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
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* users table */}
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

            {/* Page Numbers */}
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
    </>
  );
}

export default BasicDataTable;
