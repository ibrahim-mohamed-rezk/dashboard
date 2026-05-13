"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Mail, Eye, Trash2, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { deleteData, getData } from "@/lib/axios/server";
import { User } from "@/lib/type";
import useAuthrization from "@/hooks/useAuthrization";

interface ContactMessage {
  id: number;
  name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  title?: string;
  message?: string;
  body?: string;
  content?: string;
  status?: string;
  read_at?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

const NOT_PROVIDED = "—";

const pickName = (m: ContactMessage) =>
  m.name || m.full_name || m.user?.full_name || m.user?.name || NOT_PROVIDED;
const pickEmail = (m: ContactMessage) =>
  m.email || m.user?.email || NOT_PROVIDED;
const pickPhone = (m: ContactMessage) =>
  m.phone || m.user?.phone || NOT_PROVIDED;
const pickSubject = (m: ContactMessage) =>
  m.subject || m.title || NOT_PROVIDED;
const pickBody = (m: ContactMessage) =>
  m.message || m.body || m.content || "";

const formatDate = (value?: string | null) => {
  if (!value) return NOT_PROVIDED;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  try {
    return date.toLocaleString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date.toLocaleString();
  }
};

const truncate = (text: string, max = 80) => {
  if (!text) return NOT_PROVIDED;
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
};

export default function ContactMessagesPage() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const tokenRes = await axios.get("/api/auth/getToken");
        setToken(tokenRes.data.token);
      } catch (err) {
        console.error("Failed to load auth token:", err);
      }

      try {
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to read user from storage:", err);
      } finally {
        setAuthChecked(true);
      }
    };
    init();
  }, []);

  const isAuthorized = useAuthrization({
    user: user as User,
    module: "contact-messages",
  });

  const fetchMessages = async (page = 1) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await getData(
        "contact-messages",
        { page },
        { Authorization: `Bearer ${token}` }
      );
      const list: ContactMessage[] = Array.isArray(response)
        ? response
        : response?.data || [];
      setMessages(list);
      setPagination({
        current_page: response?.meta?.current_page ?? page,
        last_page: response?.meta?.last_page ?? 1,
        total: response?.meta?.total ?? list.length,
      });
    } catch (err) {
      console.error("Failed to fetch contact messages:", err);
      toast.error("فشل في جلب الرسائل");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && isAuthorized) {
      fetchMessages(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthorized]);

  const openMessage = async (message: ContactMessage) => {
    setSelected(message);
    setIsDetailLoading(true);
    try {
      const response = await getData(
        `contact-messages/${message.id}`,
        {},
        { Authorization: `Bearer ${token}` }
      );
      const detail: ContactMessage = response?.data ?? response;
      if (detail && typeof detail === "object") {
        setSelected({ ...message, ...detail });
      }
    } catch (err) {
      console.error("Failed to fetch message detail:", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const deleteMessage = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
    setDeletingId(id);
    try {
      await deleteData(`contact-messages/${id}`, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
      toast.success("تم حذف الرسالة بنجاح");
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      console.error("Failed to delete message:", err);
      toast.error("فشل في حذف الرسالة");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMessages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => {
      const haystack = [
        pickName(m),
        pickEmail(m),
        pickPhone(m),
        pickSubject(m),
        pickBody(m),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [messages, search]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            ليس لديك صلاحية لعرض هذه الصفحة
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              رسائل التواصل
            </h2>
            <p className="text-sm text-muted-foreground">
              عرض الرسائل الواردة عبر صفحة "اتصل بنا"
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            الإجمالي: {pagination.total}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMessages(pagination.current_page)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "تحديث"
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم، البريد، الموضوع، أو نص الرسالة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">البريد</TableHead>
                  <TableHead className="text-right">الهاتف</TableHead>
                  <TableHead className="text-right">الموضوع</TableHead>
                  <TableHead className="text-right">الرسالة</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-center w-[140px]">
                    الإجراءات
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary inline-block" />
                    </TableCell>
                  </TableRow>
                ) : filteredMessages.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-muted-foreground"
                    >
                      لا توجد رسائل
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMessages.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap">
                        {pickName(m)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {pickEmail(m)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {pickPhone(m)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {pickSubject(m)}
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate">
                        {truncate(pickBody(m), 100)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(m.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMessage(m)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            عرض
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMessage(m.id)}
                            disabled={deletingId === m.id}
                            className="text-red-600 hover:bg-red-50"
                          >
                            {deletingId === m.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 ml-1" />
                                حذف
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">
                صفحة {pagination.current_page} من {pagination.last_page}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMessages(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1 || isLoading}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMessages(pagination.current_page + 1)}
                  disabled={
                    pagination.current_page >= pagination.last_page || isLoading
                  }
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الرسالة</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {isDetailLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري تحميل التفاصيل...
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">الاسم</div>
                  <div className="font-medium">{pickName(selected)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">
                    البريد الإلكتروني
                  </div>
                  <div className="font-medium break-all">
                    {pickEmail(selected)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">الهاتف</div>
                  <div className="font-medium">{pickPhone(selected)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">الموضوع</div>
                  <div className="font-medium">{pickSubject(selected)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">التاريخ</div>
                  <div className="font-medium">
                    {formatDate(selected.created_at)}
                  </div>
                </div>
                {selected.status && (
                  <div>
                    <div className="text-muted-foreground mb-1">الحالة</div>
                    <Badge variant="outline">{selected.status}</Badge>
                  </div>
                )}
              </div>
              <div>
                <div className="text-muted-foreground mb-1 text-sm">
                  نص الرسالة
                </div>
                <div className="rounded-md border bg-muted/30 p-3 whitespace-pre-wrap break-words text-sm leading-6">
                  {pickBody(selected) || NOT_PROVIDED}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => deleteMessage(selected.id)}
                  disabled={deletingId === selected.id}
                  className="text-red-600 hover:bg-red-50"
                >
                  {deletingId === selected.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف الرسالة
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
