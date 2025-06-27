// lib/types/bank.ts

export interface BankQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  type?: "multiple_choice" | "true_false" | "written";
  written_answer?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Bank {
  id: number;
  name: string;
  type: "questions" | "file";
  description?: string;
  questions: BankQuestion[];
  file_path?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BankSection {
  id: number;
  bank_id: number;
  question: string;
  options?: string[];
  correct_answer?: number;
  type: "multiple_choice" | "true_false" | "written";
  written_answer?: string;
  created_at?: string;
  updated_at?: string;
}

// Updated payload structure to match the requested format
export interface CreateBankQuestionFormData {
  name: string;
  bank_id: string | number;
  type: "questions" | "file";
  // Dynamic questions structure: questions[1][question], questions[1][1], etc.
  [key: string]: any;
}

export interface UpdateBankQuestionFormData extends CreateBankQuestionFormData {
  _method: "PUT";
}
