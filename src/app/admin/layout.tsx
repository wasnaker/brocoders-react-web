"use client";

import useLanguage from "@/services/i18n/use-language";
import { useTranslation } from "@/services/i18n/client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation("common");
  const language = useLanguage();

  return (
    <html lang={language} dir={language === "ar" ? "rtl" : "ltr"}>
      <body>
        {children}
      </body>
    </html>
  );
}