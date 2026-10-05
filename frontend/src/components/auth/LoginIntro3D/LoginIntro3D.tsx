"use client";

import { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, ReactNode, RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { CanvasTexture, Color, DoubleSide, MathUtils, Mesh as ThreeMesh, MeshBasicMaterial as ThreeMeshBasicMaterial, PlaneGeometry, PMREMGenerator, Scene } from "three";
import type { DirectionalLight, Group, Mesh, PerspectiveCamera } from "three";
import { Barbell } from "./Barbell";
import { BAR_HALF_LENGTH, FINAL_ELEVATION, FINAL_FOV, INTRO_DURATION, PLATE_DEPTH, PLATE_RADIUS, PLATE_SPECS, STACK_HEIGHT } from "./loginIntroTypes";
import type { IntroPhase, IntroSceneApi } from "./loginIntroTypes";

type Vec3 = [number, number, number];
type IntroMode = "pending" | "play" | "static";

interface LoginIntro3DProps {
  /** The empty layout box beside the login that the finished stack must occupy. */
  stackSlotRef: RefObject<HTMLDivElement | null>;
  onReady: () => void;
  onMorphStart: () => void;
  onReplay: () => void;
  /** WebGL is unavailable: the page should draw its CSS stack instead. */
  onFallback: () => void;
}
interface DebugState {
  phase: IntroPhase;
  elapsed: number;
  barRotation: number;
  activePlate: number | null;
  releasedCount: number;
  stackedCount: number;
}
interface SceneProps {
  apiRef: MutableRefObject<IntroSceneApi | null>;
  stackSlotRef: RefObject<HTMLDivElement | null>;
  runKey: number;
  mode: IntroMode;
  debugMode: boolean;
  debugAt: number | null;
  onPhase: (phase: IntroPhase) => void;
  onDebug: (state: DebugState) => void;
  onReady: () => void;
  onMorphStart: () => void;
}
interface BoundaryProps { children: ReactNode; onError: () => void; }
interface BoundaryState { failed: boolean; }

class WebGLBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };
  static getDerivedStateFromError(): BoundaryState { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

const HERO_FOV = 40;
const mix = MathUtils.lerp;
const mix3 = (from: Vec3, to: Vec3, amount: number): Vec3 => [mix(from[0], to[0], amount), mix(from[1], to[1], amount), mix(from[2], to[2], amount)];
const orbit = (target: Vec3, azimuth: number, elevation: number, distance: number): Vec3 => [
  target[0] + distance * Math.sin(azimuth) * Math.cos(elevation),
  target[1] + distance * Math.sin(elevation),
  target[2] + distance * Math.cos(azimuth) * Math.cos(elevation),
];

/* A soft pool of lit floor that fades to the page background, so the scene
   never shows a horizon or a floor edge behind the login. */
function useFloorFalloff() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (context) {
      const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.45, "#9a9a9a");
      gradient.addColorStop(0.8, "#262626");
      gradient.addColorStop(1, "#000000");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 256);
    }
    return new CanvasTexture(canvas);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/* Image-based light: four soft boxes fixed in the world, baked once into a
   prefiltered environment map. It is broad, does not fall off with distance
   and does not depend on which way the bar faces. */
const STUDIO_PANELS: Array<{ position: Vec3; size: [number, number]; color: string; intensity: number }> = [
  { position: [0, 9, 3], size: [14, 9], color: "#f5f0e9", intensity: 2.4 },
  { position: [0, 3, 12], size: [16, 7], color: "#eef1f3", intensity: 1.1 },
  { position: [-10, 3, 2], size: [7, 7], color: "#ffd8bd", intensity: 1.8 },
  { position: [10, 4, -1], size: [7, 7], color: "#cfe0ea", intensity: 1.5 },
];

function useStudioEnvironment() {
  const renderer = useThree((state) => state.gl);
  const sceneRef = useRef(useThree((state) => state.scene));
  useEffect(() => {
    const scene = sceneRef.current;
    const studio = new Scene();
    studio.background = new Color("#040505");
    const panels = STUDIO_PANELS.map((panel) => {
      const mesh = new ThreeMesh(
        new PlaneGeometry(panel.size[0], panel.size[1]),
        new ThreeMeshBasicMaterial({ color: new Color(panel.color).multiplyScalar(panel.intensity), side: DoubleSide, toneMapped: false }),
      );
      mesh.position.set(panel.position[0], panel.position[1], panel.position[2]);
      mesh.lookAt(0, 2, 0);
      studio.add(mesh);
      return mesh;
    });
    const generator = new PMREMGenerator(renderer);
    const environment = generator.fromScene(studio, 0.02);
    scene.environment = environment.texture;
    return () => {
      scene.environment = null;
      environment.dispose();
      generator.dispose();
      panels.forEach((mesh) => { mesh.geometry.dispose(); mesh.material.dispose(); });
    };
  }, [renderer]);
}

