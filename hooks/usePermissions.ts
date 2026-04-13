"use client";

import { useSession } from "next-auth/react";

/**
 * Hook to manage UI-side permission checks.
 * Mimics Auth::user()->canAccess('module') logic.
 */
export const usePermissions = () => {
  const { data: session } = useSession();

  // Ideally, the backend API adds `modules` to the user's token or profile
  // Example shape from DB: user.modules = ['courses', 'books'] 
  const userModules = (session?.user as any)?.modules || [];
  
  // Super admin fallback logic if desired (e.g. role === 'admin' can access all)
  const role = (session?.user as any)?.role || "user";

  const canAccess = (moduleName: string) => {
    // If the user is a super admin, they might have access to everything automatically
    if (role === "admin") {
      return true;
    }

    return userModules.includes(moduleName);
  };

  const hasAnyAccess = (moduleNames: string[]) => {
    if (role === "admin") return true;
    return moduleNames.some(module => userModules.includes(module));
  };

  const hasAllAccess = (moduleNames: string[]) => {
    if (role === "admin") return true;
    return moduleNames.every(module => userModules.includes(module));
  };

  return {
    canAccess,
    hasAnyAccess,
    hasAllAccess,
    userModules,
    role
  };
};
