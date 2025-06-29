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
import {
  Upload,
  X,
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
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
  const [totalUsers, setTotalUsers] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
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

    const [filters, setFilters] = useState({
      subject_id: "",
      to_date: "",
      from_date: "",
      search: "",
    });

    // Statistics data
    const [stats, setStats] = useState({
      totalTeachers: 0,
      totalSubjects: 0,
      activeUsers: 0,
      growthRate: 0,
    });

    // Reset form data
    const resetFormData = () => {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        role: "teacher",
        cover: "",
        password: "",
        avatar: "",
      });
    };

    // refetch users
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
    },[]);

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
        await postData(`teachers/${editingUser.user.id}`, formData, {
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

    // Handle edit user click
    const handleEditUser = (user: User) => {
      setEditingUser(user);
      setFormData({
        full_name: user.user.full_name,
        email: user.user.email,
        phone: user.user.phone,
        role: user.user.role,
        cover: user.user.avatar,
        password: "",
        avatar: user.user.avatar,
        subject_id: user.user.subject_id?.toString() || "",
      });
      setShowEditModal(true);
      setEditError(null);
    };

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
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_IMAGE;
                  }}
                />
                <AvatarFallback>
                  {user.user.full_name?.[0] ?? "?"}
                </AvatarFallback>
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

        <div className="flex flex-wrap items-center gap-2 px-4 mb-4">
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
          {/* Filter: Search */}
          <Input
            placeholder="بحث بالاسم أو البريد..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
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