function IntroScene({ apiRef, stackSlotRef, runKey, mode, debugMode, debugAt, onPhase, onDebug, onReady, onMorphStart }: SceneProps) {
  const camera = useThree((state) => state.camera);
  const canvasElement = useThree((state) => state.gl.domElement);
  const invalidate = useThree((state) => state.invalidate);
  const cameraRef = useRef(camera as PerspectiveCamera);
  const barbellRef = useRef<Group | null>(null);
  const hardwareRef = useRef<Group | null>(null);
  const plateRefs = useRef<Array<Group | null>>([]);
  const floorRef = useRef<Mesh | null>(null);
  const keyLightRef = useRef<DirectionalLight | null>(null);
  /* theta stands the bar up on its -X end; lift is the set-down at the start. */
  const rig = useRef({ theta: 0, lift: 0 });
  /* ab blends the horizontal hero shot into the upright shot, bc blends that
     into the final stack-beside-login shot. kick is the camera's small jolt
     when a plate lands after the long fall. */
  const shot = useRef({ ab: 0, bc: 0, kick: 0 });
  const floorFalloff = useFloorFalloff();
  useStudioEnvironment();

  useEffect(() => { cameraRef.current = camera as PerspectiveCamera; }, [camera]);

  /* Everything that depends on the viewport is recomputed every frame from
     the live layout, so the shots stay correct through resizes and the final
     stack always lands in the DOM slot. */
  useFrame(() => {
    const perspectiveCamera = cameraRef.current;
    const assembly = barbellRef.current;
    const canvasRect = canvasElement.getBoundingClientRect();
    const width = canvasRect.width;
    const height = canvasRect.height;
    if (!assembly || !width || !height) return;

    const { theta, lift } = rig.current;
    assembly.rotation.z = theta;
    assembly.position.set(BAR_HALF_LENGTH * Math.cos(theta), PLATE_RADIUS + lift + (BAR_HALF_LENGTH - PLATE_RADIUS) * Math.sin(theta), 0);

    const { ab, bc, kick } = shot.current;
    const aspect = width / height;
    const visibleHeight = Math.min(height, window.innerHeight);
    const heroSlope = Math.tan(MathUtils.degToRad(HERO_FOV / 2));
    const fit = (sceneWidth: number, sceneHeight: number) => Math.max((sceneHeight / 2) * (height / visibleHeight), sceneWidth / 2 / aspect) / heroSlope;

    const horizontalTarget: Vec3 = [BAR_HALF_LENGTH, 0.95, 0];
    const horizontalPosition = orbit(horizontalTarget, -0.32, 0.13, fit(9.2, 3.6));
    const uprightTarget: Vec3 = [0, BAR_HALF_LENGTH, 0];
    const uprightPosition = orbit(uprightTarget, -0.2, 0.12, fit(3.6, 8.6));
    const heroAnchor: [number, number] = [width / 2, visibleHeight / 2];

    /* Final shot: solved so the front rim of the stack spans the slot
       exactly, top edge to bottom edge, making one plate one row tall. */
    const finalTarget: Vec3 = [0, STACK_HEIGHT / 2, PLATE_RADIUS];
    const finalSlope = Math.tan(MathUtils.degToRad(FINAL_FOV / 2));
    const slotRect = stackSlotRef.current?.getBoundingClientRect();
    let finalDistance = (STACK_HEIGHT * 1.9 * (height / visibleHeight)) / 2 / finalSlope;
    let finalAnchor = heroAnchor;
    if (slotRect && slotRect.height > 0) {
      const focal = height / (2 * finalSlope);
      const rise = (STACK_HEIGHT / 2) * Math.cos(FINAL_ELEVATION);
      const reach = (STACK_HEIGHT / 2) * Math.sin(FINAL_ELEVATION);
      finalDistance = (focal * rise + Math.sqrt(focal * focal * rise * rise + slotRect.height * slotRect.height * reach * reach)) / slotRect.height;
      /* The top of the stack is nearer the raised camera than the bottom, so
         the stack's midpoint projects slightly below the slot's centre. */
      const sag = (focal * rise * reach) / (finalDistance * finalDistance - reach * reach);
      finalAnchor = [slotRect.left + slotRect.width / 2 - canvasRect.left, slotRect.top + slotRect.height / 2 - canvasRect.top + sag];
    }
    const finalPosition = orbit(finalTarget, 0, FINAL_ELEVATION, finalDistance);

    const position = mix3(mix3(horizontalPosition, uprightPosition, ab), finalPosition, bc);
    const target = mix3(mix3(horizontalTarget, uprightTarget, ab), finalTarget, bc);
    const anchorX = mix(heroAnchor[0], finalAnchor[0], bc);
    const anchorY = mix(heroAnchor[1], finalAnchor[1], bc);
    perspectiveCamera.position.set(position[0], position[1] - kick, position[2]);
    perspectiveCamera.fov = mix(HERO_FOV, FINAL_FOV, bc);
    perspectiveCamera.aspect = aspect;
    /* The view offset is a lens shift: it slides the framed subject to its
       screen anchor without introducing off-axis perspective. */
    perspectiveCamera.setViewOffset(width, height, width / 2 - anchorX, height / 2 - anchorY, width, height);
    perspectiveCamera.lookAt(target[0], target[1] - kick, target[2]);

    const floor = floorRef.current;
    if (floor) {
      const radius = mix(6.2, 1.35, bc);
      floor.position.x = mix(2.4, 0, bc);
      floor.scale.set(radius, radius, 1);
    }
    const shadowCamera = keyLightRef.current?.shadow.camera;
    if (shadowCamera) {
      const extent = mix(9.5, 3.2, bc);
      shadowCamera.left = -extent;
      shadowCamera.right = extent;
      shadowCamera.top = extent;
      shadowCamera.bottom = -extent;
      shadowCamera.updateProjectionMatrix();
    }
  });

  /* Once the scene is static it renders on demand; redraw when the layout
     moves the slot without resizing the canvas (an error message, a font). */
  useEffect(() => {
    let frame = 0;
    let lastKey = "";
    const watch = () => {
      const slotRect = stackSlotRef.current?.getBoundingClientRect();
      const canvasRect = canvasElement.getBoundingClientRect();
      const key = slotRect ? `${slotRect.left - canvasRect.left}|${slotRect.top - canvasRect.top}|${slotRect.width}|${slotRect.height}|${canvasRect.width}|${canvasRect.height}|${window.innerHeight}` : "";
      if (key !== lastKey) { lastKey = key; invalidate(); }
      frame = window.requestAnimationFrame(watch);
    };
    frame = window.requestAnimationFrame(watch);
    return () => window.cancelAnimationFrame(frame);
  }, [canvasElement, invalidate, stackSlotRef]);

  useEffect(() => {
    const hardware = hardwareRef.current;
    const plates = plateRefs.current.filter(Boolean) as Group[];
    if (mode === "pending" || !hardware || plates.length !== PLATE_SPECS.length) return;

    const rigState = rig.current;
    const shotState = shot.current;
    rigState.theta = 0;
    rigState.lift = 0.42;
    shotState.ab = 0;
    shotState.bc = 0;
    shotState.kick = 0;
    hardware.visible = true;
    hardware.position.set(0, 0, 0);
    plates.forEach((plate, index) => {
      plate.position.set(PLATE_SPECS[index].loadedX, 0, 0);
      plate.rotation.set(0, 0, 0);
      plate.scale.set(1, 1, 1);
    });

    const timeline = gsap.timeline({ paused: true });
    let currentPhase: IntroPhase = "INTRO";
    let releasedCount = 0;
    let stackedCount = 0;
    const report = (nextPhase: IntroPhase, activePlate: number | null = null) => {
      currentPhase = nextPhase;
      onPhase(nextPhase);
      onDebug({ phase: nextPhase, elapsed: timeline.time(), barRotation: rigState.theta, activePlate, releasedCount, stackedCount });
    };

    report("INTRO");
    /* The loaded bar is set down and rests on its plates. */
    timeline.call(() => report("BAR_ENTER"), [], 0.02);
    timeline.to(rigState, { lift: 0, duration: 0.3, ease: "power2.in" }, 0.05);
    timeline.to(rigState, { lift: 0.03, duration: 0.07, ease: "power2.out" }, 0.35);
    timeline.to(rigState, { lift: 0, duration: 0.09, ease: "power2.in" }, 0.42);

    /* It is stood up on its end: the hero 90 degree rotation. */
    timeline.call(() => report("BAR_ROTATE_VERTICAL"), [], 0.75);
    timeline.to(rigState, { theta: Math.PI / 2, duration: 1, ease: "power2.inOut" }, 0.75);
    timeline.to(shotState, { ab: 1, duration: 1, ease: "power2.inOut" }, 0.75);
    timeline.call(() => report("BAR_SETTLE"), [], 1.75);
    timeline.call(() => report("PLATE_RELEASE"), [], 1.96);

    PLATE_SPECS.forEach((spec, index) => {
      const plate = plates[index];
      const land = spec.releaseTime + spec.fallDuration;
      const squash = spec.heavyImpact ? 0.94 : 0.975;
      const rebound = spec.heavyImpact ? 0.03 : 0.01;
      const lean = spec.fallDuration > 0.3 ? (index % 2 === 0 ? 0.022 : -0.022) : 0;
      timeline.call(() => { releasedCount += 1; report("PLATE_DROP", index); }, [], spec.releaseTime);
      /* Quadratic ease-in is constant acceleration: free fall down the bar. */
      timeline.to(plate.position, { x: spec.stackX, duration: spec.fallDuration, ease: "power2.in" }, spec.releaseTime);
      if (lean) {
        timeline.to(plate.rotation, { z: lean, duration: spec.fallDuration * 0.45, ease: "sine.out" }, spec.releaseTime);
        timeline.to(plate.rotation, { z: 0, duration: 0.12, ease: "power2.out" }, land);
      }
      /* Impact: the rubber compresses against the stack, rebounds a hair, settles. */
      timeline.to(plate.scale, { x: squash, duration: 0.05, ease: "power2.out" }, land);
      timeline.to(plate.position, { x: spec.stackX - ((1 - squash) * PLATE_DEPTH) / 2, duration: 0.05, ease: "power2.out" }, land);
      timeline.to(plate.scale, { x: 1, duration: 0.1, ease: "power2.out" }, land + 0.05);
      timeline.to(plate.position, { x: spec.stackX + rebound, duration: 0.1, ease: "power2.out" }, land + 0.05);
      timeline.to(plate.position, { x: spec.stackX, duration: 0.11, ease: "power2.in" }, land + 0.15);
      timeline.call(() => { stackedCount += 1; report(stackedCount === PLATE_SPECS.length ? "STACK_SETTLE" : "STACK_FORMING"); }, [], land + 0.26);

      if (spec.fallDuration > 0.3) {
        timeline.to(shotState, { kick: 0.035, duration: 0.04, ease: "power2.out" }, land);
        timeline.to(shotState, { kick: 0, duration: 0.22, ease: "power2.out" }, land + 0.04);
      }
    });

    /* The bar is drawn up and out; only the stack remains. Then one
       continuous move carries the camera in and the stack to its place
       beside the login, which emerges as the move resolves. */
    timeline.call(() => report("STACK_TO_LOGIN"), [], 3.7);
    timeline.to(hardware.position, { x: 12, duration: 0.8, ease: "power2.in" }, 3.7);
    timeline.call(() => { hardware.visible = false; }, [], 4.5);
    timeline.to(shotState, { bc: 1, duration: 1.05, ease: "power3.inOut" }, 3.9);
    timeline.call(() => report("MORPHING"), [], 4.4);
    timeline.call(() => { onMorphStart(); report("LOGIN_REVEAL"); }, [], 4.7);
    timeline.call(() => { report("READY"); onReady(); }, [], INTRO_DURATION);

    if (debugMode) {
      let lastDebugTime = -1;
      timeline.eventCallback("onUpdate", () => {
        const elapsed = timeline.time();
        if (Math.abs(elapsed - lastDebugTime) < 0.05) return;
        lastDebugTime = elapsed;
        onDebug({ phase: currentPhase, elapsed, barRotation: rigState.theta, activePlate: null, releasedCount, stackedCount });
      });
    }

    const skip = () => { timeline.progress(1); invalidate(); };
    apiRef.current = { skip };
    if (mode === "static") timeline.progress(1);
    else if (debugAt !== null) timeline.time(Math.min(debugAt, INTRO_DURATION));
    else timeline.play(0);
    invalidate();
    return () => { timeline.kill(); if (apiRef.current?.skip === skip) apiRef.current = null; };
  }, [apiRef, debugAt, debugMode, invalidate, mode, onDebug, onMorphStart, onPhase, onReady, runKey]);

  return (<>
    <color attach="background" args={["#08090b"]} />
    {/* Direct light is directional only: no distance falloff, no fog. */}
    <hemisphereLight args={["#dfe6e9", "#1a1d1c", 0.55]} />
    <directionalLight ref={keyLightRef} position={[-4, 9, 7]} intensity={1.7} color="#f6ece2" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.018} shadow-camera-near={0.5} shadow-camera-far={40} />
    <directionalLight position={[1.5, 2.5, 10]} intensity={0.75} color="#eef1f3" />
    <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[1, 64]} />
      <meshStandardMaterial color="#15181a" roughness={0.92} metalness={0} envMapIntensity={0.5} alphaMap={floorFalloff} transparent depthWrite={false} />
    </mesh>
    <Barbell groupRef={barbellRef} hardwareRef={hardwareRef} plateRefs={plateRefs} />
  </>);
}

