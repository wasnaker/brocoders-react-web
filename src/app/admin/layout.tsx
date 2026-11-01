import AppProviders from "@/components/app-providers";
import { fallbackLanguage, languages } from "@/services/i18n/config";
import { headers } from "next/headers";

export default async function AdminLayout({
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

  return <AppProviders language={language}>{children}</AppProviders>;
}
