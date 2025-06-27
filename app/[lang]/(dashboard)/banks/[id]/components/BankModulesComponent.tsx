"use client";
import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getData, postData, deleteData } from "@/lib/axios/server";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash,
  Plus,
  Eye,
  Upload,
  Download,
  Search,
  CheckSquare,
  Square,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BankQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number | null;
  type?: "multiple_choice" | "true_false" | "written";
  written_answer?: string;
}

interface BankSection {
  id: number;
  name: string;
  type: "questions" | "file";
  questions?: BankQuestion[];
  file_path?: string;
  created_at?: string;
  updated_at?: string;
}

interface Bank {
  id: number;
  name: string;
  price: number;
  banktable_id: number;
  banktable_type: string;
  created_at: string;
  updated_at: string;
}

interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

interface MultipleQuestionForm {
  title: string;
  questions: string[];
  correct_answer: number | null;
}

interface BankModulesComponentProps {
  bankId: string;
  token: string;
  initialBankData?: any;
}

const BankModulesComponent = ({
  bankId,
  token,
  initialBankData,
}: BankModulesComponentProps) => {
  // State management
  const [sections, setSections] = useState<BankSection[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [selectedSection, setSelectedSection] = useState<BankSection | null>(
    null
  );
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  );
  const [sectionTitle, setSectionTitle] = useState<string>("");

  // Multiple questions form state
  const [multipleQuestions, setMultipleQuestions] = useState<
    MultipleQuestionForm[]
  >([
    {
      title: "",
      questions: ["", "", "", ""],
      correct_answer: null,
    },
  ]);

  const [editForm, setEditForm] = useState({
    name: "",
    question: "",
    options: ["", "", "", ""],
    correct_answer: 0,
  });

  // Fetch banks data
  const fetchBanks = async () => {
    try {
      const response = await getData(
        "banks",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setBanks(response.data);

      // Find current bank
      const currentBank = response.data.find(
        (bank: Bank) => bank.id.toString() === bankId
      );
      setSelectedBank(currentBank || null);
    } catch (error) {
      toast.error("فشل في جلب بيانات البنوك");
    }
  };

  // Fetch bank sections with pagination
  const fetchBankSections = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getData(
        "bank-sections",
        { page },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setSections(response.data);
      setPaginationMeta(response.meta);
      setCurrentPage(page);
    } catch (error) {
      toast.error("فشل في جلب بيانات الأقسام");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchBanks();
    fetchBankSections();
  }, [bankId, token]);

  // Filtered sections
  const filteredSections = useMemo(() => {
    let filtered = sections;

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (section) =>
          section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (section.questions &&
            section.questions.some((q) =>
              q.question.toLowerCase().includes(searchTerm.toLowerCase())
            ))
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((section) => section.type === filterType);
    }

    return filtered;
  }, [sections, searchTerm, filterType]);

  // Handle Edit Section
  const handleEdit = (section: BankSection) => {
    setSelectedSection(section);

    if (section.questions && section.questions.length > 0) {
      const firstQuestion = section.questions[0];
      setEditForm({
        name: section.name,
        question: firstQuestion.question,
        options: firstQuestion.options.length
          ? [...firstQuestion.options]
          : ["", "", "", ""],
        correct_answer: firstQuestion.correct_answer || 0,
      });
    } else {
      setEditForm({
        name: section.name,
        question: "",
        options: ["", "", "", ""],
        correct_answer: 0,
      });
    }
    setIsEditing(true);
  };

  // Handle Delete Section
  const handleDelete = async (sectionId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا القسم؟")) return;

    try {
      setIsLoading(true);
      await deleteData(`bank-sections/${sectionId}`, {
        Authorization: `Bearer ${token}`,
      });
      await fetchBankSections(currentPage);
      toast.success("تم حذف القسم بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف القسم");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Update Section
  const handleUpdate = async () => {
    if (!selectedSection || !selectedBank) return;

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("name", selectedSection.name);
      formData.append("bank_id", selectedBank.id.toString());
      formData.append("type", "questions");
      formData.append("_method", "PUT");

      // Add all questions in the section
      if (selectedSection.questions && selectedSection.questions.length > 0) {
        selectedSection.questions.forEach((q, idx) => {
          const qIndex = idx + 1;
          formData.append(`questions[${qIndex}][question]`, q.question);
          q.options.forEach((option, optIdx) => {
            if (option.trim()) {
              formData.append(`questions[${qIndex}][${optIdx + 1}]`, option);
            }
          });
          formData.append(
            `questions[${qIndex}][correct_answer]`,
            ((q.correct_answer as number) + 1).toString()
          );
        });
      }

      await postData(`bank-sections/${selectedSection.id}`, formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      await fetchBankSections(currentPage);
      setIsEditing(false);
      setSelectedSection(null);
      toast.success("تم تحديث القسم بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث القسم");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Add Multiple Questions
  const handleAddMultipleQuestions = async () => {
    if (!selectedBank) {
      toast.error("لم يتم العثور على بيانات البنك");
      return;
    }

    const validQuestions = multipleQuestions.filter((q) => {
      if (!q.title.trim()) return false;
      const validOptions = q.questions.filter((opt) => opt.trim() !== "");
      return validOptions.length >= 2;
    });

    if (validQuestions.length === 0) {
      toast.error("يرجى إدخال سؤال واحد صحيح على الأقل");
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("name", sectionTitle);
      formData.append("bank_id", selectedBank.id.toString());
      formData.append("type", "questions");

      // Add multiple questions in the same request
      validQuestions.forEach((question, questionIndex) => {
        const qIndex = questionIndex + 1; // Start from 1

        formData.append(`questions[${qIndex}][question]`, question.title);

        question.questions.forEach((option, optionIndex) => {
          if (option.trim()) {
            formData.append(`questions[${qIndex}][${optionIndex + 1}]`, option);
          }
        });

        formData.append(
          `questions[${qIndex}][correct_answer]`,
          ((question.correct_answer as number) + 1).toString()
        );
      });

      await postData("bank-sections", formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      await fetchBankSections(currentPage);
      setIsAdding(false);
      resetMultipleQuestionsForm();
      toast.success(`تم إضافة ${validQuestions.length} سؤال بنجاح`);
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة الأسئلة");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset multiple questions form
  const resetMultipleQuestionsForm = () => {
    setMultipleQuestions([
      {
        title: "",
        questions: ["", "", "", ""],
        correct_answer: null,
      },
    ]);
  };

  // Add new question form
  const addQuestionForm = () => {
    setMultipleQuestions([
      ...multipleQuestions,
      {
        title: "",
        questions: ["", "", "", ""],
        correct_answer: null,
      },
    ]);
  };

  // Remove question form
  const removeQuestionForm = (index: number) => {
    if (multipleQuestions.length === 1) {
      toast.error("يجب أن يحتوي النموذج على سؤال واحد على الأقل");
      return;
    }
    setMultipleQuestions(multipleQuestions.filter((_, i) => i !== index));
  };

  // Update question form
  const updateQuestionForm = (
    index: number,
    updates: Partial<MultipleQuestionForm>
  ) => {
    setMultipleQuestions(
      multipleQuestions.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  };

  // Handle file upload for file type sections
  const handleFileUpload = async () => {
    if (!fileToUpload || !selectedBank) {
      toast.error("يرجى اختيار ملف للرفع");
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("name", fileToUpload.name);
      formData.append("bank_id", selectedBank.id.toString());
      formData.append("type", "file");
      formData.append("file", fileToUpload);

      await postData("bank-sections", formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      await fetchBankSections(currentPage);
      setFileToUpload(null);
      toast.success("تم رفع الملف بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء رفع الملف");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle View Section
  const handleViewSection = (section: BankSection) => {
    setSelectedSection(section);
    setIsViewing(true);
  };

  // Bulk operations
  const handleSectionSelect = (sectionId: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredSections.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredSections.map((s) => s.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedQuestions.length} قسم؟`))
      return;

    try {
      setIsLoading(true);
      await Promise.all(
        selectedQuestions.map((id) =>
          deleteData(`bank-sections/${id}`, {
            Authorization: `Bearer ${token}`,
          })
        )
      );

      await fetchBankSections(currentPage);
      setSelectedQuestions([]);
      setIsBulkMode(false);
      toast.success(`تم حذف ${selectedQuestions.length} قسم بنجاح`);
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الأقسام");
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (paginationMeta?.last_page || 1)) {
      fetchBankSections(page);
    }
  };

  // Render pagination
  const renderPagination = () => {
    if (!paginationMeta || paginationMeta.last_page <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6 px-6 py-4 border-t">
        <div className="text-sm text-gray-500">
          عرض {paginationMeta.from} إلى {paginationMeta.to} من{" "}
          {paginationMeta.total} نتيجة
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </Button>

          {Array.from(
            { length: paginationMeta.last_page },
            (_, i) => i + 1
          ).map((page) => (
            <Button
              key={page}
              variant={"outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === paginationMeta.last_page}
          >
            التالي
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Bank Header */}
      <div className="mx-auto bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <svg
                className="w-24 h-24 mx-auto mb-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              </svg>
              <h2 className="text-2xl font-bold">بنك الأسئلة</h2>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">
            {selectedBank?.name || "بنك الأسئلة"}
          </h1>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600">رقم البنك</p>
              <p className="font-semibold">{selectedBank?.id || "-"}</p>
            </div>
            <div>
              <p className="text-gray-600">السعر</p>
              <p className="font-semibold">{selectedBank?.price || 0} ج.م</p>
            </div>
            <div>
              <p className="text-gray-600">عدد الأقسام</p>
              <p className="font-semibold">{paginationMeta?.total || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">تاريخ الإنشاء</p>
              <p className="font-semibold">
                {selectedBank?.created_at
                  ? new Date(selectedBank.created_at).toLocaleDateString("ar")
                  : "غير محدد"}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Header with Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">أقسام البنك</h2>
              <span className="text-sm text-gray-500">
                ({filteredSections.length} من {sections.length} قسم)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsBulkMode(!isBulkMode);
                  setSelectedQuestions([]);
                }}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {isBulkMode ? "إلغاء التحديد المتعدد" : "تحديد متعدد"}
              </Button>

              <Button onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                إضافة أسئلة جديدة
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في الأقسام..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="فلترة حسب النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="questions">أسئلة</SelectItem>
                <SelectItem value="file">ملفات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {isBulkMode && selectedQuestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">
                  تم تحديد {selectedQuestions.length} قسم
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isLoading}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    حذف المحدد
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* File Upload Section */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">رفع ملف جديد</h3>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer flex-1">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">
                    {fileToUpload ? fileToUpload.name : "اختر ملف للرفع"}
                  </p>
                </div>
                <input
                  type="file"
                  onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {fileToUpload && (
                <Button onClick={handleFileUpload} disabled={isLoading}>
                  {isLoading ? "جاري الرفع..." : "رفع الملف"}
                </Button>
              )}
            </div>
          </div>

          {/* Sections List */}
          {isLoading && !sections.length ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">جاري التحميل...</p>
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">
                {searchTerm || filterType !== "all"
                  ? "لا توجد أقسام تطابق البحث"
                  : "لا توجد أقسام متاحة حالياً"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSections.map((section, index) => (
                <div
                  key={section.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedQuestions.includes(section.id)
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-gray-50"
                  } ${!isBulkMode ? "cursor-pointer" : ""}`}
                  onClick={() => !isBulkMode && handleViewSection(section)}
                >
                  <div className="flex items-start gap-4">
                    {isBulkMode && (
                      <div className="mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSectionSelect(section.id);
                          }}
                          className="p-1"
                        >
                          {selectedQuestions.includes(section.id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-blue-600">
                          القسم {index + 1}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {section.type === "questions" ? "أسئلة" : "ملف"}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 leading-relaxed">
                        {section.name}
                      </h3>
                      {section.questions && section.questions.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">عدد الأسئلة: </span>
                          {section.questions.length}
                        </div>
                      )}
                      {section.file_path && (
                        <div className="text-sm text-gray-600">
                          <a
                            href={section.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            تحميل الملف
                          </a>
                        </div>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSection(section);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          عرض
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(section);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(section.id);
                          }}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* View/Edit Section Dialog */}
      <Dialog
        open={!!selectedSection && (isViewing || isEditing)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSection(null);
            setIsEditing(false);
            setIsViewing(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "تعديل القسم" : "عرض القسم"}</DialogTitle>
          </DialogHeader>
          {selectedSection && (
            <div className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      اسم القسم
                    </label>
                    <Input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Render all questions for editing */}
                  {selectedSection.questions &&
                  selectedSection.questions.length > 0 ? (
                    <div className="space-y-6">
                      {selectedSection.questions.map((question, qIdx) => (
                        <div
                          key={question.id || qIdx}
                          className="border rounded-lg p-4"
                        >
                          <h4 className="font-medium mb-2">
                            السؤال {qIdx + 1}
                          </h4>
                          <div className="mb-2">
                            <label className="block text-sm font-medium mb-1">
                              عنوان السؤال
                            </label>
                            <Textarea
                              value={question.question}
                              onChange={(e) => {
                                const updatedQuestions =
                                  selectedSection.questions!.map((q, i) =>
                                    i === qIdx
                                      ? { ...q, question: e.target.value }
                                      : q
                                  );
                                setSelectedSection({
                                  ...selectedSection,
                                  questions: updatedQuestions,
                                });
                              }}
                              rows={3}
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-medium">
                              الخيارات
                            </label>
                            {question.options.map((option, optIdx) => (
                              <div
                                key={optIdx}
                                className="flex items-center gap-2"
                              >
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const updatedOptions = question.options.map(
                                      (o, i) =>
                                        i === optIdx ? e.target.value : o
                                    );
                                    const updatedQuestions =
                                      selectedSection.questions!.map((q, i) =>
                                        i === qIdx
                                          ? { ...q, options: updatedOptions }
                                          : q
                                      );
                                    setSelectedSection({
                                      ...selectedSection,
                                      questions: updatedQuestions,
                                    });
                                  }}
                                  placeholder={`الخيار ${optIdx + 1}`}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const updatedQuestions =
                                      selectedSection.questions!.map((q, i) =>
                                        i === qIdx
                                          ? { ...q, correct_answer: optIdx }
                                          : q
                                      );
                                    setSelectedSection({
                                      ...selectedSection,
                                      questions: updatedQuestions,
                                    });
                                  }}
                                >
                                  {question.correct_answer === optIdx
                                    ? "إجابة صحيحة"
                                    : "تحديد كإجابة صحيحة"}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-center mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            // Assign a unique negative id for new questions
                            const minId = (
                              selectedSection.questions || []
                            ).reduce((min, q) => (q.id < min ? q.id : min), 0);
                            const newQuestion: BankQuestion = {
                              id: minId - 1,
                              question: "",
                              options: ["", "", "", ""],
                              correct_answer: null,
                              type: "multiple_choice",
                            };
                            setSelectedSection({
                              ...selectedSection,
                              questions: [
                                ...(selectedSection.questions || []),
                                newQuestion,
                              ],
                            });
                          }}
                          className="w-full max-w-md"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          إضافة سؤال آخر
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        عنوان السؤال
                      </label>
                      <Textarea
                        value={editForm.question}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            question: e.target.value,
                          }))
                        }
                        rows={3}
                      />
                      <div className="space-y-3">
                        <label className="block text-sm font-medium">
                          الخيارات
                        </label>
                        {editForm.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  options: prev.options.map((q, i) =>
                                    i === index ? e.target.value : q
                                  ),
                                }))
                              }
                              placeholder={`الخيار ${index + 1}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEditForm({
                                  ...editForm,
                                  correct_answer: index,
                                })
                              }
                            >
                              {editForm.correct_answer === index
                                ? "إجابة صحيحة"
                                : "تحديد كإجابة صحيحة"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      إلغاء
                    </Button>
                    <Button onClick={handleUpdate} disabled={isLoading}>
                      {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">اسم القسم</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedSection.name}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">النوع</h4>
                    <p className="text-gray-700">
                      {selectedSection.type === "questions" ? "أسئلة" : "ملف"}
                    </p>
                  </div>

                  {selectedSection.questions &&
                    selectedSection.questions.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">الأسئلة</h4>
                        <div className="space-y-4">
                          {selectedSection.questions.map((question, index) => (
                            <div
                              key={question.id}
                              className="border rounded-lg p-4"
                            >
                              <h5 className="font-medium mb-2">
                                السؤال {index + 1}
                              </h5>
                              <p className="text-gray-700 mb-2">
                                {question.question}
                              </p>

                              {question.options &&
                                question.options.length > 0 && (
                                  <div className="space-y-2">
                                    {question.options.map(
                                      (option, optIndex) => (
                                        <div
                                          key={optIndex}
                                          className={`flex items-center gap-2 p-2 rounded ${
                                            question.correct_answer !== null &&
                                            question.correct_answer - 1 ===
                                              optIndex
                                              ? "bg-green-100 text-green-800 border border-green-200"
                                              : "bg-gray-100"
                                          }`}
                                        >
                                          <span className="font-medium">
                                            {optIndex + 1}.
                                          </span>
                                          <span className="flex-1">
                                            {option}
                                          </span>
                                          {question.correct_answer !== null &&
                                            question.correct_answer - 1 ===
                                              optIndex && (
                                              <span className="text-xs font-medium bg-green-200 px-2 py-1 rounded">
                                                الإجابة الصحيحة
                                              </span>
                                            )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}

                              {question.written_answer && (
                                <div className="mt-2">
                                  <span className="font-medium text-sm">
                                    الإجابة النموذجية:{" "}
                                  </span>
                                  <p className="text-gray-700">
                                    {question.written_answer}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedSection.file_path && (
                    <div>
                      <h4 className="font-medium mb-2">الملف المرفوع</h4>
                      <a
                        href={selectedSection.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        <Download className="w-4 h-4" />
                        تحميل الملف
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Multiple Questions Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة أسئلة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                اسم القسم
              </label>
              <Input
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
              />
            </div>
            {multipleQuestions.map((questionForm, index) => (
              <div key={index} className="border rounded-lg p-4 relative">
                {multipleQuestions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestionForm(index)}
                    className="absolute top-2 right-2 text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}

                <h3 className="font-medium mb-4">السؤال {index + 1}</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      عنوان السؤال
                    </label>
                    <Textarea
                      value={questionForm.title}
                      onChange={(e) =>
                        updateQuestionForm(index, { title: e.target.value })
                      }
                      placeholder="أدخل عنوان السؤال هنا"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium">
                      الخيارات
                    </label>
                    {questionForm.questions.map((question, qIndex) => (
                      <div key={qIndex} className="flex items-center gap-2">
                        <Input
                          value={question}
                          onChange={(e) => {
                            const newQuestions = [...questionForm.questions];
                            newQuestions[qIndex] = e.target.value;
                            updateQuestionForm(index, {
                              questions: newQuestions,
                            });
                          }}
                          placeholder={`الخيار ${qIndex + 1}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuestionForm(index, {
                              correct_answer: qIndex,
                            })
                          }
                        >
                          {questionForm.correct_answer !== null &&
                          questionForm.correct_answer === qIndex
                            ? "إجابة صحيحة"
                            : "تحديد كإجابة صحيحة"}
                        </Button>
                        {questionForm.questions.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newQuestions =
                                questionForm.questions.filter(
                                  (_, i) => i !== qIndex
                                );
                              updateQuestionForm(index, {
                                questions: newQuestions,
                                correct_answer:
                                  questionForm.correct_answer !== null &&
                                  questionForm.correct_answer >= qIndex &&
                                  questionForm.correct_answer > 0
                                    ? questionForm.correct_answer - 1
                                    : questionForm.correct_answer,
                              });
                            }}
                            className="text-red-500"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newQuestions = [...questionForm.questions, ""];
                        updateQuestionForm(index, {
                          questions: newQuestions,
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة خيار
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={addQuestionForm}
                className="w-full max-w-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                إضافة سؤال آخر
              </Button>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  resetMultipleQuestionsForm();
                }}
              >
                إلغاء
              </Button>
              <Button onClick={handleAddMultipleQuestions} disabled={isLoading}>
                {isLoading
                  ? "جاري الإضافة..."
                  : `إضافة ${multipleQuestions.length} سؤال`}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankModulesComponent;
