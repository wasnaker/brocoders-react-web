import ResponsiveAppBar from "@/components/app-bar";
import AppSidebar from "@/components/app-sidebar";
import { SystemBannerProvider } from "@/components/system-banner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AuthProvider from "@/services/auth/auth-provider";
import "../globals.css";
import { Roboto } from "next/font/google";
import { dir } from "i18next";
import { DirectionProvider } from "@radix-ui/react-direction";
import "@/services/i18n/config";
import { languages } from "@/services/i18n/config";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { getServerTranslation } from "@/services/i18n";
import StoreLanguageProvider from "@/services/i18n/store-language-provider";
import ThemeProvider from "@/components/theme/theme-provider";
import LeavePageProvider from "@/services/leave-page/leave-page-provider";
import QueryClientProvider from "@/services/react-query/query-client-provider";
import queryClient from "@/services/react-query/query-client";
import ReactQueryDevtools from "@/services/react-query/react-query-devtools";
import GoogleAuthProvider from "@/services/social-auth/google/google-auth-provider";
import FacebookAuthProvider from "@/services/social-auth/facebook/facebook-auth-provider";
import ConfirmDialogProvider from "@/components/confirm-dialog/confirm-dialog-provider";

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
    // Identitas build di-render ke dalam HTML pada SETIAP page load.
    //
    // Ini yang membuat deteksi build bekerja tanpa polling: nilainya segar
    // dari server tiap kali halaman diload, sementara `useBuildVersion()`
    // membandingkannya dengan versi yang INGAT browser dari load sebelumnya.
    // Setelah deploy, keduanya berbeda -> banner muncul.
    //
    // Kalau nilainya diambil dari env yang ter-bake ke bundle, keduanya
    // selalu bergerak bersama dan tidak pernah bisa berbeda.
    other: {
      "build-version": process.env.BUILD_VERSION ?? "unknown",
    },
  };
}

export function generateStaticParams() {
  return languages.map((language) => ({ language }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ language: string }>;
}) {
  const params = await props.params;

  const { language } = params;

  const { children } = props;

  return (
    <html
      lang={language}
      dir={dir(language)}
      suppressHydrationWarning
      className={roboto.variable}
    >
      <body suppressHydrationWarning className="font-sans antialiased">
        <DirectionProvider dir={dir(language)}>
          <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            <ThemeProvider>
              <StoreLanguageProvider>
                <ConfirmDialogProvider>
                  <AuthProvider>
                    <GoogleAuthProvider>
                      <FacebookAuthProvider>
                        <LeavePageProvider>
                          <SidebarProvider className="flex-col [--header-height:4rem]">
                            <ResponsiveAppBar />
                            {/* System banner — sibling app bar, DI DALAM
                                SidebarProvider (flex-col) supaya turun satu
                                baris di bawah app bar dan melebar penuh.
                                Provider TIDAK membungkus SidebarProvider:
                                kalau begitu banner dirender setelah seluruh
                                app shell dan jatuh di paling bawah layar. */}
                            <div className="system-banner">
                              <SystemBannerProvider />
                            </div>
                            <div className="flex flex-1">
                              <AppSidebar />
                              <SidebarInset>{children}</SidebarInset>
                            </div>
                          </SidebarProvider>
                          <Toaster />
                        </LeavePageProvider>
                      </FacebookAuthProvider>
                    </GoogleAuthProvider>
                  </AuthProvider>
                </ConfirmDialogProvider>
              </StoreLanguageProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
