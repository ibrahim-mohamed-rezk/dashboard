import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { getToken } from "next-auth/jwt";

const defaultLocale = "ar";
const locales = ["ar"];

function getLocale(request: Request) {
  const acceptedLanguage = request.headers.get("accept-language") ?? undefined;
  const headers = { "accept-language": acceptedLanguage };
  const languages = new Negotiator({ headers }).languages();
  return match(languages, locales, defaultLocale);
}

export async function middleware(request: any) {
  const pathname = request.nextUrl.pathname;

  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  let response;
  const urlParamsLocale = getLocale(request);

  if (pathnameIsMissingLocale) {
    response = NextResponse.redirect(
      new URL(`/${urlParamsLocale}${pathname === '/' ? '' : pathname}`, request.url)
    );
  } else {
    response = NextResponse.next();
  }

  // --- Auth & RBAC Logic ---
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET as string });
  
  if (token) {
    const role = token.role as string;
    const userModules = (token.modules as string[]) || [];

    if (role !== "admin") {
      // Very basic generic RBAC checking.
      // If a route includes a module name (e.g. /courses, /books), ensure they have access.
      const segments = pathname.split('/').filter(Boolean);
      
      const restrictedModulesToCheck = ["users", "courses", "books", "videos", "students"]; 
      // In a real app we'd import PermissionService.getModulesList() here or match against defined route configs.

      for (const segment of segments) {
        if (restrictedModulesToCheck.includes(segment)) {
            if (!userModules.includes(segment)) {
              // Redirect to unauthorized / home
              return NextResponse.redirect(new URL(`/${urlParamsLocale}/unauthorized`, request.url));
            }
        }
      }
    }
  }

  // ✅ Set x-url so you can access it in server components
  response.headers.set("x-url", request.nextUrl.href);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|assets|docs|favicon.ico).*)"],
};
