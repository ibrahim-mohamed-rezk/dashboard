import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

const defaultLocale = "ar";
const locales = ["ar"];

function getLocale(request: Request) {
  const acceptedLanguage = request.headers.get("accept-language") ?? undefined;
  const headers = { "accept-language": acceptedLanguage };
  const languages = new Negotiator({ headers }).languages();
  return match(languages, locales, defaultLocale);
}

export function middleware(request: any) {
  const pathname = request.nextUrl.pathname;

  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  let response;

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    response = NextResponse.redirect(
      new URL(`/${locale}/${pathname}`, request.url)
    );
  } else {
    response = NextResponse.next();
  }

  // ✅ Set x-url so you can access it in server components
  response.headers.set("x-url", request.nextUrl.href);

  return response;
}

export const config = {
  matcher: ["/((?!api|assets|docs|.*\\..*|_next).*)"],
};
