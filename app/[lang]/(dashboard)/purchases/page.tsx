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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useEffect, useState } from "react";
import { getData, postData } from "@/lib/axios/server";
import axios from "axios";
import { toast } from "react-hot-toast";

interface User {
  id: number;
  full_name: string;
  email: string | null;
  phone: string;
  gender: string | null;
  avatar: string | null;
  role: string;
  email_verified_at: string;
  block: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Purchastable {
  id: number;
  cour_no?: string;
  user_id: number;
  teacher_id?: number;
  subject_id?: number;
  level_id?: number;
  title: string;
  slug: string;
  description: string;
  price: string;
  type: string;
  position?: string;
  image: string;
  cover: string | null;
  meta_description: string;
  meta_keywords: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Purchase {
  id: number;
  user_id: number;
  cobon_id: number | null;
  purchastable_id: number;
  purchastable_type: string;
  status: "complete" | "pending" | "failed";
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  purchastable: Purchastable | null;
  user: User;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ApiResponse {
  data: Purchase[];
  meta: PaginationMeta;
}

function PurchasesDataTable() {
  const [data, setData] = useState<Purchase[]>([]);
  const [token, setToken] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [purchaseType, setPurchaseType] = useState<"courses" | "books">(
    "courses"
  );
  const [isLoading, setIsLoading] = useState(false);

  // refetch purchases
  const refetchPurchases = async (
    page: number = 1,
    type: string = purchaseType
  ) => {
    setIsLoading(true);
    try {
      const response = await getData(
        `purchases?page=${page}&type=${type}`,
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
    } finally {
      setIsLoading(false);
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

  // fetch purchases from api
  useEffect(() => {
    if (token) {
      refetchPurchases(currentPage, purchaseType);
    }
  }, [token, currentPage, purchaseType]);

  // change purchase status
  const changeStatus = async (
    id: number,
    newStatus: "complete" | "pending" | "failed"
  ) => {
    try {
      await postData(
        `purchases/${id}/change-status`,
        { status: newStatus },
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      );

      refetchPurchases(currentPage, purchaseType);
      toast.success("تم تحديث حالة الشراء بنجاح");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join("<br>");
          toast.error(errorMessages);
        } else {
          toast.error("حدث خطأ أثناء تحديث الحالة");
        }
      } else {
        toast.error("حدث خطأ غير متوقع");
      }
      throw error;
    }
  };

  // get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return <Badge className="bg-green-500 hover:bg-green-600">مكتمل</Badge>;
      case "pending":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            قيد الانتظار
          </Badge>
        );
      case "failed":
        return <Badge className="bg-red-500 hover:bg-red-600">فشل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // columns of table
  const columns: ColumnDef<Purchase>[] = [
    {
      accessorKey: "user",
      header: "المستخدم",
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{user.full_name}</span>
            <span className="text-sm text-gray-500">
              {user.email || user.phone}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "purchastable",
      header: purchaseType === "courses" ? "الدورة" : "الكتاب",
      cell: ({ row }) => {
        const purchastable = row.original.purchastable;
        if (!purchastable) {
          return <span className="text-gray-400">غير متوفر</span>;
        }
        return (
          <div className="flex flex-col">
            <span className="font-medium">{purchastable.title}</span>
            <span className="text-sm text-gray-500">
              ${parseFloat(purchastable.price).toLocaleString()}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "transaction_id",
      header: "معرف المعاملة",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.transaction_id || "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "created_at",
      header: "تاريخ الشراء",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return date.toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      },
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => {
        const currentStatus = row.original.status;
        return (
          <Select
            value={currentStatus}
            onValueChange={(value: "complete" | "pending" | "failed") =>
              changeStatus(row.original.id, value)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="complete">مكتمل</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="failed">فشل</SelectItem>
            </SelectContent>
          </Select>
        );
      },
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
          placeholder="بحث بالاسم..."
          value={(table.getColumn("user")?.getFilterValue() as string) || ""}
          onChange={(event) =>
            table.getColumn("user")?.setFilterValue(event.target.value)
          }
          className="max-w-sm min-w-[200px] h-10"
        />

        {/* Type filter */}
        <Select
          value={purchaseType}
          onValueChange={(value: "courses" | "books") => {
            setPurchaseType(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="courses">الدورات</SelectItem>
            <SelectItem value="books">الكتب</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* purchases table */}
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  جاري التحميل...
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
              onClick={() => refetchPurchases(currentPage - 1, purchaseType)}
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
                    onClick={() => refetchPurchases(pageNumber, purchaseType)}
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
              onClick={() => refetchPurchases(currentPage + 1, purchaseType)}
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

export default PurchasesDataTable;
