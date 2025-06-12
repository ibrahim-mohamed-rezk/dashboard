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

import { useEffect, useState } from "react";
import { getData, postData } from "@/lib/axios/server";
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
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // get token from next api
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

  // fetch admins from api
  const refetchAdmins = async () => {
    try {
      const response = await getData(
        "admins",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setData(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // refetch admins
  useEffect(() => {
    refetchAdmins();
  }, [token]);

  // fetch modules
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

  // fetch teachers
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
        setTeachers(response);
        console.log(response);
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

      // Update teacher_modules array to match teachers array
      const updatedTeacherModules = checked
        ? [...prev.teacher_modules, []]
        : prev.teacher_modules.filter(
            (_, index) => prev.teachers[index] !== teacherId
          );

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
    const teacherIds = admin.teachers.map((t) => t.id);
    const teacherModules = admin.teachers.map((t) =>
      t.modules.map((m) => m.id)
    );

    setFormData({
      full_name: admin.full_name,
      email: admin.email,
      phone: admin.phone,
      password: "",
      role: admin.role,
      teachers: teacherIds,
      teacher_modules: teacherModules,
      admin_modules: admin.modules.map((m) => m.id),
    });
    setIsEdit(true);
    setIsOpen(true);
  };

  const filteredTeachers = teachers?.filter((teacher) => {
    const searchLower = searchQuery.toLowerCase();
    return teacher.user.full_name.toLowerCase().includes(searchLower);
  });

  const handleTeacherSelect = (teacher: Teacher) => {
    if (!isTeacherSelected(teacher.id)) {
      setSelectedTeachers((prev) => [...prev, teacher]);
      handleTeacherChange(teacher.id, true);
    }
  };

  const handleTeacherRemove = (teacherId: number) => {
    setSelectedTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    handleTeacherChange(teacherId, false);
  };

  const handleAddAllTeachers = () => {
    const allTeachers = teachers || [];
    setSelectedTeachers(allTeachers);
    allTeachers.forEach((teacher) => {
      if (!isTeacherSelected(teacher.id)) {
        handleTeacherChange(teacher.id, true);
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

  // Update selectedTeachers when editing
  useEffect(() => {
    if (isEdit && editingAdmin) {
      const selectedTeachersList =
        teachers?.filter((teacher) =>
          editingAdmin.teachers.some((t) => t.id === teacher.id)
        ) || [];
      setSelectedTeachers(selectedTeachersList);
    }
  }, [isEdit, editingAdmin, teachers]);

  // columns of table
  const columns: ColumnDef<AdminTypes>[] = [
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
      <div className="flex items-center justify-between gap-2 px-4 mb-4">
        <div className="flex items-center gap-2">
          {/* search input */}
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setIsEdit(false);
                setEditingAdmin(null);
                setSelectedTeachers([]);
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
          <DialogContent className="max-w-[90vw] md:max-w-[80vw] w-full md:w-full lg:w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEdit ? "تعديل المشرف" : "إضافة مشرف جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    {selectedTeachers.map((teacher) => (
                      <Badge
                        key={teacher.id}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        {teacher.user.full_name}
                        <button
                          type="button"
                          onClick={() => handleTeacherRemove(teacher.id)}
                          className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove teacher</span>
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="البحث عن المعلمين..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                    <div className="border rounded-md max-h-[200px] overflow-y-auto">
                      {filteredTeachers?.map((teacher) => (
                        <div
                          key={teacher.id}
                          className={cn(
                            "flex items-center justify-between p-2 hover:bg-accent cursor-pointer",
                            isTeacherSelected(teacher.id) && "bg-accent"
                          )}
                          onClick={() => handleTeacherSelect(teacher)}
                        >
                          <div className="flex flex-col">
                            <span>{teacher.user.full_name}</span>
                            <span className="text-sm text-muted-foreground">
                              {teacher.user.email}
                            </span>
                          </div>
                          {isTeacherSelected(teacher.id) && (
                            <Checkbox
                              checked={true}
                              className="pointer-events-none"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedTeachers.length > 0 && (
                  <div className="space-y-4 border rounded-lg p-4">
                    <Label className="text-sm font-medium">
                      صلاحيات المعلمين
                    </Label>
                    {selectedTeachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className="space-y-2 border-b border-[#e5e5e5] pb-[10px]"
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
                                handleSelectAllTeacherModules(teacher.id)
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
                                handleDeselectAllTeacherModules(teacher.id)
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
                                  id={`teacher-${teacher.id}-module-${module.id}`}
                                  checked={isTeacherModuleSelected(
                                    teacher.id,
                                    module.id
                                  )}
                                  onCheckedChange={(checked) =>
                                    handleTeacherModuleChange(
                                      teacher.id,
                                      module.id,
                                      checked as boolean
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={`teacher-${teacher.id}-module-${module.id}`}
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
    </>
  );
}

export default BasicDataTable;
