"use client";
import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
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
import { fetchBooks, AddBook } from "@/services/bookService";

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

interface Book {
  id: number;
  name: string;
  author: string;
  subject: string;
  level: string;
  teacher: string;
  description: string;
  image: string;
  price: number;
  count: number;
}

const DEFAULT_IMAGE = "https://via.placeholder.com/150";

const columns: ColumnDef<Book>[] = [
  {
    accessorKey: "name",
    header: "اسم الكتاب",
  },
  {
    accessorKey: "author",
    header: "المؤلف",
  },
  {
    accessorKey: "subject",
    header: "الموضوع",
  },
  {
    accessorKey: "level",
    header: "المستوي",
  },
  {
    accessorKey: "teacher",
    header: "المدرس",
  },
  {
    accessorKey: "image",
    header: "صوره",
    cell: ({ row }) => {
      const book = row.original;
      return (
        <Avatar className="rounded-md">
          <AvatarImage
            src={book.image || DEFAULT_IMAGE}
            alt={book.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_IMAGE;
            }}
          />
          <AvatarFallback>{book.name?.[0] ?? "?"}</AvatarFallback>
        </Avatar>
      );
    },
  },
  {
    accessorKey: "price",
    header: "سعر",
    cell: ({ row }) => <div>${row.getValue("price")}</div>,
  },
  {
    accessorKey: "count",
    header: "عدد",
    cell: ({ row }) => <div>{row.getValue("count")}</div>,
  },
];

const schema = z.object({
  name: z.string().min(2, "Book name is required"),
  author: z.string().min(2, "Author is required"),
  subject: z.string().min(2, "Subject is required"),
  level: z.string().min(2, "Level is required"),
  teacher: z.string().min(2, "Teacher is required"),
  description: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
  price: z.number().min(0, "Price must be a positive number"),
  count: z.number().min(0, "Count must be a positive number"),
});

export function BasicDataTable() {
  const [data, setData] = React.useState<Book[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

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
      const books = await fetchBooks();
      console.log("Fetched Books:", books); // Debugging line
      setData(books);
      setLoading(false);
    };

    fetchData();
  }, []);

  const onSubmit = async (formData: any) => {
    try {
      await AddBook(formData);
      reset();
      alert("Book added successfully!");
      location.reload(); // Refresh the table
    } catch (error) {
      alert("Failed to add book.");
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
          placeholder="Filter by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) || ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm min-w-[200px] h-10"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">اضافه كتاب</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Book</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <Input {...register("name")} placeholder="Book Name" />
                <Input {...register("author")} placeholder="Author" />
                <Input {...register("subject")} placeholder="Subject" />
                <Input {...register("level")} placeholder="Level" />
                <Input {...register("teacher")} placeholder="Teacher" />
                <Input {...register("description")} placeholder="Description" />
                <Input {...register("image")} placeholder="Image URL" />
                <Input {...register("price")} type="number" placeholder="Price" />
                <Input {...register("count")} type="number" placeholder="Count" />
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
