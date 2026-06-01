"use client";

import Link from "next/link";

import { Sheet, SheetContent } from "@/components/ui/sheet";

import { navigationItems } from "@/lib/navigation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileNav({
  open,
  onOpenChange,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left">
        <div className="mt-8 flex flex-col gap-3">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="rounded-lg p-3 hover:bg-muted"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
