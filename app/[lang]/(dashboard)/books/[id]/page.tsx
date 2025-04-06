"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Book {
  id: number;
  name: string;
  author: string;
  subject: string;
  level: string;
  teacher: string;
  description: string;
  image: string;
  min_file: string;
  file: string;
  price: number;
  count: number;
  is_favorite: boolean;
}

const BookDetailsPage = () => {
  const { id } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBook = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("الرجاء تسجيل الدخول أولاً");
        return;
      }

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/books/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setBook(res.data.data);
    } catch (err) {
      console.error("Error fetching book:", err);
      alert("حدث خطأ أثناء جلب بيانات الكتاب");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center text-gray-600 mt-10">
        لم يتم العثور على بيانات هذا الكتاب.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">{book.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          {/* الصورة + معلومات عامة */}
          <div className="space-y-4">
            <Image
              src={book.image || "https://via.placeholder.com/300"}
              alt={book.name}
              width={400}
              height={300}
              className="rounded-md object-cover border"
            />
            <div className="text-sm text-gray-700">
              <span className="font-semibold">المعلم: </span> {book.teacher}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-semibold">المستوى: </span> {book.level}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-semibold">الموضوع: </span> {book.subject}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-semibold">المؤلف: </span> {book.author}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-semibold">عدد النسخ: </span> {book.count}
            </div>
            <Badge className="mt-2">السعر: ${book.price}</Badge>
          </div>

          {/* الوصف والروابط */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-1">الوصف</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {book.description}
            </p>

            <div className="space-y-3 pt-4">
              <a
                href={book.file}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full">📘 تحميل النسخة الكاملة</Button>
              </a>
              <a
                href={book.min_file}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  👀 معاينة مختصرة
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookDetailsPage;
