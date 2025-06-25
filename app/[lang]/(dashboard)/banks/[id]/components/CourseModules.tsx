"use client";
import { CoursModules } from "@/lib/type";
import { useState } from "react";
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
import { postData, deleteData } from "@/lib/axios/server";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CourseModules = ({
  modules: initialModules,
  courseId,
  token,
}: {
  modules: CoursModules[];
  courseId: string;
  token: string;
}) => {
  const [modules, setModules] = useState<CoursModules[]>(initialModules);
  const [selectedModule, setSelectedModule] = useState<CoursModules | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    url: "",
    thumbnail: null as File | null,
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

  const handleEdit = (module: CoursModules) => {
    setSelectedModule(module);
    setEditForm({
      title: module?.details?.title || "",
      description: module?.details?.description || "",
      url: module?.details?.url || "",
      thumbnail: null,
    });
    setIsEditing(true);
  };

  const handleDelete = async (moduleId: number, type: string) => {
    try {
      const endpoint = type === "video" ? "videos" : "exams";
      await deleteData(`${endpoint}/${moduleId}`, {
        Authorization: `Bearer ${token}`,
      });
      setModules(modules.filter((m) => m?.details?.id !== moduleId));
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
      } else if (selectedModule.type === "quiz") {
        endpoint = "exams";
      }

      await postData(`${endpoint}/${selectedModule?.details?.id}`, formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      setModules(
        modules.map((m) =>
          m?.id === selectedModule?.id
            ? {
                ...m,
                details: {
                  ...m.details,
                  title: editForm.title,
                  description: editForm.description,
                  url: editForm.url,
                  thumbnail: editForm.thumbnail
                    ? URL.createObjectURL(editForm.thumbnail)
                    : m.details.thumbnail,
                },
              }
            : m
        )
      );

      setIsEditing(false);
      setSelectedModule(null);
      toast.success("تم تحديث الدرس بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث الدرس");
    }
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

  console.log(modules);

  const handleAddModule = async () => {
    try {
      const formData = new FormData();
      formData.append("type", newModuleForm.type);
      formData.append("title", newModuleForm.title);
      formData.append("description", newModuleForm.description);
      formData.append("course_id", courseId);

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
        formData.append("examtable_id", courseId);
        formData.append("examtable_type", "course");
        formData.append(
          "questions_count",
          newModuleForm.questions_count.toString()
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

        endpoint = "exams";
      }

      const response = await postData(endpoint, formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      setModules([...modules, response.video]);
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
      });
      toast.success("تم إضافة الدرس بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة الدرس");
    }
  };

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

  const setQuestionType = (type: "msq" | "tf" | "written") => {
    setCurrentQuestion({
      ...currentQuestion,
      type,
      options:
        type === "tf"
          ? [
              { answer: "صح", is_correct: false },
              { answer: "خطأ", is_correct: false },
            ]
          : type === "msq"
          ? [
              { answer: "", is_correct: false },
              { answer: "", is_correct: false },
              { answer: "", is_correct: false },
              { answer: "", is_correct: false },
            ]
          : [],
      written_answer: type === "written" ? currentQuestion.written_answer : "",
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
    } else if (currentQuestion.type === "tf") {
      if (!currentQuestion.options.some((opt) => opt.is_correct)) {
        toast.error("يرجى تحديد الإجابة الصحيحة");
        return;
      }
    } else if (currentQuestion.type === "written") {
      if (currentQuestion.written_answer.trim() === "") {
        toast.error("يرجى إدخال الإجابة النموذجية");
        return;
      }
    }

    setNewModuleForm({
      ...newModuleForm,
      questions: [...newModuleForm.questions, currentQuestion],
    });

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
    setNewModuleForm({
      ...newModuleForm,
      questions: newModuleForm.questions.filter((_, i) => i !== index),
    });
  };

  const handleViewModule = (module: CoursModules) => {
    setSelectedModule(module);
    setIsViewing(true);
  };

  return (
    <div className="mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">محتوى الدورة</h2>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة درس جديدة
          </Button>
        </div>
        {!modules || modules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">لا يوجد محتوى متاح حالياً</p>
          </div>
        ) : (
          <div className="space-y-6">
            {modules.map((module: CoursModules, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleViewModule(module)}
              >
                <div className="flex justify-between items-start">
                  {module?.type === "video" ? (
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 relative">
                          <img
                            src={module?.details?.thumbnail}
                            alt={module?.details?.title}
                            className="w-full h-full object-cover rounded"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">
                            {module?.details?.title}
                          </h3>
                          <p className="text-gray-600">
                            {module?.details?.description}
                          </p>
                        </div>
                      </div>
                      {module?.details?.has_quiz && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            يحتوي على اختبار
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 relative">
                          <img
                            src={module?.details?.thumbnail}
                            alt={module?.details?.title}
                            className="w-full h-full object-cover rounded"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">
                            {module?.details?.title}
                          </h3>
                          <p className="text-gray-600">
                            {module?.details?.quiz?.[0]?.questions_count || 0}{" "}
                            سؤال
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                          handleEdit(module);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
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

      {/* Module Details Dialog */}
      <Dialog
        open={!!selectedModule && (isViewing || isEditing)}
        onOpenChange={() => {
          setSelectedModule(null);
          setIsEditing(false);
          setIsViewing(false);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "تعديل الدرس" : selectedModule?.details?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedModule && (
            <div className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      صورة مصغرة
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailEditChange}
                      className="cursor-pointer"
                    />
                    {editForm.thumbnail && (
                      <p className="text-sm text-gray-500 mt-1">
                        تم اختيار: {editForm.thumbnail.name}
                      </p>
                    )}
                    {!editForm.thumbnail &&
                      selectedModule?.details?.thumbnail && (
                        <p className="text-sm text-gray-500 mt-1">
                          الصورة الحالية: {selectedModule.details.thumbnail}
                        </p>
                      )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      إلغاء
                    </Button>
                    <Button onClick={handleUpdate}>حفظ التغييرات</Button>
                  </DialogFooter>
                </div>
              ) : (
                <>
                  <div className="aspect-video relative">
                    {selectedModule?.type === "video" ? (
                      <video
                        src={selectedModule?.details?.url}
                        controls
                        className="w-full h-full rounded-lg"
                        poster={selectedModule?.details?.thumbnail}
                      />
                    ) : (
                      <div className="bg-gray-100 rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">الأسئلة</h3>
                        {selectedModule?.details?.quiz?.[0]?.questions.map(
                          (question, index) => (
                            <div key={question.id} className="mb-6">
                              <p className="font-medium mb-2">
                                {index + 1}. {question.question}
                              </p>
                              <div className="space-y-2">
                                {question.options.map((option) => (
                                  <div
                                    key={option.id}
                                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-200"
                                  >
                                    <input
                                      type="radio"
                                      name={`question-${question.id}`}
                                      id={`option-${option.id}`}
                                      className="h-4 w-4"
                                    />
                                    <label htmlFor={`option-${option.id}`}>
                                      {option.answer}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">الوصف</h3>
                    <p className="text-gray-600">
                      {selectedModule?.details?.description}
                    </p>
                  </div>
                  {selectedModule?.type === "quiz" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          عدد الأسئلة
                        </h3>
                        <p className="text-gray-600">
                          {selectedModule?.details?.quiz?.[0]
                            ?.questions_count || 0}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          درجة النجاح
                        </h3>
                        <p className="text-gray-600">
                          {selectedModule?.details?.quiz?.[0]?.passing_score ||
                            0}
                          %
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Module Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="!max-w-7xl max-h-[90vh] w-[90%] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة درس جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 ">
            <div>
              <label className="block text-sm text-start font-medium mb-1">
                نوع الدرس
              </label>
              <Select
                value={newModuleForm.type}
                onValueChange={(value) =>
                  setNewModuleForm({ ...newModuleForm, type: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="text-start"
                    placeholder="اختر نوع الدرس"
                  />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem className="text-start w-full" value="video">
                    فيديو
                  </SelectItem>
                  <SelectItem className="text-start w-full" value="quiz">
                    اختبار
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">العنوان</label>
              <Input
                value={newModuleForm.title}
                onChange={(e) =>
                  setNewModuleForm({ ...newModuleForm, title: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الوصف</label>
              <Textarea
                value={newModuleForm.description}
                onChange={(e) =>
                  setNewModuleForm({
                    ...newModuleForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            {newModuleForm.type === "video" ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    صورة مصغرة
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="cursor-pointer"
                  />
                  {newModuleForm.thumbnail && (
                    <p className="text-sm text-gray-500 mt-1">
                      تم اختيار: {newModuleForm.thumbnail.name}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    صورة الاختبار
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleExamImageChange}
                    className="cursor-pointer"
                  />
                  {newModuleForm.exam_image && (
                    <p className="text-sm text-gray-500 mt-1">
                      تم اختيار: {newModuleForm.exam_image.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
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
                  />
                </div>

                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold">إضافة أسئلة</h3>

                  {/* Current Questions List */}
                  {newModuleForm.questions.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium">الأسئلة المضافة</h4>
                      {newModuleForm.questions.map((q, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium">{q.question}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(index)}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {q.options.map((opt, optIndex) => (
                              <div
                                key={optIndex}
                                className={`flex items-center gap-2 ${
                                  opt.is_correct ? "text-green-600" : ""
                                }`}
                              >
                                <span>{optIndex + 1}.</span>
                                <span>{opt.answer}</span>
                                {opt.is_correct && (
                                  <span className="text-xs">(إجابة صحيحة)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Question Form */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        نوع السؤال
                      </label>
                      <Select
                        value={currentQuestion.type}
                        onValueChange={(value: "msq" | "tf" | "written") =>
                          setQuestionType(value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="اختر نوع السؤال" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="msq">اختيار من متعدد</SelectItem>
                          <SelectItem value="tf">صح أو خطأ</SelectItem>
                          <SelectItem value="written">إجابة كتابية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
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
                      />
                    </div>

                    {currentQuestion.type === "msq" && (
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
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            إضافة خيار
                          </Button>
                        </div>
                        {currentQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={option.answer}
                              onChange={(e) =>
                                updateOption(index, e.target.value)
                              }
                              placeholder={`الخيار ${index + 1}`}
                            />
                            <Button
                              variant={option.is_correct ? "soft" : "outline"}
                              size="sm"
                              onClick={() => setCorrectAnswer(index)}
                            >
                              {option.is_correct
                                ? "إجابة صحيحة"
                                : "تحديد كإجابة صحيحة"}
                            </Button>
                            {currentQuestion.options.length > 2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(index)}
                                className="text-red-500"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {currentQuestion.type === "tf" && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium">
                          الإجابة الصحيحة
                        </label>
                        <div className="flex gap-2">
                          <Button
                            variant={
                              currentQuestion.options[0].is_correct
                                ? "soft"
                                : "outline"
                            }
                            className="flex-1"
                            onClick={() => setCorrectAnswer(0)}
                          >
                            صح
                          </Button>
                          <Button
                            variant={
                              currentQuestion.options[1].is_correct
                                ? "soft"
                                : "outline"
                            }
                            className="flex-1"
                            onClick={() => setCorrectAnswer(1)}
                          >
                            خطأ
                          </Button>
                        </div>
                      </div>
                    )}

                    {currentQuestion.type === "written" && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium">
                          الإجابة النموذجية
                        </label>
                        <Textarea
                          value={currentQuestion.written_answer}
                          onChange={(e) =>
                            setCurrentQuestion({
                              ...currentQuestion,
                              written_answer: e.target.value,
                            })
                          }
                          placeholder="أدخل الإجابة النموذجية هنا"
                        />
                      </div>
                    )}

                    <Button onClick={addQuestion} className="w-full">
                      إضافة السؤال
                    </Button>
                  </div>
                </div>
              </>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddModule}>إضافة</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseModules;
