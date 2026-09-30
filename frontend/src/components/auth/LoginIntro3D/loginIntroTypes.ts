export type IntroPhase = "CHECKING" | "INTRO" | "BAR_ENTER" | "BAR_ROTATE_VERTICAL" | "BAR_SETTLE" | "PLATE_RELEASE" | "PLATE_DROP" | "STACK_FORMING" | "STACK_SETTLE" | "STACK_TO_LOGIN" | "MORPHING" | "LOGIN_REVEAL" | "READY";

export interface IntroSceneApi {
  skip: () => void;
}

export interface PlateSpec {
  /** Centre of the plate along the bar while it is loaded on a sleeve. */
  loadedX: number;
  /** Centre of the plate along the bar once it rests in the stack. */
  stackX: number;
  releaseTime: number;
  fallDuration: number;
  /** A plate landing on the floor or after the long fall compresses visibly. */
  heavyImpact: boolean;
}

/* One canonical plate. Every plate in the scene and in the final login stack
   is built from these numbers; nothing scales a plate individually. */
export const PLATE_RADIUS = 0.72;
export const PLATE_DEPTH = 0.3;
export const PLATE_GAP = 0.018;
export const PLATE_PITCH = PLATE_DEPTH + PLATE_GAP;
export const PLATE_COUNT = 5;
export const STACK_HEIGHT = PLATE_COUNT * PLATE_DEPTH + (PLATE_COUNT - 1) * PLATE_GAP;

/* Barbell, along its own X axis. The -X end is the one that meets the floor. */
export const BAR_HALF_LENGTH = 3.6;
export const SHAFT_HALF_LENGTH = 2.15;
export const SHAFT_RADIUS = 0.045;
export const SLEEVE_RADIUS = 0.078;
export const COLLAR_WIDTH = 0.1;
export const BORE_RADIUS = 0.086;

/* Final camera: a slightly raised side view, so the stack reads as five thick
   slabs with the top plate's face and bore still visible. The CSS variable
   --plate-aspect in globals.css is derived from these two values. */
export const FINAL_ELEVATION = 0.23;
export const FINAL_FOV = 16;

const firstLoaded = SHAFT_HALF_LENGTH + COLLAR_WIDTH + 0.01 + PLATE_DEPTH / 2;
const stackX = (index: number) => -BAR_HALF_LENGTH + PLATE_DEPTH / 2 + index * PLATE_PITCH;

/* Three plates ride the lower sleeve and two the upper one. Once the bar is
   upright the lower three only have the sleeve's free travel to drop; the
   upper two fall the whole shaft, so they are timed as real free fall. */
export const PLATE_SPECS: PlateSpec[] = [
  { loadedX: -(firstLoaded + 2 * PLATE_PITCH), stackX: stackX(0), releaseTime: 2.0, fallDuration: 0.17, heavyImpact: true },
  { loadedX: -(firstLoaded + PLATE_PITCH), stackX: stackX(1), releaseTime: 2.13, fallDuration: 0.17, heavyImpact: false },
  { loadedX: -firstLoaded, stackX: stackX(2), releaseTime: 2.26, fallDuration: 0.17, heavyImpact: false },
  { loadedX: firstLoaded, stackX: stackX(3), releaseTime: 2.5, fallDuration: 0.55, heavyImpact: true },
  { loadedX: firstLoaded + PLATE_PITCH, stackX: stackX(4), releaseTime: 2.78, fallDuration: 0.55, heavyImpact: true },
];

export const INTRO_DURATION = 5.15;
