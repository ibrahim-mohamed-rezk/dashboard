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

interface Subject {
  id: number;
  name: string;
  description: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  path: string;
}

interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

interface ApiResponse {
  data: Subject[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

type FormData = {
  name: string;
  description: string;
};

function SubjectsDataTable() {
  const [data, setData] = useState<Subject[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const editDialogCloseRef = useRef<HTMLButtonElement>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
  });

  // Refetch subjects (keep pagination in request, remove client table limit)
  const refetchSubjects = async (page: number = 1) => {
    try {
      const response: ApiResponse = await getData(
        `subjects?page=${page}`,
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
      toast.error("فشل في جلب البيانات");
    }
  };

  // Get token from Next.js API
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

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // Add subject validation schema
  const schema = z.object({
    name: z.string().min(2, "اسم المادة مطلوب"),
    description: z.string().min(2, "الوصف مطلوب"),
  });

  const { register, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "all",
  });

  // Handle submit for adding new subject
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await postData("subjects", formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
      reset();
      setFormData({
        name: "",
        description: "",
      });
      refetchSubjects(currentPage);
      toast.success("تم إضافة المادة بنجاح");
      dialogCloseRef.current?.click();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join("<br>");
          setError(errorMessages);
        } else {
          setError("حدث خطأ أثناء الإضافة");
        }
      } else {
        setError("حدث خطأ غير متوقع");
      }
    }
  };

  // Update subject
  const updateSubject = async (id: number) => {
    setEditError(null);
    try {
      await postData(
        `subjects/${id}`,
        { ...formData, _method: "PUT" },
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      );
      reset();
      setEditingSubject(null);
      refetchSubjects(currentPage);
      toast.success("تم تحديث المادة بنجاح");
      editDialogCloseRef.current?.click();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join("<br>");
          setEditError(errorMessages);
        } else {
          setEditError("حدث خطأ أثناء التحديث");
        }
      } else {
        setEditError("حدث خطأ غير متوقع");
      }
    }
  };

  // Delete subject (single)
  const deleteSubject = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه المادة؟")) {
      return;
    }
    try {
      await deleteData(`subjects/${id}`, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
      refetchSubjects(currentPage);
      toast.success("تم حذف المادة بنجاح");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join(" ");
          toast.error(errorMessages);
        } else {
          toast.error("حدث خطأ أثناء الحذف");
        }
      } else {
        toast.error("حدث خطأ غير متوقع");
      }
    }
  };

  // Bulk delete (no per-item confirm)
  const deleteSelectedSubjects = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;

    const ids = selectedRows.map((row) => row.original.id);
    const message = `هل أنت متأكد من حذف ${ids.length} مادة(مواد)؟`;
    if (!confirm(message)) return;

    // Perform deletions one by one (same logic as single delete)
    for (const id of ids) {
      try {
        await deleteData(`subjects/${id}`, {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        });
      } catch (err) {
        const errorMsg = axios.isAxiosError(err)
          ? Object.values(err.response?.data?.errors || {}).flat().join(" ")
          : "حذف فاشل";
        toast.error(`فشل في حذف المادة ${id}: ${errorMsg}`);
      }
    }

    refetchSubjects(currentPage);
    toast.success(`تم حذف ${ids.length} مادة(مواد) بنجاح`);
    table.toggleAllPageRowsSelected(false);
  };

  // Fetch subjects from API (with pagination)
  useEffect(() => {
    if (token) {
      refetchSubjects(currentPage);
    }
    // eslint-disable-next-line
  }, [token, currentPage]);

  // Update form data when editing subject changes
  useEffect(() => {
    if (editingSubject) {
      setFormData({
        name: editingSubject.name,
        description: editingSubject.description,
      });
    }
  }, [editingSubject]);

  // Reset form when dialog closes
  const handleAddDialogClose = () => {
    setFormData({
      name: "",
      description: "",
    });
    setError(null);
  };

  const handleEditDialogClose = () => {
    setEditingSubject(null);
    setFormData({
      name: "",
      description: "",
    });
    setEditError(null);
  };

  // Columns with multi-select checkbox
  const columns: ColumnDef<Subject>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="w-4 h-4 accent-blue-600"
          checked={table.getIsAllPageRowsSelected()}
          onChange={() => table.toggleAllPageRowsSelected()}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="w-4 h-4 accent-blue-600"
          checked={row.getIsSelected()}
          onChange={() => row.toggleSelected()}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "اسم المادة",
      cell: ({ row }) => {
        return <span className="font-medium">{row.original.name}</span>;
      },
    },
    {
      accessorKey: "description",
      header: "الوصف",
      cell: ({ row }) => {
        return <span>{row.original.description}</span>;
      },
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center justify-center">
          <Button
            onClick={() => setEditingSubject(row.original)}
            size="sm"
            variant="outline"
          >
            تعديل
          </Button>
          <Button
            onClick={() => deleteSubject(row.original.id)}
            className="bg-red-500 hover:bg-red-600"
            size="sm"
          >
            حذف
          </Button>
        </div>
      ),
    },
  ];

  // Table instance with selection (remove client-side pagination limit)
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true, // Enable multi-select
    manualPagination: true, // Tell table that pagination is handled server-side
    pageCount: totalPages,
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: data.length, // Show all data from server page, no client limit
      },
    },
    onPaginationChange: (updater) => {
      // Not used, we handle pagination via refetchSubjects
    },
  });

  return (
    <>
      <div className="flex items-center gap-2 px-4 mb-4">
        {/* Search Input */}
        <Input
          placeholder="بحث بالاسم..."
          value={(table.getColumn("name")?.getFilterValue() as string) || ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm min-w-[200px] h-10"
        />

        {/* Bulk Delete Button */}
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={deleteSelectedSubjects}
          >
            حذف المحدد ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
        )}

        {/* Add Subject Dialog */}
        <Dialog onOpenChange={(open) => !open && handleAddDialogClose()}>
          <DialogTrigger asChild>
            <Button variant="outline">إضافة مادة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة مادة جديدة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-2 text-sm font-medium"
                  >
                    اسم المادة
                  </label>
                  <Input
                    {...register("name")}
                    id="name"
                    placeholder="أدخل اسم المادة"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block mb-2 text-sm font-medium"
                  >
                    الوصف
                  </label>
                  <Input
                    {...register("description")}
                    id="description"
                    placeholder="أدخل وصف المادة"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                {error && (
                  <p
                    className="text-red-500 mt-2 text-sm"
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
                    type="button"
                  >
                    إلغاء
                  </Button>
                </DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Subject Dialog */}
      <Dialog
        open={!!editingSubject}
        onOpenChange={(open) => !open && handleEditDialogClose()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل المادة</DialogTitle>
          </DialogHeader>
          {editingSubject && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSubject(editingSubject.id);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="edit_name"
                    className="block mb-2 text-sm font-medium"
                  >
                    اسم المادة
                  </label>
                  <Input
                    id="edit_name"
                    placeholder="أدخل اسم المادة"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit_description"
                    className="block mb-2 text-sm font-medium"
                  >
                    الوصف
                  </label>
                  <Input
                    id="edit_description"
                    placeholder="أدخل وصف المادة"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                {editError && (
                  <p
                    className="text-red-500 mt-2 text-sm"
                    dangerouslySetInnerHTML={{ __html: editError }}
                  />
                )}
              </div>
              <div className="mt-6 space-y-2">
                <Button type="submit" className="w-full">
                  تحديث
                </Button>
                <DialogClose asChild>
                  <Button
                    ref={editDialogCloseRef}
                    variant="outline"
                    className="w-full"
                    type="button"
                  >
                    إلغاء
                  </Button>
                </DialogClose>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Subjects Table */}
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
              onClick={() => refetchSubjects(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-9 px-4 font-medium"
            >
              السابق
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant="outline"
                    size="sm"
                    onClick={() => refetchSubjects(pageNumber)}
                    className={`w-9 h-9 font-medium transition-all duration-200 ${
                      pageNumber === currentPage
                        ? "scale-110 bg-blue-100 dark:bg-blue-900"
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
              onClick={() => refetchSubjects(currentPage + 1)}
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

export default SubjectsDataTable;