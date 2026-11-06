"use client";

import type { PropsWithChildren } from "react";
import ResponsiveAppBar from "@/components/app-bar";
import AppShell from "@/components/app-shell";
import DocumentLanguageSync from "@/components/document-language-sync";
import AuthStateClass from "@/components/auth-state-class";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SystemBannerProvider } from "@/components/system-banner";
import AuthProvider from "@/services/auth/auth-provider";
import GoogleAuthProvider from "@/services/social-auth/google/google-auth-provider";
import FacebookAuthProvider from "@/services/social-auth/facebook/facebook-auth-provider";
import ConfirmDialogProvider from "@/components/confirm-dialog/confirm-dialog-provider";
import StoreLanguageProvider from "@/services/i18n/store-language-provider";
import LeavePageProvider from "@/services/leave-page/leave-page-provider";
import { DirectionProvider } from "@radix-ui/react-direction";
import i18next from "i18next";
import { ImpersonationBanner } from "@wasnaker/module-impersonate";

type AppProvidersProps = PropsWithChildren<{
  language: string;
}>;

/**
 * Shared interactive application providers for both localized public routes
 * and locale-free admin routes. The document shell stays in the server root
 * layout; this component deliberately does not render html/body.
 */
export default function AppProviders({
  children,
  language,
}: AppProvidersProps) {
  return (
    <DirectionProvider dir={i18next.dir(language)}>
      <StoreLanguageProvider initialLanguage={language}>
        <AuthProvider>
          <DocumentLanguageSync />
          <GoogleAuthProvider>
            <FacebookAuthProvider>
              <ConfirmDialogProvider>
                <LeavePageProvider>
                  <AuthStateClass />
                  <SidebarProvider className="flex-col [--header-height:4rem]">
                    <ResponsiveAppBar />
                    <ImpersonationBanner />
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
