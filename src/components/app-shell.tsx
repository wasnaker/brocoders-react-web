"use client";

import { PropsWithChildren } from "react";
import useAuth from "@/services/auth/use-auth";
import AppSidebar from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";

/**
 * Shell aplikasi di dalam SidebarProvider. Sidebar HANYA dirender untuk
 * user terautentikasi — tamu tidak mendapat sidebar sama sekali (bukan
 * sekadar disembunyikan CSS), sehingga tidak ada tombol/menu yang bisa
 * diintip lewat DOM. SidebarInset tetap dirender sebagai <main>.
 */
export default function AppShell(props: PropsWithChildren) {
  const { user, isLoaded } = useAuth();

  return (
    <>
      {isLoaded && user ? <AppSidebar /> : null}
      <SidebarInset>{props.children}</SidebarInset>
    </>
  );
}
