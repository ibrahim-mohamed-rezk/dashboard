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
  name: string;
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
    questions: {
      id: number;
      exam: string;
      question: string;
      questions_count: number;
      options: {
        id: number;
        answer: string;
      }[];
      correct_answer: number;
    }[];
    title: string;
    description: string;
    questions_count: number;
    thumbnail: string;
    url: string;
    created_at: string;
    has_quiz: boolean;
    quiz?: {
      id: number;
      type: string;
      title: string;
      duration: number;
      thumbnail: string;
      questions_count: number;
      passing_score: number;
      created_at: string;
      questions: {
        id: number;
        exam: string;
        question: string;
        questions_count: number;
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
  online_count: number;
  modules: CoursModules[];
}

export interface StudentTypes {
  id: number;
  user: {
    id: number;
    name: string;
    image: string;
    full_name: string;
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
  is_used: number;
  status: string;
  updated_at: string;
  created_at: string;
  price?: number | string;
  level_id?: number;
  teacher_name?: string;
}


export interface Statistics {
  students: {
    total: number;
    details?: Array<{
      student_id: number;
      full_name: string | null;
      online_purchases_count: number;
      online_revenue: number;
      subscription_code_count: number;
      offline_revenue: number;
    }>;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
  teachers: {
    total: number;
    details?: Array<{
      teacher_id: number;
      full_name: string;
      course_count: number;
      online_purchases_count: number;
      online_revenue: number;
      subscription_code_count: number;
      offline_revenue: number;
      book_count: number;
      book_purchase_count: number;
      book_revenue: number;
    }>;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
  modules: {
    total: number;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
  subjects: {
    total: number;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
  courses: {
    total: number;
    online_count: number;
    offline_count?: number;
    purchases_count: number;
    online_course_details: any[];
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
  blogs: {
    total: number;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
  course_views: {
    total: number;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
  blog_views: {
    total: number;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
  exams: {
    total: number;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
  videos: {
    total: number;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
  books: {
    by_level?: Array<{ level_id: number; count: number }>;
    by_subject?: Array<{ subject_id: number; count: number }>;
    total?: number;
    by_month?: { [key: string]: number };
    by_week?: { [key: string]: number };
  };
  purchases: {
    total: number;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
  cobons: {
    total: number;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
  users: {
    total: number;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
}


export interface VideoTypes {
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
  quiz: any | null;
  questions: any | null;
  questions_count: number;
  duration: number;
  passing_score: number;
}