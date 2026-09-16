"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const plates = [
  { label: "Data", color: "#34d399" },
  { label: "Design", color: "#22d3ee" },
  { label: "Progress", color: "#a78bfa" },
  { label: "Privacy", color: "#f59e0b" },
  { label: "You", color: "#f4f4f5" },
];

export function PlateIntro() {
  const reducedMotion = Boolean(useReducedMotion());
  const [mode, setMode] = useState<"checking" | "full" | "short">("checking");
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const seen = window.localStorage.getItem("gymtracker_intro_seen") === "1";
      setMode(seen ? "short" : "full");
      window.localStorage.setItem("gymtracker_intro_seen", "1");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const instant = skipped || reducedMotion || mode === "checking";
  const duration = instant ? 0 : mode === "full" ? 0.55 : 0.18;
  const delayStep = mode === "full" ? 0.16 : 0.035;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/30 p-5 sm:p-7 lg:min-h-[660px]" aria-labelledby="intro-title">
      <div className="relative z-20 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">GymTracker</p>
          <h1 id="intro-title" className="mt-3 max-w-md text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
            Training, made clear.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500">
            Log the work. See the trend. Keep the rest private.
          </p>
        </div>
        {mode === "full" && !skipped && !reducedMotion ? (
          <button type="button" onClick={() => setSkipped(true)} className="shrink-0 rounded-lg px-2 py-1 text-xs text-zinc-600 transition hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50">
            Skip
          </button>
        ) : null}
      </div>

      <div className="relative mx-auto mt-7 h-64 max-w-sm sm:h-80 lg:mt-14 lg:h-[390px]" aria-hidden="true">
        <div className="absolute inset-x-8 top-8 h-2 rounded-full bg-zinc-600 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] sm:inset-x-4">
          <div className="absolute -left-2 -top-2 h-6 w-3 rounded-sm bg-zinc-700" />
          <div className="absolute -right-2 -top-2 h-6 w-3 rounded-sm bg-zinc-700" />
        </div>

        {plates.map((plate, index) => {
          const startX = (index - 2) * 40 - 9;
          const finalY = 192 - index * 18;
          return (
            <motion.div
              key={plate.label}
              className="absolute left-1/2 top-0 flex items-center justify-center border-2 text-[9px] font-bold uppercase tracking-widest text-zinc-950 shadow-xl"
              initial={false}
              animate={mode === "checking" ? {
                x: startX,
                y: 0,
                width: 18,
                height: 84,
                borderRadius: 999,
                opacity: 0.6,
              } : {
                x: -86,
                y: finalY,
                width: 172,
                height: 16,
                borderRadius: 8,
                opacity: 1,
              }}
              transition={{ duration, delay: instant ? 0 : index * delayStep, ease: [0.22, 1, 0.36, 1] }}
              style={{ backgroundColor: plate.color, borderColor: `${plate.color}aa` }}
            >
              <motion.span animate={{ opacity: mode === "checking" ? 0 : 1 }} transition={{ duration: instant ? 0 : 0.2, delay: instant ? 0 : index * delayStep + duration * 0.7 }}>
                {plate.label}
              </motion.span>
            </motion.div>
          );
        })}

        <div className="absolute bottom-5 left-1/2 h-2 w-52 -translate-x-1/2 rounded-full bg-black/60 blur-md" />
      </div>

      <div className="relative z-10 mt-2 grid grid-cols-3 gap-2 border-t border-zinc-800 pt-5 text-xs text-zinc-600">
        <span>Fast logging</span><span className="text-center">Real analytics</span><span className="text-right">Private by design</span>
      </div>
    </section>
  );
}
