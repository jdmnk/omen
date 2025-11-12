import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ProvidersClient } from "./providers-client";
import { METADATA } from "@/lib/metadata.const";
import { getSiteUrl } from "@/lib/app";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: METADATA.title,
  description: METADATA.description,
  openGraph: {
    title: METADATA.title,
    description: METADATA.description,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: METADATA.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: METADATA.title,
    description: METADATA.description,
    images: ["/opengraph-image"],
  },
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
