import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <Card className="h-full shadow-md flex items-center justify-center">
      <CardContent className="text-center py-12">
        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold mb-2">No Market Selected</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Search and select a market from the left panel to view details and
          positions
        </p>
      </CardContent>
    </Card>
  );
}
