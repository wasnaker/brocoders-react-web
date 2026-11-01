---
to: src/app/admin/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>/create/page.tsx
---
import type { Metadata } from "next";
import Create<%= h.pascalName(name) %> from "./page-content";
import { getServerTranslation } from "@/services/i18n";
import { getRequestLanguage } from "@/services/i18n/get-request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  const { t } = await getServerTranslation(
    language,
    "admin-<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>-create"
  );

  return {
    title: t("title"),
  };
}

export default function Page() {
  return <Create<%= h.pascalName(name) %> />;
}
