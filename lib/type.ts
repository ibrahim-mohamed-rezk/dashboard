// color type
export type color =
  | "primary"
  | "info"
  | "warning"
  | "success"
  | "destructive"
  | "secondary";
export type TextAreaColor =
  | "primary"
  | "info"
  | "warning"
  | "success"
  | "destructive";
export type InputColor =
  | "primary"
  | "info"
  | "warning"
  | "success"
  | "destructive";

//  variant
export type InputVariant =
  | "flat"
  | "underline"
  | "bordered"
  | "faded"
  | "ghost"
  | "flat-underline";
export type TextAreaVariant =
  | "flat"
  | "underline"
  | "bordered"
  | "faded"
  | "ghost"
  | "flat-underline";

// shadow
export type Shadow = "none" | "sm" | "md" | "lg" | "xl" | "2xl";

// radius

export type Radius = "none" | "sm" | "md" | "lg" | "xl";

export interface User {
  id: number;
  full_name: string;
  avatar: string;
  phone: string;
  gender: string | null;
  email: string;
  role: string;
  teachers: Teacher[];
  modules: Module[];
}

export interface Module {
  id: number;
  name: string;
  access: boolean;
}

export interface Teacher {
  id: number;
  user: {
    id: number;
    full_name: string;
    avatar: string;
    phone: string;
    gender: string | null;
    email: string;
    role: string;
  };
  tech_no: string;
  subject: string;
  description: string | null;
  about: string | null;
  cover: string;
  modules: Module[];
}

export interface SubjectsData {
  id: number;
  name: string;
  description: string;
}

export interface CoursModules {
  id: number;
  sequence: number;
  type: "video" | "quiz" | "exam";
  thumbnail: string;
  details: {
    id: number;
    type: string;
    from: string;
    course_id: number;
    course_name: string;
    title: string;
    description: string;
    thumbnail: string;
    url: string;
    created_at: string;
    has_quiz: boolean;
    quiz?: {
      id: number;
      type: string;
      title: string;
      thumbnail: string;
      questions_count: number;
      passing_score: number;
      created_at: string;
      questions: {
        id: number;
        exam: string;
        question: string;
        options: {
          id: number;
          answer: string;
        }[];
        correct_answer: number;
      }[];
    }[];
  };
}

export interface CoursesData {
  id: number;
  title: string;
  cour_no: string;
  level: string;
  level_id: number;
  subject: string;
  cover: string;
  created_at: string;
  description?: string;
  type?: string;
  price?: string;
  position?: string;
  slug?: string;
  modules: CoursModules[];
}

export interface StudentTypes {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    avatar?: string;
  } | null;
  level_id: number;
  stu_no: string;
  governorate_id: number;
  area_id: number;
  school_name: string;
  father_phone: string;
  status: "active" | "inactive";
}

export interface AdminTypes {
  id: number;
  full_name: string;
  avatar: string;
  phone: string;
  gender: string | null;
  email: string;
  role: string;
  teachers: Teacher[];
  modules: Module[];
}

export interface SubscriptionCodeTypes {
  id: number;
  student_id: number | null;
  teacher_id: string;
  code: string;
  valid_from: string;
  valid_to: string;
  is_used: boolean;
  status: string;
  updated_at: string;
  created_at: string;
}
