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

interface Level {
  id: number;
  name: string;
  marketing_teachers: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

interface ApiResponse {
  data: Level[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

type FormData = {
  name: string;
  marketing_teachers: string;
};

function LevelsDataTable() {
  const [data, setData] = useState<Level[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const editDialogCloseRef = useRef<HTMLButtonElement>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    marketing_teachers: "",
  });

  // Refetch levels
  const refetchLevels = async (page: number = 1) => {
    try {
      const response = await getData(
        `levels?page=${page}`,
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

  // Add level validation schema
  const schema = z.object({
    name: z.string().min(2, "اسم المستوى مطلوب"),
    marketing_teachers: z.string().min(2, "اسم التسويق مطلوب"),
  });

  const { register, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "all",
  });

  // Handle submit for adding new level
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await postData("levels", formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
      reset();
      setFormData({
        name: "",
        marketing_teachers: "",
      });
      refetchLevels();
      toast.success("تم إضافة المستوى بنجاح");
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

  // Update level
  const updateLevel = async (id: number) => {
    setEditError(null);
    try {
      await postData(
        `levels/${id}`,
        { ...formData, _method: "PUT" },
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      );
      reset();
      setEditingLevel(null);
      refetchLevels();
      toast.success("تم تحديث المستوى بنجاح");
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

  // Delete level (single)
  const deleteLevel = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستوى؟")) {
      return;
    }
    try {
      await deleteData(`levels/${id}`, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
      refetchLevels();
      toast.success("تم حذف المستوى بنجاح");
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
  const deleteSelectedLevels = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;

    const ids = selectedRows.map((row) => row.original.id);
    const message = `هل أنت متأكد من حذف ${ids.length} مستوى(مستويات)؟`;
    if (!confirm(message)) return;

    // Perform deletions one by one (same logic as single delete)
    for (const id of ids) {
      try {
        await deleteData(`levels/${id}`, {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        });
      } catch (err) {
        const errorMsg = axios.isAxiosError(err)
          ? Object.values(err.response?.data?.errors || {}).flat().join(" ")
          : "حذف فاشل";
        toast.error(`فشل في حذف المستوى ${id}: ${errorMsg}`);
      }
    }

    refetchLevels();
    toast.success(`تم حذف ${ids.length} مستوى(مستويات) بنجاح`);
    table.toggleAllPageRowsSelected(false);
  };

  // Fetch levels from API
  useEffect(() => {
    if (token) {
      refetchLevels(currentPage);
    }
  }, [token, currentPage]);

  // Update form data when editing level changes
  useEffect(() => {
    if (editingLevel) {
      setFormData({
        name: editingLevel.name,
        marketing_teachers: editingLevel.marketing_teachers,
      });
    }
  }, [editingLevel]);

  // Reset form when dialog closes
  const handleAddDialogClose = () => {
    setFormData({
      name: "",
      marketing_teachers: "",
    });
    setError(null);
  };

  const handleEditDialogClose = () => {
    setEditingLevel(null);
    setFormData({
      name: "",
      marketing_teachers: "",
    });
    setEditError(null);
  };

  // Columns with multi-select checkbox
  const columns: ColumnDef<Level>[] = [
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
      header: "اسم المستوى",
      cell: ({ row }) => {
        return <span className="font-medium">{row.original.name}</span>;
      },
    },
    {
      accessorKey: "marketing_teachers",
      header: "اسم التسويق للمعلمين",
      cell: ({ row }) => {
        return <span>{row.original.marketing_teachers}</span>;
      },
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center justify-center">
          <Button
            onClick={() => setEditingLevel(row.original)}
            size="sm"
            variant="outline"
          >
            تعديل
          </Button>
          <Button
            onClick={() => deleteLevel(row.original.id)}
            className="bg-red-500 hover:bg-red-600"
            size="sm"
          >
            حذف
          </Button>
        </div>
      ),
    },
  ];

  // Table instance with selection
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true, // Enable multi-select
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
            onClick={deleteSelectedLevels}
          >
            حذف المحدد ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
        )}

        {/* Add Level Dialog */}
        <Dialog onOpenChange={(open) => !open && handleAddDialogClose()}>
          <DialogTrigger asChild>
            <Button variant="outline">إضافة مستوى</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة مستوى جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-2 text-sm font-medium"
                  >
                    اسم المستوى
                  </label>
                  <Input
                    {...register("name")}
                    id="name"
                    placeholder="أدخل اسم المستوى"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="marketing_teachers"
                    className="block mb-2 text-sm font-medium"
                  >
                    اسم التسويق للمعلمين
                  </label>
                  <Input
                    {...register("marketing_teachers")}
                    id="marketing_teachers"
                    placeholder="أدخل اسم التسويق"
                    name="marketing_teachers"
                    value={formData.marketing_teachers}
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

      {/* Edit Level Dialog */}
      <Dialog
        open={!!editingLevel}
        onOpenChange={(open) => !open && handleEditDialogClose()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل المستوى</DialogTitle>
          </DialogHeader>
          {editingLevel && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateLevel(editingLevel.id);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="edit_name"
                    className="block mb-2 text-sm font-medium"
                  >
                    اسم المستوى
                  </label>
                  <Input
                    id="edit_name"
                    placeholder="أدخل اسم المستوى"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit_marketing_teachers"
                    className="block mb-2 text-sm font-medium"
                  >
                    اسم التسويق للمعلمين
                  </label>
                  <Input
                    id="edit_marketing_teachers"
                    placeholder="أدخل اسم التسويق"
                    name="marketing_teachers"
                    value={formData.marketing_teachers}
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

      {/* Levels Table */}
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
              onClick={() => refetchLevels(currentPage - 1)}
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
                    onClick={() => refetchLevels(pageNumber)}
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
              onClick={() => refetchLevels(currentPage + 1)}
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

export default LevelsDataTable;