import { MainSharedContainer } from "@/components/layouts/MainSharedContainer";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <MainSharedContainer>
      <div className="flex items-center justify-center h-full">
        <Card className="shadow-md max-w-md">
          <CardContent className="text-center py-12 px-8">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No Market Selected</h3>
            <p className="text-sm text-muted-foreground">
              Use the search bar above to find and select a prediction market
            </p>
          </CardContent>
        </Card>
      </div>
    </MainSharedContainer>
  );
}
