"use client";
import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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

import { fetchBlogs, addBlog } from "@/services/BlogService";

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

interface Blog {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  image: string;
  meta_description: string;
  meta_keywords: string;
  created_at: string;
}

const DEFAULT_IMAGE = "https://via.placeholder.com/150";

const columns: ColumnDef<Blog>[] = [
  {
    accessorKey: "title",
    header: "العنوان",
    cell: ({ row }) => row.getValue("title") ?? "N/A",
  },
  {
    accessorKey: "slug",
    header: "سلوجان",
    cell: ({ row }) => row.getValue("slug") ?? "N/A",
  },
  {
    accessorKey: "description",
    header: "الوصف",
    cell: ({ row }) => row.getValue("description") ?? "N/A",
  },
  {
    accessorKey: "image",
    header: "الصوره",
    cell: ({ row }) => {
      const imageUrl = row.getValue("image");
      return (
        <img
          src={(imageUrl as string) || DEFAULT_IMAGE}
          alt="Blog"
          className="w-16 h-16 object-cover rounded-md"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_IMAGE;
          }}
        />
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "تاريخ الانشاء",
    cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString(),
  },
];

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().min(5, "Description is required"),
  content: z.string().min(5, "Content is required"),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
});

export function BlogTable() {
  const [data, setData] = React.useState<Blog[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "all",
  });

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const blogs = await fetchBlogs();
      console.log("Fetched Blogs:", blogs);
      setData(blogs);
      setLoading(false);
    };

    fetchData();
  }, []);

  const onSubmit = async (formData: any) => {
    try {
      await addBlog(formData);
      reset();
      alert("Blog added successfully!");
      location.reload();
    } catch (error) {
      alert("Failed to add blog.");
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
          placeholder="Search blogs..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm min-w-[200px] h-10"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">اضافه منتدي</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>اضافه منتدي</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <Input {...register("title")} placeholder="Title" />
                <Input {...register("slug")} placeholder="Slug" />
                <Input {...register("description")} placeholder="Description" />
                <Input {...register("content")} placeholder="Content" />
                <Input {...register("meta_description")} placeholder="Meta Description" />
                <Input {...register("meta_keywords")} placeholder="Meta Keywords" />
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No blogs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default BlogTable;
