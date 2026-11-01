"use client";

import { Roboto } from "next/font/google";
import "./globals.css";
import { dir } from "i18next";
import { DirectionProvider } from "@radix-ui/react-direction";
import ThemeProvider from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import QueryClientProvider from "@/services/react-query/query-client-provider";
import queryClient from "@/services/react-query/query-client";
import ReactQueryDevtools from "@/services/react-query/react-query-devtools";

const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-roboto",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={roboto.variable}
    >
      <body suppressHydrationWarning className="font-sans antialiased">
        <DirectionProvider dir="ltr">
          <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </QueryClientProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
