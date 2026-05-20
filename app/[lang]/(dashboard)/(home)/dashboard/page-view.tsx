"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import UsersStat from "./components/users-stat";
import DashboardSelect from "@/components/dasboard-select";
import DatePickerWithRange from "@/components/date-picker-with-range";
import { Statistics, TeacherStatistics } from "@/lib/type";
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
  Activity,
  Zap,
  AlertCircle,
  CheckCircle2,
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
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

type TeacherDetail = NonNullable<Statistics["teachers"]["details"]>[number];

function getTeacherRevenue(teacher: TeacherDetail): number {
  if (teacher.total_revenue != null) return Number(teacher.total_revenue);
  return (
    Number(teacher.online_revenue) +
    Number(teacher.offline_revenue) +
    Number(teacher.books_revenue)
  );
}

const METRICS_GRID_PRIMARY =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4";
const METRICS_GRID_SECONDARY =
  "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4";
const METRICS_GRID_STANDARD =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4";

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

  const displayValue =
    typeof value === "number" ? formatNumber(value) : String(value);

  return (
    <Card className="h-full hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs sm:text-sm font-medium text-gray-600 line-clamp-1 min-w-0">
            {title}
          </p>
          <div className={`p-2 rounded-lg shrink-0 ${bgColor}`}>{icon}</div>
        </div>
        <p
          className="text-base sm:text-lg xl:text-xl font-bold whitespace-nowrap tabular-nums leading-none"
          title={displayValue}
        >
          {displayValue}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1.5 whitespace-nowrap truncate">
            {subtitle}
          </p>
        )}
        {change !== undefined && (
          <div className={`flex items-center mt-2 ${trendColor}`}>
            {trend === "up" ? (
              <TrendingUp className="w-4 h-4 mr-1 shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1 shrink-0" />
            )}
            <span className="text-sm font-medium whitespace-nowrap">
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface RevenueBreakdownChartProps {
  data: {
    online_revenue: number;
    offline_revenue: number;
    books_revenue?: number;
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
    Number(data.books_revenue || 0),
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
                formatCurrency(series?.reduce((a, b) => a + b, 0)),
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
  statistics: Statistics | null;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  statistics,
}) => {
  const overview = statistics?.overview;
  const totalRevenue =
    overview?.total_revenue ??
    statistics?.financial?.subscription_revenue ??
    statistics?.students?.total_revenue_from_students ??
    0;
  const avgRevenuePerStudent =
    statistics?.students?.average_revenue_per_student ??
    ((statistics?.students?.total || 0) > 0
      ? totalRevenue / (statistics?.students?.total || 1)
      : 0);
  const conversionRate = statistics?.performance?.conversion_rate ?? 0;

  return (
    <div className={METRICS_GRID_PRIMARY}>
      <MetricCard
        title="إجمالي الإيرادات"
        value={formatCurrency(totalRevenue)}
        icon={<DollarSign className="w-6 h-6 text-blue-600" />}
      />
      <MetricCard
        title="إجمالي المستخدمين"
        value={overview?.total_users ?? statistics?.users?.total ?? 0}
        icon={<Users className="w-6 h-6 text-green-600" />}
        subtitle={`${overview?.active_users_today ?? 0} نشط اليوم`}
      />
      <MetricCard
        title="الطلاب"
        value={overview?.total_students ?? statistics?.students?.total ?? 0}
        icon={<Users className="w-6 h-6 text-purple-600" />}
      />
      <MetricCard
        title="المعلمون"
        value={overview?.total_teachers ?? statistics?.teachers?.total ?? 0}
        icon={<GraduationCap className="w-6 h-6 text-indigo-600" />}
      />
      <MetricCard
        title="متوسط إيراد الطالب"
        value={formatCurrency(Math.round(avgRevenuePerStudent))}
        icon={<Target className="w-6 h-6 text-orange-600" />}
      />
      <MetricCard
        title="معدل التحويل"
        value={`${conversionRate.toFixed(2)}%`}
        icon={<Activity className="w-6 h-6 text-teal-600" />}
        subtitle={`${statistics?.performance?.purchasing_users ?? 0} مشترٍ`}
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
    price: number | string;
  }>;
}

const CoursePerformanceAnalysis: React.FC<CoursePerformanceAnalysisProps> = ({
  courses,
}) => {
  const topCourses = getTopN(courses, "revenue", 10);
  const totalRevenue = courses?.reduce((sum, c) => sum + c.revenue, 0);

  const performanceData = topCourses?.map((course) => ({
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
        c.title.length > 20 ? c.title.substring(0, 20) + "..." : c.title,
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
  const engagementData = students?.map((s) => ({
    ...s,
    totalRevenue: Number(s?.online_revenue) + Number(s?.offline_revenue),
    engagementScore:
      (s?.total_purchases || s?.online_purchases_count || 0) * 10 +
      (s?.subscription_codes_count || 0) * 5,
  }));

  const topEngaged = getTopN(engagementData, "engagementScore", 5);
  const topSpenders = getTopN(engagementData, "totalRevenue", 5);

  const scatterData = engagementData
    .filter(
      (s) =>
        s?.totalRevenue > 0 ||
        (s?.total_purchases || s?.online_purchases_count || 0) > 0,
    )
    .map((s) => ({
      x: s?.total_purchases || s?.online_purchases_count || 0,
      y: s?.totalRevenue,
      z: s?.subscription_codes_count || 0,
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
      title: { text: "الإيرادات الإجمالية (EGP)" },
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
                  {formatCurrency(student?.totalRevenue)}
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
  const performanceMetrics = teachers?.map((t) => ({
    ...t,
    totalRevenue: getTeacherRevenue(t),
    avgRevenuePerCourse:
      t?.courses_count > 0
        ? (Number(t.online_revenue) + Number(t.offline_revenue)) /
          t?.courses_count
        : 0,
    efficiency:
      t?.subscription_codes_count > 0
        ? Number(t.offline_revenue) / t?.subscription_codes_count
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

  const radarSeries = topTeachers?.map((t) => ({
    name: t?.full_name,
    data: [
      Math.min((t.courses_count / 10) * 100, 100),
      Math.min((t.online_courses_purchases / 5) * 100, 100),
      Math.min((t.subscription_codes_count / 100) * 100, 100),
      Math.min((t.books_count / 5) * 100, 100),
      Math.min((t?.totalRevenue / 10000) * 100, 100),
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
            {performanceMetrics?.map((teacher) => (
              <div key={teacher.teacher_id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{teacher.full_name}</h4>
                  <Badge>{formatCurrency(teacher.totalRevenue)}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">الدورات</p>
                    <p className="font-semibold">{teacher.courses_count}</p>
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
  statistics: Statistics | null;
}

const ContentAnalytics: React.FC<ContentAnalyticsProps> = ({ statistics }) => {
  const contentData = [
    {
      category: "الدورات",
      count: statistics?.courses?.total || 0,
      icon: <BookOpen className="w-5 h-5" />,
      color: "bg-blue-500",
    },
    {
      category: "الفيديوهات",
      count: statistics?.videos?.total || 0,
      icon: <Video className="w-5 h-5" />,
      color: "bg-purple-500",
    },
    {
      category: "الاختبارات",
      count: statistics?.exams?.total || 0,
      icon: <GraduationCap className="w-5 h-5" />,
      color: "bg-green-500",
    },
    {
      category: "المدونات",
      count: statistics?.blogs?.total || 0,
      icon: <BookOpen className="w-5 h-5" />,
      color: "bg-orange-500",
    },
    {
      category: "الكتب",
      count: statistics?.books?.total || statistics?.overview?.total_books || 0,
      icon: <BookOpen className="w-5 h-5" />,
      color: "bg-rose-500",
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
  statistics: Statistics | null;
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
      title: { text: "الإيرادات (EGP)" },
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

/* ──────────────────────────────────────────────────────────────
   Teacher Dashboard
────────────────────────────────────────────────────────────── */
interface TeacherDashboardViewProps {
  data: TeacherStatistics;
  trans: { [key: string]: string };
}

const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  data,
}) => {
  const fs = data.financial_summary;
  const grandTotal = fs.total_revenue || 0;

  // Revenue donut
  const revSeries = [
    Number(fs.online_revenue || 0),
    Number(fs.offline_revenue || 0),
    Number(fs.books_revenue || 0),
  ];
  const revOptions: ApexOptions = {
    labels: ["أونلاين", "اشتراكات", "كتب"],
    chart: { type: "donut", toolbar: { show: false } },
    legend: { position: "bottom" },
    colors: ["#3B82F6", "#10B981", "#F59E0B"],
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: "الإجمالي",
              formatter: () => formatCurrency(grandTotal),
            },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v) => formatCurrency(v) } },
  };

  // Subscription codes radial
  const usageRate = Math.round(data.subscription_codes.usage_rate * 100) / 100;
  const radialOptions: ApexOptions = {
    chart: { type: "radialBar" },
    plotOptions: {
      radialBar: {
        hollow: { size: "60%" },
        dataLabels: {
          show: true,
          name: { show: true, fontSize: "12px" },
          value: {
            show: true,
            fontSize: "20px",
            fontWeight: "bold",
            formatter: (v) => `${v}%`,
          },
        },
      },
    },
    labels: ["نسبة الاستخدام"],
    colors: ["#8B5CF6"],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المعلم</h1>
          <p className="text-gray-600 mt-1">
            مرحباً،{" "}
            <span className="font-semibold text-blue-600">
              {data.teacher_info.name}
            </span>
            {" — "}
            {data.teacher_info.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithRange />
          <DashboardSelect />
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="إجمالي الطلاب"
          value={formatNumber(data.students.total)}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          trend="neutral"
        />
        <MetricCard
          title="إجمالي الدورات"
          value={formatNumber(data.courses.total)}
          icon={<BookOpen className="w-6 h-6 text-green-600" />}
          subtitle={`${data.courses.online} أونلاين · ${data.courses.offline} خارجي`}
        />
        <MetricCard
          title="إجمالي الإيرادات"
          value={formatCurrency(grandTotal)}
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          trend="up"
        />
        <MetricCard
          title="كودات الاشتراك"
          value={formatNumber(data.subscription_codes.total)}
          icon={<Zap className="w-6 h-6 text-purple-600" />}
          subtitle={`${data.subscription_codes.used} مستخدم · ${data.subscription_codes.unused} متاح`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-12 gap-6">
        {/* Revenue Breakdown */}
        <Card className="col-span-12 md:col-span-5">
          <CardHeader>
            <CardTitle>توزيع الإيرادات</CardTitle>
            <CardDescription>
              إجمالي {formatCurrency(grandTotal)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              options={revOptions}
              series={revSeries}
              type="donut"
              height={280}
            />
          </CardContent>
        </Card>

        {/* Subscription usage */}
        <Card className="col-span-12 md:col-span-3">
          <CardHeader>
            <CardTitle>استخدام الاشتراكات</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Chart
              options={radialOptions}
              series={[usageRate]}
              type="radialBar"
              height={220}
            />
            <div className="w-full grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-gray-500">مستخدم</p>
                <p className="font-bold text-green-700">
                  {data.subscription_codes.used}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-gray-500">متاح</p>
                <p className="font-bold text-purple-700">
                  {data.subscription_codes.unused}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exams + Financial summary */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-orange-500" />
                الاختبارات المجدولة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-gray-500">الإجمالي</p>
                  <p className="text-xl font-bold text-blue-700">
                    {data.scheduled_exams.total}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-gray-500">القادمة</p>
                  <p className="text-xl font-bold text-yellow-700">
                    {data.scheduled_exams.upcoming}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-gray-500">مكتملة</p>
                  <p className="text-xl font-bold text-green-700">
                    {data.scheduled_exams.completed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                ملخص الإيرادات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  label: "الإيرادات الأونلاين",
                  value: fs.online_revenue,
                  color: "bg-blue-500",
                },
                {
                  label: "إيرادات الاشتراكات",
                  value: fs.offline_revenue,
                  color: "bg-green-500",
                },
                {
                  label: "إيرادات الكتب",
                  value: fs.books_revenue,
                  color: "bg-yellow-500",
                },
              ].map((item) => {
                const pct =
                  grandTotal > 0 ? (item.value / grandTotal) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-semibold">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Courses + Books row */}
      <div className="grid grid-cols-12 gap-6">
        {/* Courses detail */}
        <Card className="col-span-12 md:col-span-6">
          <CardHeader>
            <CardTitle>تفاصيل الدورات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "دورات أونلاين",
                  count: data.courses.online,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "دورات خارجية",
                  count: data.courses.offline,
                  color: "text-green-600",
                  bg: "bg-green-50",
                },
                {
                  label: "مشتريات أونلاين",
                  count: data.courses.online_purchases,
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
                {
                  label: "إيرادات أونلاين",
                  count: formatCurrency(data.courses.online_revenue),
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`${item.bg} rounded-xl p-4 text-center`}
                >
                  <p className={`text-2xl font-bold ${item.color}`}>
                    {item.count}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Books */}
        <Card className="col-span-12 md:col-span-6">
          <CardHeader>
            <CardTitle>الكتب</CardTitle>
            <CardDescription>
              {data.books.total} كتاب · {data.books.purchases} مبيعات ·{" "}
              {formatCurrency(data.books.revenue)} إيرادات
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.books.top_selling_books.length > 0 ? (
              <div className="space-y-3">
                {data.books.top_selling_books.map((book, idx) => (
                  <div
                    key={book.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      <p className="font-medium text-sm">{book.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCurrency(book.revenue)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {book.purchases} مبيعات
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <BookOpen className="w-10 h-10 mb-2" />
                <p className="text-sm">لا توجد بيانات كتب حالياً</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>آخر تحديث: {new Date().toLocaleString()}</span>
            <Badge variant="outline" className="bg-green-50">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              حي
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Admin Dashboard
────────────────────────────────────────────────────────────── */
interface DashboardPageViewProps {
  trans: { [key: string]: string };
  statistics: Statistics | null;
  teacherStatistics?: TeacherStatistics | null;
  teachersForFilter?: { id: number; user: { full_name: string } }[];
  role?: string;
}

const DashboardPageView: React.FC<DashboardPageViewProps> = ({
  trans,
  statistics,
  teacherStatistics,
  teachersForFilter = [],
  role = "admin",
}) => {
  const normalizedRole = (role || "").toLowerCase();
  const isAdmin =
    normalizedRole === "admin" || normalizedRole === "super_admin";
  const canViewTeachersTab =
    Boolean(statistics?.teachers) && normalizedRole !== "teacher";
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── All hooks must come before any conditional return ─────────
  const [entityTab, setEntityTab] = useState("overview");
  const teacherFilterId = searchParams.get("teacher_id") || "all";
  const searchFromUrl = searchParams.get("search") || "";
  const dateRange = searchParams.get("period") || "all";
  const filterCategory = searchParams.get("category") || "all";
  const [searchInput, setSearchInput] = useState(searchFromUrl);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  const updateQueryParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value == null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const applySearchFilter = () => {
    updateQueryParams({ search: searchInput.trim() || null });
  };

  const studentsList = statistics?.students?.details ?? [];
  const teachersList = statistics?.teachers?.details ?? [];

  // Calculate key metrics from API response only
  const totalStudents = statistics?.students?.total || 0;
  const totalTeachers = statistics?.teachers?.total || 0;
  const totalUsers = statistics?.users?.total || 0;
  const totalPurchases = statistics?.financial?.total_purchases || 0;

  const totalOnlineRevenue =
    studentsList.reduce((sum, s) => sum + Number(s?.online_revenue), 0) || 0;
  const totalOfflineRevenue =
    studentsList.reduce((sum, s) => sum + Number(s?.offline_revenue), 0) || 0;
  const totalBookRevenue =
    teachersList.reduce((sum, t) => sum + Number(t.books_revenue), 0) || 0;
  const grandTotalRevenue =
    statistics?.financial?.total_system_revenue ??
    statistics?.overview?.total_revenue ??
    totalOnlineRevenue + totalOfflineRevenue + totalBookRevenue;

  const handleTeacherFilterChange = (value: string) => {
    updateQueryParams({
      teacher_id: value === "all" ? null : value,
    });
  };

  const selectedTeacher =
    teacherFilterId !== "all"
      ? teachersList.find((t) => String(t.teacher_id) === teacherFilterId) ??
        (teachersList.length === 1 ? teachersList[0] : null)
      : null;

  const teachersTabTotals = {
    count: statistics?.teachers?.total ?? teachersList.length,
    courses: teachersList.reduce((sum, t) => sum + (t.courses_count || 0), 0),
    books: teachersList.reduce((sum, t) => sum + (t.books_count || 0), 0),
    students: teachersList.reduce(
      (sum, t) => sum + (t.students_count || 0),
      0,
    ),
    codes: teachersList.reduce(
      (sum, t) => sum + (t.subscription_codes_count || 0),
      0,
    ),
    revenue:
      statistics?.teachers?.total_revenue_from_teachers ??
      teachersList.reduce((sum, t) => sum + getTeacherRevenue(t), 0),
  };

  // ── Teacher early return (after all hooks) ────────────────────
  if (role === "teacher" && teacherStatistics) {
    return <TeacherDashboardView data={teacherStatistics} trans={trans} />;
  }

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
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applySearchFilter();
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={applySearchFilter}>
              تطبيق البحث
            </Button>
            <Select
              value={dateRange}
              onValueChange={(value) => updateQueryParams({ period: value })}
            >
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
            <Select
              value={filterCategory}
              onValueChange={(value) => updateQueryParams({ category: value })}
            >
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
        <TabsList className="flex w-full h-auto flex-wrap justify-start gap-1 p-1 bg-muted/50">
          <TabsTrigger
            value="overview"
            className="flex-1 min-w-[7rem] sm:flex-none"
          >
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="flex-1 min-w-[7rem] sm:flex-none"
          >
            الطلاب
          </TabsTrigger>
          {canViewTeachersTab && (
            <TabsTrigger
              value="teachers"
              className="flex-1 min-w-[7rem] sm:flex-none"
            >
              المعلمون
            </TabsTrigger>
          )}
          <TabsTrigger
            value="courses"
            className="flex-1 min-w-[7rem] sm:flex-none"
          >
            الدورات
          </TabsTrigger>
          <TabsTrigger
            value="revenue"
            className="flex-1 min-w-[7rem] sm:flex-none"
          >
            الإيرادات
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex-1 min-w-[7rem] sm:flex-none"
          >
            التحليلات
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <PerformanceMetrics statistics={statistics} />

          <div className={METRICS_GRID_SECONDARY}>
            <MetricCard
              title="الدورات"
              value={
                statistics?.overview?.total_courses ??
                statistics?.courses?.total ??
                0
              }
              icon={<BookOpen className="w-5 h-5 text-blue-600" />}
            />
            <MetricCard
              title="الكتب"
              value={
                statistics?.overview?.total_books ??
                statistics?.books?.total ??
                0
              }
              icon={<BookOpen className="w-5 h-5 text-purple-600" />}
            />
            <MetricCard
              title="الاختبارات"
              value={
                statistics?.overview?.total_exams ??
                statistics?.exams?.total ??
                0
              }
              icon={<GraduationCap className="w-5 h-5 text-green-600" />}
            />
            <MetricCard
              title="الفيديوهات"
              value={
                statistics?.overview?.total_videos ??
                statistics?.videos?.total ??
                0
              }
              icon={<Video className="w-5 h-5 text-indigo-600" />}
            />
            <MetricCard
              title="المدونات"
              value={
                statistics?.overview?.total_blogs ??
                statistics?.blogs?.total ??
                0
              }
              icon={<BookOpen className="w-5 h-5 text-orange-600" />}
            />
            <MetricCard
              title="أكواد الاشتراك"
              value={statistics?.subscription_codes?.total ?? 0}
              icon={<ShoppingCart className="w-5 h-5 text-rose-600" />}
              subtitle={`${statistics?.subscription_codes?.usage_rate?.toFixed(1) ?? 0}% مستخدم`}
            />
            <MetricCard
              title="إيراد النظام"
              value={formatCurrency(
                statistics?.financial?.total_system_revenue ?? 0,
              )}
              icon={<DollarSign className="w-5 h-5 text-teal-600" />}
            />
            <MetricCard
              title="المشاهدات"
              value={statistics?.engagement?.total_views ?? 0}
              icon={<Eye className="w-5 h-5 text-cyan-600" />}
            />
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className={`col-span-12 ${isAdmin ? "lg:col-span-8" : ""}`}>
              <ReportsSnapshot statistics={statistics} />
            </div>
            {isAdmin && (
              <div className="col-span-12 lg:col-span-4">
                <UsersStat statistics={statistics} trans={trans} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-12 gap-6">
            <ContentAnalytics statistics={statistics} />
            <RevenueTimeline statistics={statistics} />
          </div>

          <CoursePerformanceAnalysis
            courses={statistics?.courses?.online_courses || []}
          />
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <div className={METRICS_GRID_STANDARD}>
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
              value={studentsList.reduce(
                (sum, s) => sum + (s?.subscription_codes_count || 0),
                0,
              )}
              icon={<ShoppingCart className="w-6 h-6 text-purple-600" />}
            />
            <MetricCard
              title="متوسط إيراد الطالب"
              value={formatCurrency(
                statistics?.students?.average_revenue_per_student ?? 0,
              )}
              icon={<Activity className="w-6 h-6 text-orange-600" />}
            />
          </div>

          <StudentEngagementAnalytics students={studentsList} />

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
                    {studentsList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-gray-500"
                        >
                          لا توجد بيانات
                        </td>
                      </tr>
                    ) : (
                    studentsList.map((student) => {
                      const totalRev =
                        student.total_revenue != null
                          ? Number(student.total_revenue)
                          : Number(student.online_revenue) +
                            Number(student.offline_revenue);
                      const isActive =
                        (student.total_purchases || 0) > 0 ||
                        (student.subscription_codes_count || 0) > 0;
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
                            {student.total_purchases ??
                              student.online_courses_count ??
                              0}
                          </td>
                          <td className="p-4">
                            {student.subscription_codes_count || 0}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">
                              {isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        {canViewTeachersTab && (
          <TabsContent value="teachers" className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[220px]">
                    <p className="text-sm text-gray-600 mb-1">
                      تصفية حسب المعلم
                    </p>
                    <Select
                      value={teacherFilterId}
                      onValueChange={handleTeacherFilterChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="كل المعلمين" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل المعلمين</SelectItem>
                        {teachersForFilter.map((t) => (
                          <SelectItem
                            key={t.id}
                            value={String(t.id)}
                          >
                            {t.user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className={METRICS_GRID_PRIMARY}>
              <MetricCard
                title="المعلمون"
                value={statistics?.teachers?.total ?? teachersTabTotals.count}
                icon={<GraduationCap className="w-6 h-6 text-blue-600" />}
              />
              <MetricCard
                title="إجمالي الدورات"
                value={teachersTabTotals.courses}
                icon={<BookOpen className="w-6 h-6 text-green-600" />}
              />
              <MetricCard
                title="إجمالي الكتب"
                value={teachersTabTotals.books}
                icon={<BookOpen className="w-6 h-6 text-purple-600" />}
              />
              <MetricCard
                title="الطلاب المرتبطون"
                value={teachersTabTotals.students}
                icon={<Users className="w-6 h-6 text-indigo-600" />}
              />
              <MetricCard
                title="أكواد الاشتراك"
                value={teachersTabTotals.codes}
                icon={<ShoppingCart className="w-6 h-6 text-orange-600" />}
              />
              <MetricCard
                title="إجمالي الإيرادات"
                value={formatCurrency(teachersTabTotals.revenue)}
                icon={<DollarSign className="w-6 h-6 text-teal-600" />}
                subtitle={`متوسط ${formatCurrency(
                  statistics?.teachers?.average_revenue_per_teacher ?? 0,
                )}`}
              />
            </div>

            {selectedTeacher && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    تفاصيل المعلم: {selectedTeacher.full_name}
                  </CardTitle>
                  <CardDescription>
                    {selectedTeacher.subject || "—"} ·{" "}
                    {selectedTeacher.email || "بدون بريد"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">الدورات</p>
                      <p className="font-semibold">
                        {selectedTeacher.courses_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">مشتريات أونلاين</p>
                      <p className="font-semibold">
                        {selectedTeacher.online_courses_purchases}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">أكواد الاشتراك</p>
                      <p className="font-semibold">
                        {selectedTeacher.subscription_codes_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">الطلاب</p>
                      <p className="font-semibold">
                        {selectedTeacher.students_count ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">إيراد أونلاين</p>
                      <p className="font-semibold">
                        {formatCurrency(selectedTeacher.online_revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">إيراد خارجي</p>
                      <p className="font-semibold">
                        {formatCurrency(
                          Number(selectedTeacher.offline_revenue),
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">كتب / مشتريات</p>
                      <p className="font-semibold">
                        {selectedTeacher.books_count} /{" "}
                        {selectedTeacher.book_purchases_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">إيراد الكتب</p>
                      <p className="font-semibold">
                        {formatCurrency(selectedTeacher.books_revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">الإيراد الإجمالي</p>
                      <p className="font-semibold text-green-700">
                        {formatCurrency(getTeacherRevenue(selectedTeacher))}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">تاريخ التسجيل</p>
                      <p className="font-semibold">
                        {selectedTeacher.registration_date
                          ? new Date(
                              selectedTeacher.registration_date,
                            ).toLocaleDateString("ar-EG")
                          : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <TeacherPerformanceDashboard teachers={teachersList} />

            {(statistics?.teachers?.top_teachers_by_revenue?.length ?? 0) >
              0 && (
              <Card>
                <CardHeader>
                  <CardTitle>أفضل المعلمين حسب الإيراد</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(statistics?.teachers?.top_teachers_by_revenue ?? []).map(
                      (teacher, idx) => (
                        <div
                          key={teacher.teacher_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-medium">{teacher.full_name}</p>
                              <p className="text-xs text-gray-600">
                                {teacher.subject} · {teacher.courses_count} دورة
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold">
                            {formatCurrency(getTeacherRevenue(teacher))}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

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
                        <th className="text-left p-4">المادة</th>
                        <th className="text-left p-4">البريد</th>
                        <th className="text-left p-4">الدورات</th>
                        <th className="text-left p-4">الطلاب</th>
                        <th className="text-left p-4">مشتريات أونلاين</th>
                        <th className="text-left p-4">أكواد اشتراك</th>
                        <th className="text-left p-4">إيراد أونلاين</th>
                        <th className="text-left p-4">إيراد خارجي</th>
                        <th className="text-left p-4">إيراد كتب</th>
                        <th className="text-left p-4">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachersList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={11}
                            className="p-8 text-center text-gray-500"
                          >
                            لا توجد بيانات
                          </td>
                        </tr>
                      ) : (
                        teachersList.map((teacher) => {
                          const totalRev = getTeacherRevenue(teacher);
                          return (
                            <tr
                              key={teacher.teacher_id}
                              className="border-b hover:bg-gray-50 cursor-pointer"
                              onClick={() =>
                                handleTeacherFilterChange(
                                  String(teacher.teacher_id),
                                )
                              }
                            >
                              <td className="p-4 font-medium">
                                {teacher.full_name}
                              </td>
                              <td className="p-4">{teacher.subject || "—"}</td>
                              <td className="p-4">{teacher.email || "—"}</td>
                              <td className="p-4">{teacher.courses_count}</td>
                              <td className="p-4">
                                {teacher.students_count ?? 0}
                              </td>
                              <td className="p-4">
                                {teacher.online_courses_purchases}
                              </td>
                              <td className="p-4">
                                {teacher.subscription_codes_count}
                              </td>
                              <td className="p-4">
                                {formatCurrency(teacher.online_revenue)}
                              </td>
                              <td className="p-4">
                                {formatCurrency(
                                  Number(teacher.offline_revenue),
                                )}
                              </td>
                              <td className="p-4">
                                {formatCurrency(teacher.books_revenue)}
                              </td>
                              <td className="p-4 font-semibold">
                                {formatCurrency(totalRev)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className={METRICS_GRID_STANDARD}>
            <MetricCard
              title="إجمالي الدورات"
              value={statistics?.courses?.total || 0}
              icon={<BookOpen className="w-6 h-6 text-blue-600" />}
            />
            <MetricCard
              title="الدورات الأونلاين"
              value={statistics?.courses?.online_count ?? 0}
              icon={<Zap className="w-6 h-6 text-green-600" />}
              subtitle={`${(
                ((statistics?.courses?.online_count ?? 0) /
                  Math.max(statistics?.courses?.total ?? 0, 1)) *
                100
              ).toFixed(0)}% من الإجمالي`}
            />
            <MetricCard
              title="الدورات الاوفلاين"
              value={statistics?.courses?.offline_count ?? 0}
              icon={<BookOpen className="w-6 h-6 text-purple-600" />}
            />
            <MetricCard
              title="عدد زيارات الدورة"
              value={statistics?.engagement?.course_views || 0}
              icon={<Eye className="w-6 h-6 text-orange-600" />}
            />
          </div>

          <CoursePerformanceAnalysis
            courses={statistics?.courses?.online_courses || []}
          />

          <div className="grid grid-cols-12 gap-6">
            <Card className="col-span-12 lg:col-span-6">
              <CardHeader>
                <CardTitle>تحليل تسعيرة الدورات</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const courses = statistics?.courses?.online_courses || [];
                  const priceRanges = {
                    مجاني: courses?.filter((c) => Number(c.price) === 0).length,
                    "EGP 1-50": courses?.filter(
                      (c) => Number(c.price) > 0 && Number(c.price) <= 50,
                    ).length,
                    "EGP 51-100": courses?.filter(
                      (c) => Number(c.price) > 50 && Number(c.price) <= 100,
                    ).length,
                    "EGP 100+": courses?.filter((c) => Number(c.price) > 100)
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
                  const totalViews = statistics?.engagement?.course_views || 0;
                  const totalCourses = statistics?.courses?.total;
                  const totalPurchases =
                    statistics?.financial?.total_purchases || 0;
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
                              value={
                                item.value > 0
                                  ? (item.value / funnelData[0].value) * 100
                                  : 0
                              }
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

          <div className={METRICS_GRID_STANDARD}>
            <MetricCard
              title="إجمالي إيراد النظام"
              value={formatCurrency(
                statistics?.financial?.total_system_revenue ??
                  grandTotalRevenue,
              )}
              icon={<DollarSign className="w-6 h-6 text-green-600" />}
            />
            <MetricCard
              title="إيراد الاشتراكات"
              value={formatCurrency(
                statistics?.financial?.subscription_revenue ??
                  totalOfflineRevenue,
              )}
              icon={<Zap className="w-6 h-6 text-blue-600" />}
            />
            <MetricCard
              title="إيراد المعلمين"
              value={formatCurrency(
                statistics?.teachers?.total_revenue_from_teachers ??
                  totalBookRevenue,
              )}
              icon={<GraduationCap className="w-6 h-6 text-purple-600" />}
            />
            <MetricCard
              title="متوسط قيمة الشراء"
              value={formatCurrency(
                statistics?.financial?.average_purchase_value ?? 0,
              )}
              icon={<BookOpen className="w-6 h-6 text-orange-600" />}
            />
          </div>

          <div className="grid grid-cols-12 gap-6">
            <RevenueBreakdownChart
              data={{
                online_revenue: totalOnlineRevenue,
                offline_revenue: totalOfflineRevenue,
                books_revenue: totalBookRevenue,
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

                  const projectedRevenue = months?.map((_, idx) =>
                    Math.round(
                      currentMonthlyAvg * Math.pow(growthRate, idx + 1),
                    ),
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
                    {(statistics?.students?.top_students_by_revenue?.length
                      ? statistics.students.top_students_by_revenue.slice(0, 5)
                      : getTopN(
                          statistics?.students?.details || [],
                          "total_revenue",
                          5,
                        )
                    ).map((student, idx) => {
                      const total =
                        student.total_revenue != null
                          ? Number(student.total_revenue)
                          : Number(student.online_revenue) +
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
                                {student.total_purchases ?? 0} مشتريات
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

                {isAdmin && (
                  <div>
                    <h4 className="font-medium mb-3">
                      أفضل المعلمون الإيرادات الأعلى
                    </h4>
                    <div className="space-y-2">
                      {(statistics?.teachers?.top_teachers_by_revenue?.length
                        ? statistics.teachers.top_teachers_by_revenue.slice(
                            0,
                            5,
                          )
                        : getTopN(
                            statistics?.teachers?.details || [],
                            "total_revenue",
                            5,
                          )
                      ).map((teacher, idx) => {
                        const total = getTeacherRevenue(teacher);
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
                                <p className="font-medium">
                                  {teacher.full_name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {teacher.courses_count} دورة
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
                                    Number(teacher.offline_revenue),
                                  )}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className={METRICS_GRID_STANDARD}>
            <MetricCard
              title="معدل التحويل"
              value={`${(statistics?.performance?.conversion_rate ?? 0).toFixed(2)}%`}
              icon={<Target className="w-6 h-6 text-blue-600" />}
            />
            <MetricCard
              title="متوسط قيمة العميل"
              value={formatCurrency(
                statistics?.performance?.average_customer_value ?? 0,
              )}
              icon={<DollarSign className="w-6 h-6 text-green-600" />}
            />
            <MetricCard
              title="أكواد مستخدمة"
              value={statistics?.subscription_codes?.used ?? 0}
              icon={<ShoppingCart className="w-6 h-6 text-purple-600" />}
              subtitle={`من ${statistics?.subscription_codes?.total ?? 0}`}
            />
            <MetricCard
              title="قيمة الأكواد المستخدمة"
              value={formatCurrency(
                statistics?.subscription_codes?.used_value ?? 0,
              )}
              icon={<Activity className="w-6 h-6 text-orange-600" />}
            />
          </div>

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
                  const heatmapData = days?.flatMap((day, dayIndex) =>
                    hours?.map((hour) => ({
                      day: dayIndex,
                      hour,
                      value: Math.floor(Math.random() * 100),
                    })),
                  );

                  const series = days?.map((day, index) => ({
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
                      categories: hours?.map((h) => `${h}:00`),
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
