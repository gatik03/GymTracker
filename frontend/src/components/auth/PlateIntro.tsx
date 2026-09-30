"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";

interface PlateIntroProps { onReady: () => void; onMorphStart: () => void; onReplay: () => void; }
type PlateColor = "red" | "blue" | "yellow" | "green";

const plateData: Array<{ side: "left" | "right"; color: PlateColor; size: number; delay: number }> = [
  { side: "left", color: "red", size: 170, delay: 0.3 },
  { side: "right", color: "red", size: 170, delay: 0.48 },
  { side: "left", color: "blue", size: 138, delay: 0.68 },
  { side: "right", color: "blue", size: 138, delay: 0.86 },
  { side: "left", color: "yellow", size: 108, delay: 1.06 },
  { side: "right", color: "green", size: 86, delay: 1.24 },
];

const colors: Record<PlateColor, { edge: string; body: string; shadow: string }> = {
  red: { edge: "#e06b58", body: "#a5322d", shadow: "#42171a" },
  blue: { edge: "#6fa4d8", body: "#24598e", shadow: "#102a48" },
  yellow: { edge: "#e6c65e", body: "#b88723", shadow: "#59400f" },
  green: { edge: "#83bd91", body: "#3c7950", shadow: "#183622" },
};

export function PlateIntro({ onReady, onMorphStart, onReplay }: PlateIntroProps) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<"checking" | "intro" | "ready">("checking");
  const [replayCount, setReplayCount] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const plateRefs = useRef<Array<HTMLDivElement | null>>([]);
  const dustRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const floorRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const reducedMotionRef = useRef(reducedMotion);

  useEffect(() => { reducedMotionRef.current = reducedMotion; }, [reducedMotion]);

  const finish = () => {
    timelineRef.current?.kill();
    setPhase("ready");
    onReady();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forceIntro = process.env.NODE_ENV === "development" || params.get("intro") === "1" || replayCount > 0;
    const skipIntro = params.get("intro") === "skip" && replayCount === 0;
    const seen = window.localStorage.getItem("gymtracker_intro_seen") === "1";
    if (reducedMotion === null) return;
    if (reducedMotion || skipIntro || (!forceIntro && seen)) {
      gsap.set(sceneRef.current, { autoAlpha: 0 });
      const readyTimer = window.setTimeout(() => {
        setPhase("ready");
        onReady();
      }, 0);
      return () => window.clearTimeout(readyTimer);
    }

    window.localStorage.setItem("gymtracker_intro_seen", "1");
    onReplay();
    const introTimer = window.setTimeout(() => setPhase("intro"), 0);
    const context = gsap.context(() => {
      const bar = barRef.current;
      const plates = plateRefs.current.filter(Boolean) as HTMLDivElement[];
      const dust = dustRefs.current.filter(Boolean) as HTMLSpanElement[];
      if (!bar) return;

      gsap.set(sceneRef.current, { autoAlpha: 1 });
      gsap.set(bar, { autoAlpha: 0, y: 36, rotate: -1.5 });
      gsap.set(plates, { autoAlpha: 0, y: -window.innerHeight * 0.62, scale: 1.08 });
      gsap.set(dust, { autoAlpha: 0, scale: 0.2 });

      const timeline = gsap.timeline({ defaults: { overwrite: "auto" }, onComplete: finish });
      timelineRef.current = timeline;
      timeline.to(bar, { autoAlpha: 1, y: 0, rotate: 0, duration: 0.42, ease: "power3.out" });

      plates.forEach((plate, index) => {
        const data = plateData[index];
        const impact = data.delay + 0.57;
        const direction = data.side === "left" ? -1 : 1;
        timeline.to(plate, { autoAlpha: 1, duration: 0.05 }, data.delay);
        timeline.to(plate, { y: 0, duration: 0.56, ease: "power3.in" }, data.delay);
        timeline.to(plate, { scaleY: 0.9, scaleX: 1.05, duration: 0.055, ease: "power2.out" }, impact);
        timeline.to(plate, { scaleY: 1.04, scaleX: 0.98, duration: 0.11, ease: "power2.out" }, impact + 0.055);
        timeline.to(plate, { scale: 1, duration: 0.2, ease: "elastic.out(1, 0.7)" }, impact + 0.165);
        timeline.fromTo(dust[index], { x: direction * 30, y: 0, autoAlpha: 0, scale: 0.2 }, { x: direction * 105, y: -12 - index * 3, autoAlpha: 0.48, scale: 1, duration: 0.13, ease: "power2.out" }, impact);
        timeline.to(dust[index], { autoAlpha: 0, scale: 0.3, duration: 0.28, ease: "power1.out" }, impact + 0.13);
      });

      timeline.to([bar, ...plates], { y: 7, scaleY: 0.985, duration: 0.12, ease: "power2.out" }, 1.93);
      timeline.to([bar, ...plates], { y: 0, scaleY: 1, duration: 0.3, ease: "elastic.out(1, 0.65)" }, 2.05);
      timeline.call(onMorphStart, [], 2.42);
      timeline.to([bar, ...plates], { scale: 0.82, x: 0, duration: 0.54, ease: "power3.inOut" }, 2.42);
      timeline.to(bar, { scaleX: 0.56, scaleY: 0.34, y: 86, autoAlpha: 0.55, duration: 0.5, ease: "power2.inOut" }, 2.42);
      timeline.to(plates, { x: 0, y: 86, borderRadius: 18, scale: 0.42, duration: 0.5, ease: "power2.inOut" }, 2.42);
      timeline.to(floorRef.current, { autoAlpha: 0, duration: 0.34 }, 2.42);
      timeline.to(sceneRef.current, { autoAlpha: 0, duration: 0.34, ease: "power2.out" }, 2.98);
    }, rootRef);

    return () => {
      window.clearTimeout(introTimer);
      timelineRef.current?.kill();
      context.revert();
    };
    // onReady is intentionally stable for the page lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, replayCount]);

  const skip = () => {
    timelineRef.current?.kill();
    gsap.set(sceneRef.current, { autoAlpha: 0 });
    finish();
  };
  const replay = () => {
    if (reducedMotionRef.current || !rootRef.current) return;
    onReplay();
    setReplayCount((count) => count + 1);
  };

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(255,91,37,0.075),transparent_38%),radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.03),transparent_52%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(135deg,transparent_0%,transparent_49%,rgba(255,255,255,0.03)_50%,transparent_51%)] [background-size:24px_24px]" />
      <div className="absolute left-1/2 top-8 -translate-x-1/2 font-mono text-[10px] font-semibold uppercase tracking-[0.38em] text-zinc-600">GymTracker</div>
      {phase === "intro" ? <button type="button" onClick={skip} className="pointer-events-auto absolute bottom-6 right-6 z-30 rounded-full px-2 py-2 text-xs text-zinc-500 transition hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">Skip intro →</button> : null}
      {phase === "ready" && !reducedMotion ? <button type="button" onClick={replay} className="pointer-events-auto absolute bottom-6 right-6 z-30 rounded-full px-2 py-2 text-xs text-zinc-600 transition hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">Replay intro →</button> : null}

      <div ref={sceneRef} className="absolute left-1/2 top-[47%] h-[min(33vw,280px)] w-[min(88vw,1050px)] -translate-x-1/2 -translate-y-1/2 sm:h-[min(29vw,330px)]" aria-hidden="true">
        <div ref={floorRef} className="absolute bottom-[7%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-[6%] left-1/2 h-8 w-[72%] -translate-x-1/2 rounded-[50%] bg-black/70 blur-2xl" />
        <div ref={barRef} className="absolute left-1/2 top-[48%] h-[clamp(9px,1.1vw,16px)] w-full -translate-x-1/2 rounded-full bg-gradient-to-b from-zinc-200 via-zinc-500 to-zinc-800 shadow-[0_10px_22px_rgba(0,0,0,0.6)]">
          <span className="absolute left-1/2 top-0 h-full w-[16%] -translate-x-1/2 opacity-35 [background-image:repeating-linear-gradient(90deg,transparent_0,transparent_6px,rgba(0,0,0,0.7)_7px,transparent_8px)]" />
          <span className="absolute left-[-1%] top-1/2 h-[clamp(28px,3vw,48px)] w-[clamp(8px,0.8vw,14px)] -translate-y-1/2 rounded bg-zinc-700" />
          <span className="absolute right-[-1%] top-1/2 h-[clamp(28px,3vw,48px)] w-[clamp(8px,0.8vw,14px)] -translate-y-1/2 rounded bg-zinc-700" />
        </div>
        {plateData.map((plate, index) => {
          const side = plate.side === "left" ? -1 : 1;
          const offset = 24 + index * 1.2;
          const color = colors[plate.color];
          return <div key={plate.color + plate.side} ref={(node) => { plateRefs.current[index] = node; }} className="absolute left-1/2 top-[48%] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-[0_18px_30px_rgba(0,0,0,0.55)]" style={{ width: `clamp(${plate.size * 0.45}px, ${plate.size / 10}vw, ${plate.size}px)`, height: `clamp(${plate.size * 0.45}px, ${plate.size / 10}vw, ${plate.size}px)`, marginLeft: `calc(${side} * ${offset}%)`, background: `radial-gradient(circle at 33% 25%, ${color.edge} 0%, ${color.body} 30%, ${color.shadow} 100%)`, borderColor: color.edge }}>
            <span className="absolute inset-[10%] rounded-full border border-black/25" />
            <span className="absolute inset-[28%] rounded-full border border-white/15 bg-black/10" />
            <span className="absolute inset-[38%] rounded-full bg-zinc-950 shadow-[inset_0_2px_3px_rgba(255,255,255,0.18)]" />
            <span className="absolute inset-x-[18%] top-[13%] h-px rotate-[-25deg] bg-white/25" />
          </div>;
        })}
        {plateData.map((plate, index) => <span key={plate.color + "dust"} ref={(node) => { dustRefs.current[index] = node; }} className="absolute left-1/2 top-[50%] h-1 w-1 rounded-full bg-zinc-400/50" />)}
      </div>
    </div>
  );
}
