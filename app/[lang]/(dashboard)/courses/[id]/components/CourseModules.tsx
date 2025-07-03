"use client";
import { CoursModules, VideoTypes } from "@/lib/type";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { postData, deleteData, getData } from "@/lib/axios/server";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash,
  Plus,
  Upload,
  FileText,
  PlayCircle,
  HelpCircle,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import CustomModal from "@/components/ui/CustomModal";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";

const CourseModules = ({
  courseId,
  token,
}: {
  courseId: string;
  token: string;
}) => {
  const [modules, setModules] = useState<CoursModules[]>([]);
  const [selectedModule, setSelectedModule] = useState<CoursModules | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isEditingVideoQuiz, setIsEditingVideoQuiz] = useState(false);
  const [videos, setVideos] = useState<VideoTypes[]>([]);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    url: "",
    thumbnail: null as File | null,
    questions_count: 0,
    duration: 0,
    passing_score: 0,
    exam_image: null as File | null,
    questions: [] as {
      id?: number;
      question: string;
      options: { id?: number; answer: string; is_correct: boolean }[];
      correct_answer?: number;
    }[],
    created_at: "",
  });

  const [newModuleForm, setNewModuleForm] = useState({
    type: "video",
    title: "",
    description: "",
    url: "",
    thumbnail: null as File | null,
    questions_count: 0,
    duration: 0,
    passing_score: 0,
    exam_image: null as File | null,
    questions: [] as {
      question: string;
      options: { answer: string; is_correct: boolean }[];
    }[],
    exam_belongs_to: "course" as "course" | "video",
    exam_video_id: "",
    created_at: "",
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    type: "msq" as "msq" | "tf" | "written",
    options: [
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
    ],
    written_answer: "",
  });

  // For editing existing questions
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<
    number | null
  >(null);
  const [editQuestionForm, setEditQuestionForm] = useState({
    question: "",
    options: [
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
    ],
  });

  const params = useParams();

  // Fetch course data
  const fetchCourse = async () => {
    try {
      const response = await getData(
        `courses/${params.id}`,
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setModules(response.data.modules);
    } catch (error) {
      throw error;
    }
  };

  // Fetch videos from api
  const fetchVideos = async () => {
    try {
      const response = await getData(
        `videos`,
        { course_id: params.id },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setVideos(response.videos);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchCourse();
    fetchVideos();
  }, [token]);

  const handleThumbnailEditChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setEditForm((prev) => ({
        ...prev,
        thumbnail: files[0],
      }));
    }
  };

  const handleExamImageEditChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setEditForm((prev) => ({
        ...prev,
        exam_image: files[0],
      }));
    }
  };

  // Enhanced click handler for modules
  const handleModuleClick = (module: CoursModules) => {
    setSelectedModule(module);

    if (module.type === "video") {
      setEditForm({
        title: module?.details?.title || "",
        description: module?.details?.description || "",
        url: module?.details?.url || "",
        thumbnail: null,
        questions_count: 0,
        duration: 0,
        passing_score: 0,
        exam_image: null,
        questions: [],
        created_at: "",
      });
      setIsEditing(true);
    } else if (module.type === "quiz" || module.type === "exam") {
      // For quiz/exam, populate the form with existing data
      const examDetails = module.details;

      const questions = Array.isArray((examDetails as any)?.questions)
        ? (examDetails as any).questions
        : Array.isArray(examDetails?.quiz)
        ? examDetails.quiz[0]?.questions
        : [];

      const transformedQuestions =
        questions?.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options.map((opt: any, index: number) => ({
            id: opt.id,
            answer: opt.answer,
            is_correct: q.correct_answer === index + 1,
          })),
          correct_answer: q.correct_answer,
        })) || [];

      setEditForm({
        title: examDetails?.title || "",
        description: examDetails?.description || "",
        url: "",
        thumbnail: null,
        questions_count:
          (examDetails as any)?.questions_count ??
          (Array.isArray(examDetails?.quiz)
            ? examDetails.quiz[0]?.questions_count
            : 0),
        duration:
          (examDetails as any)?.duration ??
          (Array.isArray(examDetails?.quiz)
            ? examDetails.quiz[0]?.duration
            : 0),
        passing_score:
          (examDetails as any)?.passing_score ??
          (Array.isArray(examDetails?.quiz)
            ? examDetails.quiz[0]?.passing_score
            : 0),
        exam_image: null,
        questions: transformedQuestions,
        created_at: examDetails?.created_at || "",
      });
      setIsEditing(true);
    }
  };

  const handleEdit = (module: CoursModules) => {
    handleModuleClick(module);
  };

  // Enhanced delete function with confirmation
  const handleDelete = async (moduleId: number, type: string) => {
    if (
      !confirm("هل أنت متأكد من حذف هذا الدرس؟ لا يمكن التراجع عن هذا الإجراء.")
    ) {
      return;
    }

    try {
      const endpoint = type === "video" ? "videos" : "exams";
      await deleteData(`${endpoint}/${moduleId}`, {
        Authorization: `Bearer ${token}`,
      });
      await fetchCourse();
      toast.success("تم حذف الدرس بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الدرس");
    }
  };

  const handleUpdate = async () => {
    if (!selectedModule) return;

    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description);
      formData.append("_method", "PUT");

      let endpoint = "videos";

      if (selectedModule.type === "video") {
        const from = "youtube";
        formData.append("from", from);
        formData.append("url", editForm.url);
        if (editForm.thumbnail) {
          formData.append("thumbnail", editForm.thumbnail);
        }
        endpoint = "videos";
      } else if (
        selectedModule.type === "quiz" ||
        selectedModule.type === "exam"
      ) {
        formData.append("questions_count", editForm.questions_count.toString());
        formData.append("duration", editForm.duration.toString());
        formData.append("passing_score", editForm.passing_score.toString());

        if (editForm.exam_image) {
          formData.append("image", editForm.exam_image);
        }

        // Add questions data
        editForm.questions.forEach((question, index) => {
          const questionNumber = index + 1;
          formData.append(
            `questions[${questionNumber}][question]`,
            question.question
          );

          question.options.forEach((option, optIndex) => {
            formData.append(
              `questions[${questionNumber}][${optIndex + 1}]`,
              option.answer
            );
          });

          const correctAnswerIndex = question.options.findIndex(
            (opt) => opt.is_correct
          );
          formData.append(
            `questions[${questionNumber}][answer]`,
            (correctAnswerIndex + 1).toString()
          );
        });

        endpoint = "exams";
      }

      await postData(`${endpoint}/${selectedModule?.details?.id}`, formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      await fetchCourse();
      setIsEditing(false);
      setSelectedModule(null);
      toast.success("تم تحديث الدرس بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث الدرس");
    }
  };

  // Handle video quiz update
  const handleVideoQuizUpdate = async () => {
    if (!selectedModule?.details?.quiz?.[0]) return;

    try {
      const quizId = selectedModule.details.quiz[0].id;
      const videoId = selectedModule.details.id; // Get the current video ID

      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("examtable_type", "video");
      formData.append("examtable_id", videoId.toString());
      formData.append("questions_count", editForm.questions_count.toString());
      formData.append("duration", editForm.duration.toString());
      formData.append("passing_score", editForm.passing_score.toString());

      // Add questions data
      editForm.questions.forEach((question, index) => {
        const questionNumber = index + 1;
        formData.append(
          `questions[${questionNumber}][question]`,
          question.question
        );

        question.options.forEach((option, optIndex) => {
          formData.append(
            `questions[${questionNumber}][${optIndex + 1}]`,
            option.answer
          );
        });

        const correctAnswerIndex = question.options.findIndex(
          (opt) => opt.is_correct
        );
        formData.append(
          `questions[${questionNumber}][answer]`,
          (correctAnswerIndex + 1).toString()
        );
      });

      await postData(`exams/${quizId}`, formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      await fetchCourse();
      setIsEditingVideoQuiz(false);
      setSelectedModule(null);
      toast.success("تم تحديث اختبار الفيديو بنجاح");
    } catch (error) {
      console.error("Error updating video quiz:", error);
      toast.error("حدث خطأ أثناء تحديث اختبار الفيديو");
    }
  };

  // Handle editing video quiz
  const handleEditVideoQuiz = () => {
    if (!selectedModule?.details?.quiz?.[0]) return;

    const quizData = selectedModule.details.quiz[0];
    const transformedQuestions =
      quizData.questions?.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options.map((opt: any, index: number) => ({
          id: opt.id,
          answer: opt.answer,
          is_correct: q.correct_answer === index + 1,
        })),
        correct_answer: q.correct_answer,
      })) || [];

    setEditForm((prev) => ({
      ...prev,
      questions_count: (quizData as any)?.questions_count ?? 0,
      duration: (quizData as any)?.duration ?? 0,
      passing_score: (quizData as any)?.passing_score ?? 0,
      questions: transformedQuestions,
    }));
    setIsEditingVideoQuiz(true);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewModuleForm({
        ...newModuleForm,
        thumbnail: e.target.files[0],
      });
    }
  };

  const handleExamImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewModuleForm({
        ...newModuleForm,
        exam_image: e.target.files[0],
      });
    }
  };

  const handleAddModule = async () => {
    try {
      const formData = new FormData();
      formData.append("type", newModuleForm.type);
      formData.append("title", newModuleForm.title);
      formData.append("description", newModuleForm.description);
      formData.append("course_id", courseId);
      formData.append("created_at", newModuleForm.created_at);

      let endpoint = "course-sections";
      if (newModuleForm.type === "video") {
        const from = "youtube";
        formData.append("from", from);
        formData.append("url", newModuleForm.url);
        if (newModuleForm.thumbnail) {
          formData.append("thumbnail", newModuleForm.thumbnail);
        }
        endpoint = "videos";
      } else if (newModuleForm.type === "quiz") {
        formData.append("title", newModuleForm.title);
        if (newModuleForm.exam_belongs_to === "course") {
          formData.append("examtable_id", courseId);
          formData.append("examtable_type", "course");
        } else if (newModuleForm.exam_belongs_to === "video") {
          formData.append("examtable_id", newModuleForm.exam_video_id);
          formData.append("examtable_type", "video");
        }
        formData.append(
          "questions_count",
          newModuleForm.questions.length.toString()
        );
        newModuleForm.questions.forEach((question, index) => {
          const questionNumber = index + 1;
          formData.append(
            `questions[${questionNumber}][question]`,
            question.question
          );
          question.options.forEach((option, optIndex) => {
            formData.append(
              `questions[${questionNumber}][${optIndex + 1}]`,
              option.answer
            );
          });
          const correctAnswerIndex = question.options.findIndex(
            (opt) => opt.is_correct
          );
          formData.append(
            `questions[${questionNumber}][answer]`,
            (correctAnswerIndex + 1).toString()
          );
        });
        if (newModuleForm.exam_image) {
          formData.append("image", newModuleForm.exam_image);
        }
        if (newModuleForm.created_at) {
          formData.append("created_at", newModuleForm.created_at);
        }
        endpoint = "exams";
      }

      await postData(endpoint, formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      await fetchCourse();
      setIsAdding(false);
      setNewModuleForm({
        type: "video",
        title: "",
        description: "",
        url: "",
        thumbnail: null,
        questions_count: 0,
        duration: 0,
        passing_score: 0,
        exam_image: null,
        questions: [],
        exam_belongs_to: "course",
        exam_video_id: "",
        created_at: "",
      });
      toast.success("تم إضافة الدرس بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة الدرس");
    }
  };

  // Question management functions
  const addOption = () => {
    if (currentQuestion.type !== "msq") return;
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { answer: "", is_correct: false }],
    });
  };

  const removeOption = (index: number) => {
    if (currentQuestion.type !== "msq") return;
    if (currentQuestion.options.length <= 2) {
      toast.error("يجب أن يحتوي السؤال على خيارين على الأقل");
      return;
    }
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.filter((_, i) => i !== index),
    });
  };

  const updateOption = (index: number, value: string) => {
    if (currentQuestion.type !== "msq") return;
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.map((opt, i) =>
        i === index ? { ...opt, answer: value } : opt
      ),
    });
  };

  const setCorrectAnswer = (index: number) => {
    if (currentQuestion.type === "written") return;
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.map((opt, i) => ({
        ...opt,
        is_correct: i === index,
      })),
    });
  };

  const addQuestion = () => {
    if (currentQuestion.question.trim() === "") {
      toast.error("يرجى إدخال السؤال");
      return;
    }

    if (currentQuestion.type === "msq") {
      if (currentQuestion.options.some((opt) => opt.answer.trim() === "")) {
        toast.error("يرجى إدخال جميع الخيارات");
        return;
      }

      if (!currentQuestion.options.some((opt) => opt.is_correct)) {
        toast.error("يرجى تحديد الإجابة الصحيحة");
        return;
      }
    }

    // Add to edit form for existing modules
    if (isEditing) {
      setEditForm({
        ...editForm,
        questions: [
          ...editForm.questions,
          {
            question: currentQuestion.question,
            options: currentQuestion.options,
          },
        ],
      });
    } else {
      // Add to new module form
      setNewModuleForm({
        ...newModuleForm,
        questions: [...newModuleForm.questions, currentQuestion],
      });
    }

    setCurrentQuestion({
      question: "",
      type: "msq",
      options: [
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
      ],
      written_answer: "",
    });
  };

  const removeQuestion = (index: number) => {
    if (isEditing) {
      setEditForm({
        ...editForm,
        questions: editForm.questions.filter((_, i) => i !== index),
      });
    } else {
      setNewModuleForm({
        ...newModuleForm,
        questions: newModuleForm.questions.filter((_, i) => i !== index),
      });
    }
  };

  // Edit existing question functions
  const startEditingQuestion = (index: number) => {
    const question = editForm.questions[index];
    setEditingQuestionIndex(index);
    setEditQuestionForm({
      question: question.question,
      options: question.options.map((opt) => ({
        answer: opt.answer,
        is_correct: opt.is_correct,
      })),
    });
  };

  const saveEditedQuestion = () => {
    if (editingQuestionIndex === null) return;

    const updatedQuestions = [...editForm.questions];
    updatedQuestions[editingQuestionIndex] = {
      ...updatedQuestions[editingQuestionIndex],
      question: editQuestionForm.question,
      options: editQuestionForm.options,
    };

    setEditForm({
      ...editForm,
      questions: updatedQuestions,
    });

    setEditingQuestionIndex(null);
    setEditQuestionForm({
      question: "",
      options: [
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
      ],
    });
  };

  const cancelEditingQuestion = () => {
    setEditingQuestionIndex(null);
    setEditQuestionForm({
      question: "",
      options: [
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
      ],
    });
  };

  const handleViewModule = (module: CoursModules) => {
    setSelectedModule(module);
    setIsViewing(true);
  };

  const renderModuleIcon = (module: CoursModules) => {
    if (module.type === "video") {
      return <PlayCircle className="w-8 h-8 text-blue-500" />;
    } else if (module.type === "quiz" || module.type === "exam") {
      return <HelpCircle className="w-8 h-8 text-green-500" />;
    }
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Assume first row is header: ["Question", "Option 1", "Option 2", "Option 3", "Option 4", "Correct Option"]
      const questions = json.slice(1).map((row) => {
        const [question, opt1, opt2, opt3, opt4, correct] = row;
        const options = [
          { answer: opt1, is_correct: correct == 1 },
          { answer: opt2, is_correct: correct == 2 },
          { answer: opt3, is_correct: correct == 3 },
          { answer: opt4, is_correct: correct == 4 },
        ];
        return { question, options };
      });

      setNewModuleForm((prev) => ({
        ...prev,
        questions: [...prev.questions, ...questions],
        questions_count: prev.questions_count || questions.length,
      }));
    };
    reader.readAsBinaryString(file);
  };

  // Export questions as Excel
  const handleExportQuestions = () => {
    if (!selectedModule) return;
    let questions = [];
    if (
      selectedModule?.type === "exam" &&
      selectedModule.details &&
      "questions" in selectedModule.details &&
      Array.isArray((selectedModule.details as any).questions)
    ) {
      questions = (selectedModule.details as any).questions;
    } else if (
      selectedModule?.type === "quiz" &&
      Array.isArray(selectedModule?.details?.quiz) &&
      selectedModule.details.quiz[0]?.questions
    ) {
      questions = selectedModule.details.quiz[0].questions;
    } else if (
      Array.isArray(selectedModule?.details?.quiz) &&
      selectedModule.details.quiz[0]?.questions
    ) {
      questions = selectedModule.details.quiz[0].questions;
    }
    if (!questions.length) return;
    // Prepare data for Excel
    const data = [
      [
        "السؤال",
        "الخيار 1",
        "الخيار 2",
        "الخيار 3",
        "الخيار 4",
        "رقم الإجابة الصحيحة (1-4)",
      ],
      ...questions.map((q: any) => {
        const correctIdx = q.correct_answer
          ? q.correct_answer
          : q.options.findIndex((opt: any) => opt.is_correct) + 1;
        return [
          q.question,
          q.options[0]?.answer || "",
          q.options[1]?.answer || "",
          q.options[2]?.answer || "",
          q.options[3]?.answer || "",
          correctIdx,
        ];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(
      wb,
      `questions_${selectedModule.details?.title || "quiz"}.xlsx`
    );
  };

  return (
    <div className="mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden text-right rtl">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-white">محتوى الدورة</h2>
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            إضافة درس جديدة
          </Button>
        </div>

        {!modules || modules.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              لا يوجد محتوى متاح حالياً
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              ابدأ بإضافة أول درس للدورة
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((module: CoursModules, index) => (
              <div
                key={module.id}
                className="border dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer hover:shadow-md"
                onClick={() => handleModuleClick(module)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {module?.type === "video" &&
                      module?.details?.thumbnail ? (
                        <div className="w-20 h-20 relative rounded-lg overflow-hidden">
                          <img
                            src={module.details.thumbnail}
                            alt={module.details.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                            <PlayCircle className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          {renderModuleIcon(module)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold dark:text-white truncate">
                          {module?.details?.title}
                        </h3>
                        <Badge variant={"outline"}>
                          {module.type === "video" ? "فيديو" : "اختبار"}
                        </Badge>
                      </div>
                      {/* Show created_at date */}
                      {module?.details?.created_at && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          يبدأ في{" "}
                          {new Date(
                            module.details.created_at
                          ).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      )}

                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
                        {module?.details?.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {module.type === "video" && (
                          <>
                            <span>فيديو تعليمي</span>
                            {module?.details?.has_quiz && (
                              <Badge variant="outline" className="text-xs">
                                يحتوي على اختبار (
                                {module?.details?.quiz?.[0]?.questions_count ||
                                  0}{" "}
                                سؤال)
                              </Badge>
                            )}
                          </>
                        )}
                        {(module.type === "quiz" || module.type === "exam") && (
                          <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4" />
                            <span>
                              {module?.details?.questions_count ||
                                module?.details?.questions?.length ||
                                0}{" "}
                              سؤال
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
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
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(module);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewModule(module);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        عرض التفاصيل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(module?.details?.id, module?.type);
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

      {/* Enhanced Edit Module Modal */}
      <CustomModal
        open={!!selectedModule && isEditing && !isEditingVideoQuiz}
        onClose={() => {
          setSelectedModule(null);
          setIsEditing(false);
          setEditingQuestionIndex(null);
        }}
        className="max-w-7xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 dark:text-white"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {selectedModule?.type === "video" && (
                <PlayCircle className="w-5 h-5" />
              )}
              {(selectedModule?.type === "quiz" ||
                selectedModule?.type === "exam") && (
                <HelpCircle className="w-5 h-5" />
              )}
              تعديل {selectedModule?.type === "video" ? "الفيديو" : "الاختبار"}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedModule(null);
                setIsEditing(false);
                setEditingQuestionIndex(null);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {selectedModule && (
            <div className="space-y-6">
              {/* Common fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">
                    العنوان
                  </label>
                  <Input
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="bg-white dark:bg-gray-800 dark:text-white"
                    placeholder="أدخل عنوان الدرس"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">
                    الوصف
                  </label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="bg-white dark:bg-gray-800 dark:text-white"
                    placeholder="أدخل وصف الدرس"
                    rows={3}
                  />
                </div>
              </div>

              {/* Video specific fields */}
              {selectedModule.type === "video" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      رابط الفيديو
                    </label>
                    <Input
                      value={editForm.url}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          url: e.target.value,
                        }))
                      }
                      className="bg-white dark:bg-gray-800 dark:text-white"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      صورة مصغرة
                    </label>
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailEditChange}
                        className="cursor-pointer bg-white dark:bg-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {editForm.thumbnail && (
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        تم اختيار: {editForm.thumbnail.name}
                      </p>
                    )}
                  </div>

                  {/* Video Quiz Edit Button */}
                  {selectedModule.details?.has_quiz && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">
                            اختبار الفيديو
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {selectedModule.details.quiz?.[0]
                              ?.questions_count || 0}{" "}
                            سؤال
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleEditVideoQuiz}
                          className="border-blue-200 text-blue-700 hover:bg-blue-100"
                        >
                          <HelpCircle className="w-4 h-4 mr-2" />
                          تعديل الاختبار
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Date input for created_at */}
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      تاريخ بدايه الدرس
                    </label>
                    <Input
                      type="date"
                      value={editForm.created_at || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          created_at: e.target.value,
                        }))
                      }
                      className="bg-white dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Exam/Quiz specific fields */}
              {(selectedModule.type === "quiz" ||
                selectedModule.type === "exam") && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-white">
                        تاريخ بدايه الاختبار
                      </label>
                      <Input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={editForm.created_at || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            created_at: e.target.value,
                          }))
                        }
                        className="bg-white dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-white">
                        المدة (دقيقة)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={editForm.duration || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            duration: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="bg-white dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-white">
                        درجة النجاح (%)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={editForm.passing_score || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            passing_score: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="bg-white dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      صورة الاختبار
                    </label>
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleExamImageEditChange}
                        className="cursor-pointer bg-white dark:bg-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {editForm.exam_image && (
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        تم اختيار: {editForm.exam_image.name}
                      </p>
                    )}
                  </div>

                  {/* Display and edit questions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium mb-2 dark:text-white">
                        الأسئلة المتاحة
                      </h4>
                      <Badge variant="outline">
                        {editForm.questions.length} سؤال
                      </Badge>
                    </div>

                    {/* Existing Questions List */}
                    {editForm.questions.length > 0 && (
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {editForm.questions.map((question, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                          >
                            {editingQuestionIndex === index ? (
                              // Edit mode
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    السؤال
                                  </label>
                                  <Textarea
                                    value={editQuestionForm.question}
                                    onChange={(e) =>
                                      setEditQuestionForm((prev) => ({
                                        ...prev,
                                        question: e.target.value,
                                      }))
                                    }
                                    rows={2}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium">
                                    الخيارات
                                  </label>
                                  {editQuestionForm.options.map(
                                    (option, optIndex) => (
                                      <div
                                        key={optIndex}
                                        className="flex items-center gap-2"
                                      >
                                        <span className="text-sm w-6">
                                          {optIndex + 1}.
                                        </span>
                                        <Input
                                          value={option.answer}
                                          onChange={(e) => {
                                            const newOptions = [
                                              ...editQuestionForm.options,
                                            ];
                                            newOptions[optIndex].answer =
                                              e.target.value;
                                            setEditQuestionForm((prev) => ({
                                              ...prev,
                                              options: newOptions,
                                            }));
                                          }}
                                          className="flex-1"
                                        />
                                        <Button
                                          variant={"outline"}
                                          size="sm"
                                          onClick={() => {
                                            const newOptions =
                                              editQuestionForm.options.map(
                                                (opt, i) => ({
                                                  ...opt,
                                                  is_correct: i === optIndex,
                                                })
                                              );
                                            setEditQuestionForm((prev) => ({
                                              ...prev,
                                              options: newOptions,
                                            }));
                                          }}
                                          className={
                                            option.is_correct
                                              ? "bg-green-600 hover:bg-green-700"
                                              : ""
                                          }
                                        >
                                          {option.is_correct
                                            ? "صحيح ✓"
                                            : "تحديد"}
                                        </Button>
                                      </div>
                                    )
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={saveEditedQuestion}
                                  >
                                    حفظ
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={cancelEditingQuestion}
                                  >
                                    إلغاء
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <p className="font-medium dark:text-white">
                                    {index + 1}. {question.question}
                                  </p>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        startEditingQuestion(index)
                                      }
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeQuestion(index)}
                                      className="text-red-500"
                                    >
                                      <Trash className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {question.options.map((option, optIndex) => (
                                    <div
                                      key={optIndex}
                                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                                        option.is_correct
                                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                          : "bg-white dark:bg-gray-700"
                                      }`}
                                    >
                                      <span className="font-medium">
                                        {optIndex + 1}.
                                      </span>
                                      <span className="flex-1">
                                        {option.answer}
                                      </span>
                                      {option.is_correct && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          صحيح
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Question Form */}
                    <div className="border rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20">
                      <h4 className="font-medium mb-4 text-blue-900 dark:text-blue-100">
                        إضافة سؤال جديد
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            السؤال
                          </label>
                          <Textarea
                            value={currentQuestion.question}
                            onChange={(e) =>
                              setCurrentQuestion({
                                ...currentQuestion,
                                question: e.target.value,
                              })
                            }
                            placeholder="أدخل السؤال هنا"
                            rows={2}
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium">
                              الخيارات
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addOption}
                              className="text-blue-600 border-blue-200"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              إضافة خيار
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {currentQuestion.options.map((option, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <span className="text-sm font-medium w-6">
                                  {index + 1}.
                                </span>
                                <Input
                                  value={option.answer}
                                  onChange={(e) =>
                                    updateOption(index, e.target.value)
                                  }
                                  placeholder={`الخيار ${index + 1}`}
                                  className="flex-1"
                                />
                                <Button
                                  variant={"outline"}
                                  size="sm"
                                  onClick={() => setCorrectAnswer(index)}
                                  className={
                                    option.is_correct
                                      ? "bg-green-600 hover:bg-green-700"
                                      : ""
                                  }
                                >
                                  {option.is_correct ? "صحيح ✓" : "تحديد كصحيح"}
                                </Button>
                                {currentQuestion.options.length > 2 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeOption(index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button
                          onClick={addQuestion}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={
                            !currentQuestion.question.trim() ||
                            !currentQuestion.options.some(
                              (opt) => opt.is_correct
                            )
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          إضافة السؤال
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingQuestionIndex(null);
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleUpdate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  حفظ التغييرات
                </Button>
              </div>
            </div>
          )}
        </div>
      </CustomModal>

      {/* Video Quiz Edit Modal */}
      <CustomModal
        open={isEditingVideoQuiz}
        onClose={() => setIsEditingVideoQuiz(false)}
        className="max-w-7xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 dark:text-white"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              تعديل اختبار الفيديو
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingVideoQuiz(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Replace questions_count input with created_at date input */}
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  تاريخ بدايه الدرس
                </label>
                <Input
                  type="date"
                  value={editForm.created_at || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      created_at: e.target.value,
                    }))
                  }
                  className="bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  المدة (دقيقة)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={editForm.duration || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      duration: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  درجة النجاح (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.passing_score || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      passing_score: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Display number of questions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
                الأسئلة المتاحة
              </h4>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-blue-700 dark:text-blue-300">
                  عدد الأسئلة الحالية: {editForm.questions.length}
                </span>
                <Badge
                  variant="outline"
                  className="border-blue-200 text-blue-700"
                >
                  {editForm.questions.length} سؤال
                </Badge>
              </div>
            </div>

            {/* Questions List */}
            {editForm.questions.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium dark:text-white">قائمة الأسئلة</h4>
                <div className="max-h-60 overflow-y-auto space-y-3">
                  {editForm.questions.map((question, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium dark:text-white">
                          {index + 1}. {question.question}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="text-red-500"
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-2 p-2 rounded ${
                              option.is_correct
                                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                : "bg-white dark:bg-gray-700"
                            }`}
                          >
                            <span className="text-sm font-medium">
                              {optIndex + 1}.
                            </span>
                            <span className="flex-1">{option.answer}</span>
                            {option.is_correct && (
                              <Badge variant="outline" className="text-xs">
                                الإجابة الصحيحة
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Question Form */}
            <div className="border rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20">
              <h4 className="font-medium mb-4 text-blue-900 dark:text-blue-100">
                إضافة سؤال جديد
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    السؤال
                  </label>
                  <Textarea
                    value={currentQuestion.question}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        question: e.target.value,
                      })
                    }
                    placeholder="أدخل السؤال هنا"
                    rows={2}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium">
                      الخيارات
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="text-blue-600 border-blue-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة خيار
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm font-medium w-6">
                          {index + 1}.
                        </span>
                        <Input
                          value={option.answer}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`الخيار ${index + 1}`}
                          className="flex-1"
                        />
                        <Button
                          variant={"outline"}
                          size="sm"
                          onClick={() => setCorrectAnswer(index)}
                          className={
                            option.is_correct
                              ? "bg-green-600 hover:bg-green-700"
                              : ""
                          }
                        >
                          {option.is_correct ? "صحيح ✓" : "تحديد"}
                        </Button>
                        {currentQuestion.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={addQuestion}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={
                    !currentQuestion.question.trim() ||
                    !currentQuestion.options.some((opt) => opt.is_correct)
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة السؤال
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditingVideoQuiz(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleVideoQuizUpdate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                حفظ تغييرات الاختبار
              </Button>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* Module Details Dialog (view only) */}
      <CustomModal
        open={!!selectedModule && isViewing}
        onClose={() => {
          setSelectedModule(null);
          setIsViewing(false);
        }}
        className="!max-w-7xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 dark:text-white"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
              {selectedModule?.type === "video" && (
                <PlayCircle className="w-5 h-5" />
              )}
              {(selectedModule?.type === "quiz" ||
                selectedModule?.type === "exam") && (
                <HelpCircle className="w-5 h-5" />
              )}
              {selectedModule?.details?.title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedModule(null);
                setIsViewing(false);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {selectedModule && (
            <div className="space-y-6">
              {/* Show video if module is video */}
              {selectedModule?.type === "video" && (
                <div className="aspect-video relative rounded-lg overflow-hidden bg-black">
                  {selectedModule?.details?.url &&
                  /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(
                    selectedModule.details.url
                  ) ? (
                    // YouTube embed
                    <iframe
                      src={`https://www.youtube.com/embed/${(() => {
                        const match = selectedModule.details.url.match(
                          /(?:v=|youtu\.be\/)([\w-]+)/
                        );
                        return match ? match[1] : "";
                      })()}`}
                      title={selectedModule.details.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    <video
                      src={selectedModule?.details?.url}
                      controls
                      className="w-full h-full"
                      poster={selectedModule?.details?.thumbnail}
                    />
                  )}
                </div>
              )}

              {/* Show exam/quiz if present */}
              {(selectedModule?.type === "quiz" ||
                selectedModule?.type === "exam" ||
                (Array.isArray(selectedModule?.details?.quiz) &&
                  selectedModule?.details?.quiz?.length > 0)) && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      الأسئلة
                    </h3>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-sm">
                        {(() => {
                          let questions = [];
                          if (
                            selectedModule?.type === "exam" &&
                            selectedModule.details &&
                            "questions" in selectedModule.details &&
                            Array.isArray(
                              (selectedModule.details as any).questions
                            )
                          ) {
                            questions = (selectedModule.details as any)
                              .questions;
                          } else if (
                            selectedModule?.type === "quiz" &&
                            Array.isArray(selectedModule?.details?.quiz) &&
                            selectedModule.details.quiz[0]?.questions
                          ) {
                            questions =
                              selectedModule.details.quiz[0].questions;
                          } else if (
                            Array.isArray(selectedModule?.details?.quiz) &&
                            selectedModule.details.quiz[0]?.questions
                          ) {
                            questions =
                              selectedModule.details.quiz[0].questions;
                          }
                          return `${questions.length} سؤال`;
                        })()}
                      </Badge>
                      {/* Export Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportQuestions}
                        className="border-green-300 text-green-700 hover:bg-green-100"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        تصدير الأسئلة إلى Excel
                      </Button>
                    </div>
                  </div>

                  {(() => {
                    let questions = [];
                    if (
                      selectedModule?.type === "exam" &&
                      selectedModule.details &&
                      "questions" in selectedModule.details &&
                      Array.isArray((selectedModule.details as any).questions)
                    ) {
                      questions = (selectedModule.details as any).questions;
                    } else if (
                      selectedModule?.type === "quiz" &&
                      Array.isArray(selectedModule?.details?.quiz) &&
                      selectedModule.details.quiz[0]?.questions
                    ) {
                      questions = selectedModule.details.quiz[0].questions;
                    } else if (
                      Array.isArray(selectedModule?.details?.quiz) &&
                      selectedModule.details.quiz[0]?.questions
                    ) {
                      questions = selectedModule.details.quiz[0].questions;
                    }

                    return questions.map((question: any, index: number) => (
                      <div
                        key={question.id || index}
                        className="mb-6 bg-white dark:bg-gray-700 rounded-lg p-4"
                      >
                        <p className="font-medium mb-3 dark:text-white">
                          {index + 1}. {question.question}
                        </p>
                        <div className="space-y-2">
                          {question.options.map(
                            (option: any, optIdx: number) => (
                              <div
                                key={option.id || optIdx}
                                className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                                  question.correct_answer === optIdx + 1
                                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                                    : "bg-gray-50 dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id || index}`}
                                  id={`option-${option.id || optIdx}`}
                                  className="h-4 w-4 text-blue-600"
                                  checked={
                                    question.correct_answer === optIdx + 1
                                  }
                                  readOnly
                                />
                                <label
                                  htmlFor={`option-${option.id || optIdx}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  {option.answer}
                                  {question.correct_answer === optIdx + 1 && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-xs"
                                    >
                                      الإجابة الصحيحة
                                    </Badge>
                                  )}
                                </label>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* Show description */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 dark:text-white">
                  الوصف
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {selectedModule?.details?.description}
                </p>
              </div>

              {/* Show quiz stats if module is quiz */}
              {selectedModule?.type === "quiz" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                      عدد الأسئلة
                    </h3>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {selectedModule?.details?.quiz?.[0]?.questions_count || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                      درجة النجاح
                    </h3>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {selectedModule?.details?.quiz?.[0]?.passing_score || 0}%
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                      المدة
                    </h3>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {selectedModule?.details?.quiz?.[0]?.duration || 0} دقيقة
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CustomModal>

      {/* Enhanced Add Module Dialog */}
      <CustomModal
        open={isAdding}
        onClose={() => setIsAdding(false)}
        className="max-w-7xl max-h-[90vh] w-[95%] overflow-y-auto bg-white dark:bg-gray-900 dark:text-white"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold">إضافة درس جديدة</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  نوع الدرس
                </label>
                <Select
                  value={newModuleForm.type}
                  onValueChange={(value) =>
                    setNewModuleForm({ ...newModuleForm, type: value })
                  }
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue placeholder="اختر نوع الدرس" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectItem
                      value="video"
                      className="flex items-center gap-2 text-right"
                    >
                      فيديو
                    </SelectItem>
                    <SelectItem
                      value="quiz"
                      className="flex items-center gap-2 text-right"
                    >
                      اختبار
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  العنوان
                </label>
                <Input
                  value={newModuleForm.title}
                  onChange={(e) =>
                    setNewModuleForm({
                      ...newModuleForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="أدخل عنوان الدرس"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الوصف</label>
              <Textarea
                value={newModuleForm.description}
                onChange={(e) =>
                  setNewModuleForm({
                    ...newModuleForm,
                    description: e.target.value,
                  })
                }
                placeholder="أدخل وصف الدرس"
                rows={3}
              />
            </div>

            {newModuleForm.type === "video" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    رابط الفيديو
                  </label>
                  <Input
                    value={newModuleForm.url}
                    onChange={(e) =>
                      setNewModuleForm({
                        ...newModuleForm,
                        url: e.target.value,
                      })
                    }
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    صورة مصغرة
                  </label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {newModuleForm.thumbnail && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      تم اختيار: {newModuleForm.thumbnail.name}
                    </p>
                  )}
                </div>

                {/* Date input for created_at */}
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">
                    تاريخ بدايه الدرس
                  </label>
                  <Input
                    type="date"
                    value={newModuleForm.created_at || ""}
                    onChange={(e) =>
                      setNewModuleForm({
                        ...newModuleForm,
                        created_at: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    هذا الاختبار يتبع
                  </label>
                  <Select
                    value={newModuleForm.exam_belongs_to}
                    onValueChange={(value: "course" | "video") =>
                      setNewModuleForm({
                        ...newModuleForm,
                        exam_belongs_to: value,
                        exam_video_id: "",
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر تبعية الاختبار" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      <SelectItem value="course">الدورة</SelectItem>
                      <SelectItem value="video">فيديو</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newModuleForm.exam_belongs_to === "video" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      اختر الفيديو
                    </label>
                    <Select
                      value={newModuleForm.exam_video_id}
                      onValueChange={(value) =>
                        setNewModuleForm({
                          ...newModuleForm,
                          exam_video_id: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر الفيديو" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        {videos && videos.length > 0 ? (
                          videos.map((video) => (
                            <SelectItem
                              key={video.id}
                              value={video.id.toString()}
                            >
                              {video.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            لا يوجد فيديوهات متاحة
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    صورة الاختبار
                  </label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleExamImageChange}
                      className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {newModuleForm.exam_image && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      تم اختيار: {newModuleForm.exam_image.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      تاريخ بدايه الاختبار
                    </label>
                    <Input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={newModuleForm.created_at || ""}
                      onChange={(e) =>
                        setNewModuleForm({
                          ...newModuleForm,
                          created_at: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      مدة الاختبار (بالدقائق)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={newModuleForm.duration || ""}
                      onChange={(e) =>
                        setNewModuleForm({
                          ...newModuleForm,
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="المدة بالدقائق"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      درجة النجاح
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={newModuleForm.passing_score || ""}
                      onChange={(e) =>
                        setNewModuleForm({
                          ...newModuleForm,
                          passing_score: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="النسبة المئوية للنجاح"
                    />
                  </div>
                </div>

                {/* Enhanced Questions Section */}
                <div className="space-y-6 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      إضافة أسئلة الاختبار
                    </h3>
                    <Badge variant="outline" className="px-3 py-1">
                      {newModuleForm.questions.length} من{" "}
                      {newModuleForm.questions_count} سؤال
                    </Badge>
                  </div>

                  {/* Current Questions List */}
                  {newModuleForm.questions.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-green-700 dark:text-green-300">
                        الأسئلة المضافة
                      </h4>
                      <div className="max-h-60 overflow-y-auto space-y-3">
                        {newModuleForm.questions.map((q, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium text-sm">
                                {index + 1}. {q.question}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {q.options.map((opt, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`p-2 rounded ${
                                    opt.is_correct
                                      ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                                      : "bg-gray-100 dark:bg-gray-700"
                                  }`}
                                >
                                  {optIndex + 1}. {opt.answer}
                                  {opt.is_correct && (
                                    <span className="ml-1">✓</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New Question Form */}
                  <div className="border rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20">
                    <h4 className="font-medium mb-4 text-blue-900 dark:text-blue-100">
                      إضافة سؤال جديد
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          السؤال
                        </label>
                        <Textarea
                          value={currentQuestion.question}
                          onChange={(e) =>
                            setCurrentQuestion({
                              ...currentQuestion,
                              question: e.target.value,
                            })
                          }
                          placeholder="أدخل السؤال هنا"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-medium">
                            الخيارات
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addOption}
                            className="text-blue-600 border-blue-200"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            إضافة خيار
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {currentQuestion.options.map((option, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <span className="text-sm font-medium w-6">
                                {index + 1}.
                              </span>
                              <Input
                                value={option.answer}
                                onChange={(e) =>
                                  updateOption(index, e.target.value)
                                }
                                placeholder={`الخيار ${index + 1}`}
                                className="flex-1"
                              />
                              <Button
                                variant={"outline"}
                                size="sm"
                                onClick={() => setCorrectAnswer(index)}
                                className={
                                  option.is_correct
                                    ? "bg-green-600 hover:bg-green-700"
                                    : ""
                                }
                              >
                                {option.is_correct ? "صحيح ✓" : "تحديد كصحيح"}
                              </Button>
                              {currentQuestion.options.length > 2 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={addQuestion}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={
                          !currentQuestion.question.trim() ||
                          !currentQuestion.options.some((opt) => opt.is_correct)
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        إضافة السؤال
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {newModuleForm.type !== "video" ? (
              <div className="space-y-6">
                {/* Excel Upload Section */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    رفع ملف الأسئلة (Excel)
                  </label>
                  <Input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleExcelUpload}
                    className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    يجب أن يكون الملف بصيغة Excel ويحتوي على الأعمدة: السؤال،
                    الخيار 1، الخيار 2، الخيار 3، الخيار 4، رقم الإجابة الصحيحة
                    (1-4)
                  </p>
                </div>
                // ...rest of the quiz/exam form...
              </div>
            ) : (
              <div className="space-y-4">
                {/* ...rest of the video form... */}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                إلغاء
              </Button>
              <Button
                onClick={handleAddModule}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={
                  !newModuleForm.title.trim() ||
                  !newModuleForm.description.trim()
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                إضافة الدرس
              </Button>
            </div>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default CourseModules;
