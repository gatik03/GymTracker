"use client";
import { useState } from "react";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

import { MobileNav } from "./MobileNav";

export function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <MobileNav
        open={mobileOpen}
        onOpenChange={setMobileOpen}
      />

      <div className="flex flex-1 flex-col">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
