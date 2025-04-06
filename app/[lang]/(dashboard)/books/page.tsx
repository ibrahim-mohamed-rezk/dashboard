"use client";

import * as React from "react";
import Link from "next/link";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { fetchBooks, addBook } from "@/services/bookService";
import axios from "axios";
import { Pencil, Trash2, Eye } from "lucide-react";

interface Book {
  id: number;
  name: string;
  author: string;
  subject_id: number;
  level_id: number;
  teacher_id: number;
  description: string;
  image: string;
  min_file: string;
  file: string;
  price: number;
  count: number;
  type: string;
}

const DEFAULT_IMAGE = "https://via.placeholder.com/150";

export default function BasicDataTable() {
  const [data, setData] = React.useState<Book[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    const books = await fetchBooks();
    setData(books);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("هل أنت متأكد من حذف هذا الكتاب؟");
    if (!confirmDelete) return;

    const token = localStorage.getItem("authToken");
    if (!token) return alert("لا يوجد توكن.");

    try {
      await axios.delete(`https://safezone-co.top/api/v1/dashboard/books/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("تم حذف الكتاب بنجاح.");
      setData((prev) => prev.filter((book) => book.id !== id));
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحذف.");
    }
  };

  const columns: ColumnDef<Book>[] = [
    { accessorKey: "name", header: "اسم الكتاب" },
    { accessorKey: "author", header: "المؤلف" },
    { accessorKey: "subject_id", header: "الموضوع" },
    { accessorKey: "level_id", header: "المستوى" },
    { accessorKey: "teacher_id", header: "المدرس" },
    {
      accessorKey: "image",
      header: "صورة",
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
      header: "السعر",
      cell: ({ row }) => <div>${row.getValue("price")}</div>,
    },
    {
      accessorKey: "count",
      header: "العدد",
      cell: ({ row }) => <div>{row.getValue("count")}</div>,
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const book = row.original;
        const [editOpen, setEditOpen] = React.useState(false);
        const [editData, setEditData] = React.useState({
          name: book.name,
          author: book.author,
          subject_id: book.subject_id,
          level_id: book.level_id,
          teacher_id: book.teacher_id,
          description: book.description || "",
          image: book.image || "",
          min_file: book.min_file || "",
          file: book.file || "",
          price: book.price,
          count: book.count,
          type: book.type || "paid",
        });

        const handleUpdate = async () => {
          const token = localStorage.getItem("authToken");
          if (!token) return alert("لا يوجد توكن.");

          const params = new URLSearchParams();
          for (const key in editData) {
            if (editData[key as keyof typeof editData] !== undefined && editData[key as keyof typeof editData] !== null) {
              params.append(key, String(editData[key as keyof typeof editData]));
            }
          }

          try {
            await axios.put(
              `https://safezone-co.top/api/v1/dashboard/books/${book.id}?${params.toString()}`,
              null,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            alert("تم تعديل الكتاب بنجاح");
            setEditOpen(false);
            fetchData();
          } catch (err) {
            console.error("Update failed:", err);
            alert("فشل تعديل الكتاب");
          }
        };

        return (
          <div className="flex gap-2 items-center">
            <Link href={`/books/${book.id}`}>
              <Eye className="w-4 h-4 text-blue-600" />
            </Link>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Pencil className="w-4 h-4 text-yellow-600" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>تعديل الكتاب</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdate();
                  }}
                  className="space-y-3"
                >
                  <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} placeholder="اسم الكتاب" />
                  <Input value={editData.author} onChange={(e) => setEditData({ ...editData, author: e.target.value })} placeholder="المؤلف" />
                  <Input value={editData.subject_id} onChange={(e) => setEditData({ ...editData, subject_id: Number(e.target.value) })} placeholder="رقم الموضوع" />
                  <Input value={editData.level_id} onChange={(e) => setEditData({ ...editData, level_id: Number(e.target.value) })} placeholder="رقم المستوى" />
                  <Input value={editData.teacher_id} onChange={(e) => setEditData({ ...editData, teacher_id: Number(e.target.value) })} placeholder="رقم المعلم" />
                  <Input value={editData.type} onChange={(e) => setEditData({ ...editData, type: e.target.value })} placeholder="نوع الكتاب (مثلاً paid)" />
                  <Input value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} placeholder="الوصف" />
                  <Input value={editData.image} onChange={(e) => setEditData({ ...editData, image: e.target.value })} placeholder="رابط الصورة" />
                  <Input value={editData.min_file} onChange={(e) => setEditData({ ...editData, min_file: e.target.value })} placeholder="رابط الملف المختصر" />
                  <Input value={editData.file} onChange={(e) => setEditData({ ...editData, file: e.target.value })} placeholder="رابط الملف الكامل" />
                  <Input type="number" value={editData.price} onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })} placeholder="السعر" />
                  <Input type="number" value={editData.count} onChange={(e) => setEditData({ ...editData, count: Number(e.target.value) })} placeholder="العدد" />

                  <Button type="submit" className="w-full">حفظ التعديلات</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button size="icon" variant="ghost" onClick={() => handleDelete(book.id)}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        );
      },
    },
  ];

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
          placeholder="ابحث باسم الكتاب..."
          value={(table.getColumn("name")?.getFilterValue() as string) || ""}
          onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
          className="max-w-sm min-w-[200px] h-10"
        />
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
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                  لا توجد نتائج.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