const skipButtonClass = "pointer-events-auto absolute bottom-4 right-4 z-30 inline-flex min-h-11 items-center rounded px-3 text-[0.8125rem] text-zinc-400 [font-family:var(--font-geist-sans)] transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400";

export function LoginIntro3D({ stackSlotRef, onReady, onMorphStart, onReplay, onFallback }: LoginIntro3DProps) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<IntroPhase>("CHECKING");
  const [runKey, setRunKey] = useState(0);
  const [mode, setMode] = useState<IntroMode>("pending");
  const [webglFailed, setWebglFailed] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugState>({ phase: "CHECKING", elapsed: 0, barRotation: 0, activePlate: null, releasedCount: 0, stackedCount: 0 });
  const apiRef = useRef<IntroSceneApi | null>(null);
  const search = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
  const debugMode = process.env.NODE_ENV === "development" && search?.get("intro") === "debug";
  /* /login?intro=debug&at=2.4 freezes the timeline at 2.4s for inspection. */
  const debugAtParam = debugMode ? Number.parseFloat(search?.get("at") ?? "") : Number.NaN;
  const debugAt = Number.isFinite(debugAtParam) && runKey === 0 ? debugAtParam : null;

  useEffect(() => {
    if (reducedMotion === null) return;
    const params = new URLSearchParams(window.location.search);
    const forceIntro = process.env.NODE_ENV === "development" || params.get("intro") === "1" || params.get("intro") === "debug" || runKey > 0;
    const forceSkip = params.get("intro") === "skip";
    const seen = window.localStorage.getItem("gymtracker_intro_seen") === "1";
    const skip = reducedMotion || forceSkip || (!forceIntro && seen);
    const timer = window.setTimeout(() => {
      if (skip) { setMode("static"); return; }
      window.localStorage.setItem("gymtracker_intro_seen", "1");
      onReplay();
      setPhase("INTRO");
      setMode("play");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [onReplay, reducedMotion, runKey]);

  const skip = () => apiRef.current?.skip();
  const replay = () => { if (reducedMotion) return; setRunKey((key) => key + 1); };
  const handleWebGLFailure = useCallback(() => { setWebglFailed(true); setPhase("READY"); onFallback(); onReady(); }, [onFallback, onReady]);
  const settled = phase === "READY";

  return (<div className="pointer-events-none absolute inset-0 overflow-hidden">
    {mode !== "pending" && !webglFailed ? <div className="absolute inset-0" aria-hidden="true"><WebGLBoundary onError={handleWebGLFailure}><Canvas shadows="percentage" frameloop={settled ? "demand" : "always"} dpr={[1, 2]} camera={{ fov: HERO_FOV, near: 0.1, far: 90, position: [3.6, 2, 12] }} gl={{ antialias: true, alpha: false }}><IntroScene apiRef={apiRef} stackSlotRef={stackSlotRef} runKey={runKey} mode={mode} debugMode={debugMode} debugAt={debugAt} onPhase={setPhase} onDebug={setDebugInfo} onReady={onReady} onMorphStart={onMorphStart} /></Canvas></WebGLBoundary></div> : null}
    {mode === "play" && !settled && !webglFailed ? <button type="button" onClick={skip} aria-label="Skip the barbell intro" className={skipButtonClass}>Skip intro</button> : null}
    {settled && !reducedMotion && !webglFailed ? <button type="button" onClick={replay} aria-label="Replay the barbell intro" className={skipButtonClass}>Replay intro</button> : null}
    {debugMode ? <pre className="pointer-events-none absolute left-4 top-4 z-40 rounded border border-white/10 bg-black/70 p-3 font-mono text-[10px] leading-5 text-zinc-300">{`phase: ${debugInfo.phase}\nelapsed: ${debugInfo.elapsed.toFixed(2)}s\nbar rotation: ${debugInfo.barRotation.toFixed(2)}rad\nreleased: ${debugInfo.releasedCount}/${PLATE_SPECS.length}\nstacked: ${debugInfo.stackedCount}/${PLATE_SPECS.length}`}</pre> : null}
  </div>);
}
