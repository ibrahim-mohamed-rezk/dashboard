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
  FileText,
  HelpCircle,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomModal from "@/components/ui/CustomModal";

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
  level_id: number;
  banktable_id: number;
  banktable_type: string;
  created_at: string;
  updated_at: string;
  sections: BankSection[];
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
  const [bankData, setBankData] = useState<Bank[]>([]);
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
  const [sectionType, setSectionType] = useState<"questions" | "file">(
    "questions"
  );

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

  const [editQuestionsForm, setEditQuestionsForm] = useState<
    MultipleQuestionForm[]
  >([]);

  // Fetch banks data
  const fetchBanks = async () => {
    try {
      const response = await getData(
        `banks/${bankId}`,
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );

      setSelectedBank(response.data);
    } catch (error) {
      toast.error("فشل في جلب بيانات البنوك");
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchBanks();
  }, [bankId, token]);

  // Get sections from the current bank data
  const sections = selectedBank?.sections || [];

  // Enhanced statistics
  const statistics = useMemo(() => {
    if (!selectedBank)
      return {
        totalSections: 0,
        totalQuestions: 0,
        fileCount: 0,
        questionSections: 0,
      };

    const totalSections = sections.length;
    const questionSections = sections.filter(
      (s) => s.type === "questions"
    ).length;
    const fileCount = sections.filter((s) => s.type === "file").length;
    const totalQuestions = sections.reduce((acc, section) => {
      return acc + (section.questions?.length || 0);
    }, 0);

    return {
      totalSections,
      totalQuestions,
      fileCount,
      questionSections,
    };
  }, [selectedBank, sections]);

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
      setEditQuestionsForm(
        section.questions.map((q) => ({
          title: q.question,
          questions: q.options.length ? [...q.options] : ["", "", "", ""],
          correct_answer:
            q.correct_answer !== null ? q.correct_answer - 1 : null,
        }))
      );
    } else {
      setEditQuestionsForm([
        { title: "", questions: ["", "", "", ""], correct_answer: null },
      ]);
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
      await fetchBanks(); // Refresh bank data
      toast.success("تم حذف القسم بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف القسم");
    } finally {
      setIsLoading(false);
    }
  };

  // Add closeDialog function
  const closeDialog = () => {
    setIsEditing(false);
    setIsViewing(false);
    setIsAdding(false);
    setSelectedSection(null);
    setSectionTitle("");
    setSectionType("questions");
    setFileToUpload(null);
    resetMultipleQuestionsForm();
  };

  // Handle Update Section
  const handleUpdate = async () => {
    if (!selectedSection || !selectedBank) return;
    try {
      setIsLoading(true);
      if (selectedSection.type === "file") {
        const formData = new FormData();
        formData.append("name", selectedSection.name);
        formData.append("bank_id", bankId.toString());
        formData.append("type", "file");
        formData.append("_method", "PUT");

        // If user uploaded a new file, add it
        if (fileToUpload) {
          formData.append("file", fileToUpload);
        } else if (!selectedSection.file_path) {
          // If file_path is undefined, user wants to remove the file
          formData.append("remove_file", "1");
        }

        await postData(`bank-sections/${selectedSection.id}`, formData, {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        });

        await fetchBanks();
        setFileToUpload(null);
        closeDialog();
        toast.success("تم تحديث القسم بنجاح");
        return;
      }

      // Default: handle questions section update
      const formData = new FormData();
      formData.append("name", selectedSection.name);
      formData.append("bank_id", bankId.toString());
      formData.append("type", "questions");
      formData.append("_method", "PUT");

      // Use editQuestionsForm for all questions
      editQuestionsForm.forEach((q, idx) => {
        const qIndex = idx + 1;
        formData.append(`questions[${qIndex}][question]`, q.title);
        q.questions.forEach((option, optIdx) => {
          if (option.trim()) {
            formData.append(`questions[${qIndex}][${optIdx + 1}]`, option);
          }
        });
        formData.append(
          `questions[${qIndex}][correct_answer]`,
          q.correct_answer !== null ? (q.correct_answer + 1).toString() : ""
        );
      });

      await postData(`bank-sections/${selectedSection.id}`, formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      await fetchBanks();
      closeDialog();
      toast.success("تم تحديث القسم بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث القسم");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Add Section (Questions or File)
  const handleAddSection = async () => {
    if (!selectedBank) {
      toast.error("لم يتم العثور على بيانات البنك");
      return;
    }

    if (!sectionTitle.trim()) {
      toast.error("يرجى إدخال اسم القسم");
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("name", sectionTitle);
      formData.append("bank_id", bankId.toString());
      formData.append("type", sectionType);

      if (sectionType === "file") {
        if (!fileToUpload) {
          toast.error("يرجى اختيار ملف للرفع");
          return;
        }
        formData.append("file", fileToUpload);
      } else {
        // Questions type
        const validQuestions = multipleQuestions.filter((q) => {
          if (!q.title.trim()) return false;
          const validOptions = q.questions.filter((opt) => opt.trim() !== "");
          return validOptions.length >= 2;
        });

        if (validQuestions.length === 0) {
          toast.error("يرجى إدخال سؤال واحد صحيح على الأقل");
          return;
        }

        // Add multiple questions in the same request
        validQuestions.forEach((question, questionIndex) => {
          const qIndex = questionIndex + 1;
          formData.append(`questions[${qIndex}][question]`, question.title);
          question.questions.forEach((option, optionIndex) => {
            if (option.trim()) {
              formData.append(
                `questions[${qIndex}][${optionIndex + 1}]`,
                option
              );
            }
          });
          formData.append(
            `questions[${qIndex}][correct_answer]`,
            ((question.correct_answer as number) + 1).toString()
          );
        });
      }

      await postData("bank-sections", formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      await fetchBanks();
      closeDialog();

      if (sectionType === "file") {
        toast.success("تم رفع الملف بنجاح");
      } else {
        const validQuestions = multipleQuestions.filter((q) => {
          if (!q.title.trim()) return false;
          const validOptions = q.questions.filter((opt) => opt.trim() !== "");
          return validOptions.length >= 2;
        });
        toast.success(`تم إضافة ${validQuestions.length} سؤال بنجاح`);
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة القسم");
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

      await fetchBanks();
      setSelectedQuestions([]);
      setIsBulkMode(false);
      toast.success(`تم حذف ${selectedQuestions.length} قسم بنجاح`);
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الأقسام");
    } finally {
      setIsLoading(false);
    }
  };

  // Add, remove, update question logic for editQuestionsForm
  const addEditQuestionForm = () => {
    setEditQuestionsForm([
      ...editQuestionsForm,
      { title: "", questions: ["", "", "", ""], correct_answer: null },
    ]);
  };
  const removeEditQuestionForm = (index: number) => {
    if (editQuestionsForm.length === 1) {
      toast.error("يجب أن يحتوي النموذج على سؤال واحد على الأقل");
      return;
    }
    setEditQuestionsForm(editQuestionsForm.filter((_, i) => i !== index));
  };
  const updateEditQuestionForm = (
    index: number,
    updates: Partial<MultipleQuestionForm>
  ) => {
    setEditQuestionsForm(
      editQuestionsForm.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  };

  return (
    <div className="w-full">
      {/* Bank Header */}
      <div className="mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden mb-8 border border-gray-200 dark:border-gray-700">
        <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-900 dark:to-purple-900">
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
          <h1 className="text-3xl font-bold mb-6">
            {selectedBank?.name || "بنك الأسئلة"}
          </h1>

          {/* Enhanced Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-300 text-sm font-medium">
                    إجمالي الأقسام
                  </p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-100">
                    {statistics.totalSections}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-300" />
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4 border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-300 text-sm font-medium">
                    إجمالي الأسئلة
                  </p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-100">
                    {statistics.totalQuestions}
                  </p>
                </div>
                <HelpCircle className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-300 text-sm font-medium">
                    أقسام الأسئلة
                  </p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-100">
                    {statistics.questionSections}
                  </p>
                </div>
                <HelpCircle className="h-8 w-8 text-purple-600 dark:text-purple-300" />
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 dark:text-orange-300 text-sm font-medium">
                    الملفات
                  </p>
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-100">
                    {statistics.fileCount}
                  </p>
                </div>
                <Upload className="h-8 w-8 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
          </div>

          {/* Additional Bank Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  رقم البنك
                </p>
                <p className="font-semibold dark:text-white">
                  {selectedBank?.id || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  السعر
                </p>
                <p className="font-semibold dark:text-white">
                  {selectedBank?.price || 0} ج.م
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  تاريخ الإنشاء
                </p>
                <p className="font-semibold dark:text-white">
                  {selectedBank?.created_at
                    ? new Date(selectedBank.created_at).toLocaleDateString("ar")
                    : "غير محدد"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Header with Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">أقسام البنك</h2>
              <span className="text-sm text-gray-500 dark:text-gray-300">
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
                إضافة قسم جديد
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                placeholder="البحث في الأقسام..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full lg:w-48 dark:bg-gray-800 dark:text-white">
                <SelectValue placeholder="فلترة حسب النوع" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:text-white">
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="questions">أسئلة</SelectItem>
                <SelectItem value="file">ملفات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {isBulkMode && selectedQuestions.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
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

          {/* Sections List */}
          {isLoading && !sections.length ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-300 text-lg">
                جاري التحميل...
              </p>
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-300 text-lg">
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
                      ? "bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
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
                            <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Square className="h-4 w-4 dark:text-gray-400" />
                          )}
                        </Button>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          القسم {index + 1}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            section.type === "questions"
                              ? "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300"
                              : "bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-300"
                          }`}
                        >
                          {section.type === "questions" ? "أسئلة" : "ملف"}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 leading-relaxed dark:text-white">
                        {section.name}
                      </h3>
                      {section.questions && section.questions.length > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">عدد الأسئلة: </span>
                          {section.questions.length}
                        </div>
                      )}
                      {section.file_path && (
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <a
                            href={section.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
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
      </div>

      {/* View/Edit Section Dialog */}
      {selectedSection && (
        <CustomModal
          open={isViewing || isEditing}
          onClose={closeDialog}
          className="max-w-4xl max-h-[90vh] w-full"
        >
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">
                {isEditing ? "تعديل القسم" : "عرض القسم"}
              </h2>
            </div>
            {selectedSection && (
              <div className="space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        اسم القسم
                      </label>
                      <Input
                        value={selectedSection.name}
                        onChange={(e) => {
                          setSelectedSection({
                            ...selectedSection,
                            name: e.target.value,
                          });
                        }}
                      />
                    </div>

                    {/* If section is file, show file upload form instead of question edit form */}
                    {selectedSection.type === "file" ? (
                      <div className="space-y-4">
                        {selectedSection.file_path ? (
                          <div className="mb-2">
                            <label className="block text-sm font-medium mb-1">
                              الملف الحالي:
                            </label>
                            <a
                              href={selectedSection.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              تحميل الملف الحالي
                            </a>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-4 text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => {
                                setSelectedSection({
                                  ...selectedSection,
                                  file_path: undefined,
                                });
                              }}
                            >
                              إزالة الملف
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              رفع ملف جديد
                            </label>
                            <label className="cursor-pointer block border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors text-center">
                              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm font-medium text-gray-700">
                                {fileToUpload
                                  ? fileToUpload.name
                                  : "اختر ملف للرفع"}
                              </p>
                              <input
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  setFileToUpload(file);
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {editQuestionsForm.map((questionForm, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-4 relative"
                          >
                            {editQuestionsForm.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEditQuestionForm(index)}
                                className="absolute top-2 right-2 text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            <h3 className="font-medium mb-4">
                              السؤال {index + 1}
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  عنوان السؤال
                                </label>
                                <Textarea
                                  value={questionForm.title}
                                  onChange={(e) =>
                                    updateEditQuestionForm(index, {
                                      title: e.target.value,
                                    })
                                  }
                                  placeholder="أدخل عنوان السؤال هنا"
                                  rows={3}
                                />
                              </div>
                              <div className="space-y-3">
                                <label className="block text-sm font-medium">
                                  الخيارات
                                </label>
                                {questionForm.questions.map(
                                  (option, qIndex) => (
                                    <div
                                      key={qIndex}
                                      className="flex items-center gap-2"
                                    >
                                      <Input
                                        value={option}
                                        onChange={(e) => {
                                          const newQuestions = [
                                            ...questionForm.questions,
                                          ];
                                          newQuestions[qIndex] = e.target.value;
                                          updateEditQuestionForm(index, {
                                            questions: newQuestions,
                                          });
                                        }}
                                        placeholder={`الخيار ${qIndex + 1}`}
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          updateEditQuestionForm(index, {
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
                                            updateEditQuestionForm(index, {
                                              questions: newQuestions,
                                              correct_answer:
                                                questionForm.correct_answer !==
                                                  null &&
                                                questionForm.correct_answer >=
                                                  qIndex &&
                                                questionForm.correct_answer > 0
                                                  ? questionForm.correct_answer -
                                                    1
                                                  : questionForm.correct_answer,
                                            });
                                          }}
                                          className="text-red-500"
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  )
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newQuestions = [
                                      ...questionForm.questions,
                                      "",
                                    ];
                                    updateEditQuestionForm(index, {
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
                            onClick={addEditQuestionForm}
                            className="w-full max-w-md"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            إضافة سؤال آخر
                          </Button>
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
                            {selectedSection.questions.map(
                              (question, index) => (
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
                                                question.correct_answer !==
                                                  null &&
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
                                              {question.correct_answer !==
                                                null &&
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
                              )
                            )}
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
          </div>
        </CustomModal>
      )}

      {/* Add Section Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة قسم جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  اسم القسم
                </label>
                <Input
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="أدخل اسم القسم"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  نوع القسم
                </label>
                <select
                  value={sectionType}
                  onChange={(e) =>
                    setSectionType(e.target.value as "questions" | "file")
                  }
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="" disabled>
                    اختر نوع القسم
                  </option>
                  <option value="questions">أسئلة</option>
                  <option value="file">ملف</option>
                </select>
              </div>
            </div>

            {sectionType === "file" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    رفع ملف
                  </label>
                  <label className="cursor-pointer block border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      {fileToUpload ? fileToUpload.name : "اختر ملف للرفع"}
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, PDF حتى 10MB
                    </p>
                    <input
                      type="file"
                      onChange={(e) =>
                        setFileToUpload(e.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
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
                                const newQuestions = [
                                  ...questionForm.questions,
                                ];
                                newQuestions[qIndex] = e.target.value;
                                updateQuestionForm(index, {
                                  questions: newQuestions,
                                });
                              }}
                              placeholder={`الخيار ${qIndex + 1}`}
                            />
                            <Button
                              variant={"outline"}
                              size="sm"
                              onClick={() =>
                                updateQuestionForm(index, {
                                  correct_answer: qIndex,
                                })
                              }
                            >
                              {questionForm.correct_answer !== null &&
                              questionForm.correct_answer === qIndex
                                ? "إجابة صحيحة ✓"
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
                            const newQuestions = [
                              ...questionForm.questions,
                              "",
                            ];
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
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                إلغاء
              </Button>
              <Button onClick={handleAddSection} disabled={isLoading}>
                {isLoading
                  ? "جاري الإضافة..."
                  : sectionType === "file"
                  ? "رفع الملف"
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
