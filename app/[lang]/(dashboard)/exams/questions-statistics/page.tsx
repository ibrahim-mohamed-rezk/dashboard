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

// Interface for question result data
interface QuestionResult {
  exam_id: number;
  exam: string;
  type: string;
  student_id: number;
  student: string;
  level: string;
  group: string;
  question_id: number;
  question: string;
  is_correct: boolean;
  correct_answer: string | null;
  last_answer: number;
  attempts: number;
}

function QuestionsStatisticsTable() {
  const [data, setData] = useState<QuestionResult[]>([]);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
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
    totalQuestions: 0,
    totalStudents: 0,
    correctAnswers: 0,
    totalAttempts: 0,
  });

  // Calculate statistics from data
  const calculateStatistics = (questionData: QuestionResult[]) => {
    const uniqueQuestions = new Set(
      questionData.map((item) => item.question_id)
    ).size;
    const uniqueStudents = new Set(questionData.map((item) => item.student_id))
      .size;
    const totalAttempts = questionData.length;
    const correctAnswers = questionData.filter(
      (item) => item.is_correct
    ).length;

    setStatistics({
      totalQuestions: uniqueQuestions,
      totalStudents: uniqueStudents,
      correctAnswers,
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
    const excelData = data.map((item) => ({
      "رقم الامتحان": item.exam_id,
      "عنوان الامتحان": item.exam || "بدون عنوان",
      "نوع الامتحان": item.type || "-",
      "رقم الطالب": item.student_id,
      "اسم الطالب": item.student,
      المرحلة: item.level,
      المجموعة: item.group || "بدون مجموعة",
      "رقم السؤال": item.question_id,
      السؤال: item.question || "بدون نص",
      صحيح: item.is_correct ? "نعم" : "لا",
      "الإجابة الصحيحة": item.correct_answer || "غير محدد",
      "آخر إجابة": item.last_answer,
      "عدد المحاولات": item.attempts,
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 12 }, // رقم الامتحان
      { wch: 25 }, // عنوان الامتحان
      { wch: 15 }, // نوع الامتحان
      { wch: 12 }, // رقم الطالب
      { wch: 20 }, // اسم الطالب
      { wch: 15 }, // المرحلة
      { wch: 15 }, // المجموعة
      { wch: 12 }, // رقم السؤال
      { wch: 40 }, // السؤال
      { wch: 8 }, // صحيح
      { wch: 20 }, // الإجابة الصحيحة
      { wch: 12 }, // آخر إجابة
      { wch: 15 }, // عدد المحاولات
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "إحصائيات الأسئلة");

    // Generate filename with current date
    const currentDate = new Date().toLocaleDateString("ar-SA");
    const filename = `إحصائيات_الأسئلة_${currentDate.replace(/\//g, "-")}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
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
      setStudents(extractListData(studentsResponse, "students"));

      const examsResponse = await getData(
        "exams",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setExams(extractListData(examsResponse, "exams"));
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
        "exam-result-questions-student",
        {
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          ...filters,
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );

      const { items, pagination: pageInfo } = extractPaginatedList<QuestionResult>(
        response,
        "questions",
      );
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
  const columns: ColumnDef<QuestionResult>[] = [
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
      accessorKey: "is_correct",
      header: "صحيح",
      cell: ({ row }) => (
        <Badge
          variant="soft"
          className={
            row.original.is_correct
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }
        >
          {row.original.is_correct ? "نعم" : "لا"}
        </Badge>
      ),
    },
    {
      accessorKey: "correct_answer",
      header: "الإجابة الصحيحة",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-green-600">
          {row.original.correct_answer || "غير محدد"}
        </span>
      ),
    },
    {
      accessorKey: "last_answer",
      header: "آخر إجابة",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-blue-600">
          {row.original.last_answer}
        </span>
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
    module: ["questions_statistics", "QuestionsStatistics"],
  });
  if (!isAuthrized) {
    return <div>ليس لديك صلاحية لعرض هذه الصفحة</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Section */}
      <div className="mb-8 px-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          إحصائيات نتائج الأسئلة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="إجمالي الأسئلة"
            value={statistics.totalQuestions}
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
            title="الإجابات الصحيحة"
            value={statistics.correctAnswers}
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

          {/* Export to Excel Button */}
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={loading || data.length === 0}
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
                student_id: "",
                exam_id: "",
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
                    <p className="text-sm">لم يتم العثور على أي نتائج أسئلة</p>
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
