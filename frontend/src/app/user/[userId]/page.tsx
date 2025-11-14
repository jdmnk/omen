import { UserProfile } from "@/components/widgets/UserProfile";
import type { Metadata } from "next";
import { METADATA } from "@/lib/metadata.const";
import { getSiteUrl } from "@/lib/app.const";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;

  const title = `Omen | User ${userId.slice(0, 8)}...`;
  const description = `View trading profile and positions`;

  return {
    metadataBase: new URL(getSiteUrl()),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return <UserProfile userId={userId} />;
}
