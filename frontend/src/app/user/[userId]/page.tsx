import { UserProfile } from "@/components/widgets/user/UserProfile";
import type { Metadata } from "next";
import { METADATA } from "@/lib/metadata.const";
import { getSiteUrl } from "@/lib/app.const";
import { Header } from "@/components/Header";

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

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* <Header /> */}
      <main className="flex-1 w-full flex flex-col overflow-hidden min-h-0">
        <UserProfile userId={userId} />
      </main>
    </div>
  );
}
