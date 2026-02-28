import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond } from "next/font/google";

import { ThemeProvider } from "@/lib/ThemeContext";

import { QueryProvider } from "@/components/providers/QueryProvider";

import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const cinzel = Cinzel({
  variable: "--font-label",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Isabella & Alexander — Wedding Invitation",
  description: "Join us as we celebrate our love. 12 July 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${cormorant.variable} ${cinzel.variable}`}>
          <QueryProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
