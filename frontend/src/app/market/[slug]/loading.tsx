import { LoadingSpinner } from "@/components/ui/spinner";
import { MainSharedContainer } from "@/components/layouts/MainSharedContainer";

export default function Loading() {
  return (
    <MainSharedContainer>
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner message="Loading market..." size="lg" />
      </div>
    </MainSharedContainer>
  );
}
