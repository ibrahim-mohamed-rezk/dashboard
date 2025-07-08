"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReportsSnapshot from "./components/reports-snapshot";
import CountryMap from "./components/country-map";
import UserDeviceReport from "./components/user-device-report";
import UserStats from "./components/user-stats-chart";
import UsersStat from "./components/users-stat";
import ReportsArea from "./components/reports-area";
import DashboardSelect from "@/components/dasboard-select";
import TopTen from "./components/top-ten";
import TopPage from "./components/top-page";
import DatePickerWithRange from "@/components/date-picker-with-range";
import { Statistics } from "@/lib/type";
import { ApexOptions } from "apexcharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Video,
  GraduationCap,
  DollarSign,
  ShoppingCart,
  Eye,
  Award,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Filter,
  Search,
  Download,
  RefreshCw,
} from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Helper functions
function getTopN<T>(arr: T[] = [], field: keyof T, n = 5): T[] {
  return [...arr]
    .sort((a, b) => Number(b[field] ?? 0) - Number(a[field] ?? 0))
    .slice(0, n);
}

function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

// Components
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  trend,
  subtitle,
}) => {
  const trendColor =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
      ? "text-red-600"
      : "text-gray-600";
  const bgColor =
    trend === "up"
      ? "bg-green-50"
      : trend === "down"
      ? "bg-red-50"
      : "bg-gray-50";

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {change !== undefined && (
              <div className={`flex items-center mt-2 ${trendColor}`}>
                {trend === "up" ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm font-medium">
                  {Math.abs(change).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${bgColor}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

interface RevenueBreakdownChartProps {
  data: {
    online_revenue: number;
    offline_revenue: number;
    book_revenue?: number;
  };
  title: string;
}

const RevenueBreakdownChart: React.FC<RevenueBreakdownChartProps> = ({
  data,
  title,
}) => {
  const series = [
    Number(data.online_revenue || 0),
    Number(data.offline_revenue || 0),
    Number(data.book_revenue || 0),
  ];
  const options: ApexOptions = {
    labels: ["الإيرادات الأونلاين", "الإيرادات الخارجية", "الإيرادات الكتابية"],
    chart: { type: "donut", toolbar: { show: true } },
    legend: { position: "bottom" },
    colors: ["#3B82F6", "#10B981", "#F59E0B"],
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: "إجمالي الإيرادات",
              formatter: () =>
                formatCurrency(series.reduce((a, b) => a + b, 0)),
            },
          },
        },
      },
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val) => formatCurrency(val),
      },
    },
  };
  return (
    <Card className="col-span-12 md:col-span-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Chart options={options} series={series} type="donut" height={300} />
      </CardContent>
    </Card>
  );
};

interface PerformanceMetricsProps {
  statistics: Statistics;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  statistics,
}) => {
  const totalOnlineRevenue =
    statistics.students.details?.reduce(
      (sum, s) => sum + Number(s.online_revenue),
      0
    ) || 0;
  const totalOfflineRevenue =
    statistics.students.details?.reduce(
      (sum, s) => sum + Number(s.offline_revenue),
      0
    ) || 0;
  const totalRevenue = totalOnlineRevenue + totalOfflineRevenue;
  const avgRevenuePerStudent =
    statistics.students.total > 0
      ? totalRevenue / statistics.students.total
      : 0;

  const conversionRate =
    statistics.purchases.total > 0 && statistics.users.total > 0
      ? (statistics.purchases.total / statistics.users.total) * 100
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="إجمالي الإيرادات"
        value={formatCurrency(totalRevenue)}
        icon={<DollarSign className="w-6 h-6 text-blue-600" />}
        trend="up"
        change={15.3}
      />
      <MetricCard
        title="الإيرادات المتوسطة لكل طالب"
        value={formatCurrency(avgRevenuePerStudent)}
        icon={<Users className="w-6 h-6 text-green-600" />}
        trend="up"
        change={8.7}
      />
      <MetricCard
        title="معدل التحويل"
        value={`${conversionRate.toFixed(1)}%`}
        icon={<Target className="w-6 h-6 text-purple-600" />}
        trend="down"
        change={-2.3}
        subtitle="المشتريات / المستخدمون الكليون"
      />
      <MetricCard
        title="الدورات النشطة"
        value={statistics.courses.online_count ?? 0}
        icon={<BookOpen className="w-6 h-6 text-orange-600" />}
        subtitle={`${statistics.courses.total} دورة إجمالية`}
      />
    </div>
  );
};

