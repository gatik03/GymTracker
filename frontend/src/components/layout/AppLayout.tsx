"use client";
import { useState } from "react";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />

        <MobileNav
          open={mobileOpen}
          onOpenChange={setMobileOpen}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            onMenuClick={() => setMobileOpen(true)}
          />

          <main className="min-w-0 flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
