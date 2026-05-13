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
  teacher_id?: number;
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
  path?: string;
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
export type QuestionType = {
  id?: number;
  question: string;
  questionType: "text" | "image"; 
  type?: "msq" | "tf" | "written";
  options: { id?: number; answer: string; is_correct: boolean }[];
  degree: number;
    correct_answer?: number;
  written_answer?: string;
  // إزالة السطر القديم: question_type
};

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
    blocked?: boolean;
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
  month: string;
  id: number;
  student_id: number | null;
  student_name: string | null;
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
      email: string | null;
      phone: string | null;
      online_courses_count?: number;
      online_revenue: number;
      books_count?: number;
      books_revenue?: number;
      subscription_codes_count: number; // Changed from subscription_code_count
      offline_revenue: number;
      total_purchases?: number;
      total_revenue?: number;
      registration_date?: string;
      online_purchases_count?: number; // Optional as it might not be in JSON "students.details" but used in code
    }>;
    top_students_by_revenue?: any[];
    total_revenue_from_students?: number;
    average_revenue_per_student?: number;
    registration_trend?: any[];
    by_month?: {
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
      email?: string;
      subject?: string;
      courses_count: number; // Changed from course_count
      online_courses_purchases: number; // Changed from online_purchases_count
      online_revenue: number;
      subscription_codes_count: number; // Changed from subscription_code_count
      offline_revenue: number;
      books_count: number; // Changed from book_count
      book_purchases_count: number; // Changed from book_purchase_count
      books_revenue: number; // Changed from book_revenue
      students_count?: number;
      total_revenue?: number;
      registration_date?: string;
    }>;
    top_teachers_by_revenue?: any[];
    total_revenue_from_teachers?: number;
    average_revenue_per_teacher?: number;
    registration_trend?: any[];
    by_month?: {
      [key: string]: number;
    };
    by_week?: {
      [key: string]: number;
    };
  };
  modules?: {
    total: number;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
  subjects?: {
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
    free_count?: number;
    paid_count?: number;
    purchases_count?: number; // Optional in JSON
    online_courses?: Array<{
      id: number;
      title: string;
      teacher: string;
      subject: string;
      level: string;
      price: string | number;
      purchases_count: number;
      views_count: number;
      revenue: number;
      created_at: string;
    }>;
    online_course_details?: any[]; // Keep for compatibility or remove if unused
    top_courses_by_revenue?: any[];
    top_courses_by_purchases?: any[];
    total_revenue?: number;
    total_purchases?: number;
    average_price?: number;
    creation_trend?: any[];
    by_month?: {
      [key: string]: number;
    };
    by_week?: {
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
    total: number; // Changed to number from object with by_month
    by_month?: {
      [key: string]: number;
    };
    by_week?: {
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
  financial: {
    total_purchases: number;
    total_revenue: number;
    subscription_revenue: number;
    total_system_revenue: number;
    average_purchase_value: number;
    revenue_by_type: {
      courses: {
        revenue: number;
        count: number;
      };
      books: {
        revenue: number;
        count: number;
      };
    };
    revenue_trend: any[];
  };
  subscription_codes: {
    total: number;
    used: number;
    unused: number;
    active: number;
    expired: number;
    usage_rate: number;
    total_value: number;
    used_value: number;
    creation_trend: any[];
    by_month?: {
      [key: string]: number;
    };
    by_week?: {
      [key: string]: number;
    };
  };
  users: {
    total: number;
    active: number;
    blocked: number;
    by_role: {
      super_admin: number;
      admin: number;
      student: number;
      teacher: number;
    };
    registration_trend: any[];
    by_month?: {
      [key: string]: number;
    };
    by_week?: {
      [key: string]: number;
    };
  };
  engagement: {
    course_views: number;
    blog_views: number;
    total_views: number;
    top_viewed_courses: any[];
    top_viewed_blogs: any[];
    engagement_trend: any[];
  };
  purchases?: {
    // Made optional as it's missing in JSON, replaced by financial
    total: number;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
  cobons?: {
    // Made optional/kept as is just in case
    total: number;
    by_month: {
      [key: string]: number;
    };
    by_week: {
      [key: string]: number;
    };
  };
}

export interface TeacherStatistics {
  teacher_info: {
    id: number;
    name: string;
    email: string;
    phone: string;
    teach_no: string;
    subject?: string;
    cover?: string;
    avatar?: string;
  };
  students: {
    total: number;
  };
  courses: {
    total: number;
    online: number;
    offline: number;
    online_purchases: number;
    online_revenue: number;
    offline_revenue?: number;
  };
  books: {
    total: number;
    purchases: number;
    revenue: number;
    top_selling_books: Array<{
      id: number;
      title: string;
      purchases: number;
      revenue: number;
    }>;
  };
  subscription_codes: {
    total: number;
    used: number;
    unused: number;
    usage_rate: number;
    offline_revenue: number;
  };
  scheduled_exams: {
    total: number;
    upcoming: number;
    completed: number;
  };
  financial_summary: {
    online_revenue: number;
    books_revenue: number;
    offline_revenue: number;
    total_revenue: number;
    revenue_breakdown?: { [key: string]: number };
  };
  trends: {
    courses_trend: Array<{ period: string; count: number }>;
    books_trend: Array<{ period: string; count: number }>;
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