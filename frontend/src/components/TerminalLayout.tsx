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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="h-full w-full flex-1 flex flex-col">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full w-full flex-1"
        >
          {/* Left sidebar */}
          <ResizablePanel defaultSize={25} minSize={10}>
            <SearchColumn />
          </ResizablePanel>

          {/* Main content */}
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={20}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={50} minSize={20}>
                <div className="flex h-full items-center justify-center p-6">
                  <span className="font-semibold">Two</span>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={20}>
                <div className="flex h-full items-center justify-center p-6">
                  <span className="font-semibold">Three</span>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* Right sidebar */}
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={10}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Sidebar</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
