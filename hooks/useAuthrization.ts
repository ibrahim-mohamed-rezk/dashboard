import { User } from "@/lib/type";

const useAuthrization = ({ user, module }: { user: User; module: string }) => {
  const normalizedModule = module?.toLowerCase();

  const hasAccess = (accessValue: unknown) => {
    if (typeof accessValue === "boolean") return accessValue;
    if (typeof accessValue === "number") return accessValue === 1;
    if (typeof accessValue === "string") {
      const normalized = accessValue.toLowerCase();
      return normalized === "true" || normalized === "1";
    }
    return false;
  };

  return Boolean(
    user?.modules?.some((item: any) => {
      const name = item?.name?.toLowerCase?.();
      const path = item?.path?.toLowerCase?.();

      return hasAccess(item?.access) && (name === normalizedModule || path === normalizedModule);
    })
  );
};

export default useAuthrization;