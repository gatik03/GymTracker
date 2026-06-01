"use client";

import Link from "next/link";
import { navigationItems } from "@/lib/navigation";

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
      <div className="p-6">
        <h1 className="text-2xl font-bold">
          GymTracker
        </h1>

        <p className="text-sm text-muted-foreground">
          Track. Progress. Improve.
        </p>
      </div>

      <nav className="flex flex-col gap-2 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="
                flex items-center
                gap-3
                rounded-xl
                px-4
                py-3
                transition
                hover:bg-muted
              "
            >
              <Icon size={18} />

              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
