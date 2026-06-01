"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onMenuClick?: () => void;
};

export function Topbar({ onMenuClick }: Props) {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background">
      <div>
        <h2 className="text-lg font-semibold">
          Gym Tracker
        </h2>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </header>
  );
}
