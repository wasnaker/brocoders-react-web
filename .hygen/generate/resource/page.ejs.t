---
to: src/app/admin/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>/page.tsx
---
import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";
import <%= h.pascalPluralName(name) %>PageContent from "@/app/[language]/admin/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>/page-content";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  const { t } = await getServerTranslation(
    language,
    "admin-<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>"
  );

  return {
    title: t("title"),
  };
}

export default function Page() {
  return <<%= h.pascalPluralName(name) %>PageContent />;
}
