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
import { DateRange } from "react-day-picker";
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
  Users,
  GraduationCap,
  Phone,
  School,
} from "lucide-react";

import { useEffect, useState } from "react";
import { getData } from "@/lib/axios/server";
import axios, { AxiosHeaders } from "axios";
import { StudentTypes, SubscriptionCodeTypes, Teacher, User } from "@/lib/type";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DatePickerWithRange from "@/components/date-picker-with-range";

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

function BasicDataTable() {
  const [data, setData] = useState<StudentTypes[]>([]);
  const [token, setToken] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [area, setArea] = useState<any[]>([]);
  const [level, setLevel] = useState<any[]>([]);
  // const [subjects, setSubjects] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    governorate_id: "",
    area_id: "",
    level_id: "",
    // subject_id: "",
    teacher_id: "",
    gender: "",
    to_date: "",
    from_date: "",
    search: "",
  });

  const [user, setUser] = useState<User | null>(null);
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalSchools: 0,
    studentsWithPhone: 0,
  });
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
    total: 0,
    lastPage: 1,
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Calculate statistics
  const calculateStatistics = (studentsData: StudentTypes[]) => {
    const activeStudents = studentsData.filter(
      (student) => student.status === "active"
    ).length;
    const uniqueSchools = new Set(
      studentsData?.map((student) => student.school_name).filter(Boolean)
    ).size;
    const studentsWithPhone = studentsData.filter(
      (student) => student.user?.phone
    ).length;

    setStatistics({
      totalStudents: pagination.total,
      activeStudents,
      totalSchools: uniqueSchools,
      studentsWithPhone,
    });
  };

  // feach governornment data
  const feachGovernorData = async () => {
    try {
      const response = await getData(
        "governorates",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setGovernorates(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  // feach governornment data
  const feachLevelsData = async () => {
    try {
      const response = await getData(
        "levels",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setLevel(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  // feach governornment data
  const feachAreaData = async () => {
    try {
      const response = await getData(
        "areas",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setArea(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  // const feachSubjectsData = async () => {
  //   try {
  //     const response = await getData(
  //       "subjects",
  //       {},
  //       {
  //         Authorization: `Bearer ${token}`,
  //       }
  //     );
  //     setSubjects(response.data);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  useEffect(() => {
    feachAreaData();
    feachLevelsData();
    feachGovernorData();
    // feachSubjectsData();
  }, [token]);

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

  // refetch users
  const refetchUsers = async () => {
    try {
      const response = await getData(
        "students",
        {
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          ...filters,
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setData(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response?.meta?.total,
        lastPage: response?.meta?.last_page,
      }));

      // Calculate statistics with the fetched data
      calculateStatistics(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // feach users from api
  useEffect(() => {
    refetchUsers();
  }, [pagination.pageIndex, pagination.pageSize, token, filters]);

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
        }
      } catch (error) {
        throw error;
      }
    };

    feachData();
  }, []);

  // columns of table
  const columns: ColumnDef<StudentTypes>[] = [
    {
      accessorKey: "full_name",
      header: "الاسم الكامل",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="rounded-full">
              <AvatarFallback>{user.user?.avatar}</AvatarFallback>
            </Avatar>
            <span>{user.user?.name ?? "N/A"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "stu_no",
      header: "كود الطالب",
      cell: ({ row }) => <div>{row.original.stu_no}</div>,
    },
    {
      accessorKey: "school_name",
      header: "اسم المدرسة",
      cell: ({ row }) => <div>{row.original.school_name}</div>,
    },
    {
      accessorKey: "father_phone",
      header: "هاتف الأب",
      cell: ({ row }) => <div>{row.original.father_phone}</div>,
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "active" ? "soft" : "outline"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "email",
      header: "الايميل",
      cell: ({ row }) => (
        <div className="lowercase whitespace-nowrap">
          {row.original.user?.email ?? "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "الهاتف",
      cell: ({ row }) => <div>{row.original.user?.phone ?? "N/A"}</div>,
    },
    {
      accessorKey: "role",
      header: "دور",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.user?.role ?? "student"}
        </Badge>
      ),
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
    manualPagination: true,
    pageCount: pagination.lastPage,
    state: {
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
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

  return (
    <>
      {/* Statistics Section */}
      <div className="mb-8 px-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          إحصائيات الطلاب
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="إجمالي الطلاب"
            value={statistics?.totalStudents?.toLocaleString()}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="الطلاب النشطون"
            value={statistics?.activeStudents?.toLocaleString()}
            icon={GraduationCap}
            color="green"
          />
          <StatCard
            title="عدد المدارس"
            value={statistics?.totalSchools?.toLocaleString()}
            icon={School}
            color="purple"
          />
          <StatCard
            title="طلاب لديهم هاتف"
            value={statistics?.studentsWithPhone?.toLocaleString()}
            icon={Phone}
            color="orange"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4 mb-4">
        {/* Filters Bar */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          {/* Governorate Filter */}
          <div className="min-w-[180px]">
            <Label htmlFor="governorate">المحافظة</Label>
            <Select
              value={filters.governorate_id}
              onValueChange={(value) => {
                setFilters((prev) => ({
                  ...prev,
                  governorate_id: value,
                  area_id: "",
                }));
                setArea([]); // Optionally clear area if governorate changes
                feachAreaData();
                refetchUsers();
              }}
            >
              <SelectTrigger id="governorate">
                <SelectValue placeholder="اختر المحافظة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                {governorates?.map((g: any) => (
                  <SelectItem key={g.id} value={g.id + ""}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Area Filter */}
          <div className="min-w-[180px]">
            <Label htmlFor="area">المنطقة</Label>
            <Select
              value={filters.area_id}
              onValueChange={(value) => {
                setFilters((prev) => ({ ...prev, area_id: value }));
                refetchUsers();
              }}
            >
              <SelectTrigger id="area">
                <SelectValue placeholder="اختر المنطقة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                {area?.map((a: any) => (
                  <SelectItem key={a.id} value={a.id + ""}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Level Filter */}
          <div className="min-w-[180px]">
            <Label htmlFor="level">المرحلة</Label>
            <Select
              value={filters.level_id}
              onValueChange={(value) => {
                setFilters((prev) => ({ ...prev, level_id: value }));
                refetchUsers();
              }}
            >
              <SelectTrigger id="level">
                <SelectValue placeholder="اختر المرحلة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                {level?.map((l: any) => (
                  <SelectItem key={l.id} value={l.id + ""}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Subject Filter */}
          {/* <div className="min-w-[180px]">
            <Label htmlFor="subject">المادة</Label>
            <Select
              value={filters.subject_id}
              onValueChange={(value) => {
                setFilters((prev) => ({ ...prev, subject_id: value }));
                refetchUsers();
              }}
            >
              <SelectTrigger id="subject">
                <SelectValue placeholder="اختر المادة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                {subjects?.map((s: any) => (
                  <SelectItem key={s.id} value={s.id + ""}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}
          {/* Teacher Filter (admin only) */}
          {user?.role === "admin" && (
            <div className="min-w-[180px]">
              <Label htmlFor="teacher">المعلم</Label>
              <Select
                value={filters.teacher_id}
                onValueChange={(value) => {
                  setFilters((prev) => ({ ...prev, teacher_id: value }));
                  refetchUsers();
                }}
              >
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="اختر المعلم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">الكل</SelectItem>
                  {teachers?.map((t: any) => (
                    <SelectItem key={t.id} value={t.id + ""}>
                      {t.user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Gender Filter */}
          <div className="min-w-[180px] flex flex-col">
            <Label>الجنس</Label>
            <RadioGroup
              value={filters.gender}
              onValueChange={(value) => {
                setFilters((prev) => ({ ...prev, gender: value }));
                refetchUsers();
              }}
              className="flex flex-row gap-2 mt-1"
            >
              <RadioGroupItem value="" id="gender-all">
                الكل
              </RadioGroupItem>
              <RadioGroupItem value="male" id="gender-male">
                ذكر
              </RadioGroupItem>
              <RadioGroupItem value="female" id="gender-female">
                أنثى
              </RadioGroupItem>
            </RadioGroup>
          </div>
          {/* Date Range Filter */}
          <div className="min-w-[220px] flex flex-col">
            <Label>الفترة الزمنية</Label>
            <DatePickerWithRange
              className="w-full"
              value={dateRange}
              onChange={(range) => {
                setDateRange(range);
                setFilters((prev) => ({
                  ...prev,
                  from_date: range?.from
                    ? range.from.toISOString().split("T")[0]
                    : "",
                  to_date: range?.to
                    ? range.to.toISOString().split("T")[0]
                    : "",
                }));
                refetchUsers();
              }}
            />
          </div>
          {/* Reset Filters Button */}
          <div className="flex items-end">
            <Button
              variant="outline"
              color="warning"
              size="sm"
              onClick={() => {
                setFilters({
                  governorate_id: "",
                  area_id: "",
                  level_id: "",
                  // subject_id: "",
                  teacher_id: "",
                  gender: "",
                  to_date: "",
                  from_date: "",
                  search: "",
                });
                setDateRange(undefined);
                refetchUsers();
              }}
            >
              إعادة تعيين الفلاتر
            </Button>
          </div>
        </div>
        {/* search input */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by name..."
            value={filters.search}
            onChange={(event) => {
              setFilters((prev) => ({ ...prev, search: event.target.value }));
              refetchUsers();
            }}
            className="max-w-sm min-w-[200px] h-10"
          />
        </div>
      </div>

      {/* users table */}
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
            {table.getRowModel().rows?.length ? (
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
            {Array.from({ length: pagination.lastPage }, (_, i) => i + 1)?.map(
              (pageNumber) => (
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
              )
            )}
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
