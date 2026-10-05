"use client";

import type { ReactNode, RefObject } from "react";

interface PlateStackSurfaceProps {
  children: ReactNode;
  status: "hidden" | "morphing" | "ready";
  /** The box the WebGL plate stack is rendered into. */
  stackSlotRef: RefObject<HTMLDivElement | null>;
  /** Draw the stack in CSS because WebGL is unavailable. */
  cssStack: boolean;
}

const plateCount = 5;

/* Two anchors: the physical stack, and the login beside it (below it on narrow screens). */
export function PlateStackSurface({ children, status, stackSlotRef, cssStack }: PlateStackSurfaceProps) {
  return (
    <div className="login-rig" data-state={status}>
      <div ref={stackSlotRef} className="login-rig__stack" data-plate-stack-slot aria-hidden="true">
        {cssStack ? Array.from({ length: plateCount }, (_, index) => <div className="login-rig__plate" key={index} />) : null}
      </div>
      <div className="login-console">{children}</div>
    </div>
  );
}
