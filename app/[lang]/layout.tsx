import "../assets/scss/globals.scss";
import "../assets/scss/theme.scss";
import { siteConfig } from "@/config/site";
import Providers from "@/provider/providers";
import "simplebar-react/dist/simplebar.min.css";
import TanstackProvider from "@/provider/providers.client";
import AuthProvider from "@/provider/auth.provider";
import "flatpickr/dist/themes/light.css";

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
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
