import { Roboto } from "next/font/google";
import { headers } from "next/headers";
import { dir } from "i18next";
import "./globals.css";
import RootProviders from "@/components/root-providers";
import { fallbackLanguage, languages } from "@/services/i18n/config";

const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-roboto",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const requestedLanguage = requestHeaders.get("x-app-language");
  const language = languages.includes(
    requestedLanguage as (typeof languages)[number]
  )
    ? requestedLanguage!
    : fallbackLanguage;

  return (
    <html
      lang={language}
      dir={dir(language)}
      suppressHydrationWarning
      className={roboto.variable}
    >
      <body suppressHydrationWarning className="font-sans antialiased">
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
