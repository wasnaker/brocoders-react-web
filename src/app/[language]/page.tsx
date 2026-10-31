import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import Link from "@/components/link";
import { Trans } from "react-i18next/TransWithoutContext";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "home");

  return {
    title: t("title"),
  };
}

export default async function Home(props: Props) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "home");

  return (
    <div className="page-content--reading">
      <div className="page-hero">
        <div className="page-hero__body">
          <h1 className="page-title mb-4" data-testid="home-title">
            {t("title")}
          </h1>
          <p>
            <Trans
              i18nKey={`description`}
              t={t}
              components={[
                <a
                  key="1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 underline"
                  href="https://github.com/brocoders/extensive-react-boilerplate/blob/main/docs/README.md"
                >
                  {}
                </a>,
              ]}
            />
          </p>
        </div>
        <div className="page-hero__footer">
          <Link
            href="/privacy-policy"
            className="text-primary underline-offset-4 underline"
          >
            {t("privacyPolicy")}
          </Link>
        </div>
      </div>
    </div>
  );
}
