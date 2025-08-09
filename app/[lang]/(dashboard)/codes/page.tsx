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

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Copy, Printer, Loader2, Trash2, Pencil } from "lucide-react";

import { useEffect, useState } from "react";
import { getData, postData } from "@/lib/axios/server";
import axios, { AxiosHeaders } from "axios";
import { StudentTypes, SubscriptionCodeTypes, Teacher, User } from "@/lib/type";
import toast from "react-hot-toast";

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

function BasicDataTable() {
  const [data, setData] = useState<SubscriptionCodeTypes[]>([]);
  const [token, setToken] = useState("");
  const [generatedCode, setGeneratedCode] = useState<
    SubscriptionCodeTypes[] | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTeacherSelectOpen, setIsTeacherSelectOpen] = useState(false);
  const [codeCount, setCodeCount] = useState<string | number | null>(1);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(
    null
  );
  const [validFrom, setValidFrom] = useState<string>("");
  const [validTo, setValidTo] = useState<string>("");

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
    total: 0,
    lastPage: 1,
    currentPage: 1,
    from: 1,
    to: 15,
    links: [] as PaginationLink[],
  });

  const [isLoading, setIsLoading] = useState(false);

  const [levels, setLevels] = useState<{ id: number; name: string }[]>([]);
  const [price, setPrice] = useState<string>("");
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

  const [isUsedFilter, setIsUsedFilter] = useState<string>("");

  // Multi-select delete states
  const [rowSelection, setRowSelection] = useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<SubscriptionCodeTypes | null>(null);

  // Use real database ID for row identification
  const getRowId = (row: SubscriptionCodeTypes) => row.id.toString();

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("تم نسخ الكود بنجاح");
  };

  // Single delete function
  const handleDelete = async () => {
    if (!selectedCode) return;
    setIsLoading(true);
    try {
      await postData(
        `subscription_codes/${selectedCode.id}`,
        { _method: "DELETE" },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      toast.success("تم حذف الكود بنجاح");
      setIsDeleteDialogOpen(false);
      refetchUsers();
    } catch (error) {
      console.error("Error deleting code:", error);
      toast.error("حدث خطأ أثناء حذف الكود");
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk delete function using real database IDs
  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).map(Number); // Real database IDs

    if (selectedIds.length === 0) return;

    setIsLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          postData(
            `subscription_codes/${id}`,
            { _method: "DELETE" },
            {
              Authorization: `Bearer ${token}`,
            }
          )
        )
      );
      toast.success(`تم حذف ${selectedIds.length} كود`);
      setRowSelection({});
      setIsBulkDeleteConfirmOpen(false);
      refetchUsers();
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف الجماعي");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch teachers for admin
  const fetchTeachers = async () => {
    if (user?.role !== "admin") return;
    try {
      const response = await getData(
        "teachers",
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        })
      );
      setTeachers(response.data);
    } catch (error) {
      console.log("Failed to fetch teachers");
    }
  };

  // Fetch levels for admin
  const fetchLevels = async () => {
    try {
      const response = await getData(
        "levels",
        {},
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        })
      );
      setLevels(response.data);
    } catch (error) {
      console.log("Failed to fetch levels");
    }
  };

  // refetch users
  const refetchUsers = async () => {
  setIsLoading(true);
  try {
    const response = await getData(
      "subscription_codes",
      {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        teacher_id: selectedTeacherId || undefined,
        is_used: isUsedFilter !== "" ? isUsedFilter : undefined,
      },
      {
        Authorization: `Bearer ${token}`,
      }
    );

    // Extract codes and paginate from the new response structure
    const { codes, paginate } = response.data;

    setData(codes); // Set the actual codes array

    setPagination((prev) => ({
      ...prev,
      total: paginate.total,
      lastPage: paginate.last_page,
      currentPage: paginate.current_page,
      from: paginate.from,
      to: paginate.to,
      links: paginate.links || [], // if links exist
    }));
  } catch (error) {
    console.error("Error fetching subscription codes:", error);
    setData([]);
    setPagination((prev) => ({
      ...prev,
      total: 0,
      lastPage: 1,
      currentPage: 1,
      from: 0,
      to: 0,
      links: [],
    }));
  } finally {
    setIsLoading(false);
  }
};

  // feach users from api
  useEffect(() => {
    refetchUsers();
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    token,
    selectedTeacherId,
    isUsedFilter,
  ]);

  // get token from next api
  useEffect(() => {
    const feachData = async () => {
      try {
        const response = await axios.get("/api/auth/getToken");
        setToken(response.data.token);
        const userData = JSON.parse(response.data.user);
        setUser(userData);
        if (userData.role === "admin") {
          fetchTeachers();
          fetchLevels();
        }
      } catch (error) {
        throw error;
      }
    };

    feachData();
  }, [token]);

  // Function to generate student code
  const generateStudentCode = async () => {
    if (user?.role === "admin") {
      setIsTeacherSelectOpen(true);
      return;
    }

    try {
      const response = await postData(
        "subscription_codes",
        {
          count: codeCount,
          teacher_id: user?.id,
          valid_from: validFrom,
          valid_to: validTo,
          price: price,
          level_id: selectedLevelId,
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setGeneratedCode(response.data);
      setIsDialogOpen(true);
      setPrice("");
      setSelectedLevelId(null);
    } catch (error) {
      console.error("Error generating student code:", error);
    }
  };

  const handleTeacherSelect = async (teacherId: number) => {
    setSelectedTeacherId(teacherId);
  };

  const handleGenerateCodes = async () => {
    if (!selectedTeacherId) return;

    try {
      const response = await postData(
        "subscription_codes",
        {
          count: codeCount,
          teacher_id: selectedTeacherId,
          valid_from: validFrom,
          valid_to: validTo,
          price: price,
          level_id: selectedLevelId,
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setGeneratedCode(response.data);
      setIsTeacherSelectOpen(false);
      setIsDialogOpen(true);
      setSelectedTeacherId(null);
      setValidFrom("");
      setValidTo("");
      setPrice("");
      setSelectedLevelId(null);
    } catch (error) {
      console.error("Error generating student code:", error);
    }
  };

  // UPDATED: New print format with grid layout - each cell is 52.5mm x 29.7mm
  const printCodes = () => {
    if (!generatedCode) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Calculate grid layout (4 columns per row to fit A4 page)
    const codesPerRow = 4;
    const rows = [];
    
    // Split codes into rows of 4
    for (let i = 0; i < generatedCode.length; i += codesPerRow) {
      const row = generatedCode.slice(i, i + codesPerRow);
      rows.push(row);
    }

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>Student Codes</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              padding: 5mm;
              background: white;
            }
            
            .header-section {
              text-align: center;
              margin-bottom: 5mm;
            }
            
            .header-section h1 {
              font-size: 18px;
              margin-bottom: 3mm;
            }
            
            .codes-grid {
              border-collapse: collapse;
              margin: 0 auto;
            }
            
            .codes-grid td {
              width: 52.5mm;
              height: 29.7mm;
              border: 1px solid #000;
              text-align: center;
              vertical-align: middle;
              font-size: 12px;
              font-weight: bold;
              padding: 2mm;
              position: relative;
            }
            
            .code-text {
              font-size: 14px;
              letter-spacing: 1px;
            }
            
            @media print {
              body {
                padding: 3mm;
              }
              
              .no-print {
                display: none;
              }
              
              @page {
                size: A4;
                margin: 5mm;
              }
              
              .codes-grid td {
                font-size: 11px;
              }
              
              .code-text {
                font-size: 13px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-section">
            <h1>أكواد الطلاب</h1>
            <div class="codes-container">
            ${generatedCode
              .map(
                (code) => `
              <div class="code">${code.code}</div>
            `
              )
              .join("")}
          </div>
            <div class="no-print">
              <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; margin-bottom: 10px;">طباعة</button>
            </div>
          </div>
          
          <table class="codes-grid">
            ${rows.map(row => `
              <tr>
                ${row.map(code => `
                  <td>
                    <div class="code-text">${code.code}</div>
                  </td>
                `).join('')}
                ${row.length < codesPerRow ? 
                  Array(codesPerRow - row.length).fill(0).map(() => `
                    <td>&nbsp;</td>
                  `).join('') : ''
                }
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // Selection column
  const selectionColumn: ColumnDef<SubscriptionCodeTypes> = {
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

  // Table columns with selection column and actions
  const columns: ColumnDef<SubscriptionCodeTypes>[] = [
    selectionColumn, // Add selection column first
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
      accessorKey: "price",
      header: "السعر",
      cell: ({ row }) => {
        const price = row.original.price;
        return price && Number(price) > 0 ? `${price} ج.م` : "مجاني";
      },
    },
    {
      accessorKey: "level_id",
      header: "المستوى",
      cell: ({ row }) => {
        const level = levels.find((l) => l.id === row.original.level_id);
        return level ? level.name : "-";
      },
    },
    {
      accessorKey: "valid_from",
      header: "تاريخ البداية",
      cell: ({ row }) => (
        <div>
          {new Date(row.original.valid_from).toLocaleDateString("en-US")}
        </div>
      ),
    },
    {
      accessorKey: "valid_to",
      header: "تاريخ النهاية",
      cell: ({ row }) => (
        <div>{new Date(row.original.valid_to).toLocaleDateString("en-US")}</div>
      ),
    },
    {
      accessorKey: "is_used",
      header: "حالة الاستخدام",
      cell: ({ row }) => (
        <Badge variant={row.original.is_used === 1 ? "soft" : "outline"}>
          {row.original.is_used === 1 ? "مستخدم" : "غير مستخدم"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "true" ? "soft" : "outline"}>
          {row.original.status === "true" ? "نشط" : "غير نشط"}
        </Badge>
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
      accessorKey: "teacher_name",
      header: "اسم المعلم",
      cell: ({ row }) => {
        return row.original.teacher_name;
      },
    },
    // Actions column
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedCode(row.original);
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

  // Table configuration with row selection
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: pagination.lastPage,
    
    // Use real database ID for row identification
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
          {/* is_used filter */}
          <select
            className="h-10 px-3 border rounded-md"
            value={isUsedFilter}
            onChange={(e) => {
              setIsUsedFilter(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <option value="">كل الحالات</option>
            <option value="1">مستخدم</option>
            <option value="0">غير مستخدم</option>
          </select>
          {/* teacher filter */}
          {user?.role === "admin" && (
            <select
              className="h-10 px-3 border rounded-md"
              value={selectedTeacherId || ""}
              onChange={(e) =>
                setSelectedTeacherId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
            >
              <option value="">جميع المعلمين</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher?.user.full_name}
                </option>
              ))}
            </select>
          )}
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
            onClick={generateStudentCode}
            variant="outline"
            className="h-10"
          >
            إنشاء كود طالب
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>كود الطالب </DialogTitle>
          </DialogHeader>
          <div className="py-4 overflow-auto max-h-[90vh]">
            {generatedCode?.map((code) => (
              <div
                key={code.id}
                className="flex items-center justify-center gap-2 mb-2"
              >
                <div className="text-center text-2xl font-bold tracking-wider">
                  {code.code}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(code.code)}
                  className="h-8 w-8"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex justify-center mt-4">
              <Button
                onClick={printCodes}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                طباعة الأكواد
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              يرجى حفظ هذا الكود. لن يتم عرضه مرة أخرى.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTeacherSelectOpen} onOpenChange={setIsTeacherSelectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>اختر المعلم</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <select
              className="w-full p-2 border rounded-md"
              onChange={(e) => handleTeacherSelect(Number(e.target.value))}
              value={selectedTeacherId || ""}
            >
              <option value="">اختر المعلم</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher?.user.full_name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-sm">عدد الأكواد:</label>
              <Input
                type="number"
                min="1"
                value={codeCount as string}
                onChange={(e) => {
                  setCodeCount(e.target.value);
                }}
                className="w-20"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm">تاريخ البداية:</label>
                <Input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm">تاريخ النهاية:</label>
                <Input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-sm">السعر:</label>
              <Input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-24"
                placeholder="السعر"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-sm">المستوى:</label>
              <select
                className="w-40 p-2 border rounded-md"
                value={selectedLevelId || ""}
                onChange={(e) =>
                  setSelectedLevelId(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">اختر المستوى</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleGenerateCodes}
              disabled={
                !selectedTeacherId || !codeCount || !validFrom || !validTo
              }
              className="w-full"
            >
              إنشاء الأكواد
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Single Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>هل أنت متأكد من حذف هذا الكود؟</p>
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
              هل أنت متأكد من حذف <strong>{selectedCount}</strong> كود؟ لا يمكن التراجع.
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

      {/* Subscription codes table */}
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
                  No results found.
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

          {/* Page Numbers */}
          <div className="flex items-center gap-2">
            {(() => {
              const currentPage = pagination.currentPage;
              const lastPage = pagination.lastPage;
              const pages = [];

              // Always show first page
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

              // Calculate start and end of page range
              let start = Math.max(2, currentPage - 1);
              let end = Math.min(lastPage - 1, currentPage + 1);

              // Add ellipsis after first page if needed
              if (start > 2) {
                pages.push(
                  <span key="ellipsis1" className="px-2">
                    ...
                  </span>
                );
              }

              // Add middle pages
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

              // Add ellipsis before last page if needed
              if (end < lastPage - 1) {
                pages.push(
                  <span key="ellipsis2" className="px-2">
                    ...
                  </span>
                );
              }

              // Always show last page if there is more than one page
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
    </>
  );
}

export default BasicDataTable;