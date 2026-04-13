/**
 * Permission Service
 * Extracted from permissions_cycle_guide.md
 * 
 * Provides static definitions for user permissions.
 */

export const PermissionService = {
  /**
   * The complete list of available modules in the system (26 in total).
   */
  getModulesList(): string[] {
    return [
      "users",
      "admins",
      "courses",
      "reviews",
      "purchases",
      "statistics",
      "books",
      "videos",
      "students",
      "exams",
      "assignments",
      "live_classes",
      "certificates",
      "payments",
      "settings",
      "reports",
      "notifications",
      "chat",
      "support",
      "affiliates",
      "coupons",
      "questions_bank",
      "blog",
      "pages",
      "faqs",
      "roles_permissions"
    ]; // Placeholder names matching the 26 mentioned in the guide.
  },

  /**
   * The base modules a teacher receives upon creation (15 in total).
   */
  getTeacherBasicModules(): string[] {
    return [
      "courses",
      "videos",
      "students",
      "exams",
      "assignments",
      "statistics",
      "books",
      "live_classes",
      "certificates",
      "reports",
      "notifications",
      "chat",
      "support",
      "questions_bank",
      "reviews"
    ]; // Placeholder modules specific to the teacher.
  },

  /**
   * Checks if a provided modules list represents a valid initialization.
   * Can be used to verify if current user has minimum missing hydraulic permissions.
   */
  initializeModules(existingModules: string[]): string[] {
    const allModules = this.getModulesList();
    // Return all modules that should be inserted/updated in the DB
    return allModules.filter(module => !existingModules.includes(module));
  },

  /**
   * Assigns basic teacher permissions by checking what they already have.
   */
  assignBasicTeacherPermissions(existingPermissions: string[] | undefined): string[] {
    const defaultPermissions = this.getTeacherBasicModules();
    const current = existingPermissions || [];
    const missingPermissions = defaultPermissions.filter(p => !current.includes(p));
    return [...current, ...missingPermissions];
  }
};
