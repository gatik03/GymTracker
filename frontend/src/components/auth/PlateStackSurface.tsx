"use client";

import type { ReactNode, RefObject } from "react";

interface PlateStackSurfaceProps {
  /** Brand block, shown above the login rows. */
  head: ReactNode;
  /** The login rows; on desktop each one lines up with a plate in the stack. */
  rows: ReactNode;
  foot: ReactNode;
  status: "hidden" | "morphing" | "ready";
  /** The box the WebGL plate stack is rendered into. */
  stackSlotRef: RefObject<HTMLDivElement | null>;
  /** Draw the stack in CSS because WebGL is unavailable. */
  cssStack: boolean;
}

const plateCount = 5;

export function PlateStackSurface({ head, rows, foot, status, stackSlotRef, cssStack }: PlateStackSurfaceProps) {
  return (
    <div className="login-rig" data-state={status}>
      <div ref={stackSlotRef} className="login-rig__stack" data-plate-stack-slot aria-hidden="true">
        {cssStack ? Array.from({ length: plateCount }, (_, index) => <div className="login-rig__plate" key={index} />) : null}
      </div>
      <div className="login-console">
        <div className="login-console__head">{head}</div>
        <div className="login-console__rows">{rows}</div>
        <div className="login-console__foot">{foot}</div>
      </div>
    </div>
  );
}
