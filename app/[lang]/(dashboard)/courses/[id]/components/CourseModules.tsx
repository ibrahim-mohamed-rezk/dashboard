"use client";
import { QuestionType, CoursModules, VideoTypes } from "@/lib/type";
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
  const [imageError, setImageError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isEditingVideoQuiz, setIsEditingVideoQuiz] = useState(false);
  const [videos, setVideos] = useState<VideoTypes[]>([]);

  // Server-side filters for modules
  const [moduleFilters, setModuleFilters] = useState({
    type: "", // "video" | "exam" | ""
    questions_from: "",
    questions_to: "",
  });

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    url: "",
    thumbnail: null as File | null,
    questions_count: 0,
    duration: 0,
    passing_score: 0,
    exam_image: null as File | null,
    questions: [] as QuestionType[],

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
    questions: [] as QuestionType[],

    exam_belongs_to: "course" as "course" | "video",
    exam_video_id: "",
    created_at: "",
  });

  const [currentQuestion, setCurrentQuestion] = useState<QuestionType>({
    question: "",
    questionType: "text" as "text" | "image", // <-- New field
    type: "msq" as "msq" | "tf" | "written",
    options: [
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
    ],
    written_answer: "",
    degree: 1,
  });

  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    const imageExtensions = /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i;
    return imageExtensions.test(url);
  };

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
        {
          type: moduleFilters.type,
          questions_from: moduleFilters.questions_from,
          questions_to: moduleFilters.questions_to,
        },
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
  }, [
    token,
    moduleFilters.type,
    moduleFilters.questions_from,
    moduleFilters.questions_to,
  ]);

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
          questionType: q.questionType || "text", // ✅ أضف هذا الحقل
          type: q.type || "msq", // إذا كان لديك نوع السؤال
          options: q.options.map((opt: any, index: number) => ({
            id: opt.id,
            answer: opt.answer,
            is_correct: q.correct_answer === index + 1,
          })),
          correct_answer: q.correct_answer,
          degree: q.degree || 1,
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
    try {
      const endpoint = type === "video" ? "videos" : "exams";
      await deleteData(`${endpoint}/${moduleId}`, {
        Authorization: `Bearer ${token}`,
      });
      fetchCourse();
      fetchVideos();
      toast.success("تم الحذف بنجاح");
    } catch (error) {
      toast.error("فشل الحذف");
    }
  };

  const handleUpdate = async () => {
    if (!selectedModule) return;
    if (
      (selectedModule.type === "quiz" || selectedModule.type === "exam") &&
      editForm.questions_count > editForm.questions.length
    ) {
      toast.error("عدد اسئله غير كافي");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description);
      formData.append("_method", "PUT");
      formData.append("created_at", editForm.created_at);

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
          formData.append(
            `questions[${questionNumber}][degree]`,
            question.degree.toString()
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
      fetchVideos();
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
      fetchVideos();
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
        questionType: q.questionType || ("text" as const), // ✅ تم الإصلاح
        options: q.options.map((opt: any, index: number) => ({
          id: opt.id,
          answer: opt.answer,
          is_correct: q.correct_answer === index + 1,
        })),
        correct_answer: q.correct_answer,
        degree: q.degree,
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
      if (
        newModuleForm.type === "quiz" &&
        newModuleForm.questions_count > newModuleForm.questions.length
      ) {
        toast.error("عدد اسئله غير كافي");
        return;
      }
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
          newModuleForm.questions_count.toString()
        );
        newModuleForm.questions.forEach((question, index) => {
          const questionNumber = index + 1;

          // Append the question text or image URL
          formData.append(
            `questions[${questionNumber}][question]`,
            question.question
          );

          // Append the question type: 'text' or 'image'
          formData.append(
            `questions[${questionNumber}][questionType]`,
            question.questionType
          );

          // Append options
          question.options.forEach((option, optIndex) => {
            formData.append(
              `questions[${questionNumber}][${optIndex + 1}]`,
              option.answer
            );
          });

          // Append correct answer index
          const correctAnswerIndex = question.options.findIndex(
            (opt) => opt.is_correct
          );
          formData.append(
            `questions[${questionNumber}][answer]`,
            (correctAnswerIndex + 1).toString()
          );

          // Append degree (score)
          formData.append(
            `questions[${questionNumber}][degree]`,
            question.degree.toString()
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
      fetchVideos();
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
    if (currentQuestion.questionType === "image") {
      if (!isValidImageUrl(currentQuestion.question)) {
        toast.error("يرجى إدخال رابط صورة صالح");
        return;
      }
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

    const newQuestion = { ...currentQuestion }; // Includes questionType

    if (isEditing) {
      setEditForm({
        ...editForm,
        questions: [...editForm.questions, newQuestion],
      });
    } else {
      setNewModuleForm({
        ...newModuleForm,
        questions: [...newModuleForm.questions, newQuestion],
      });
    }

    // Reset current question
    setCurrentQuestion({
      question: "",
      questionType: "text",
      type: "msq",
      options: [
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
        { answer: "", is_correct: false },
      ],
      written_answer: "",
      degree: 1,
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
    // Also set currentQuestion to preserve type
    setCurrentQuestion((prev) => ({
      ...prev,
      question: question.question,
      questionType: question.questionType || "text", // default to text
      options: question.options,
      degree: question.degree || 1,
    }));
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

      // Assume first row is header:
      // ["Question", "Option 1", "Option 2", "Option 3", "Option 4", "Correct Option", "Type"]
      const questions = json.slice(1).map((row) => {
        const [question, opt1, opt2, opt3, opt4, correct, type] = row;
        const options = [
          { answer: opt1, is_correct: correct == 1 },
          { answer: opt2, is_correct: correct == 2 },
          { answer: opt3, is_correct: correct == 3 },
          { answer: opt4, is_correct: correct == 4 },
        ];
        return {
          question,
          options,
          degree: 1,
          questionType: (type?.trim().toLowerCase() === "image"
            ? "image"
            : "text") as "text" | "image",
        };
      });

      setNewModuleForm((prev) => ({
        ...prev,
        questions: [...prev.questions, ...questions],
        questions_count: prev.questions_count || questions.length,
      }));

      toast.success(`تم استيراد ${questions.length} سؤال من Excel`);
    };
    reader.readAsBinaryString(file);
  };

  // Import questions from Excel into edit form (for updating existing exam/quiz)
  const handleExcelUploadForEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      // Expected columns: Question, Option1, Option2, Option3, Option4, Correct(1-4), Type(optional: text|image)
      const questions = json.slice(1).map((row) => {
        const [question, opt1, opt2, opt3, opt4, correct, type] = row;
        const options = [
          { answer: opt1, is_correct: correct == 1 },
          { answer: opt2, is_correct: correct == 2 },
          { answer: opt3, is_correct: correct == 3 },
          { answer: opt4, is_correct: correct == 4 },
        ];
        return {
          question,
          options,
          degree: 1,
          questionType: (typeof type === "string" &&
          type.trim().toLowerCase() === "image"
            ? "image"
            : "text") as "text" | "image",
        };
      });

      setEditForm((prev) => ({
        ...prev,
        questions,
        questions_count: prev.questions_count || questions.length,
      }));

      toast.success(`تم استيراد ${questions.length} سؤال من Excel`);
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

          {selectedModuleIds.length === 0 ? (
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة درس جديدة
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                تم اختيار {selectedModuleIds.length} عنصر
              </span>

              {/* Delete Selected Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={async (e) => {
                  e.preventDefault();

                  const toastId = toast(
                    <div className="text-right space-y-2">
                      <p className="font-bold text-red-600 dark:text-red-400">
                        تأكيد الحذف
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        هل أنت متأكد من حذف{" "}
                        <strong>{selectedModuleIds.length}</strong> عنصر؟
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        لا يمكن التراجع عن هذا الإجراء.
                      </p>
                      <div className="flex justify-end gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast.dismiss(toastId);
                            toast.success("تم إلغاء الحذف"); // ✅ Show cancel feedback
                          }}
                        >
                          إلغاء
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            toast.dismiss(toastId); // Close confirmation
                            try {
                              // Loop and delete each selected module
                              for (const id of selectedModuleIds) {
                                const module = modules.find(
                                  (m) => m.details?.id === id
                                );
                                if (module) {
                                  await handleDelete(id, module.type);
                                }
                              }
                              toast.success(
                                `تم حذف ${selectedModuleIds.length} عنصر بنجاح`
                              );
                            } catch (err) {
                              toast.error("حدث خطأ أثناء الحذف");
                            } finally {
                              setSelectedModuleIds([]); // Clear selection
                            }
                          }}
                        >
                          <Trash className="h-4 w-4 ml-1" />
                          نعم، احذف
                        </Button>
                      </div>
                    </div>,
                    {
                      duration: 12000,
                      style: {
                        minWidth: "320px",
                        direction: "rtl",
                      },
                    }
                  );
                }}
              >
                <Trash className="h-4 w-4 ml-2" />
                حذف المحدد
              </Button>

              {/* Cancel Selection */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModuleIds([])}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400"
              >
                إلغاء التحديد
              </Button>
            </div>
          )}
        </div>

        {/* Filters: type and questions count range - sent as request params */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              نوع المحتوى
            </label>
            <Select
              value={moduleFilters.type}
              onValueChange={(val) =>
                setModuleFilters((prev) => ({ ...prev, type: val }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                <SelectItem value="video">فيديو</SelectItem>
                <SelectItem value="exam">اختبار</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              عدد الأسئلة من
            </label>
            <Input
              type="number"
              min={0}
              value={moduleFilters.questions_from}
              onChange={(e) =>
                setModuleFilters((prev) => ({
                  ...prev,
                  questions_from: e.target.value,
                }))
              }
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              عدد الأسئلة إلى
            </label>
            <Input
              type="number"
              min={0}
              value={moduleFilters.questions_to}
              onChange={(e) =>
                setModuleFilters((prev) => ({
                  ...prev,
                  questions_to: e.target.value,
                }))
              }
              placeholder="مثلاً 20"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setModuleFilters({
                  type: "",
                  questions_from: "",
                  questions_to: "",
                })
              }
              className="w-full"
            >
              إعادة تعيين
            </Button>
          </div>
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-right rtl">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    #
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedModuleIds.length > 0 &&
                        modules.every((m) =>
                          selectedModuleIds.includes(m.details?.id)
                        )
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedModuleIds(
                            modules
                              .map((m) => m.details?.id)
                              .filter(Boolean) as number[]
                          );
                        } else {
                          setSelectedModuleIds([]);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    العنوان
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    النوع
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    الوصف
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    تاريخ الإنشاء
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    عدد الأسئلة
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {modules.map((module: CoursModules, index) => (
                  <tr
                    key={module.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                    onClick={() => handleModuleClick(module)}
                  >
                    <td className="px-4 py-3 font-medium">{index + 1}</td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedModuleIds.includes(module.details?.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModuleIds((prev) => [
                              ...prev,
                              module.details?.id,
                            ]);
                          } else {
                            setSelectedModuleIds((prev) =>
                              prev.filter((id) => id !== module.details?.id)
                            );
                          }
                        }}
                        onClick={(e) => e.stopPropagation()} // Prevent opening edit modal
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2 min-w-[180px]">
                      {module?.type === "video" &&
                      module?.details?.thumbnail ? (
                        <span className="inline-block w-10 h-10 relative rounded overflow-hidden mr-2">
                          <img
                            src={module.details.thumbnail}
                            alt={module.details.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                            <PlayCircle className="w-5 h-5 text-white" />
                          </span>
                        </span>
                      ) : (
                        <span className="inline-block w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center mr-2">
                          {renderModuleIcon(module)}
                        </span>
                      )}
                      <span className="truncate">{module?.details?.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {module.type === "video" ? "فيديو" : "اختبار"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      {module?.details?.description}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {module?.details?.created_at
                        ? new Date(
                            module.details.created_at
                          ).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {module.type === "video" && module?.details?.has_quiz
                        ? module?.details?.quiz?.[0]?.questions_count || 0
                        : module?.details?.questions_count ||
                          module?.details?.questions?.length ||
                          0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                        عدد الأسئلة
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={editForm.questions_count || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            questions_count: parseInt(e.target.value) || 0,
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

                  {/* Excel upload for updating questions */}
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      استيراد الأسئلة من Excel
                    </label>
                    <Input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleExcelUploadForEdit}
                      className="cursor-pointer bg-white dark:bg-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      يجب أن يحتوي الملف على الأعمدة: السؤال، الخيار 1، الخيار
                      2، الخيار 3، الخيار 4، رقم الإجابة الصحيحة (1-4)، النوع
                      (اختياري: text أو image)
                    </p>
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
                                  <div className="font-medium dark:text-white">
                                    <span>{index + 1}.</span>
                                    {question.questionType === "image" ? (
                                      <div className="mt-2">
                                        <img
                                          src={question.question}
                                          alt={`سؤال ${index + 1}`}
                                          className="max-h-48 rounded border bg-white p-1"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                              "https://via.placeholder.com/300x150?text=فشل+التحميل";
                                            (e.target as HTMLImageElement).alt =
                                              "فشل تحميل الصورة";
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <p className="mt-1">
                                        {question.question}
                                      </p>
                                    )}
                                  </div>
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
                        <div className="font-medium mb-3 dark:text-white">
                          <span>{index + 1}. </span>
                          {(() => {
                            // Try to detect if question is an image URL
                            const isImageUrl = isValidImageUrl(
                              question.question
                            );
                            if (isImageUrl) {
                              return (
                                <div className="mt-2">
                                  <img
                                    src={question.question}
                                    alt={`سؤال ${index + 1}`}
                                    className="max-h-48 rounded border bg-white p-1 mx-auto"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "https://via.placeholder.com/300x150?text=فشل+التحميل";
                                      (e.target as HTMLImageElement).alt =
                                        "فشل تحميل الصورة";
                                    }}
                                  />
                                </div>
                              );
                            }
                            return <span>{question.question}</span>;
                          })()}
                        </div>
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
                      عدد الأسئلة
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={newModuleForm.questions_count || ""}
                      onChange={(e) =>
                        setNewModuleForm({
                          ...newModuleForm,
                          questions_count: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="عدد الأسئلة"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      تاريخ بدايه الاختبار
                    </label>
                    <Input
                      type="date"
                      // min={new Date().toISOString().split("T")[0]}
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
                                {index + 1}.{" "}
                                {q.questionType === "image" ? (
                                  <div className="mt-2">
                                    <img
                                      src={q.question}
                                      alt={`سؤال ${index + 1}`}
                                      className="max-h-32 rounded border bg-white p-1"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "https://via.placeholder.com/150x100?text=فشل+التحميل";
                                        (e.target as HTMLImageElement).alt =
                                          "فشل تحميل الصورة";
                                      }}
                                    />
                                  </div>
                                ) : (
                                  q.question
                                )}
                              </p>
                              <span className="text-xs text-blue-600 dark:text-blue-300 mr-2">
                                الدرجة: {q.degree}
                              </span>
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
                      {/* Question Type Selection */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            نوع السؤال
                          </label>
                          <Select
                            value={currentQuestion.questionType}
                            onValueChange={(value) =>
                              setCurrentQuestion((prev) => ({
                                ...prev,
                                questionType: value as "text" | "image", // <-- The type is set here
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع السؤال" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              <SelectItem value="text">نص</SelectItem>
                              <SelectItem value="image">صورة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {currentQuestion.questionType === "text" ? (
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              نص السؤال
                            </label>
                            <Textarea
                              value={currentQuestion.question}
                              onChange={(e) =>
                                setCurrentQuestion({
                                  ...currentQuestion,
                                  question: e.target.value,
                                })
                              }
                              placeholder="أدخل نص السؤال"
                              rows={2}
                            />
                          </div>
                        ) : (
                          <div>
                            {/* <p className="text-xs text-red-500 mb-1">
                              ملاحظة: يجب أن يكون الرابط مباشر للصورة (ينتهي بـ
                              .jpg أو .png أو .webp)
                            </p> */}
                            <label className="block text-sm font-medium mb-2">
                              رابط صورة السؤال
                            </label>
                            <Input
                              value={currentQuestion.question}
                              onChange={(e) => {
                                const value = e.target.value;
                                setCurrentQuestion({
                                  ...currentQuestion,
                                  question: value,
                                });

                                // تحقق من الرابط فقط إذا كان نوع السؤال "صورة"
                                if (currentQuestion.questionType === "image") {
                                  if (value && !isValidImageUrl(value)) {
                                    setImageError(
                                      "يجب أن يكون الرابط ينتهي بامتداد صورة (مثل: .jpg, .png, .webp)"
                                    );
                                  } else {
                                    setImageError(null); // لا يوجد خطأ
                                  }
                                }
                              }}
                              placeholder="https://example.com/image.jpg"
                            />
                            {imageError && (
                              <p className="text-sm text-red-500 mt-1">
                                {imageError}
                              </p>
                            )}
                            {/* Optional: Preview Image */}
                            {currentQuestion.question && (
                              <div className="mt-2">
                                <img
                                  src={currentQuestion.question}
                                  alt="Preview"
                                  className="max-h-40 rounded border"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).alt =
                                      "فشل تحميل الصورة";
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          الدرجة
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={currentQuestion.degree}
                          onChange={(e) =>
                            setCurrentQuestion({
                              ...currentQuestion,
                              degree: parseInt(e.target.value) || 1,
                            })
                          }
                          placeholder="الدرجة (مثلاً: 1)"
                          className="w-20"
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
