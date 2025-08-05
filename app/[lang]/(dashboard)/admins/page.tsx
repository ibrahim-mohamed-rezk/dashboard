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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useRef } from "react";
import { getData, postData, deleteData } from "@/lib/axios/server";
import axios from "axios";
import { AdminTypes, Module, Teacher } from "@/lib/type";
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
import { Checkbox } from "@/components/ui/checkbox";
import { X, Users, Shield, BookOpen, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

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
          <p className="text-3xl font-bold mt-2">{value?.toLocaleString()}</p>
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

function BasicDataTable() {
  const [data, setData] = useState<AdminTypes[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [token, setToken] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminTypes | null>(null);
  const locale = "ar";
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "admin",
    teachers: [] as number[],
    teacher_modules: [] as number[][],
    admin_modules: [] as number[],
  });
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeachers, setSelectedTeachers] = useState<Teacher[]>([]);
  const [pagination, setPagination] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  }>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    links: [],
  });

  // ✅ Multi-select state
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const statistics = {
    totalAdmins: data?.length,
    totalTeachers: teachers?.length,
    totalModules: modules?.length,
    activeAdmins: data?.filter(
      (admin) => admin.modules && admin.modules.length > 0
    ).length,
  };

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
  });

  const refetchAdmins = async (page = 1) => {
    try {
      const response = await getData(
        "admins",
        { page },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setData(response.data);
      setPagination({
        current_page: response.meta.current_page,
        last_page: response.meta.last_page,
        per_page: response.meta.per_page,
        total: response.meta.total,
        links: response.meta.links,
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    refetchAdmins();
  }, [token]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await getData(
          "modules",
          {},
          {
            Authorization: `Bearer ${token}`,
          }
        );
        setModules(response);
      } catch (error) {
        console.log(error);
      }
    };
    fetchModules();
  }, [token]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await getData(
          "teachers",
          {},
          {
            Authorization: `Bearer ${token}`,
          }
        );
        setTeachers(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchTeachers();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTeacherChange = (teacherId: number, checked: boolean) => {
    setFormData((prev) => {
      const updatedTeachers = checked
        ? [...prev.teachers, teacherId]
        : prev.teachers.filter((id) => id !== teacherId);
      let updatedTeacherModules;
      if (checked) {
        const teacherIndex = updatedTeachers.indexOf(teacherId);
        updatedTeacherModules = [...prev.teacher_modules];
        updatedTeacherModules[teacherIndex] = [];
      } else {
        const oldTeacherIndex = prev.teachers.indexOf(teacherId);
        updatedTeacherModules = prev.teacher_modules.filter(
          (_, index) => index !== oldTeacherIndex
        );
      }
      return {
        ...prev,
        teachers: updatedTeachers,
        teacher_modules: updatedTeacherModules,
      };
    });
  };

  const handleTeacherModuleChange = (
    teacherId: number,
    moduleId: number,
    checked: boolean
  ) => {
    setFormData((prev) => {
      const teacherIndex = prev.teachers.indexOf(teacherId);
      if (teacherIndex === -1) return prev;
      const updatedTeacherModules = [...prev.teacher_modules];
      const currentModules = updatedTeacherModules[teacherIndex] || [];
      updatedTeacherModules[teacherIndex] = checked
        ? [...currentModules, moduleId]
        : currentModules.filter((id) => id !== moduleId);
      return {
        ...prev,
        teacher_modules: updatedTeacherModules,
      };
    });
  };

  const handleAdminModuleChange = (moduleId: number, checked: boolean) => {
    setFormData((prev) => {
      const updatedModules = checked
        ? [...prev.admin_modules, moduleId]
        : prev.admin_modules.filter((id) => id !== moduleId);
      return {
        ...prev,
        admin_modules: updatedModules,
      };
    });
  };

  const isTeacherSelected = (teacherId: number) => {
    return formData.teachers.includes(teacherId);
  };

  const isTeacherModuleSelected = (teacherId: number, moduleId: number) => {
    const teacherIndex = formData.teachers.indexOf(teacherId);
    if (teacherIndex === -1) return false;
    return formData.teacher_modules[teacherIndex]?.includes(moduleId) || false;
  };

  const isAdminModuleSelected = (moduleId: number) => {
    return formData.admin_modules.includes(moduleId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        teacher_modules: formData.teacher_modules,
      };
      if (isEdit && editingAdmin) {
        await postData(`admins/${editingAdmin.id}`, submitData, {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        });
        toast.success("تم تحديث المشرف بنجاح");
      } else {
        await postData("admins", submitData, {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        });
        toast.success("تم إضافة المشرف بنجاح");
      }
      setIsOpen(false);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        role: "admin",
        teachers: [],
        teacher_modules: [],
        admin_modules: [],
      });
      refetchAdmins();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.errors;
        if (errorData) {
          const errorMessages = Object.values(errorData).flat().join("<br>");
          setError(errorMessages);
        } else {
          setError("حدث خطأ");
        }
      } else {
        setError("حدث خطأ غير متوقع");
      }
    }
  };

  const handleEdit = (admin: AdminTypes) => {
    setEditingAdmin(admin);
    setSearchQuery("");
    const validTeachers = admin.teachers.filter((t) => t.id !== null);
    const teacherIds = validTeachers.map((t) => t.id);
    const currentTeacherIds = teachers?.map((t) => t.id) || [];
    const difference = teacherIds.filter(
      (id) => !currentTeacherIds.includes(id)
    );
    const teacherModules = validTeachers.map((t) => {
      const uniqueModuleIds = [
        ...new Set(t.modules.filter((m) => m.access).map((m) => m.id)),
      ];
      return uniqueModuleIds;
    });
    const adminModuleIds = admin.modules
      .filter((m) => m.access)
      .map((m) => m.id);
    setFormData({
      full_name: admin.full_name,
      email: admin.email,
      phone: admin.phone,
      password: "",
      role: admin.role,
      teachers: teacherIds,
      teacher_modules: teacherModules,
      admin_modules: adminModuleIds,
    });
    const selectedTeachersList = validTeachers.map((adminTeacher) => {
      const existingTeacher = teachers?.find((t) => t.user.id === adminTeacher.id);
      if (existingTeacher) {
        return existingTeacher;
      }
      return {
        id: adminTeacher.user.id,
        user: {
          id: adminTeacher.user.id,
          full_name: adminTeacher.name || "Unknown Teacher",
          email: `teacher${adminTeacher.user.id}@example.com`,
          phone: "",
          avatar: "",
        },
        modules: adminTeacher.modules,
      } as Teacher;
    });
    setSelectedTeachers(selectedTeachersList);
    setIsEdit(true);
    setIsOpen(true);
    return difference;
  };

  const filteredTeachers = teachers?.filter((teacher) => {
    const searchLower = searchQuery.toLowerCase();
    return teacher.user.full_name.toLowerCase().includes(searchLower);
  });

  const handleTeacherSelect = (teacher: Teacher) => {
    const isAlreadyInFormData = formData.teachers.includes(teacher.user.id);
    const isAlreadyInSelectedTeachers = selectedTeachers.some(
      (t) => t.id === teacher.user.id
    );
    if (!isAlreadyInFormData && !isAlreadyInSelectedTeachers) {
      setSelectedTeachers((prev) => [...prev, teacher]);
      handleTeacherChange(teacher.user.id, true);
    }
  };

  const handleTeacherRemove = (teacherId: number) => {
    const teacherIndex = formData.teachers.indexOf(teacherId);
    setSelectedTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    setFormData((prev) => {
      const updatedTeachers = prev.teachers.filter((id) => id !== teacherId);
      const updatedTeacherModules = prev.teacher_modules.filter(
        (_, index) => index !== teacherIndex
      );
      return {
        ...prev,
        teachers: updatedTeachers,
        teacher_modules: updatedTeacherModules,
      };
    });
  };

  const handleAddAllTeachers = () => {
    const allTeachers = teachers || [];
    setSelectedTeachers(allTeachers);
    allTeachers.forEach((teacher) => {
      if (!isTeacherSelected(teacher.user.id)) {
        handleTeacherChange(teacher.user.id, true);
      }
    });
  };

  const handleSelectAllTeacherModules = (teacherId: number) => {
    setFormData((prev) => {
      const teacherIndex = prev.teachers.indexOf(teacherId);
      if (teacherIndex === -1) return prev;
      const allModuleIds =
        modules?.map((m) => m.id).filter((id) => id !== 7 && id !== 8) || [];
      const updatedTeacherModules = [...prev.teacher_modules];
      updatedTeacherModules[teacherIndex] = allModuleIds;
      return {
        ...prev,
        teacher_modules: updatedTeacherModules,
      };
    });
  };

  const handleDeselectAllTeacherModules = (teacherId: number) => {
    setFormData((prev) => {
      const teacherIndex = prev.teachers.indexOf(teacherId);
      if (teacherIndex === -1) return prev;
      const updatedTeacherModules = [...prev.teacher_modules];
      updatedTeacherModules[teacherIndex] = [];
      return {
        ...prev,
        teacher_modules: updatedTeacherModules,
      };
    });
  };

  const handleSelectAllAdminModules = () => {
    const allModuleIds = modules?.map((m) => m.id) || [];
    setFormData((prev) => ({
      ...prev,
      admin_modules: allModuleIds,
    }));
  };

  const handleDeselectAllAdminModules = () => {
    setFormData((prev) => ({
      ...prev,
      admin_modules: [],
    }));
  };

  // ✅ NEW: Multi-select delete handler
  const handleDeleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection).map(Number);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          deleteData(`admins/${id}`, {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          })
        )
      );
      toast.success(`تم حذف ${selectedIds.length} مشرف(ين) بنجاح!`);
      setRowSelection({}); // Clear selection
      refetchAdmins(); // Refresh data
    } catch (error) {
      toast.error("فشل في حذف بعض المشرفين");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // ✅ NEW: Open delete dialog
  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  // columns of table
  const columns: ColumnDef<AdminTypes>[] = [
    // ✅ Select Column
    {
  id: "select",
  header: ({ table }) => {
    const isAllSelected = table.getIsAllPageRowsSelected();
    const isSomeSelected = table.getIsSomePageRowsSelected();

    return (
      <div className="flex items-center">
        <div className="relative">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={() => table.toggleAllPageRowsSelected()}
            className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
          {isSomeSelected && !isAllSelected && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3 h-0.5 bg-white rounded"></div>
            </div>
          )}
        </div>
      </div>
    );
  },
  cell: ({ row }) => (
    <div className="flex items-center">
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={() => row.toggleSelected()}
      />
    </div>
  ),
},
    {
      accessorKey: "full_name",
      header: "الاسم الكامل",
      cell: ({ row }) => {
        const admin = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="rounded-full">
              <AvatarImage src={admin.avatar} />
              <AvatarFallback>{admin.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{admin.full_name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "الايميل",
      cell: ({ row }) => (
        <div className="lowercase whitespace-nowrap">{row.original.email}</div>
      ),
    },
    {
      accessorKey: "phone",
      header: "الهاتف",
      cell: ({ row }) => <div>{row.original.phone}</div>,
    },
    {
      accessorKey: "role",
      header: "دور",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "modules",
      header: "الصلاحيات",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.modules?.map((module) => (
            <Badge
              key={module.id}
              variant={module.access ? "soft" : "outline"}
              className="capitalize"
            >
              {module.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const admin = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(admin)}
            >
              تعديل
            </Button>
          </div>
        );
      },
    },
  ];

  // ✅ Table with row selection
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row) => String(row.id),
  });

  // ✅ Get selected count
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي المشرفين"
          value={pagination.total}
          icon={Shield}
          color="blue"
        />
        <StatCard
          title="إجمالي المعلمين"
          value={statistics.totalTeachers}
          icon={Users}
          color="green"
        />
        <StatCard
          title="إجمالي الوحدات"
          value={statistics.totalModules}
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="المشرفين النشطين"
          value={statistics.activeAdmins}
          icon={UserCheck}
          color="orange"
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-4 mb-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by name..."
            value={
              (table.getColumn("full_name")?.getFilterValue() as string) || ""
            }
            onChange={(event) =>
              table.getColumn("full_name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm min-w-[200px] h-10"
          />
        </div>

        <div className="flex gap-2">
          {/* ✅ Conditional Delete / Add Button */}
          {selectedCount > 0 ? (
            <Button
              variant="outline"
              onClick={openDeleteDialog}
              className="h-10"
            >
              حذف المحدد ({selectedCount})
            </Button>
          ) : (
            <Dialog
              open={isOpen}
              onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                  setSearchQuery("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setIsEdit(false);
                    setEditingAdmin(null);
                    setSelectedTeachers([]);
                    setSearchQuery("");
                    setFormData({
                      full_name: "",
                      email: "",
                      phone: "",
                      password: "",
                      role: "admin",
                      teachers: [],
                      teacher_modules: [],
                      admin_modules: [],
                    });
                  }}
                >
                  إضافة مشرف
                </Button>
              </DialogTrigger>
              {/* DialogContent remains unchanged */}
              <DialogContent className="max-w-[90vw] md:max-w-[80vw] w-full md:w-full lg:w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {isEdit ? "تعديل المشرف" : "إضافة مشرف جديد"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Form content unchanged */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">الاسم الكامل</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">كلمة المرور</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!isEdit}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>المعلمين</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddAllTeachers}
                          className="h-8"
                        >
                          إضافة الكل
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {Array.from(
                          new Map(
                            selectedTeachers.map((teacher) => [teacher.user.id, teacher])
                          ).values()
                        ).map((teacher) => (
                          <Badge
                            key={teacher.user.id}
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {teacher.user.full_name}
                            <button
                              type="button"
                              onClick={() => handleTeacherRemove(teacher.user.id)}
                              className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove teacher</span>
                            </button>
                          </Badge>
                        ))}
                      </div>
                      {selectedTeachers.length > 0 && isEdit && (
                        <div className="text-sm text-muted-foreground mb-2">
                          المعلمون المعينون حاليًا مع صلاحياتهم معروضة أدناه
                        </div>
                      )}
                      <div className="space-y-2">
                        <Input
                          placeholder="البحث عن المعلمين..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full"
                        />
                        <div className="border rounded-md max-h-[200px] overflow-y-auto">
                          {filteredTeachers?.map((teacher) => {
                            const isSelected = formData.teachers.includes(
                              teacher.user.id
                            );
                            return (
                              <div
                                key={teacher.user.id}
                                className={cn(
                                  "flex items-center justify-between p-2 hover:bg-accent",
                                  isSelected && "bg-accent",
                                  !isSelected && "cursor-pointer"
                                )}
                                onClick={() => {
                                  if (!isSelected) {
                                    handleTeacherSelect(teacher);
                                  }
                                }}
                              >
                                <div className="flex flex-col">
                                  <span>{teacher.user.full_name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {teacher.user.email}
                                  </span>
                                </div>
                                {isSelected && (
                                  <Checkbox
                                    checked={true}
                                    className="pointer-events-none"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    {selectedTeachers.length > 0 && (
                      <div className="space-y-4 border rounded-lg p-4">
                        <Label className="text-sm font-medium">
                          صلاحيات المعلمين
                        </Label>
                        {Array.from(
                          new Map(
                            selectedTeachers.map((teacher) => [teacher.user.id, teacher])
                          ).values()
                        ).map((teacher) => (
                          <div
                            key={teacher.user.id}
                            className="space-y-2 border-b border-[#e5e5e5] pb-[10px] last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">
                                {teacher.user.full_name}
                              </Label>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleSelectAllTeacherModules(teacher.user.id)
                                  }
                                  className="h-8"
                                >
                                  تحديد الكل
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDeselectAllTeacherModules(teacher.user.id)
                                  }
                                  className="h-8"
                                >
                                  إلغاء الكل
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 ml-4">
                              {modules?.map((module) => {
                                if (module.id === 7 || module.id === 8) return null;
                                return (
                                  <div
                                    key={module.id}
                                    className="flex items-center space-x-2 gap-[5px]"
                                  >
                                    <Checkbox
                                      id={`teacher-${teacher.user.id}-module-${module.id}`}
                                      checked={isTeacherModuleSelected(
                                        teacher.user.id,
                                        module.id
                                      )}
                                      onCheckedChange={(checked) =>
                                        handleTeacherModuleChange(
                                          teacher.user.id,
                                          module.id,
                                          checked as boolean
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor={`teacher-${teacher.user.id}-module-${module.id}`}
                                      className="text-sm"
                                    >
                                      {module.name}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>صلاحيات المشرف</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAllAdminModules}
                            className="h-8"
                          >
                            تحديد الكل
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDeselectAllAdminModules}
                            className="h-8"
                          >
                            إلغاء الكل
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {modules?.map((module) => (
                          <div
                            key={module.id}
                            className="flex items-center space-x-2 gap-[5px]"
                          >
                            <Checkbox
                              id={`admin-module-${module.id}`}
                              checked={isAdminModuleSelected(module.id)}
                              onCheckedChange={(checked) =>
                                handleAdminModuleChange(
                                  module.id,
                                  checked as boolean
                                )
                              }
                            />
                            <Label htmlFor={`admin-module-${module.id}`}>
                              {module.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  <Button type="submit" className="w-full">
                    {isEdit ? "تحديث" : "إضافة"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* admins table */}
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
            {table?.getRowModel().rows?.length ? (
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

      <div className="flex justify-center mt-4">
        {pagination.links.map((link, idx) => (
          <button
            key={idx}
            disabled={!link.url || link.active}
            className={`mx-1 px-3 py-1 rounded transition-colors ${
              link.active
                ? "bg-blue-500 text-white dark:bg-blue-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={() => {
              if (link.url) {
                const match = link.url.match(/page=(\d+)/);
                if (match) {
                  refetchAdmins(Number(match[1]));
                }
              }
            }}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ))}
      </div>

      {/* ✅ Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد الحذف الجماعي</DialogTitle>
            </DialogHeader>
            <p>
              هل أنت متأكد من حذف <strong>{selectedCount}</strong> مشرف(ين)؟
              لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                إلغاء
              </Button>
              <Button variant="outline" onClick={handleDeleteSelected}>
                حذف المحدد
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default BasicDataTable;