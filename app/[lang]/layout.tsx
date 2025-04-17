import "../assets/scss/globals.scss";
import "../assets/scss/theme.scss";
import { siteConfig } from "@/config/site";
import Providers from "@/provider/providers";
import "simplebar-react/dist/simplebar.min.css";
import TanstackProvider from "@/provider/providers.client";
import AuthProvider from "@/provider/auth.provider";
import "flatpickr/dist/themes/light.css";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { parse } from "url";

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default async function RootLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const cookiesData = await cookies();
  const token = cookiesData.get("token")?.value;
  const headersList = await headers();
  const fullUrl = headersList.get("x-url") || headersList.get("referer") || "";

  const { pathname } = parse(fullUrl);
  if (!token && !pathname?.includes("/auth/login")) {
    redirect("/auth/login");
  }

  return (
    <html dir="rtl" lang={lang}>
      <AuthProvider>
        <TanstackProvider>
          <Providers>{children}</Providers>
        </TanstackProvider>
      </AuthProvider>
    </html>
  );
}
