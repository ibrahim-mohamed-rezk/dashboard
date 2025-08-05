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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Copy, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getData, postData } from "@/lib/axios/server";
import axios from "axios";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface Coupon {
  id: number; // ✅ Real backend ID
  code: number;
  status: string;
  discount: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface CouponPayload {
  code: number;
  status: string;
  discount: number;
  start_time: string;
  end_time: string;
  _method?: string;
}

function BasicDataTable() {
  const [data, setData] = useState<Coupon[]>([]);
  const [token, setToken] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    status: "percentage",
    discount: "",
    start_time: "",
    end_time: "",
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
    lastPage: 1,
    currentPage: 1,
    from: 1,
    to: 10,
    links: [] as PaginationLink[],
  });

  // Track selected rows by real `coupon.id`
  const [rowSelection, setRowSelection] = useState({});

  // ✅ CRITICAL: Use real database ID for row identification
  const getRowId = (row: Coupon) => row.id.toString();

  const copyToClipboard = (code: number) => {
    navigator.clipboard.writeText(code.toString());
    toast.success("تم نسخ الكود بنجاح");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      code: "",
      status: "percentage",
      discount: "",
      start_time: "",
      end_time: "",
    });
    setSelectedCoupon(null);
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setSelectedCoupon(coupon);
      setFormData({
        code: coupon.code.toString(),
        status: coupon.status,
        discount: coupon.discount.toString(),
        start_time: coupon.start_time.split("T")[0],
        end_time: coupon.end_time.split("T")[0],
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let payload: CouponPayload = {
        code: parseInt(formData.code),
        status: formData.status,
        discount: parseFloat(formData.discount),
        start_time: formData.start_time,
        end_time: formData.end_time,
      };
      if (selectedCoupon) {
        payload = {
          ...payload,
          _method: "PUT",
        };
        await postData(`cobons/${selectedCoupon.id}`, payload, {
          Authorization: `Bearer ${token}`,
        });
        toast.success("تم تحديث الكوبون بنجاح");
      } else {
        await postData("cobons", payload, {
          Authorization: `Bearer ${token}`,
        });
        toast.success("تم إنشاء الكوبون بنجاح");
      }
      setIsDialogOpen(false);
      resetForm();
      refetchCoupons();
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast.error("حدث خطأ أثناء حفظ الكوبون");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCoupon) return;
    setIsLoading(true);
    try {
      await postData(
        `cobons/${selectedCoupon.id}`,
        { _method: "DELETE" },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      toast.success("تم حذف الكوبون بنجاح");
      setIsDeleteDialogOpen(false);
      refetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("حدث خطأ أثناء حذف الكوبون");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Bulk delete now uses real database IDs
  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).map(Number); // ✅ Now these are real database IDs

    if (selectedIds.length === 0) return;

    setIsLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          postData(
            `cobons/${id}`,
            { _method: "DELETE" },
            {
              Authorization: `Bearer ${token}`,
            }
          )
        )
      );
      toast.success(`تم حذف ${selectedIds.length} كوبون`);
      setRowSelection({});
      setIsBulkDeleteConfirmOpen(false);
      refetchCoupons();
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف الجماعي");
    } finally {
      setIsLoading(false);
    }
  };

  // refetch coupons
  const refetchCoupons = async () => {
    setIsLoading(true);
    try {
      const response = await getData(
        "cobons",
        {
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setData(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total,
        lastPage: response.data.last_page,
        currentPage: response.data.current_page,
        from: response.data.from,
        to: response.data.to,
        links: response.data.links,
      }));
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  // fetch coupons from api
  useEffect(() => {
    if (token) {
      refetchCoupons();
    }
  }, [pagination.pageIndex, pagination.pageSize, token]);

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
  }, []);

  // Update useEffect to set form data when editing coupon changes
  useEffect(() => {
    if (selectedCoupon) {
      setFormData({
        code: selectedCoupon.code.toString(),
        status: selectedCoupon.status,
        discount: selectedCoupon.discount.toString(),
        start_time: selectedCoupon.start_time.split("T")[0],
        end_time: selectedCoupon.end_time.split("T")[0],
      });
    }
  }, [selectedCoupon]);

  // Selection column
  const selectionColumn: ColumnDef<Coupon> = {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="w-4 h-4 rounded border-gray-300"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={() => row.toggleSelected()}
          className="w-4 h-4 rounded border-gray-300"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  };

  // columns of table
  const columns: ColumnDef<Coupon>[] = [
    selectionColumn, // Add first
    {
      accessorKey: "code",
      header: "الكود",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono">{row.original.code}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard(row.original.code)}
            className="h-8 w-8"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "نوع الخصم",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.status === "percentage" ? "نسبة مئوية" : "قيمة ثابتة"}
        </Badge>
      ),
    },
    {
      accessorKey: "discount",
      header: "قيمة الخصم",
      cell: ({ row }) => (
        <div>
          {row.original.status === "percentage"
            ? `${row.original.discount}%`
            : row.original.discount}
        </div>
      ),
    },
    {
      accessorKey: "start_time",
      header: "تاريخ البداية",
      cell: ({ row }) => (
        <div>
          {new Date(row.original.start_time).toLocaleDateString("en-US")}
        </div>
      ),
    },
    {
      accessorKey: "end_time",
      header: "تاريخ النهاية",
      cell: ({ row }) => (
        <div>{new Date(row.original.end_time).toLocaleDateString("en-US")}</div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "تاريخ الإنشاء",
      cell: ({ row }) => (
        <div>
          {new Date(row.original.created_at).toLocaleDateString("en-US")}
        </div>
      ),
    },
    {
      accessorKey: "updated_at",
      header: "تاريخ التحديث",
      cell: ({ row }) => (
        <div>
          {new Date(row.original.updated_at).toLocaleDateString("en-US")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDialog(row.original)}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedCoupon(row.original);
              setIsDeleteDialogOpen(true);
            }}
            className="h-8 w-8 text-outline"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // ✅ FIXED: Table config with real ID-based row selection
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: pagination.lastPage,
    
    // ✅ CRITICAL: Use real database ID for row identification
    getRowId, // This ensures selection uses real IDs, not table indices
    
    // Enable row selection
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
      rowSelection, // Now contains real IDs as keys
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

  // Get selected count
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-4 mb-4">
        <div className="flex items-center gap-2">
          {/* search input */}
          <Input
            placeholder="البحث عن طريق الكود..."
            value={(table.getColumn("code")?.getFilterValue() as string) || ""}
            onChange={(event) =>
              table.getColumn("code")?.setFilterValue(event.target.value)
            }
            className="max-w-sm min-w-[200px] h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Show bulk delete button only if items selected */}
          {selectedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkDeleteConfirmOpen(true)}
              className="h-10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              حذف {selectedCount} عنصر
            </Button>
          )}

          <Button
            onClick={() => handleOpenDialog()}
            variant="outline"
            className="h-10"
          >
            <Plus className="h-4 w-4 mr-2" />
            إنشاء كوبون جديد
          </Button>
        </div>
      </div>

      {/* coupons table */}
      <div className="overflow-x-auto relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
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
          <div className="flex items-center gap-2">
            {(() => {
              const currentPage = pagination.currentPage;
              const lastPage = pagination.lastPage;
              const pages = [];
              pages.push(
                <Button
                  key="1"
                  variant={currentPage === 1 ? "soft" : "outline"}
                  size="sm"
                  onClick={() => table.setPageIndex(0)}
                  className={`w-9 h-9 font-medium transition-all duration-200 ${
                    currentPage === 1 ? "scale-110" : "hover:scale-105"
                  }`}
                >
                  1
                </Button>
              );
              let start = Math.max(2, currentPage - 1);
              let end = Math.min(lastPage - 1, currentPage + 1);
              if (start > 2) {
                pages.push(
                  <span key="ellipsis1" className="px-2">
                    ...
                  </span>
                );
              }
              for (let i = start; i <= end; i++) {
                pages.push(
                  <Button
                    key={i}
                    variant={currentPage === i ? "soft" : "outline"}
                    size="sm"
                    onClick={() => table.setPageIndex(i - 1)}
                    className={`w-9 h-9 font-medium transition-all duration-200 ${
                      currentPage === i ? "scale-110" : "hover:scale-105"
                    }`}
                  >
                    {i}
                  </Button>
                );
              }
              if (end < lastPage - 1) {
                pages.push(
                  <span key="ellipsis2" className="px-2">
                    ...
                  </span>
                );
              }
              if (lastPage > 1) {
                pages.push(
                  <Button
                    key={lastPage}
                    variant={currentPage === lastPage ? "soft" : "outline"}
                    size="sm"
                    onClick={() => table.setPageIndex(lastPage - 1)}
                    className={`w-9 h-9 font-medium transition-all duration-200 ${
                      currentPage === lastPage ? "scale-110" : "hover:scale-105"
                    }`}
                  >
                    {lastPage}
                  </Button>
                );
              }
              return pages;
            })()}
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

      {/* Create/Edit Coupon Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCoupon ? "تعديل الكوبون" : "إنشاء كوبون جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="code" className="block text-sm font-medium">
                  الكود
                </label>
                <input
                  id="code"
                  name="code"
                  type="number"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md"
                  placeholder="أدخل الكود"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="status" className="block text-sm font-medium">
                  نوع الخصم
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={(e) => handleSelectChange("status", e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="percentage">نسبة مئوية</option>
                  <option value="fixed">قيمة ثابتة</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="discount" className="block text-sm font-medium">
                قيمة الخصم
              </label>
              <input
                id="discount"
                name="discount"
                type="number"
                step="0.01"
                min="0"
                value={formData.discount}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded-md"
                placeholder={
                  formData.status === "percentage"
                    ? "أدخل النسبة المئوية"
                    : "أدخل القيمة الثابتة"
                }
              />
              <p className="text-xs text-gray-500">
                {formData.status === "percentage"
                  ? "أدخل النسبة المئوية (مثال: 10 لخصم 10%)"
                  : "أدخل القيمة الثابتة للخصم"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="start_time"
                  className="block text-sm font-medium"
                >
                  تاريخ البداية
                </label>
                <input
                  id="start_time"
                  name="start_time"
                  type="date"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="end_time" className="block text-sm font-medium">
                  تاريخ النهاية
                </label>
                <input
                  id="end_time"
                  name="end_time"
                  type="date"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md"
                  min={
                    formData.start_time ||
                    new Date().toISOString().split("T")[0]
                  }
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                className="mr-2"
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedCoupon ? "تحديث" : "إنشاء"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Single Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>هل أنت متأكد من حذف هذا الكوبون؟</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف الجماعي</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              هل أنت متأكد من حذف <strong>{selectedCount}</strong> كوبون؟ لا يمكن التراجع.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteConfirmOpen(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button
              variant="outline"
              onClick={handleBulkDelete}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BasicDataTable;