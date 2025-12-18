import { UserSearchBar } from "@/modules/user/components/UserSearchBar";
import { UserWatchlist } from "@/modules/user/components/UserWatchlist";

export default function Home() {
  return (
    <div className="bg-background">
      <main className="w-full">
        <div className="container mx-auto max-w-7xl p-6 space-y-6">
          <UserSearchBar />
          <UserWatchlist />
        </div>
      </main>
    </div>
  );
}
