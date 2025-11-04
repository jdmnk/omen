import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TerminalLayout } from "@/components/TerminalLayout";
import { ProvidersClient } from "./providers-client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Omen Insight",
  description:
    "Omen Insight is a platform for Polymarket analysis and insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-screen">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen overflow-hidden`}
      >
        <ProvidersClient>
          <TerminalLayout>{children}</TerminalLayout>
        </ProvidersClient>
      </body>
    </html>
  );
}
