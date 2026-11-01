
import ResponsiveAppBar from "@/components/app-bar";
import AppShell from "@/components/app-shell";
import AuthStateClass from "@/components/auth-state-class";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SystemBannerProvider } from "@/components/system-banner";
import AuthProvider from "@/services/auth/auth-provider";
import GoogleAuthProvider from "@/services/social-auth/google/google-auth-provider";
import FacebookAuthProvider from "@/services/social-auth/facebook/facebook-auth-provider";
import ConfirmDialogProvider from "@/components/confirm-dialog/confirm-dialog-provider";
import StoreLanguageProvider from "@/services/i18n/store-language-provider";
import { Roboto } from "next/font/google";
import { dir } from "i18next";
import { DirectionProvider } from "@radix-ui/react-direction";
import { getServerTranslation } from "@/services/i18n";
import { languages } from "@/services/i18n/config";
import type { Metadata } from "next";
import LeavePageProvider from "@/services/leave-page/leave-page-provider";

const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-roboto",
});

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "common");

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
  const params = await props.params;
  const { language } = params;
  const { children } = props;

  return (
    <DirectionProvider dir={dir(language)}>
      <StoreLanguageProvider>
        <AuthProvider>
          <GoogleAuthProvider>
            <FacebookAuthProvider>
              <ConfirmDialogProvider>
                <LeavePageProvider>
                  <AuthStateClass />
                  <SidebarProvider className="flex-col [--header-height:4rem]">
                    <ResponsiveAppBar />
                    <div className="system-banner">
                      <SystemBannerProvider />
                    </div>
                    <div className="app-shell">
                      <AppShell>{children}</AppShell>
                    </div>
                  </SidebarProvider>
                </LeavePageProvider>
              </ConfirmDialogProvider>
            </FacebookAuthProvider>
            </GoogleAuthProvider>
          </AuthProvider>
        </StoreLanguageProvider>
      </DirectionProvider>
  );
}
