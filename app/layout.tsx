import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "sonner";

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
  title: {
    default: "Ceremonia — Beautiful Event Invitations",
    template: "%s | Ceremonia",
  },
  description:
    "Create cinematic, personalised invitations your guests will never forget. Weddings, birthdays, baby showers and more — RSVP management, custom themes, and your own subdomain.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://ceremonia.app",
  ),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    siteName: "Ceremonia",
    type: "website",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ceremoniaapp",
  },
  robots: {
    index: true,
    follow: true,
  },
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
            <Toaster
              position="bottom-right"
              richColors
              toastOptions={{
                style: {
                  background: "#0F0A0A",
                  border: "1px solid #D4AF3730",
                  color: "#F5F0E8",
                  fontFamily: "var(--font-label)",
                  fontSize: "11px",
                  letterSpacing: "0.05em",
                },
              }}
            />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
