import { UserProfile } from "@/modules/user/components/UserProfile";
import type { Metadata } from "next";
import { METADATA } from "@/lib/metadata.const";
import { getSiteUrl } from "@/lib/app.const";
import { Header } from "@/components/Header";

type UserProfileData = {
  name?: string | null;
  pseudonym?: string | null;
};

async function fetchUserData(address: string): Promise<UserProfileData | null> {
  try {
    const url = new URL("https://polymarket.com/api/profile/userData");
    url.searchParams.set("address", address);
    const response = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!response.ok) return null;
    return (await response.json()) as UserProfileData;
  } catch {
    return null;
  }
}

function formatAddressShort(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const userData = await fetchUserData(userId);

  const displayName =
    userData?.name || userData?.pseudonym || formatAddressShort(userId);
  const title = `Omen | @${displayName}`;
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
    <div>
      {/* <Header /> */}
      <main className="w-full">
        <UserProfile userId={userId} />
      </main>
    </div>
  );
}
