import AppProviders from "@/components/app-providers";
import { getServerTranslation } from "@/services/i18n";
import { languages } from "@/services/i18n/config";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { language } = await props.params;
  const { t } = await getServerTranslation(language, "common");

  return {
    title: t("title"),
    other: {
      "build-version": process.env.BUILD_VERSION ?? "unknown",
    },
  };
}

export function generateStaticParams() {
  return languages.map((language) => ({ language }));
}

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{ language: string }>;
}) {
  const { language } = await props.params;

  return <AppProviders language={language}>{props.children}</AppProviders>;
}
