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

  // --- Auth Logic ---
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET as string });
  // NOTE: Module permission checks are enforced inside app pages/hooks
  // via shared `canAccessModule` logic to keep backend-driven behavior
  // consistent for all roles.

  // ✅ Set x-url so you can access it in server components
  response.headers.set("x-url", request.nextUrl.href);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|assets|docs|favicon.ico).*)"],
};
