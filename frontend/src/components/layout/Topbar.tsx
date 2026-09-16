"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-background px-4 sm:px-6">
      <Link href="/" className="rounded-md text-lg font-semibold tracking-tight text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 md:text-sm md:text-zinc-500">
        <span className="md:hidden">Gym<span className="text-emerald-400">Tracker</span></span>
        <span className="hidden md:inline">Personal training workspace</span>
      </Link>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="Open navigation menu">
        <Menu className="h-5 w-5" />
      </Button>
    </header>
  );
}
