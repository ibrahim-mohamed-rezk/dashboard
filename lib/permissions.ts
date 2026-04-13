import { Module } from "@/lib/type";

type ModuleMatcher = string | string[];

const hasAccessValue = (accessValue: unknown): boolean => {
  if (typeof accessValue === "boolean") return accessValue;
  if (typeof accessValue === "number") return accessValue === 1;
  if (typeof accessValue === "string") {
    const normalized = accessValue.toLowerCase();
    return normalized === "true" || normalized === "1";
  }
  return false;
};

export const canAccessModule = (
  modules: Module[] | undefined | null,
  module: ModuleMatcher
): boolean => {
  if (!Array.isArray(modules) || modules.length === 0) return false;

  const targets = (Array.isArray(module) ? module : [module])
    .map((item) => item?.toLowerCase())
    .filter(Boolean);

  if (targets.length === 0) return false;

  return modules.some((item: any) => {
    const name = item?.name?.toLowerCase?.();
    const path = item?.path?.toLowerCase?.();

    return hasAccessValue(item?.access) && (targets.includes(name) || targets.includes(path));
  });
};

