"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { navigationItems } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-100 md:flex">
      <Link href="/" aria-label="GymTracker dashboard" className="m-4 rounded-xl px-2 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50">
        <span className="text-xl font-bold tracking-tight text-zinc-50">Gym<span className="text-emerald-400">Tracker</span></span>
        <span className="mt-1 block text-xs text-zinc-600">Track. Progress. Improve.</span>
      </Link>

      <nav aria-label="Primary navigation" className="flex flex-1 flex-col gap-1 px-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${active ? "bg-zinc-900 text-zinc-50" : "text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-200"}`}
            >
              <Icon size={18} className={active ? "text-emerald-400" : ""} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-900 p-4">
        <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
          <LogOut size={18} /><span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
