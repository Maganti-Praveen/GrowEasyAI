import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GrowEasy CRM Importer — AI-Powered CSV Import",
  description:
    "Intelligently map any CSV format to your GrowEasy CRM schema using AI. Handles Facebook Leads, Google Ads, real estate exports, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(224 71% 8%)",
              border: "1px solid hsl(215 20% 16%)",
              color: "hsl(210 40% 96%)",
            },
          }}
          theme="dark"
        />
      </body>
    </html>
  );
}
