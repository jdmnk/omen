import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ProvidersClient } from "./providers-client";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
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
        className={`${roboto.variable} antialiased flex flex-col h-screen overflow-hidden bg-background`}
      >
        <ProvidersClient>{children}</ProvidersClient>
      </body>
    </html>
  );
}