interface CoursePerformanceAnalysisProps {
  courses: Array<{
    id: number;
    title: string;
    revenue: number;
    purchases_count: number;
    price: number;
  }>;
}

const CoursePerformanceAnalysis: React.FC<CoursePerformanceAnalysisProps> = ({
  courses,
}) => {
  const topCourses = getTopN(courses, "revenue", 10);
  const totalRevenue = courses.reduce((sum, c) => sum + c.revenue, 0);

  const performanceData = topCourses.map((course) => ({
    ...course,
    revenuePercentage:
      totalRevenue > 0 ? (course.revenue / totalRevenue) * 100 : 0,
    avgPurchaseValue:
      course.purchases_count > 0 ? course.revenue / course.purchases_count : 0,
  }));

  const series = [
    {
      name: "الإيرادات",
      data: performanceData.map((c) => c.revenue),
    },
    {
      name: "المشتريات",
      data: performanceData.map((c) => c.purchases_count),
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: true },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: true,
      offsetX: -6,
      style: {
        fontSize: "12px",
        colors: ["#fff"],
      },
    },
    xaxis: {
      categories: performanceData.map((c) =>
        c.title.length > 20 ? c.title.substring(0, 20) + "..." : c.title
      ),
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    colors: ["#3B82F6", "#10B981"],
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (val, { seriesIndex }) {
          return seriesIndex === 0
            ? formatCurrency(val)
            : `${val} ${"مشتريات"}`;
        },
      },
    },
  };

  return (
    <Card className="col-span-12">
      <CardHeader>
        <CardTitle>تحليل أداء الدورات</CardTitle>
        <CardDescription>
          توزيع الإيرادات والمشتريات عبر أفضل الدورات
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Chart options={options} series={series} type="bar" height={400} />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {performanceData.slice(0, 3).map((course, idx) => (
            <div key={course.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  #{idx + 1} {course.title}
                </span>
                <Badge variant={idx === 0 ? "outline" : "outline"}>
                  {course.revenuePercentage.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={course.revenuePercentage} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-gray-600">
                <span>{formatCurrency(course.revenue)}</span>
                <span>{course.purchases_count} مبيعات</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface StudentEngagementAnalyticsProps {
  students: Statistics["students"]["details"];
}

const StudentEngagementAnalytics: React.FC<StudentEngagementAnalyticsProps> = ({
  students = [],
}) => {
  const engagementData = students.map((s) => ({
    ...s,
    totalRevenue: Number(s.online_revenue) + Number(s.offline_revenue),
    engagementScore:
      s.online_purchases_count * 10 + s.subscription_code_count * 5,
  }));

  const topEngaged = getTopN(engagementData, "engagementScore", 5);
  const topSpenders = getTopN(engagementData, "totalRevenue", 5);

  const scatterData = engagementData
    .filter((s) => s.totalRevenue > 0 || s.online_purchases_count > 0)
    .map((s) => ({
      x: s.online_purchases_count,
      y: s.totalRevenue,
      z: s.subscription_code_count,
    }));

  const scatterOptions: ApexOptions = {
    chart: {
      type: "scatter",
      zoom: { enabled: true },
    },
    xaxis: {
      title: { text: "المشتريات الأونلاين" },
      tickAmount: 10,
    },
    yaxis: {
      title: { text: "الإيرادات الإجمالية ($)" },
      tickAmount: 7,
    },
    grid: {
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
    },
    markers: {
      size: scatterData.map((d) => Math.min(d.z * 2, 20)),
    },
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <Card className="col-span-12 lg:col-span-8">
        <CardHeader>
          <CardTitle>مصفوفة تفاعل الطلاب</CardTitle>
          <CardDescription>الارتباط بين المشتريات والإيرادات</CardDescription>
        </CardHeader>
        <CardContent>
          <Chart
            options={scatterOptions}
            series={[{ name: "الطلاب", data: scatterData }]}
            type="scatter"
            height={350}
          />
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-4">
        <CardHeader>
          <CardTitle>أكثر الطلاب تفاعلاً</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topEngaged.map((student, idx) => (
              <div
                key={student.student_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium">
                      {student.full_name || "المجهول"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {"النقاط"}: {student.engagementScore}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {formatCurrency(student.totalRevenue)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface TeacherPerformanceDashboardProps {
  teachers: Statistics["teachers"]["details"];
}

const TeacherPerformanceDashboard: React.FC<
  TeacherPerformanceDashboardProps
> = ({ teachers = [] }) => {
  const performanceMetrics = teachers.map((t) => ({
    ...t,
    totalRevenue:
      Number(t.online_revenue) +
      Number(t.offline_revenue) +
      Number(t.book_revenue),
    avgRevenuePerCourse:
      t.course_count > 0
        ? (Number(t.online_revenue) + Number(t.offline_revenue)) /
          t.course_count
        : 0,
    efficiency:
      t.subscription_code_count > 0
        ? Number(t.offline_revenue) / t.subscription_code_count
        : 0,
  }));

  const radarCategories = [
    "الدورات",
    "المبيعات الأونلاين",
    "الاشتراكات",
    "الكتب",
    "الإيرادات",
  ];
  const topTeachers = getTopN(performanceMetrics, "totalRevenue", 3);

  const radarSeries = topTeachers.map((t) => ({
    name: t.full_name,
    data: [
      Math.min((t.course_count / 10) * 100, 100),
      Math.min((t.online_purchases_count / 5) * 100, 100),
      Math.min((t.subscription_code_count / 100) * 100, 100),
      Math.min((t.book_count / 5) * 100, 100),
      Math.min((t.totalRevenue / 10000) * 100, 100),
    ],
  }));

  const radarOptions: ApexOptions = {
    chart: { type: "radar" },
    xaxis: { categories: radarCategories },
    yaxis: { show: false },
    markers: { size: 4 },
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <Card className="col-span-12 lg:col-span-6">
        <CardHeader>
          <CardTitle>مخطط أداء المعلمين</CardTitle>
          <CardDescription>مقارنة متعددة الأبعاد للأداء</CardDescription>
        </CardHeader>
        <CardContent>
          <Chart
            options={radarOptions}
            series={radarSeries}
            type="radar"
            height={350}
          />
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-6">
        <CardHeader>
          <CardTitle>مقاييس كفاءة المعلمين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceMetrics.map((teacher) => (
              <div key={teacher.teacher_id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{teacher.full_name}</h4>
                  <Badge>{formatCurrency(teacher.totalRevenue)}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">الدورات</p>
                    <p className="font-semibold">{teacher.course_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">الإيرادات المتوسطة لكل دورة</p>
                    <p className="font-semibold">
                      {formatCurrency(teacher.avgRevenuePerCourse)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">الكفاءة</p>
                    <p className="font-semibold">
                      {formatCurrency(teacher.efficiency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ContentAnalyticsProps {
  statistics: Statistics;
}

const ContentAnalytics: React.FC<ContentAnalyticsProps> = ({ statistics }) => {
  const contentData = [
    {
      category: "الدورات",
      count: statistics.courses.total,
      icon: <BookOpen className="w-5 h-5" />,
      color: "bg-blue-500",
    },
    {
      category: "الفيديوهات",
      count: statistics.videos.total,
      icon: <Video className="w-5 h-5" />,
      color: "bg-purple-500",
    },
    {
      category: "الاختبارات",
      count: statistics.exams.total,
      icon: <GraduationCap className="w-5 h-5" />,
      color: "bg-green-500",
    },
    {
      category: "المدونات",
      count: statistics.blogs.total,
      icon: <BookOpen className="w-5 h-5" />,
      color: "bg-orange-500",
    },
  ];

  const series = contentData.map((d) => d.count);
  const options: ApexOptions = {
    chart: { type: "polarArea" },
    labels: contentData.map((d) => d.category),
    fill: { opacity: 0.8 },
    stroke: { width: 1, colors: undefined },
    yaxis: { show: false },
    legend: { position: "bottom" },
    plotOptions: {
      polarArea: {
        rings: {
          strokeWidth: 0,
        },
        spokes: {
          strokeWidth: 0,
        },
      },
    },
  };

  return (
    <Card className="col-span-12 lg:col-span-6">
      <CardHeader>
        <CardTitle>توزيع المحتوى</CardTitle>
        <CardDescription>
          نظرة عامة على المحتوى التعليمي المتوفر
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Chart
          options={options}
          series={series}
          type="polarArea"
          height={300}
        />
        <div className="mt-4 grid grid-cols-2 gap-4">
          {contentData.map((item) => (
            <div key={item.category} className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg text-white ${item.color}`}>
                {item.icon}
              </div>
              <div>
                <p className="text-sm text-gray-600">{item.category}</p>
                <p className="font-semibold">{formatNumber(item.count)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface RevenueTimelineProps {
  statistics: Statistics;
}

const RevenueTimeline: React.FC<RevenueTimelineProps> = ({ statistics }) => {
  // Simulated monthly data
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const onlineRevenue = [12000, 15000, 18000, 16000, 20000, 22000];
  const offlineRevenue = [8000, 9000, 11000, 10000, 12000, 14000];

  const series = [
    { name: "الإيرادات الأونلاين", data: onlineRevenue },
    { name: "الإيرادات الخارجية", data: offlineRevenue },
  ];

  const options: ApexOptions = {
    chart: {
      type: "area",
      stacked: true,
      toolbar: { show: true },
    },
    xaxis: { categories: months },
    yaxis: {
      title: { text: "الإيرادات ($)" },
      labels: {
        formatter: (val) => formatCurrency(val),
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.6,
        opacityTo: 0.1,
      },
    },
    tooltip: {
      y: {
        formatter: (val) => formatCurrency(val),
      },
    },
  };

  return (
    <Card className="col-span-12 lg:col-span-6">
      <CardHeader>
        <CardTitle>خط الزمن للإيرادات</CardTitle>
        <CardDescription>
          تحليل الاتجاه للإيرادات على مدار 6 أشهر
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Chart options={options} series={series} type="area" height={300} />
      </CardContent>
    </Card>
  );
};

interface DashboardPageViewProps {
  trans: { [key: string]: string };
  statistics: Statistics;
}

const DashboardPageView: React.FC<DashboardPageViewProps> = ({
  trans,
  statistics,
}) => {
  const [entityTab, setEntityTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Calculate key metrics
  const totalStudents = statistics.students.total;
  const totalTeachers = statistics.teachers.total;
  const totalUsers = statistics.users.total;
  const totalPurchases = statistics.purchases.total;

  const totalOnlineRevenue =
    statistics.students.details?.reduce(
      (sum, s) => sum + Number(s.online_revenue),
      0
    ) || 0;
  const totalOfflineRevenue =
    statistics.students.details?.reduce(
      (sum, s) => sum + Number(s.offline_revenue),
      0
    ) || 0;
  const totalBookRevenue =
    statistics.teachers.details?.reduce(
      (sum, t) => sum + Number(t.book_revenue),
      0
    ) || 0;
  const grandTotalRevenue =
    totalOnlineRevenue + totalOfflineRevenue + totalBookRevenue;

  // Prepare filtered data
  const filteredStudents = useMemo(() => {
    if (!statistics.students.details) return [];
    return statistics.students.details.filter(
      (s) =>
        !searchTerm ||
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [statistics.students.details, searchTerm]);

  const filteredTeachers = useMemo(() => {
    if (!statistics.teachers.details) return [];
    return statistics.teachers.details.filter(
      (t) =>
        !searchTerm ||
        t.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [statistics.teachers.details, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            لوحة تحكم التحليلات
          </h1>
          <p className="text-gray-600 mt-1">رؤى شاملة ومقاييس الأداء</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            تصدير
          </Button>
          <DatePickerWithRange />
          <DashboardSelect />
        </div>
      </div>

      {/* Advanced Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="ابحث عن الطلاب أو المعلمين أو الدورات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="النطاق الزمني" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الوقت</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
                <SelectItem value="quarter">هذا الربع</SelectItem>
                <SelectItem value="year">هذه السنة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفئات</SelectItem>
                <SelectItem value="revenue">الإيرادات</SelectItem>
                <SelectItem value="engagement">التفاعل</SelectItem>
                <SelectItem value="content">المحتوى</SelectItem>
                <SelectItem value="performance">الأداء</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              المزيد من الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Navigation Tabs */}
      <Tabs value={entityTab} onValueChange={setEntityTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="students">الطلاب</TabsTrigger>
          <TabsTrigger value="teachers">المعلمون</TabsTrigger>
          <TabsTrigger value="courses">الدورات</TabsTrigger>
          <TabsTrigger value="revenue">الإيرادات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <PerformanceMetrics statistics={statistics} />

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8">
              <ReportsSnapshot statistics={statistics} />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <UsersStat statistics={statistics} trans={trans} />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <ContentAnalytics statistics={statistics} />
            <RevenueTimeline statistics={statistics} />
          </div>

          <CoursePerformanceAnalysis
            courses={statistics.courses.online_course_details || []}
          />
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="إجمالي الطلاب"
              value={totalStudents}
              icon={<Users className="w-6 h-6 text-blue-600" />}
              subtitle="المتعلمون النشطون"
            />
            <MetricCard
              title="الإيرادات الأونلاين المتوسطة"
              value={formatCurrency(totalOnlineRevenue / totalStudents)}
              icon={<DollarSign className="w-6 h-6 text-green-600" />}
            />
            <MetricCard
              title="إجمالي الاشتراكات"
              value={filteredStudents.reduce(
                (sum, s) => sum + s.subscription_code_count,
                0
              )}
              icon={<ShoppingCart className="w-6 h-6 text-purple-600" />}
            />
            <MetricCard
              title="معدل التفاعل"
              value={`${(
                (filteredStudents.filter((s) => s.online_purchases_count > 0)
                  .length /
                  totalStudents) *
                100
              ).toFixed(1)}%`}
              icon={<Activity className="w-6 h-6 text-orange-600" />}
            />
          </div>

          <StudentEngagementAnalytics students={filteredStudents} />

          <Card>
            <CardHeader>
              <CardTitle>دليل الطلاب</CardTitle>
              <CardDescription>
                المعلومات التفصيلية والمقاييس للطلاب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">اسم الطالب</th>
                      <th className="text-left p-4">الإيرادات الأونلاين</th>
                      <th className="text-left p-4">الإيرادات الخارجية</th>
                      <th className="text-left p-4">الإيرادات الإجمالية</th>
                      <th className="text-left p-4">المشتريات</th>
                      <th className="text-left p-4">الاشتراكات</th>
                      <th className="text-left p-4">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => {
                      const totalRev =
                        Number(student.online_revenue) +
                        Number(student.offline_revenue);
                      const isActive =
                        student.online_purchases_count > 0 ||
                        student.subscription_code_count > 0;
                      return (
                        <tr
                          key={student.student_id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-4 font-medium">
                            {student.full_name || "المجهول"}
                          </td>
                          <td className="p-4">
                            {formatCurrency(student.online_revenue)}
                          </td>
                          <td className="p-4">
                            {formatCurrency(Number(student.offline_revenue))}
                          </td>
                          <td className="p-4 font-semibold">
                            {formatCurrency(totalRev)}
                          </td>
                          <td className="p-4">
                            {student.online_purchases_count}
                          </td>
                          <td className="p-4">
                            {student.subscription_code_count}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">
                              {isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="إجمالي المعلمون"
              value={totalTeachers}
              icon={<GraduationCap className="w-6 h-6 text-blue-600" />}
            />
            <MetricCard
              title="إجمالي الدورات"
              value={filteredTeachers.reduce(
                (sum, t) => sum + t.course_count,
                0
              )}
              icon={<BookOpen className="w-6 h-6 text-green-600" />}
            />
            <MetricCard
              title="إجمالي الكتب"
              value={filteredTeachers.reduce((sum, t) => sum + t.book_count, 0)}
              icon={<BookOpen className="w-6 h-6 text-purple-600" />}
            />
            <MetricCard
              title="الإيرادات المتوسطة لكل معلم"
              value={formatCurrency(grandTotalRevenue / totalTeachers)}
              icon={<DollarSign className="w-6 h-6 text-orange-600" />}
            />
          </div>

          <TeacherPerformanceDashboard teachers={filteredTeachers} />

          <Card>
            <CardHeader>
              <CardTitle>جدول أداء المعلمين</CardTitle>
              <CardDescription>
                المقاييس وتفاصيل الإيرادات للمعلمين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">اسم المعلم</th>
                      <th className="text-left p-4">الدورات</th>
                      <th className="text-left p-4">الإيرادات الأونلاين</th>
                      <th className="text-left p-4">الإيرادات الخارجية</th>
                      <th className="text-left p-4">الإيرادات الكتابية</th>
                      <th className="text-left p-4">الإيرادات الإجمالية</th>
                      <th className="text-left p-4">الكفاءة</th>
                      <th className="text-left p-4">التقييم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((teacher) => {
                      const totalRev =
                        Number(teacher.online_revenue) +
                        Number(teacher.offline_revenue) +
                        Number(teacher.book_revenue);
                      const efficiency =
                        teacher.course_count > 0
                          ? totalRev / teacher.course_count
                          : 0;
                      const rating =
                        efficiency > 1000
                          ? "جيد جداً"
                          : efficiency > 500
                          ? "جيد"
                          : "متوسط";
                      return (
                        <tr
                          key={teacher.teacher_id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-4 font-medium">
                            {teacher.full_name}
                          </td>
                          <td className="p-4">{teacher.course_count}</td>
                          <td className="p-4">
                            {formatCurrency(teacher.online_revenue)}
                          </td>
                          <td className="p-4">
                            {formatCurrency(Number(teacher.offline_revenue))}
                          </td>
                          <td className="p-4">
                            {formatCurrency(teacher.book_revenue)}
                          </td>
                          <td className="p-4 font-semibold">
                            {formatCurrency(totalRev)}
                          </td>
                          <td className="p-4">{formatCurrency(efficiency)}</td>
                          <td className="p-4">
                            <Badge variant={"outline"}>{rating}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="إجمالي الدورات"
              value={statistics.courses.total}
              icon={<BookOpen className="w-6 h-6 text-blue-600" />}
            />
            <MetricCard
              title="الدورات الأونلاين"
              value={statistics.courses.online_count ?? 0}
              icon={<Zap className="w-6 h-6 text-green-600" />}
              subtitle={`${(
                (statistics.courses.online_count / statistics.courses.total) *
                100
              ).toFixed(0)}% من الإجمالي`}
            />
            <MetricCard
              title="الدورات الخارجية"
              value={statistics.courses.offline_count ?? 0}
              icon={<BookOpen className="w-6 h-6 text-purple-600" />}
            />
            <MetricCard
              title="عدد زيارات الدورة"
              value={statistics.course_views.total}
              icon={<Eye className="w-6 h-6 text-orange-600" />}
            />
          </div>

          <CoursePerformanceAnalysis
            courses={statistics.courses.online_course_details || []}
          />

          <div className="grid grid-cols-12 gap-6">
            <Card className="col-span-12 lg:col-span-6">
              <CardHeader>
                <CardTitle>تحليل تسعيرة الدورات</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const courses =
                    statistics.courses.online_course_details || [];
                  const priceRanges = {
                    مجاني: courses.filter((c) => Number(c.price) === 0).length,
                    "$1-$50": courses.filter(
                      (c) => Number(c.price) > 0 && Number(c.price) <= 50
                    ).length,
                    "$51-$100": courses.filter(
                      (c) => Number(c.price) > 50 && Number(c.price) <= 100
                    ).length,
                    "$100+": courses.filter((c) => Number(c.price) > 100)
                      .length,
                  };
                  const series = Object.values(priceRanges);
                  const options: ApexOptions = {
                    chart: { type: "pie" },
                    labels: Object.keys(priceRanges),
                    colors: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"],
                    legend: { position: "bottom" },
                  };
                  return (
                    <Chart
                      options={options}
                      series={series}
                      type="pie"
                      height={300}
                    />
                  );
                })()}
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-6">
              <CardHeader>
                <CardTitle>مخطط التسوق للدورات</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const totalViews = statistics.course_views.total;
                  const totalCourses = statistics.courses.total;
                  const totalPurchases = statistics.purchases.total;
                  const funnelData = [
                    { stage: "الأطوار", value: totalViews, color: "#3B82F6" },
                    {
                      stage: "اهتمام الدورة",
                      value: Math.round(totalViews * 0.3),
                      color: "#10B981",
                    },
                    {
                      stage: "إضافة إلى السلة",
                      value: Math.round(totalViews * 0.1),
                      color: "#F59E0B",
                    },
                    {
                      stage: "المشتريات",
                      value: totalPurchases,
                      color: "#8B5CF6",
                    },
                  ];

                  return (
                    <div className="space-y-4">
                      {funnelData.map((item, idx) => (
                        <div key={item.stage}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">
                              {item.stage}
                            </span>
                            <span className="text-sm text-gray-600">
                              {formatNumber(item.value)}
                            </span>
                          </div>
                          <div className="relative">
                            <Progress
                              value={(item.value / funnelData[0].value) * 100}
                              className="h-8"
                            />
                            {idx < funnelData.length - 1 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {(
                                  (item.value / funnelData[idx + 1].value - 1) *
                                  100
                                ).toFixed(1)}
                                % نسبة تراجع
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              تحديث بيانات الإيرادات في الوقت الفعلي. آخر تحديث:{" "}
              {new Date().toLocaleString()}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="إجمالي الإيرادات"
              value={formatCurrency(grandTotalRevenue)}
              icon={<DollarSign className="w-6 h-6 text-green-600" />}
              trend="up"
              change={23.5}
            />
            <MetricCard
              title="الإيرادات الأونلاين"
              value={formatCurrency(totalOnlineRevenue)}
              icon={<Zap className="w-6 h-6 text-blue-600" />}
              subtitle={`${(
                (totalOnlineRevenue / grandTotalRevenue) *
                100
              ).toFixed(1)}% من الإجمالي`}
            />
            <MetricCard
              title="الإيرادات الخارجية"
              value={formatCurrency(totalOfflineRevenue)}
              icon={<BookOpen className="w-6 h-6 text-purple-600" />}
              subtitle={`${(
                (totalOfflineRevenue / grandTotalRevenue) *
                100
              ).toFixed(1)}% من الإجمالي`}
            />
            <MetricCard
              title="الإيرادات الكتابية"
              value={formatCurrency(totalBookRevenue)}
              icon={<BookOpen className="w-6 h-6 text-orange-600" />}
              subtitle={`${(
                (totalBookRevenue / grandTotalRevenue) *
                100
              ).toFixed(1)}% من الإجمالي`}
            />
          </div>

          <div className="grid grid-cols-12 gap-6">
            <RevenueBreakdownChart
              data={{
                online_revenue: totalOnlineRevenue,
                offline_revenue: totalOfflineRevenue,
                book_revenue: totalBookRevenue,
              }}
              title="توزيع الإيرادات"
            />

            <Card className="col-span-12 md:col-span-8">
              <CardHeader>
                <CardTitle>توقع الإيرادات</CardTitle>
                <CardDescription>
                  توقع الإيرادات للشهور الستة القادمة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  const currentMonthlyAvg = grandTotalRevenue / 6;
                  const growthRate = 1.15; // 15% monthly growth

                  const projectedRevenue = months.map((_, idx) =>
                    Math.round(
                      currentMonthlyAvg * Math.pow(growthRate, idx + 1)
                    )
                  );

                  const series = [
                    {
                      name: "الإيرادات المتوقعة",
                      data: projectedRevenue,
                    },
                  ];

                  const options: ApexOptions = {
                    chart: { type: "line", toolbar: { show: false } },
                    stroke: { curve: "smooth", width: 3 },
                    xaxis: { categories: months },
                    yaxis: {
                      labels: {
                        formatter: (val) => formatCurrency(val),
                      },
                    },
                    colors: ["#8B5CF6"],
                    fill: {
                      type: "gradient",
                      gradient: {
                        shadeIntensity: 1,
                        inverseColors: false,
                        opacityFrom: 0.45,
                        opacityTo: 0.05,
                        stops: [20, 100, 100, 100],
                      },
                    },
                    markers: { size: 5 },
                    grid: { borderColor: "#f1f1f1" },
                  };

                  return (
                    <Chart
                      options={options}
                      series={series}
                      type="area"
                      height={350}
                    />
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الإيرادات حسب المصدر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">
                    أفضل الطلاب الإيرادات الأعلى
                  </h4>
                  <div className="space-y-2">
                    {getTopN(
                      statistics.students.details || [],
                      "online_revenue",
                      5
                    ).map((student, idx) => {
                      const total =
                        Number(student.online_revenue) +
                        Number(student.offline_revenue);
                      return (
                        <div
                          key={student.student_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium">
                                {student.full_name || "المجهول"}
                              </p>
                              <p className="text-xs text-gray-600">
                                {student.online_purchases_count} مشتريات
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(total)}
                            </p>
                            <p className="text-xs text-gray-600">
                              الأونلاين:{" "}
                              {formatCurrency(student.online_revenue)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">
                    أفضل المعلمون الإيرادات الأعلى
                  </h4>
                  <div className="space-y-2">
                    {getTopN(
                      statistics.teachers.details || [],
                      "offline_revenue",
                      5
                    ).map((teacher, idx) => {
                      const total =
                        Number(teacher.online_revenue) +
                        Number(teacher.offline_revenue) +
                        Number(teacher.book_revenue);
                      return (
                        <div
                          key={teacher.teacher_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium">{teacher.full_name}</p>
                              <p className="text-xs text-gray-600">
                                {teacher.course_count} دورة
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(total)}
                            </p>
                            <div className="flex space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                الأونلاين:{" "}
                                {formatCurrency(teacher.online_revenue)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                الخارجية:{" "}
                                {formatCurrency(
                                  Number(teacher.offline_revenue)
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            <Card className="col-span-12">
              <CardHeader>
                <CardTitle>لوحة صحة النظام</CardTitle>
                <CardDescription>
                  المؤشرات الرئيسية والمقاييس للصحة النظامية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="relative inline-flex">
                      <div className="w-32 h-32">
                        {(() => {
                          const healthScore = 85;
                          const options: ApexOptions = {
                            chart: { type: "radialBar" },
                            plotOptions: {
                              radialBar: {
                                hollow: { size: "70%" },
                                dataLabels: {
                                  show: true,
                                  name: { show: false },
                                  value: {
                                    show: true,
                                    fontSize: "24px",
                                    fontWeight: "bold",
                                    formatter: () => `${healthScore}%`,
                                  },
                                },
                              },
                            },
                            colors: ["#10B981"],
                            stroke: { lineCap: "round" },
                          };
                          return (
                            <Chart
                              options={options}
                              series={[healthScore]}
                              type="radialBar"
                              height={150}
                            />
                          );
                        })()}
                      </div>
                    </div>
                    <p className="mt-2 font-medium">درجة صحة النظام</p>
                    <p className="text-sm text-gray-600">
                      النظام يعمل بشكل جيد
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">حالة النظام</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">وقت استجابة API</span>
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          سريع
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">صحة قاعدة البيانات</span>
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          صحيح
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">جلسات المستخدم</span>
                        <Badge variant="outline" className="bg-yellow-50">
                          <Clock className="w-3 h-3 mr-1" />
                          متوسط
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">مقاييس التفاعل</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>معدل اكتمال الدورة</span>
                          <span>68%</span>
                        </div>
                        <Progress value={68} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>احتفاظ الطالب</span>
                          <span>82%</span>
                        </div>
                        <Progress value={82} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>تفاعل المحتوى</span>
                          <span>75%</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">أهداف النمو</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">نمو MoM</span>
                          <span className="font-semibold text-green-600">
                            +15.3%
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">نمو QoQ</span>
                          <span className="font-semibold text-blue-600">
                            +42.7%
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">نمو YoY</span>
                          <span className="font-semibold text-purple-600">
                            +127%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-6">
              <CardHeader>
                <CardTitle>خريطة حرارة النشاط</CardTitle>
                <CardDescription>
                  أوقات الاستخدام الأقصى خلال الأسبوع
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const days = [
                    "الإثنين",
                    "الثلاثاء",
                    "الأربعاء",
                    "الخميس",
                    "الجمعة",
                    "السبت",
                    "الأحد",
                  ];
                  const hours = Array.from({ length: 24 }, (_, i) => i);

                  // Generate sample heatmap data
                  const heatmapData = days.flatMap((day, dayIndex) =>
                    hours.map((hour) => ({
                      day: dayIndex,
                      hour,
                      value: Math.floor(Math.random() * 100),
                    }))
                  );

                  const series = days.map((day, index) => ({
                    name: day,
                    data: heatmapData
                      .filter((d) => d.day === index)
                      .map((d) => ({ x: d.hour.toString(), y: d.value })),
                  }));

                  const options: ApexOptions = {
                    chart: { type: "heatmap", toolbar: { show: false } },
                    dataLabels: { enabled: false },
                    colors: ["#3B82F6"],
                    xaxis: {
                      categories: hours.map((h) => `${h}:00`),
                      labels: { show: false },
                    },
                  };

                  return (
                    <Chart
                      options={options}
                      series={series}
                      type="heatmap"
                      height={250}
                    />
                  );
                })()}
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-6">
              <CardHeader>
                <CardTitle>مصفوفة أداء المحتوى</CardTitle>
                <CardDescription>
                  فعالية الأنواع المختلفة من المحتوى
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      type: "محاضرات الفيديو",
                      views: 15420,
                      completion: 72,
                      satisfaction: 4.5,
                    },
                    {
                      type: "اختبارات تفاعلية",
                      views: 8930,
                      completion: 85,
                      satisfaction: 4.7,
                    },
                    {
                      type: "موارد PDF",
                      views: 12100,
                      completion: 65,
                      satisfaction: 4.2,
                    },
                    {
                      type: "جلسات حية",
                      views: 3200,
                      completion: 92,
                      satisfaction: 4.8,
                    },
                    {
                      type: "الواجبات",
                      views: 9870,
                      completion: 78,
                      satisfaction: 4.3,
                    },
                  ].map((content) => (
                    <div key={content.type} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium">{content.type}</h5>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {formatNumber(content.views)} زيارة
                          </Badge>
                          <div className="flex items-center">
                            <Award className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="text-sm">
                              {content.satisfaction}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <Progress value={content.completion} className="h-3" />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-white font-medium">
                          {content.completion}% اكتمال
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>التحليلات التنبؤية</CardTitle>
              <CardDescription>
                الرؤى والتوصيات التنبؤية بواسطة AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>توقع الإيرادات:</strong> بناءً على الاتجاهات
                    الحالية، يتوقع أن يزيد الإيرادات بنسبة 25% في الربع القادم.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    <strong>نمو المستخدمين:</strong> من المتوقع أن يصل عدد
                    الطلاب إلى 50+ بنهاية الشهر عند معدل النمو الحالي.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    <strong>تحسين الدورات:</strong> ينصح بضبط التسعيرة للدورات
                    ذات الصفر مشتريات لتحسين التحويل.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Section */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>آخر تحديث: {new Date().toLocaleString()}</span>
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                حي
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                التقرير المجدول
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4 mr-2" />
                تصدير لوحة التحكم
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPageView;
