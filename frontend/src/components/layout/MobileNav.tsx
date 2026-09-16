"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { navigationItems } from "@/lib/navigation";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex flex-col justify-between border-zinc-800 bg-zinc-950 text-zinc-100">
        <div>
          <SheetTitle className="mb-8 mt-4 text-left text-xl font-bold tracking-tight text-zinc-50">
            <Link href="/" onClick={() => onOpenChange(false)}>Gym<span className="text-emerald-400">Tracker</span></Link>
          </SheetTitle>
          <nav aria-label="Mobile primary navigation" className="flex flex-col gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onOpenChange(false)}
                  className={`flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${active ? "bg-zinc-900 text-zinc-50" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"}`}
                >
                  <Icon size={18} className={active ? "text-emerald-400" : ""} /><span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <button type="button" onClick={() => { onOpenChange(false); void logout(); }} className="mb-4 flex w-full items-center gap-3 rounded-xl p-3 text-sm text-red-400 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
          <LogOut size={18} /><span>Sign out</span>
        </button>
      </SheetContent>
    </Sheet>
  );
}
