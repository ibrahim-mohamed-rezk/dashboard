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
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  TrendingUp,
  Target,
  Filter,
  Download,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getData } from "@/lib/axios/server";
import axios from "axios";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import useAuthrization from "@/hooks/useAuthrization";
import { User } from "@/lib/type";

// Statistics Card Component
const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "blue",
}: {
  title: string;
  value: string | number;
  icon: any;
  color?: string;
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green:
      "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    orange:
      "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div
          className={`p-3 rounded-full ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// Interface for exam result data
interface ExamResult {
  exam_id: number;
  title: string;
  type: string;
  student_id: number;
  student: string;
  level: string;
  group: string;
  correct: number;
  wrong: number;
  total: number;
  percentage: number;
}

function ExamStatisticsTable() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<ExamResult[]>([]);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter options data
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  // Filter states
  const [filters, setFilters] = useState({
    student_id: "",
    exam_id: "",
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
    total: 0,
    lastPage: 1,
  });

  // Statistics state
  const [statistics, setStatistics] = useState({
    totalExams: 0,
    totalStudents: 0,
    averagePercentage: 0,
    totalAttempts: 0,
  });

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Calculate statistics from data
  const calculateStatistics = (examData: ExamResult[]) => {
    const uniqueExams = new Set(examData.map((item) => item.exam_id)).size;
    const uniqueStudents = new Set(examData.map((item) => item.student_id))
      .size;
    const totalAttempts = examData.length;
    const averagePercentage =
      examData.length > 0
        ? examData.reduce((sum, item) => sum + item.percentage, 0) /
          examData.length
        : 0;

    setStatistics({
      totalExams: uniqueExams,
      totalStudents: uniqueStudents,
      averagePercentage: Math.round(averagePercentage * 100) / 100,
      totalAttempts,
    });
  };

  // Export to Excel function
  const exportToExcel = async () => {
    if (!data.length) {
      alert("لا توجد بيانات للتصدير");
      return;
    }

    setIsExporting(true);
    try {
      // Prepare data for export
      const exportData = data.map((item) => ({
        "رقم الامتحان": item.exam_id,
        "عنوان الامتحان": item.title || "بدون عنوان",
        "نوع الامتحان": item.type || "-",
        "رقم الطالب": item.student_id,
        "اسم الطالب": item.student,
        المرحلة: item.level,
        المجموعة: item.group || "بدون مجموعة",
        "الإجابات الصحيحة": item.correct,
        "الإجابات الخاطئة": item.wrong,
        "إجمالي الأسئلة": item.total,
        "النسبة المئوية": `${item.percentage.toFixed(2)}%`,
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "نتائج الامتحانات");

      // Add statistics sheet
      const statsData = [
        { الإحصائية: "إجمالي الامتحانات", القيمة: statistics.totalExams },
        { الإحصائية: "إجمالي الطلاب", القيمة: statistics.totalStudents },
        {
          الإحصائية: "متوسط النسبة المئوية",
          القيمة: `${statistics.averagePercentage}%`,
        },
        { الإحصائية: "إجمالي المحاولات", القيمة: statistics.totalAttempts },
      ];
      const statsWs = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, statsWs, "الإحصائيات");

      // Generate filename with current date
      const currentDate = new Date().toLocaleDateString("ar-SA");
      const filename = `نتائج_الامتحانات_${currentDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("حدث خطأ أثناء تصدير الملف");
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch students and exams for filter options
  const fetchFilterOptions = async () => {
    if (!token) return;

    try {
      // Fetch students
      const studentsResponse = await getData(
        "students",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setStudents(
        studentsResponse.data?.students ||
          studentsResponse.data ||
          studentsResponse
      );

      // Fetch exams
      const examsResponse = await getData(
        "exams",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setExams(examsResponse.data || examsResponse);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // Fetch exam results data
  const fetchExamResults = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getData(
        "exam-result-student",
        {
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          ...filters,
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );

      const examData = response.data || response;
      setData(examData);

      // Update pagination if response has pagination info
      if (response.meta) {
        setPagination((prev) => ({
          ...prev,
          total: response.meta.total,
          lastPage: response.meta.last_page,
        }));
      }

      calculateStatistics(examData);
    } catch (error: any) {
      console.error("Failed to fetch exam results:", error);
      setError("فشل في تحميل بيانات النتائج");
    } finally {
      setLoading(false);
    }
  };

  // Get token from API
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await axios.get("/api/auth/getToken");
        setToken(response.data.token);
        
        // Get user from localStorage
        const userDataString = localStorage.getItem("user");
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to get token:", error);
      }
    };
    fetchToken();
  }, []);

  // Fetch data when token or filters change
  useEffect(() => {
    if (token) {
      fetchExamResults();
      fetchFilterOptions();
    }
  }, [token, pagination.pageIndex, pagination.pageSize, filters]);

  // Table columns definition
  const columns: ColumnDef<ExamResult>[] = [
    {
      accessorKey: "exam_id",
      header: "رقم الامتحان",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {row.original.exam_id}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "عنوان الامتحان",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          {row.original.title || "بدون عنوان"}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "نوع الامتحان",
      cell: ({ row }) => (
        <span className="capitalize">
          {row.original.type ? row.original.type : "-"}
        </span>
      ),
    },
    {
      accessorKey: "student_id",
      header: "رقم الطالب",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.original.student_id}
        </span>
      ),
    },
    {
      accessorKey: "student",
      header: "اسم الطالب",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.student}</div>
      ),
    },
    {
      accessorKey: "level",
      header: "المرحلة",
      cell: ({ row }) => <div className="text-sm">{row.original.level}</div>,
    },
    {
      accessorKey: "group",
      header: "المجموعة",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.group || "بدون مجموعة"}</div>
      ),
    },
    {
      accessorKey: "correct",
      header: "الإجابات الصحيحة",
      cell: ({ row }) => (
        <Badge variant="soft" className="bg-green-100 text-green-700">
          {row.original.correct}
        </Badge>
      ),
    },
    {
      accessorKey: "wrong",
      header: "الإجابات الخاطئة",
      cell: ({ row }) => (
        <Badge variant="soft" className="bg-red-100 text-red-700">
          {row.original.wrong}
        </Badge>
      ),
    },
    {
      accessorKey: "total",
      header: "إجمالي الأسئلة",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.total}</span>
      ),
    },
    {
      accessorKey: "percentage",
      header: "النسبة المئوية",
      cell: ({ row }) => {
        const percentage = row.original.percentage;
        const getPercentageColor = (pct: number) => {
          if (pct >= 80) return "text-green-600 bg-green-100";
          if (pct >= 60) return "text-yellow-600 bg-yellow-100";
          return "text-red-600 bg-red-100";
        };

        return (
          <Badge
            variant="soft"
            className={`${getPercentageColor(percentage)} font-medium`}
          >
            {percentage.toFixed(2)}%
          </Badge>
        );
      },
    },
  ];

  // Table configuration
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: pagination.lastPage,
    state: {
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    },
    onPaginationChange: (updater) => {
      const newPagination =
        updater instanceof Function ? updater(pagination) : updater;
      setPagination((prev) => ({
        ...prev,
        pageIndex: newPagination.pageIndex,
        pageSize: newPagination.pageSize,
      }));
    },
  });

  const isAuthrized = useAuthrization({
    user: user as User,
    module: ["ExamsStatistics"],
  });
  if (!isAuthrized) {
    return <div>ليس لديك صلاحية لعرض هذه الصفحة</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Section */}
      <div className="mb-8 px-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          إحصائيات نتائج الامتحانات
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="إجمالي الامتحانات"
            value={statistics.totalExams}
            icon={BookOpen}
            color="blue"
          />
          <StatCard
            title="إجمالي الطلاب"
            value={statistics.totalStudents}
            icon={Users}
            color="green"
          />
          <StatCard
            title="متوسط النسبة المئوية"
            value={`${statistics.averagePercentage}%`}
            icon={TrendingUp}
            color="orange"
          />
          <StatCard
            title="إجمالي المحاولات"
            value={statistics.totalAttempts}
            icon={Target}
            color="purple"
          />
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col gap-4 px-4 mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Student Filter */}
          <div className="min-w-[200px]">
            <Label htmlFor="student_id">الطالب</Label>
            <select
              id="student_id"
              value={filters.student_id}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, student_id: e.target.value }))
              }
              className="w-full px-3 flex justify-between items-center read-only:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition duration-300 border-default-300 text-default-500 focus:outline-none focus:border-default-500/50 disabled:bg-default-200 placeholder:text-accent-foreground/50 border rounded-lg h-10 text-sm"
            >
              <option value="">كل الطلاب</option>
              {students?.map((student: any) => (
                <option key={student.id} value={student.id}>
                  {student.user?.full_name ||
                    student.full_name ||
                    `الطالب ${student.user?.id || student.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Filter */}
          <div className="min-w-[200px]">
            <Label htmlFor="exam_id">الامتحان</Label>
            <select
              id="exam_id"
              value={filters.exam_id}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, exam_id: e.target.value }))
              }
              className="w-full px-3 flex justify-between items-center read-only:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition duration-300 border-default-300 text-default-500 focus:outline-none focus:border-default-500/50 disabled:bg-default-200 placeholder:text-accent-foreground/50 border rounded-lg h-10 text-sm"
            >
              <option value="">كل الامتحانات</option>
              {exams?.map((exam: any) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title || `الامتحان ${exam.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                student_id: "",
                exam_id: "",
              });
            }}
            className="h-10 px-4"
          >
            <Filter className="w-4 h-4 mr-2" />
            إعادة تعيين الفلاتر
          </Button>

          {/* Export to Excel Button */}
          <Button
            onClick={exportToExcel}
            disabled={isExporting || !data.length}
            className="h-10 px-4 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                تصدير Excel
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <Table className="dark:bg-[#1F2937] w-full rounded-md shadow-md">
          <TableHeader>
            {table.getHeaderGroups()?.map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers?.map((header) => (
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
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8"
                >
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    جاري التحميل...
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8"
                >
                  <div className="text-red-500">
                    <p className="font-medium">خطأ في تحميل البيانات</p>
                    <p className="text-sm">{error}</p>
                    <Button
                      onClick={fetchExamResults}
                      variant="outline"
                      className="mt-2"
                    >
                      إعادة المحاولة
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows?.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells()?.map((cell) => (
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
                  colSpan={columns.length}
                  className="text-center py-8"
                >
                  <div className="text-gray-500">
                    <p className="font-medium">لا توجد نتائج</p>
                    <p className="text-sm">
                      لم يتم العثور على أي نتائج امتحانات
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {!loading && !error && table.getRowModel().rows?.length > 0 && (
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
              {Array.from(
                { length: pagination.lastPage },
                (_, i) => i + 1
              )?.map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={
                    pageNumber === table.getState().pagination.pageIndex + 1
                      ? "soft"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => table.setPageIndex(pageNumber - 1)}
                  className={`w-9 h-9 font-medium transition-all duration-200 ${
                    pageNumber === table.getState().pagination.pageIndex + 1
                      ? "scale-110"
                      : "hover:scale-105"
                  }`}
                >
                  {pageNumber}
                </Button>
              ))}
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
      )}
    </div>
  );
}

export default ExamStatisticsTable;
