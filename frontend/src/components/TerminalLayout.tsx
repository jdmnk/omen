"use client";

import { ReactNode } from "react";
import { Header } from "./_new/Header";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { SearchColumn } from "./_new/SearchColumn";

export function TerminalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 w-full flex flex-col overflow-hidden min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {/* Left sidebar */}
          <ResizablePanel defaultSize={25} minSize={10}>
            <div className="h-full overflow-auto">
              <SearchColumn />
            </div>
          </ResizablePanel>

          {/* Main content */}
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={20}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={50} minSize={20}>
                <div className="h-full overflow-auto flex items-center justify-center p-6">
                  <span className="font-semibold">Two</span>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={20}>
                <div className="h-full overflow-auto flex items-center justify-center p-6">
                  <span className="font-semibold">Three</span>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* Right sidebar */}
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={10}>
            <div className="h-full overflow-auto flex items-center justify-center p-6">
              <span className="font-semibold">Sidebar</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
