"use client";

import Link from "next/link";
import { navigationItems } from "@/lib/navigation";

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      <div className="p-6">
        <h1 className="text-2xl font-bold">
          GymTracker
        </h1>
      </div>

      <nav className="flex flex-col gap-2 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-muted transition"
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
