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

import { Button } from "@/components/ui/button";
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios, { AxiosHeaders } from "axios";
import { Teacher, User } from "@/lib/type";
import { useEffect, useState } from "react";
import { getData, postData, deleteData } from "@/lib/axios/server";
import toast from "react-hot-toast";

interface Banner {
  id: number;
  image: string;
  status: string;
  type: string;
  teacher: number | null;
}

const DEFAULT_IMAGE = "https://via.placeholder.com/300x200";

const schema = z.object({
  image: z.instanceof(File, { message: "Please upload an image file" }),
  type: z.enum(["online", "offline"]),
  teacher: z.union([z.number(), z.null()]).optional(),
});

function BannerTable() {
  const [data, setData] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const columns: ColumnDef<Banner>[] = [
    {
      accessorKey: "image",
      header: "صوره",
      cell: ({ row }) => {
        const banner = row.original;
        return (
          <Avatar className="rounded-md w-24 h-24">
            <AvatarImage
              src={banner.image || DEFAULT_IMAGE}
              alt="Banner"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_IMAGE;
              }}
            />
            <AvatarFallback>Img</AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      accessorKey: "status",
      header: "موضوع",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "type",
      header: "نوع",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue("type")}
        </Badge>
      ),
    },
    {
      accessorKey: "teacher",
      header: "مدرس",
      cell: ({ row }) => (
        <div>{row.getValue("teacher") ? row.getValue("teacher") : "N/A"}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const banner = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(banner)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => handleDelete(banner.id)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    mode: "all",
  });

  const watchType = watch("type");

  useEffect(() => {
    if (watchType === "online") {
      setValue("teacher", null);
    }
  }, [watchType, setValue]);

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
  }, [token]);

  // Fetch teachers for admin
  const fetchTeachers = async () => {
    if (user?.role !== "admin") return;
    try {
      const response = await getData(
        "teachers",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setTeachers(response);
    } catch (error) {
      console.log("Failed to fetch teachers");
    }
  };

  // ✅ Fetch All Banners
  const fetchBanners = async () => {
    try {
      const response = await getData(
        "banners",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setData(response.data);
    } catch (error) {
      console.error("Error fetching banners:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [token]);

  const onSubmit = async (formData: any) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("image", formData.image);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("status", "banner");
      formDataToSend.append("_method", "PUT");
      if (formData.teacher) {
        formDataToSend.append("teacher", formData.teacher);
      }

      if (editingBanner) {
        await postData(`banners/${editingBanner.id}`, formDataToSend, {
          Authorization: `Bearer ${token}`,
        });
        toast.success("Banner updated successfully!");
      } else {
        await postData("banners", formDataToSend, {
          Authorization: `Bearer ${token}`,
        });
        toast.success("Banner added successfully!");
      }

      fetchBanners();
      reset();
      setImagePreview(null);
      setEditingBanner(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error(
        editingBanner ? "Failed to update banner." : "Failed to add banner."
      );
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }
      setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setValue("type", banner.type);
    if (banner.teacher) {
      setValue("teacher", banner.teacher);
    }
    setImagePreview(banner.image);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (bannerId: number) => {
    try {
      await deleteData(`banners/${bannerId}`, {
        Authorization: `Bearer ${token}`,
      });
      toast.success("Banner deleted successfully!");
      fetchBanners();
    } catch (error) {
      toast.error("Failed to delete banner.");
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, value) => {
      const content = row.getValue(columnId);
      return String(content).toLowerCase().includes(value.toLowerCase());
    },
  });

  return (
    <>
      <div className="flex items-center gap-2 px-4 mb-4">
        <Input
          placeholder="Search banners..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm min-w-[200px] h-10"
        />
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              onClick={() => {
                setEditingBanner(null);
                reset();
                setImagePreview(null);
              }}
            >
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? "Edit Banner" : "Add Banner"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-2 border rounded"
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mt-2 w-32 h-32 object-cover rounded"
                    />
                  )}
                  {errors.image && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.image.message as string}
                    </p>
                  )}
                </div>
                <select
                  {...register("type")}
                  className="w-full p-2 border rounded"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
                {watchType === "offline" && (
                  <select
                    {...register("teacher")}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.user.full_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <Button type="submit" className="mt-4 w-full">
                {editingBanner ? "Update" : "Submit"}
              </Button>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => {
                    setEditingBanner(null);
                    reset();
                    setImagePreview(null);
                  }}
                >
                  Cancel
                </Button>
              </DialogClose>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                  No banners found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default BannerTable;
