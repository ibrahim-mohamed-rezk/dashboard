import { boolean, number } from "zod";

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
  full_name: string;
  avatar: string;
  phone: string;
  gender: string | null;
  email: string;
  role: string;
  modules: Module[];
}

export interface SubjectsData {
  id: number;
  name: string;
  description: string;
}
