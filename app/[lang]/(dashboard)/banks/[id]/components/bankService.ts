// lib/services/bankService.ts

import { getData, postData, deleteData } from "@/lib/axios/server";
import {
  Bank,
  BankQuestion,
  CreateBankQuestionFormData,
  UpdateBankQuestionFormData,
} from "./bankTypes";

export class BankService {
  /**
   * Get all banks
   */
  static async getBanks(token: string): Promise<Bank[]> {
    try {
      const response = await getData(
        "banks",
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("فشل في جلب بيانات البنوك");
    }
  }

  /**
   * Get a specific bank by ID
   */
  static async getBank(bankId: string, token: string): Promise<Bank> {
    try {
      const response = await getData(
        `banks/${bankId}`,
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("فشل في جلب بيانات البنك");
    }
  }

  /**
   * Create a new bank
   */
  static async createBank(
    bankData: Partial<Bank>,
    token: string
  ): Promise<Bank> {
    try {
      const response = await postData("banks", bankData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
      return response.data;
    } catch (error) {
      throw new Error("فشل في إنشاء البنك");
    }
  }

  /**
   * Update a bank
   */
  static async updateBank(
    bankId: string,
    bankData: Partial<Bank>,
    token: string
  ): Promise<Bank> {
    try {
      const payload = {
        ...bankData,
        _method: "PUT",
      };

      const response = await postData(`banks/${bankId}`, payload, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
      return response.data;
    } catch (error) {
      throw new Error("فشل في تحديث البنك");
    }
  }

  /**
   * Delete a bank
   */
  static async deleteBank(bankId: string, token: string): Promise<void> {
    try {
      await deleteData(`banks/${bankId}`, {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      throw new Error("فشل في حذف البنك");
    }
  }

  /**
   * Get all questions for a specific bank
   */
  static async getBankQuestions(
    bankId: string,
    token: string
  ): Promise<BankQuestion[]> {
    try {
      const response = await getData(
        `banks/${bankId}/questions`,
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("فشل في جلب أسئلة البنك");
    }
  }

  /**
   * Create multiple bank questions with specific form data structure
   */
  static async createBankQuestions(
    bankId: string,
    bankName: string,
    questionsData: {
      question: string;
      type: "multiple_choice" | "true_false" | "written";
      options?: string[];
      correct_answer?: number;
      written_answer?: string;
    }[],
    token: string
  ): Promise<BankQuestion[]> {
    try {
      const formData = new FormData();

      // Required fields
      formData.append("name", bankName);
      formData.append("bank_id", bankId);
      formData.append("type", "questions");

      // Add questions in the specified format
      questionsData.forEach((questionData, index) => {
        const questionIndex = index + 1; // Start from 1 as per your specification

        // questions[1][question], questions[2][question], etc.
        formData.append(
          `questions[${questionIndex}][question]`,
          questionData.question
        );

        if (questionData.type === "multiple_choice" && questionData.options) {
          // questions[1][1], questions[1][2], questions[1][3], questions[1][4]
          questionData.options.forEach((option, optIndex) => {
            if (option.trim()) {
              formData.append(
                `questions[${questionIndex}][${optIndex + 1}]`,
                option
              );
            }
          });

          // questions[1][correct_answer]: [ex: 2]
          if (typeof questionData.correct_answer === "number") {
            formData.append(
              `questions[${questionIndex}][correct_answer]`,
              (questionData.correct_answer + 1).toString()
            );
          }
        } else if (questionData.type === "true_false") {
          // For true/false questions
          formData.append(`questions[${questionIndex}][1]`, "صح");
          formData.append(`questions[${questionIndex}][2]`, "خطأ");
          if (typeof questionData.correct_answer === "number") {
            formData.append(
              `questions[${questionIndex}][correct_answer]`,
              (questionData.correct_answer + 1).toString()
            );
          }
        } else if (
          questionData.type === "written" &&
          questionData.written_answer
        ) {
          // For written questions
          formData.append(
            `questions[${questionIndex}][written_answer]`,
            questionData.written_answer
          );
        }
      });

      const response = await postData("bank-sections", formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });
      return response.data;
    } catch (error) {
      throw new Error("فشل في إضافة الأسئلة");
    }
  }

  /**
   * Update a bank question with specific form data structure
   */
  static async updateBankQuestion(
    questionId: string | number,
    bankId: string,
    bankName: string,
    questionData: {
      question: string;
      type: "multiple_choice" | "true_false" | "written";
      options?: string[];
      correct_answer?: number;
      written_answer?: string;
    },
    token: string
  ): Promise<BankQuestion> {
    try {
      const formData = new FormData();

      // Required fields
      formData.append("name", bankName);
      formData.append("bank_id", bankId);
      formData.append("type", "questions");
      formData.append("_method", "PUT");

      // Add the question in the specified format (using index 1)
      formData.append("questions[1][question]", questionData.question);

      if (questionData.type === "multiple_choice" && questionData.options) {
        questionData.options.forEach((option, optIndex) => {
          if (option.trim()) {
            formData.append(`questions[1][${optIndex + 1}]`, option);
          }
        });

        if (typeof questionData.correct_answer === "number") {
          formData.append(
            "questions[1][correct_answer]",
            (questionData.correct_answer + 1).toString()
          );
        }
      } else if (questionData.type === "true_false") {
        formData.append("questions[1][1]", "صح");
        formData.append("questions[1][2]", "خطأ");
        if (typeof questionData.correct_answer === "number") {
          formData.append(
            "questions[1][correct_answer]",
            (questionData.correct_answer + 1).toString()
          );
        }
      } else if (
        questionData.type === "written" &&
        questionData.written_answer
      ) {
        formData.append(
          "questions[1][written_answer]",
          questionData.written_answer
        );
      }

      const response = await postData(`bank-sections/${questionId}`, formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });
      return response.data;
    } catch (error) {
      throw new Error("فشل في تحديث السؤال");
    }
  }

  /**
   * Delete a bank question
   */
  static async deleteBankQuestion(
    questionId: string | number,
    token: string
  ): Promise<void> {
    try {
      await deleteData(`bank-sections/${questionId}`, {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      throw new Error("فشل في حذف السؤال");
    }
  }

  /**
   * Get a specific question
   */
  static async getBankQuestion(
    questionId: string | number,
    token: string
  ): Promise<BankQuestion> {
    try {
      const response = await getData(
        `bank-sections/${questionId}`,
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("فشل في جلب بيانات السؤال");
    }
  }

  /**
   * Search questions in a bank
   */
  static async searchBankQuestions(
    bankId: string,
    searchTerm: string,
    token: string
  ): Promise<BankQuestion[]> {
    try {
      const response = await getData(
        `banks/${bankId}/questions/search`,
        {
          q: searchTerm,
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("فشل في البحث عن الأسئلة");
    }
  }

  /**
   * Export bank questions
   */
  static async exportBankQuestions(
    bankId: string,
    format: "json" | "excel" | "pdf",
    token: string
  ): Promise<Blob> {
    try {
      const response = await getData(
        `banks/${bankId}/export`,
        {
          format: format,
        },
        {
          Authorization: `Bearer ${token}`,
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("فشل في تصدير الأسئلة");
    }
  }

  /**
   * Import questions to bank
   */
  static async importBankQuestions(
    bankId: string,
    file: File,
    token: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bank_id", bankId);

      const response = await postData("bank-sections/import", formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });
      return response.data;
    } catch (error) {
      throw new Error("فشل في استيراد الأسئلة");
    }
  }

  /**
   * Upload file to bank (for file type banks)
   */
  static async uploadBankFile(
    bankId: string,
    bankName: string,
    file: File,
    token: string
  ): Promise<Bank> {
    try {
      const formData = new FormData();
      formData.append("name", bankName);
      formData.append("bank_id", bankId);
      formData.append("type", "file");
      formData.append("file", file);
      formData.append("_method", "PUT");

      const response = await postData(`banks/${bankId}/upload`, formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });
      return response.data;
    } catch (error) {
      throw new Error("فشل في رفع الملف");
    }
  }
}
