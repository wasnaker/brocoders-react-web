"use client";

import { PropsWithChildren } from "react";
import useAuth from "@/services/auth/use-auth";
import AppSidebar from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { ImpersonationBanner } from "@wasnaker/module-impersonate";

/**
 * Shell aplikasi di dalam SidebarProvider. Sidebar HANYA dirender untuk
 * user terautentikasi — tamu tidak mendapat sidebar sama sekali (bukan
 * sekadar disembunyikan CSS), sehingga tidak ada tombol/menu yang bisa
 * diintip lewat DOM. SidebarInset tetap dirender sebagai <main>.
 *
 * Banner impersonasi dirender DI DALAM <main> (SidebarInset) supaya tidak
 * menabrak sidebar yang diposisikan fixed di kolom kiri.
 */
export default function AppShell(props: PropsWithChildren) {
  const { user, isLoaded } = useAuth();

  return (
    <>
      {isLoaded && user ? <AppSidebar /> : null}
      <SidebarInset>
        <ImpersonationBanner />
        {props.children}
      </SidebarInset>
    </>
  );
}
