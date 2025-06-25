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

interface Job {
  id: number;
  title: string;
  slug: string;
  description: string;
  salary: string;
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
  data: Job[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

type FormData = {
  title: string;
  slug: string;
  description: string;
  salary: string;
};

function JobsDataTable() {
  const [data, setData] = useState<Job[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    slug: "",
    description: "",
    salary: "",
  });

  // refetch jobs
  const refetchJobs = async (page: number = 1) => {
    try {
      const response = await getData(
        `works?page=${page}`,
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setData(response.data.data);
      setTotalPages(response.meta.last_page);
      setCurrentPage(response.meta.current_page);
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

  // handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Handle title change and auto-generate slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  // add job validation schema
  const schema = z.object({
    title: z.string().min(2, "Title is required"),
    slug: z.string().min(2, "Slug is required"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    salary: z.string().min(1, "Salary is required"),
  });

  const { register, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "all",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await postData("works", formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });

      reset();
      setFormData({
        title: "",
        slug: "",
        description: "",
        salary: "",
      });
      refetchJobs();
      toast.success("تم إضافة الوظيفة بنجاح");
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

  // update job
  const updateJob = async (id: number) => {
    try {
      await postData(
        `works/${id}`,
        { ...formData, _method: "PUT" },
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      );

      reset();
      setEditingJob(null);
      refetchJobs();
      toast.success("تم تحديث الوظيفة بنجاح");
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

  // delete job
  const deleteJob = async (id: number) => {
    try {
      await deleteData(`works/${id}`, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });

      reset();
      setEditingJob(null);
      refetchJobs();
      toast.success("تم حذف الوظيفة بنجاح");
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

  // fetch jobs from api
  useEffect(() => {
    if (token) {
      refetchJobs(currentPage);
    }
  }, [token, currentPage]);

  // Update useEffect to set form data when editing job changes
  useEffect(() => {
    if (editingJob) {
      setFormData({
        title: editingJob.title,
        slug: editingJob.slug,
        description: editingJob.description,
        salary: editingJob.salary,
      });
    }
  }, [editingJob]);

  // columns of table
  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: "title",
      header: "عنوان الوظيفة",
      cell: ({ row }) => {
        const job = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{job.title}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "الوصف",
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.description}>
          {row.original.description}
        </div>
      ),
    },
    {
      accessorKey: "salary",
      header: "الراتب",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-medium">
          ${parseFloat(row.original.salary).toLocaleString()}
        </Badge>
      ),
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center justify-center">
          <Button onClick={() => setEditingJob(row.original)} size="sm">
            تعديل
          </Button>
          <Button
            onClick={() => deleteJob(row.original.id)}
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

  return (
    <>
      <div className="flex items-center gap-2 px-4 mb-4">
        {/* search input */}
        <Input
          placeholder="بحث بالعنوان..."
          value={(table.getColumn("title")?.getFilterValue() as string) || ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm min-w-[200px] h-10"
        />
        {/* add job Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">إضافة وظيفة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة وظيفة جديدة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title">عنوان الوظيفة</label>
                  <Input
                    {...register("title")}
                    id="title"
                    placeholder="أدخل عنوان الوظيفة"
                    name="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                  />
                </div>
                <div>
                  <label htmlFor="slug">الرابط المختصر</label>
                  <Input
                    {...register("slug")}
                    id="slug"
                    placeholder="job-slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="description">وصف الوظيفة</label>
                  <textarea
                    {...register("description")}
                    id="description"
                    placeholder="أدخل وصف مفصل للوظيفة"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded min-h-[100px] resize-vertical"
                  />
                </div>
                <div>
                  <label htmlFor="salary">الراتب</label>
                  <Input
                    {...register("salary")}
                    id="salary"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                {error && (
                  <p
                    className="text-red-500 mt-2"
                    dangerouslySetInnerHTML={{ __html: error }}
                  />
                )}
              </div>
              <div className="mt-6 space-y-2">
                <Button type="submit" className="w-full">
                  إضافة
                </Button>
                <DialogClose asChild>
                  <Button
                    ref={dialogCloseRef}
                    variant="outline"
                    className="w-full"
                  >
                    إلغاء
                  </Button>
                </DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Job Dialog */}
      <Dialog open={!!editingJob} onOpenChange={() => setEditingJob(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل الوظيفة</DialogTitle>
          </DialogHeader>
          {editingJob && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateJob(editingJob.id);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit_title">عنوان الوظيفة</label>
                  <Input
                    id="edit_title"
                    placeholder="أدخل عنوان الوظيفة"
                    name="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                  />
                </div>
                <div>
                  <label htmlFor="edit_slug">الرابط المختصر</label>
                  <Input
                    id="edit_slug"
                    placeholder="job-slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="edit_description">وصف الوظيفة</label>
                  <textarea
                    id="edit_description"
                    placeholder="أدخل وصف مفصل للوظيفة"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded min-h-[100px] resize-vertical"
                  />
                </div>
                <div>
                  <label htmlFor="edit_salary">الراتب</label>
                  <Input
                    id="edit_salary"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                {editError && (
                  <p
                    className="text-red-500 mt-2"
                    dangerouslySetInnerHTML={{ __html: editError }}
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

      {/* jobs table */}
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
              onClick={() => refetchJobs(currentPage - 1)}
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
                    onClick={() => refetchJobs(pageNumber)}
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
              onClick={() => refetchJobs(currentPage + 1)}
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

export default JobsDataTable;
