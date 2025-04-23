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

import { MoreHorizontal } from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

import { fetchCourses, addCourse, deleteCourse } from "@/services/courseService";
import { useEffect, useState } from "react";

interface Course {
  id: number;
  title: string;
  cour_no: string;
  level: string;
  subject: string;
  cover: string;
  created_at: string;
}

const DEFAULT_IMAGE = "https://via.placeholder.com/150";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  cour_no: z.string().min(2, "Course No is required"),
  level: z.string().min(2, "Level is required"),
  subject: z.string().min(2, "Subject is required"),
  cover: z.string().url("Invalid image URL"),
});

const columns: ColumnDef<Course>[] = [
  {
    accessorKey: "title",
    header: "العنوان",
    cell: ({ row }) => row.getValue("title"),
  },
  {
    accessorKey: "cour_no",
    header: "عدد الكورسات",
    cell: ({ row }) => row.getValue("cour_no"),
  },
  {
    accessorKey: "level",
    header: "المستوي",
    cell: ({ row }) => row.getValue("level"),
  },
  {
    accessorKey: "subject",
    header: "الموضوع",
    cell: ({ row }) => row.getValue("subject"),
  },
  {
    accessorKey: "cover",
    header: "الغطاء",
    cell: ({ row }) => {
      const imageUrl: string = row.getValue("cover") || DEFAULT_IMAGE;
      return (
        <Avatar className="rounded-md">
          <AvatarImage
            src={imageUrl}
            alt="Course Cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_IMAGE;
            }}
          />
          <AvatarFallback>NA</AvatarFallback>
        </Avatar>
      );
    },
  },
  {
    id: "actions",
    header: "الاجراءات",
    cell: ({ row }) => {
      const item = row.original;

      const handleEdit = (id: number) => {
        alert(`Edit Course ID: ${id}`);
      };

      const handleDelete = async (id: number) => {
        const confirmDelete = confirm(
          `Are you sure you want to delete course ID: ${id}?`
        );
        if (confirmDelete) {
          try {
            await deleteCourse(id);
            alert(`Course ID: ${id} has been deleted.`);
            window.location.reload(); // Refresh after delete
          } catch (error) {
            alert("Failed to delete the course.");
          }
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={() => handleEdit(item.id)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 hover:bg-red-50"
              onClick={() => handleDelete(item.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

 function CoursesTable() {
  const [data, setData] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "all",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const courses = await fetchCourses();
      setData(courses);
      setLoading(false);
    };

    fetchData();
  }, []);

  const onSubmit = async (formData: any) => {
    try {
      await addCourse(formData);
      reset();
      alert("Course added successfully!");
      window.location.reload(); // Refresh the table
    } catch (error) {
      alert("Failed to add course.");
    }
  };

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
      <div className="flex items-center gap-2 px-4 mb-4">
        <Input
          placeholder="Filter by title..."
          value={(table.getColumn("title")?.getFilterValue() as string) || ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm min-w-[200px] h-10"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">اضافه كورس جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>اضافه كورس جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <Input {...register("title")} placeholder="Course Title" />
                <Input {...register("cour_no")} placeholder="Course No" />
                <Input {...register("level")} placeholder="Level" />
                <Input {...register("subject")} placeholder="Subject" />
                <Input {...register("cover")} placeholder="Cover Image URL" />
              </div>
              <Button type="submit" className="mt-4 w-full">
                Submit
              </Button>
              <DialogClose asChild>
                <Button variant="outline" className="mt-2 w-full">
                  Cancel
                </Button>
              </DialogClose>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
    </>
  );
}

export default CoursesTable;
