"use client";

import { motion, useReducedMotion } from "framer-motion";

const labels: Record<string, string> = {
  chest: "Chest", back: "Back", shoulders: "Shoulders", biceps: "Biceps",
  triceps: "Triceps", forearms: "Forearms", abs: "Core", quads: "Quadriceps",
  hamstrings: "Hamstrings", glutes: "Glutes", calves: "Calves", full_body: "Full body",
};

interface AnatomyMuscleMapProps {
  muscleGroup?: string;
  exerciseName?: string;
}

interface PatchProps {
  d: string;
  group: string;
  activeGroup: string;
  reducedMotion: boolean;
}

function Patch({ d, group, activeGroup, reducedMotion }: PatchProps) {
  const active = activeGroup === group || activeGroup === "full_body";
  return (
    <motion.path
      d={d}
      initial={false}
      animate={{ fill: active ? "#34d399" : "#3f3f46", opacity: active ? 0.96 : 0.3 }}
      transition={{ duration: reducedMotion ? 0 : 0.45, ease: "easeOut" }}
      stroke={active ? "#a7f3d0" : "#52525b"}
      strokeWidth={active ? 1.4 : 0.7}
      vectorEffect="non-scaling-stroke"
    />
  );
}

export function AnatomyMuscleMap({ muscleGroup = "", exerciseName }: AnatomyMuscleMapProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const activeGroup = muscleGroup in labels ? muscleGroup : "";
  const label = activeGroup ? labels[activeGroup] : "Choose an exercise";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 lg:sticky lg:top-6">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Muscle focus</p>
          <h2 className="mt-1 text-xl font-semibold text-zinc-100" aria-live="polite">{label}</h2>
          <p className="mt-1 min-h-5 text-sm text-zinc-500">
            {exerciseName || "The active area responds as you select an exercise."}
          </p>
        </div>
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.55)]" aria-hidden="true" />
      </div>

      <div className="relative mx-auto mt-4 max-w-[320px]">
        <div className="pointer-events-none absolute inset-x-10 top-1/3 h-40 rounded-full bg-emerald-500/[0.04] blur-3xl" aria-hidden="true" />
        <svg viewBox="0 0 320 520" className="relative h-auto w-full" role="img" aria-label={`${label} highlighted on a stylized athletic figure`}>
          <defs>
            <linearGradient id="body-shell" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#27272a" />
              <stop offset="1" stopColor="#18181b" />
            </linearGradient>
          </defs>
          <circle cx="160" cy="50" r="34" fill="url(#body-shell)" stroke="#3f3f46" strokeWidth="2" />
          <path d="M143 82 L177 82 L184 104 L136 104 Z" fill="#202024" />
          <path d="M126 101 C98 107 88 132 88 169 L99 270 C104 300 119 321 132 331 L188 331 C201 321 216 300 221 270 L232 169 C232 132 222 107 194 101 C181 96 173 94 160 94 C147 94 139 96 126 101 Z" fill="url(#body-shell)" stroke="#3f3f46" strokeWidth="2" />
          <path d="M94 121 C73 128 62 151 57 186 L42 284 C40 299 49 310 61 310 C73 309 78 300 80 287 L91 226 L107 154 Z" fill="url(#body-shell)" stroke="#3f3f46" strokeWidth="2" />
          <path d="M226 121 C247 128 258 151 263 186 L278 284 C280 299 271 310 259 310 C247 309 242 300 240 287 L229 226 L213 154 Z" fill="url(#body-shell)" stroke="#3f3f46" strokeWidth="2" />
          <path d="M132 326 C113 345 109 377 106 416 L102 491 C102 506 113 513 126 508 L145 490 L154 348 Z" fill="url(#body-shell)" stroke="#3f3f46" strokeWidth="2" />
          <path d="M188 326 C207 345 211 377 214 416 L218 491 C218 506 207 513 194 508 L175 490 L166 348 Z" fill="url(#body-shell)" stroke="#3f3f46" strokeWidth="2" />

          <Patch group="shoulders" activeGroup={activeGroup} reducedMotion={reducedMotion} d="M101 124 C105 108 121 102 137 105 L132 132 C121 142 109 141 98 135 Z M219 124 C215 108 199 102 183 105 L188 132 C199 142 211 141 222 135 Z" />
          <Patch group="chest" activeGroup={activeGroup} reducedMotion={reducedMotion} d="M132 118 C141 111 151 111 157 116 L157 166 C141 169 126 160 119 143 Z M188 118 C179 111 169 111 163 116 L163 166 C179 169 194 160 201 143 Z" />
          <Patch group="back" activeGroup={activeGroup} reducedMotion={reducedMotion} d="M116 151 C108 172 109 213 122 246 L143 224 L140 175 Z M204 151 C212 172 211 213 198 246 L177 224 L180 175 Z" />
          <Patch group="biceps" activeGroup={activeGroup} reducedMotion={reducedMotion} d="M82 151 C70 167 68 198 76 218 L91 213 L99 157 Z M238 151 C250 167 252 198 244 218 L229 213 L221 157 Z" />
          <Patch group="triceps" activeGroup={activeGroup} reducedMotion={reducedMotion} d="M99 149 C102 168 98 196 91 215 L103 220 L114 158 Z M221 149 C218 168 222 196 229 215 L217 220 L206 158 Z" />
          <Patch group="forearms" activeGroup={activeGroup} reducedMotion={reducedMotion} d="M72 224 L89 228 L76 286 C73 299 64 302 56 295 Z M248 224 L231 228 L244 286 C247 299 256 302 264 295 Z" />
          <Patch group="abs" activeGroup={activeGroup} reducedMotion={reducedMotion} d="M144 177 L157 174 L157 218 L143 218 Z M163 174 L176 177 L177 218 L163 218 Z M143 224 L157 224 L157 268 L139 264 Z M163 224 L177 224 L181 264 L163 268 Z" />
          <Patch group="glutes" activeGroup={activeGroup} reducedMotion={reducedMotion} d="M127 285 C137 273 150 275 157 285 L157 320 C140 321 129 312 124 300 Z M193 285 C183 273 170 275 163 285 L163 320 C180 321 191 312 196 300 Z" />
          <Patch group="quads" activeGroup={activeGroup} reducedMotion={reducedMotion} d="M127 338 C139 331 149 339 151 352 L144 416 C137 431 121 425 117 409 L118 367 Z M193 338 C181 331 171 339 169 352 L176 416 C183 431 199 425 203 409 L202 367 Z" />
          <Patch group="hamstrings" activeGroup={activeGroup} reducedMotion={reducedMotion} d="M115 344 C108 364 109 397 116 421 L128 415 L132 344 Z M205 344 C212 364 211 397 204 421 L192 415 L188 344 Z" />
          <Patch group="calves" activeGroup={activeGroup} reducedMotion={reducedMotion} d="M113 426 C105 447 105 478 111 495 L128 490 L137 432 C130 423 121 421 113 426 Z M207 426 C215 447 215 478 209 495 L192 490 L183 432 C190 423 199 421 207 426 Z" />
        </svg>
      </div>
      <p className="mt-2 text-center text-xs leading-5 text-zinc-600">
        Broad training regions only — a focused cue, not a medical anatomy model.
      </p>
    </section>
  );
}
