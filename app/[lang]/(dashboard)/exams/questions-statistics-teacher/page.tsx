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
import { extractListData, extractPaginatedList } from "@/lib/api/response";
import axios from "axios";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import { User } from "@/lib/type";
import useAuthrization from "@/hooks/useAuthrization";

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

// Interface for teacher question result data
interface TeacherQuestionResult {
  teacher_id: number;
  teacher: string;
  exam_id: number;
  exam: string;
  type: string | null;
  level: string;
  question_id: number;
  question: string;
  attempts: number;
  correct: number;
  wrong: number;
  percentage: number;
}

function QuestionsStatisticsTable() {
  const [data, setData] = useState<TeacherQuestionResult[]>([]);
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter options data
  const [teachers, setTeachers] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);

  // Filter states
  const [filters, setFilters] = useState({
    teacher_id: "",
    exam_id: "",
    level_id: "",
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
    totalQuestions: 0,
    totalTeachers: 0,
    totalCorrect: 0,
    totalAttempts: 0,
  });

  // Calculate statistics from data
  const calculateStatistics = (questionData: TeacherQuestionResult[]) => {
    const uniqueQuestions = new Set(
      questionData.map((item) => item.question_id)
    ).size;
    const uniqueTeachers = new Set(questionData.map((item) => item.teacher_id))
      .size;
    const totalAttempts = questionData.reduce(
      (sum, item) => sum + item.attempts,
      0
    );
    const totalCorrect = questionData.reduce(
      (sum, item) => sum + item.correct,
      0
    );

    setStatistics({
      totalQuestions: uniqueQuestions,
      totalTeachers: uniqueTeachers,
      totalCorrect,
      totalAttempts,
    });
  };

  // Export to Excel function
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert("لا توجد بيانات للتصدير");
      return;
    }

    // Prepare data for Excel export
    const excelData = data.map((item, index) => ({
      "رقم التسلسل": index + 1,
      "رقم المعلم": item.teacher_id,
      "اسم المعلم": item.teacher,
      "رقم الامتحان": item.exam_id,
      "عنوان الامتحان": item.exam || "بدون عنوان",
      "نوع الامتحان": item.type || "-",
      المرحلة: item.level,
      "رقم السؤال": item.question_id,
      السؤال: item.question || "بدون نص",
      "عدد المحاولات": item.attempts,
      "الإجابات الصحيحة": item.correct,
      "الإجابات الخاطئة": item.wrong,
      "النسبة المئوية": `${item.percentage.toFixed(2)}%`,
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 12 }, // رقم التسلسل
      { wch: 12 }, // رقم المعلم
      { wch: 20 }, // اسم المعلم
      { wch: 12 }, // رقم الامتحان
      { wch: 30 }, // عنوان الامتحان
      { wch: 15 }, // نوع الامتحان
      { wch: 15 }, // المرحلة
      { wch: 12 }, // رقم السؤال
      { wch: 50 }, // السؤال
      { wch: 15 }, // عدد المحاولات
      { wch: 18 }, // الإجابات الصحيحة
      { wch: 18 }, // الإجابات الخاطئة
      { wch: 15 }, // النسبة المئوية
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "إحصائيات الأسئلة للمعلمين");

    // Generate filename with current date
    const currentDate = new Date().toLocaleDateString("ar-SA");
    const filename = `إحصائيات_الأسئلة_للمعلمين_${currentDate.replace(
      /\//g,
      "-"
    )}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    if (!token) return;

    try {
      // Fetch teachers
      const teachersResponse = await getData(
        "teachers",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setTeachers(extractListData(teachersResponse, "teachers"));

      const examsResponse = await getData(
        "exams",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setExams(extractListData(examsResponse, "exams"));

      const levelsResponse = await getData(
        "levels",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setLevels(extractListData(levelsResponse, "levels"));
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // Fetch questions results data
  const fetchQuestionsResults = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getData(
        "exam-questions-teacher",
        {
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          ...filters,
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );

      const { items, pagination: pageInfo } =
        extractPaginatedList<TeacherQuestionResult>(response, "questions");
      setData(items);

      if (pageInfo) {
        setPagination((prev) => ({
          ...prev,
          total: pageInfo.total,
          lastPage: pageInfo.last_page,
        }));
      }

      calculateStatistics(items);
    } catch (error: any) {
      console.error("Failed to fetch question results:", error);
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
      fetchQuestionsResults();
      fetchFilterOptions();
    }
  }, [token, pagination.pageIndex, pagination.pageSize, filters]);

  // Table columns definition
  const columns: ColumnDef<TeacherQuestionResult>[] = [
    {
      accessorKey: "teacher_id",
      header: "رقم المعلم",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {row.original.teacher_id}
        </span>
      ),
    },
    {
      accessorKey: "teacher",
      header: "اسم المعلم",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.teacher}</div>
      ),
    },
    {
      accessorKey: "exam_id",
      header: "رقم الامتحان",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-green-600 dark:text-green-400">
          {row.original.exam_id}
        </span>
      ),
    },
    {
      accessorKey: "exam",
      header: "عنوان الامتحان",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          {row.original.exam || "بدون عنوان"}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "نوع الامتحان",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.type || "-"}</span>
      ),
    },
    {
      accessorKey: "level",
      header: "المرحلة",
      cell: ({ row }) => <div className="text-sm">{row.original.level}</div>,
    },
    {
      accessorKey: "question_id",
      header: "رقم السؤال",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
          {row.original.question_id}
        </span>
      ),
    },
    {
      accessorKey: "question",
      header: "السؤال",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate" title={row.original.question}>
          {row.original.question || "بدون نص"}
        </div>
      ),
    },
    {
      accessorKey: "attempts",
      header: "عدد المحاولات",
      cell: ({ row }) => (
        <Badge variant="soft" className="bg-blue-100 text-blue-700">
          {row.original.attempts}
        </Badge>
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

    const isAuthrized = useAuthrization({ user: user as User, module: "questions_statistics_teacher" });
  if (!isAuthrized) {
    return <div>ليس لديك صلاحية لعرض هذه الصفحة</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Section */}
      <div className="mb-8 px-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          إحصائيات نتائج الأسئلة للمعلمين
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="إجمالي الأسئلة"
            value={statistics.totalQuestions}
            icon={BookOpen}
            color="blue"
          />
          <StatCard
            title="إجمالي المعلمين"
            value={statistics.totalTeachers}
            icon={Users}
            color="green"
          />
          <StatCard
            title="الإجابات الصحيحة"
            value={statistics.totalCorrect}
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
          {/* Teacher Filter */}
          <div className="min-w-[200px]">
            <Label htmlFor="teacher_id">المعلم</Label>
            <select
              id="teacher_id"
              value={filters.teacher_id}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, teacher_id: e.target.value }))
              }
              className="w-full px-3 flex justify-between items-center read-only:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition duration-300 border-default-300 text-default-500 focus:outline-none focus:border-default-500/50 disabled:bg-default-200 placeholder:text-accent-foreground/50 border rounded-lg h-10 text-sm"
            >
              <option value="">كل المعلمين</option>
              {teachers?.map((teacher: any) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user?.full_name ||
                    teacher.full_name ||
                    `المعلم ${teacher.user?.id || teacher.id}`}
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

          {/* Level Filter */}
          <div className="min-w-[200px]">
            <Label htmlFor="level_id">المرحلة</Label>
            <select
              id="level_id"
              value={filters.level_id}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, level_id: e.target.value }))
              }
              className="w-full px-3 flex justify-between items-center read-only:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition duration-300 border-default-300 text-default-500 focus:outline-none focus:border-default-500/50 disabled:bg-default-200 placeholder:text-accent-foreground/50 border rounded-lg h-10 text-sm"
            >
              <option value="">كل المراحل</option>
              {levels?.map((level: any) => (
                <option key={level.id} value={level.id}>
                  {level.name || `المرحلة ${level.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Export to Excel Button */}
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={loading || !data || data.length === 0}
            className="h-10 px-4 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            تصدير إلى Excel
          </Button>

          {/* Reset Filters Button */}
          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                teacher_id: "",
                exam_id: "",
                level_id: "",
              });
            }}
            className="h-10 px-4"
          >
            <Filter className="w-4 h-4 mr-2" />
            إعادة تعيين الفلاتر
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
                      onClick={fetchQuestionsResults}
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
                      لم يتم العثور على أي نتائج أسئلة للمعلمين
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

export default QuestionsStatisticsTable;
