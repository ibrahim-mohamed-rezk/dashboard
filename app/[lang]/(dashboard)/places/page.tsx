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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";

import { useEffect, useState } from "react";
import { getData, postData, deleteData } from "@/lib/axios/server";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Building2, Globe, Map } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Governorate {
  id: number;
  name: string;
}

interface Area {
  id: number;
  name: string;
  governorate_id: number;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface GovernoratesResponse {
  data: Governorate[];
  meta: PaginationMeta;
}

interface AreasResponse {
  data: Area[];
  meta: PaginationMeta;
}

// Statistics Card Component
const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "blue",
}: {
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  color?: "blue" | "green" | "purple" | "orange";
}) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    green: "bg-green-50 border-green-200 text-green-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
    orange: "bg-orange-50 border-orange-200 text-orange-800",
  };

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  return (
    <div
      className={`p-6 rounded-lg border ${colorClasses[color]} dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
        </div>
        <div
          className={`p-3 rounded-full ${iconColorClasses[color]} bg-white dark:bg-gray-700`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

function GovernoratesAreasManagement() {
  // Governorates state
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [governoratesMeta, setGovernoratesMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [governoratePageIndex, setGovernoratePageIndex] = useState(0); // 0-based
  const [governoratePageSize, setGovernoratePageSize] = useState(10);
  const [governorateSearch, setGovernorateSearch] = useState("");

  // Areas state
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasMeta, setAreasMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [areaPageIndex, setAreaPageIndex] = useState(0); // 0-based
  const [areaPageSize, setAreaPageSize] = useState(10);
  const [areaSearch, setAreaSearch] = useState("");

  // Token and tab
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState<"governorates" | "areas">(
    "governorates"
  );

  // Governorate dialog states
  const [isGovernorateDialogOpen, setIsGovernorateDialogOpen] = useState(false);
  const [isEditingGovernorate, setIsEditingGovernorate] = useState(false);
  const [editingGovernorate, setEditingGovernorate] =
    useState<Governorate | null>(null);
  const [governorateFormData, setGovernorateFormData] = useState({
    name: "",
  });

  // Area dialog states
  const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);
  const [isEditingArea, setIsEditingArea] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [areaFormData, setAreaFormData] = useState({
    name: "",
    governorate_id: "",
  });

  const [error, setError] = useState<string | null>(null);

  // Statistics
  const statistics = {
    totalGovernorates: governoratesMeta.total,
    totalAreas: areasMeta.total,
    averageAreasPerGovernorate:
      governoratesMeta.total > 0
        ? Math.round(areasMeta.total / governoratesMeta.total)
        : 0,
    activeLocations: governoratesMeta.total + areasMeta.total,
  };

  // Get token from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/auth/getToken");
        setToken(response.data.token);
      } catch (error) {
        console.error("Error fetching token:", error);
      }
    };

    fetchData();
  }, []);

  // Fetch governorates
  const refetchGovernorates = async (
    pageIndex = governoratePageIndex,
    pageSize = governoratePageSize,
    search = governorateSearch
  ) => {
    try {
      const params: any = {
        page: pageIndex + 1,
        per_page: pageSize,
      };
      if (search) params.search = search;
      const response = await getData(
        "governorates",
        params,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setGovernorates(response.data || []);
      setGovernoratesMeta(response.meta || {
        current_page: 1,
        last_page: 1,
        per_page: pageSize,
        total: 0,
      });
    } catch (error) {
      console.error("Error fetching governorates:", error);
    }
  };

  // Fetch areas
  const refetchAreas = async (
    pageIndex = areaPageIndex,
    pageSize = areaPageSize,
    search = areaSearch
  ) => {
    try {
      const params: any = {
        page: pageIndex + 1,
        per_page: pageSize,
      };
      if (search) params.search = search;
      const response = await getData(
        "areas",
        params,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setAreas(response.data || []);
      setAreasMeta(response.meta || {
        current_page: 1,
        last_page: 1,
        per_page: pageSize,
        total: 0,
      });
    } catch (error) {
      console.error("Error fetching areas:", error);
    }
  };

  // Fetch data when token or pagination/search changes
  useEffect(() => {
    if (token) {
      refetchGovernorates();
      refetchAreas();
    }
    // eslint-disable-next-line
  }, [token]);

  // Governorates pagination/search effect
  useEffect(() => {
    if (token) {
      refetchGovernorates(governoratePageIndex, governoratePageSize, governorateSearch);
    }
    // eslint-disable-next-line
  }, [governoratePageIndex, governoratePageSize, governorateSearch, token]);

  // Areas pagination/search effect
  useEffect(() => {
    if (token) {
      refetchAreas(areaPageIndex, areaPageSize, areaSearch);
    }
    // eslint-disable-next-line
  }, [areaPageIndex, areaPageSize, areaSearch, token]);

  // Governorate form handlers
  const handleGovernorateInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setGovernorateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGovernorateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", governorateFormData.name);

      if (isEditingGovernorate && editingGovernorate) {
        formData.append("_method", "PUT");
        await postData(`governorates/${editingGovernorate.id}`, formData, {
          Authorization: `Bearer ${token}`,
        });
        toast.success("تم تحديث المحافظة بنجاح");
      } else {
        await postData("governorates", formData, {
          Authorization: `Bearer ${token}`,
        });
        toast.success("تم إضافة المحافظة بنجاح");
      }

      setIsGovernorateDialogOpen(false);
      setGovernorateFormData({ name: "" });
      refetchGovernorates();
      setError(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join(", ");
          setError(errorMessages);
        } else {
          setError("حدث خطأ");
        }
      } else {
        setError("حدث خطأ غير متوقع");
      }
    }
  };

  // Area form handlers
  const handleAreaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAreaFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAreaGovernorateChange = (value: string) => {
    setAreaFormData((prev) => ({
      ...prev,
      governorate_id: value,
    }));
  };

  const handleAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", areaFormData.name);
      formData.append("governorate_id", areaFormData.governorate_id);

      if (isEditingArea && editingArea) {
        formData.append("_method", "PUT");
        await postData(
          `areas/${editingArea.id}`,
          formData,
          {
            Authorization: `Bearer ${token}`,
          }
        );
        toast.success("تم تحديث المنطقة بنجاح");
      } else {
        await postData("areas", formData, {
          Authorization: `Bearer ${token}`,
        });
        toast.success("تم إضافة المنطقة بنجاح");
      }

      setIsAreaDialogOpen(false);
      setAreaFormData({ name: "", governorate_id: "" });
      refetchAreas();
      setError(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join(", ");
          setError(errorMessages);
        } else {
          setError("حدث خطأ");
        }
      } else {
        setError("حدث خطأ غير متوقع");
      }
    }
  };

  // Edit handlers
  const handleEditGovernorate = (governorate: Governorate) => {
    setEditingGovernorate(governorate);
    setGovernorateFormData({
      name: governorate.name,
    });
    setIsEditingGovernorate(true);
    setIsGovernorateDialogOpen(true);
  };

  const handleEditArea = (area: Area) => {
    setEditingArea(area);
    setAreaFormData({
      name: area.name,
      governorate_id: area.governorate_id.toString(),
    });
    setIsEditingArea(true);
    setIsAreaDialogOpen(true);
  };

  // Delete handlers
  const handleDeleteGovernorate = async (id: number) => {
    if (
      !window.confirm(
        "هل أنت متأكد من حذف هذه المحافظة؟ سيتم حذف جميع المناطق التابعة لها أيضاً."
      )
    )
      return;
    try {
      await deleteData(`governorates/${id}`, {
        Authorization: `Bearer ${token}`,
      });
      toast.success("تم حذف المحافظة بنجاح");
      refetchGovernorates();
      refetchAreas(); // In case areas are affected
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join(", ");
          setError(errorMessages);
        } else {
          setError("حدث خطأ");
        }
      } else {
        setError("حدث خطأ غير متوقع");
      }
    }
  };

  const handleDeleteArea = async (id: number) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المنطقة؟")) return;
    try {
      await deleteData(`areas/${id}`, {
        Authorization: `Bearer ${token}`,
      });
      toast.success("تم حذف المنطقة بنجاح");
      refetchAreas();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join(", ");
          setError(errorMessages);
        } else {
          setError("حدث خطأ");
        }
      } else {
        setError("حدث خطأ غير متوقع");
      }
    }
  };

  // Get governorate name by ID
  const getGovernorateNameById = (id: number) => {
    const governorate = governorates.find((g) => g.id === id);
    return governorate ? governorate.name : "غير محدد";
  };

  // Governorate columns
  const governorateColumns: ColumnDef<Governorate>[] = [
    {
      accessorKey: "id",
      header: "المعرف",
      cell: ({ row }) => <Badge variant="outline">{row.original.id}</Badge>,
    },
    {
      accessorKey: "name",
      header: "اسم المحافظة",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      id: "areas_count",
      header: "عدد المناطق",
      cell: ({ row }) => {
        // This will only count areas in the current page, not all pages!
        const count = areas.filter(
          (area) => area.governorate_id === row.original.id
        ).length;
        return (
          <Badge variant="soft" className="bg-green-50 text-green-700">
            {count} منطقة
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const governorate = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditGovernorate(governorate)}
            >
              تعديل
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteGovernorate(governorate.id)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              حذف
            </Button>
          </div>
        );
      },
    },
  ];

  // Area columns
  const areaColumns: ColumnDef<Area>[] = [
    {
      accessorKey: "id",
      header: "المعرف",
      cell: ({ row }) => <Badge variant="outline">{row.original.id}</Badge>,
    },
    {
      accessorKey: "name",
      header: "اسم المنطقة",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-green-600" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "governorate_id",
      header: "المحافظة",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span>{getGovernorateNameById(row.original.governorate_id)}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const area = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditArea(area)}
            >
              تعديل
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteArea(area.id)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              حذف
            </Button>
          </div>
        );
      },
    },
  ];

  // Tables
  const governorateTable = useReactTable({
    data: governorates,
    columns: governorateColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: governoratesMeta.last_page,
    state: {
      pagination: {
        pageIndex: governoratePageIndex,
        pageSize: governoratePageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const next = updater({
          pageIndex: governoratePageIndex,
          pageSize: governoratePageSize,
        });
        setGovernoratePageIndex(next.pageIndex);
        setGovernoratePageSize(next.pageSize);
      } else if (typeof updater === "object") {
        setGovernoratePageIndex(updater.pageIndex);
        setGovernoratePageSize(updater.pageSize);
      }
    },
  });

  const areaTable = useReactTable({
    data: areas,
    columns: areaColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: areasMeta.last_page,
    state: {
      pagination: {
        pageIndex: areaPageIndex,
        pageSize: areaPageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const next = updater({
          pageIndex: areaPageIndex,
          pageSize: areaPageSize,
        });
        setAreaPageIndex(next.pageIndex);
        setAreaPageSize(next.pageSize);
      } else if (typeof updater === "object") {
        setAreaPageIndex(updater.pageIndex);
        setAreaPageSize(updater.pageSize);
      }
    },
  });

  // Pagination Controls Component
  function PaginationControls({
    table,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    totalRows,
    lastPage,
    pageSizeOptions = [5, 10, 20, 50, 100],
  }: {
    table: any;
    pageIndex: number;
    setPageIndex: (idx: number) => void;
    pageSize: number;
    setPageSize: (size: number) => void;
    totalRows: number;
    lastPage: number;
    pageSizeOptions?: number[];
  }) {
    return (
      <div className="flex flex-row items-center justify-center gap-2 py-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(0)}
            disabled={pageIndex === 0}
          >
            {"<<"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0}
          >
            {"<"}
          </Button>
          <span className="text-sm">
            صفحة{" "}
            <strong>
              {pageIndex + 1} من {lastPage}
            </strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(Math.min(lastPage - 1, pageIndex + 1))}
            disabled={pageIndex + 1 >= lastPage}
          >
            {">"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(lastPage - 1)}
            disabled={pageIndex + 1 >= lastPage}
          >
            {">>"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي المحافظات"
          value={statistics.totalGovernorates}
          icon={Globe}
          color="blue"
        />
        <StatCard
          title="إجمالي المناطق"
          value={statistics.totalAreas}
          icon={Building2}
          color="green"
        />
        <StatCard
          title="متوسط المناطق لكل محافظة"
          value={statistics.averageAreasPerGovernorate}
          icon={Map}
          color="purple"
        />
        <StatCard
          title="إجمالي المواقع"
          value={statistics.activeLocations}
          icon={MapPin}
          color="orange"
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1 mb-6">
        <button
          onClick={() => setActiveTab("governorates")}
          className={cn(
            "flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors",
            activeTab === "governorates"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          المحافظات
        </button>
        <button
          onClick={() => setActiveTab("areas")}
          className={cn(
            "flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors",
            activeTab === "areas"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          المناطق
        </button>
      </div>

      {/* Governorates Tab */}
      {activeTab === "governorates" && (
        <>
          <div className="flex items-center justify-between gap-2 px-4 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="البحث في المحافظات..."
                value={governorateSearch}
                onChange={(event) => {
                  setGovernorateSearch(event.target.value);
                  setGovernoratePageIndex(0);
                }}
                className="max-w-sm min-w-[200px] h-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Dialog
              open={isGovernorateDialogOpen}
              onOpenChange={setIsGovernorateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setIsEditingGovernorate(false);
                    setEditingGovernorate(null);
                    setGovernorateFormData({ name: "" });
                    setError(null);
                  }}
                >
                  إضافة محافظة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {isEditingGovernorate
                      ? "تعديل المحافظة"
                      : "إضافة محافظة جديدة"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleGovernorateSubmit} className="space-y-4">
                  <div className="space-y-2 flex flex-col">
                    <Label htmlFor="governorate_name">اسم المحافظة</Label>
                    <input
                      id="governorate_name"
                      name="name"
                      type="text"
                      value={governorateFormData.name}
                      onChange={handleGovernorateInputChange}
                      placeholder="أدخل اسم المحافظة"
                      required
                      className="max-w-sm min-w-[200px] h-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {error && <div className="text-red-500 text-sm">{error}</div>}

                  <Button type="submit" className="w-full">
                    {isEditingGovernorate ? "تحديث" : "إضافة"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto">
            <Table className="dark:bg-[#1F2937] w-full rounded-md shadow-md">
              <TableHeader>
                {governorateTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead className="!text-right" key={header.id}>
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
                {governorateTable.getRowModel().rows?.length ? (
                  governorateTable.getRowModel().rows.map((row) => (
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
                    <TableCell
                      colSpan={governorateColumns.length}
                      className="text-center"
                    >
                      لا توجد محافظات.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <PaginationControls
              table={governorateTable}
              pageIndex={governoratePageIndex}
              setPageIndex={setGovernoratePageIndex}
              pageSize={governoratePageSize}
              setPageSize={setGovernoratePageSize}
              totalRows={governoratesMeta.total}
              lastPage={governoratesMeta.last_page}
            />
          </div>
        </>
      )}

      {/* Areas Tab */}
      {activeTab === "areas" && (
        <>
          <div className="flex items-center justify-between gap-2 px-4 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="البحث في المناطق..."
                value={areaSearch}
                onChange={(event) => {
                  setAreaSearch(event.target.value);
                  setAreaPageIndex(0);
                }}
                className="max-w-sm min-w-[200px] h-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Dialog open={isAreaDialogOpen} onOpenChange={setIsAreaDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setIsEditingArea(false);
                    setEditingArea(null);
                    setAreaFormData({ name: "", governorate_id: "" });
                    setError(null);
                  }}
                >
                  إضافة منطقة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {isEditingArea ? "تعديل المنطقة" : "إضافة منطقة جديدة"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAreaSubmit} className="space-y-4">
                  <div className="space-y-2 flex flex-col">
                    <Label htmlFor="area_name">اسم المنطقة</Label>
                    <input
                      id="area_name"
                      name="name"
                      type="text"
                      value={areaFormData.name}
                      onChange={handleAreaInputChange}
                      placeholder="أدخل اسم المنطقة"
                      required
                      className="max-w-sm min-w-[200px] h-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2 flex flex-col">
                    <Label htmlFor="governorate_select">المحافظة</Label>
                    <select
                      id="governorate_select"
                      name="governorate_id"
                      value={areaFormData.governorate_id}
                      onChange={(e) =>
                        handleAreaGovernorateChange(e.target.value)
                      }
                      required
                      className="max-w-sm min-w-[200px] h-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>
                        اختر المحافظة
                      </option>
                      {governorates.map((governorate) => (
                        <option key={governorate.id} value={governorate.id}>
                          {governorate.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && <div className="text-red-500 text-sm">{error}</div>}

                  <Button type="submit" className="w-full">
                    {isEditingArea ? "تحديث" : "إضافة"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto">
            <Table className="dark:bg-[#1F2937] w-full rounded-md shadow-md">
              <TableHeader>
                {areaTable.getHeaderGroups().map((headerGroup) => (
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
                {areaTable.getRowModel().rows?.length ? (
                  areaTable.getRowModel().rows.map((row) => (
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
                    <TableCell
                      colSpan={areaColumns.length}
                      className="text-center"
                    >
                      لا توجد مناطق.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <PaginationControls
              table={areaTable}
              pageIndex={areaPageIndex}
              setPageIndex={setAreaPageIndex}
              pageSize={areaPageSize}
              setPageSize={setAreaPageSize}
              totalRows={areasMeta.total}
              lastPage={areasMeta.last_page}
            />
          </div>
        </>
      )}
    </>
  );
}

export default GovernoratesAreasManagement;
