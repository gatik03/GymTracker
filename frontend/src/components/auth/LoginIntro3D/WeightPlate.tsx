"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, CylinderGeometry, LatheGeometry, SRGBColorSpace, Vector2 } from "three";
import type { BufferGeometry, Texture } from "three";
import { BORE_RADIUS, PLATE_DEPTH, PLATE_RADIUS } from "./loginIntroTypes";

export interface PlateGeometry {
  rubber: BufferGeometry;
  hub: BufferGeometry;
  stripe: BufferGeometry;
  label: BufferGeometry;
  labelMap: Texture;
}

const HUB_RADIUS = 0.2;
const RADIAL_SEGMENTS = 96;
const LABEL_HEIGHT = 0.056;
const LABEL_ARC = (LABEL_HEIGHT * 4) / PLATE_RADIUS;
const LABEL_BEARING = -0.5;

/* Turns a closed outline into a lathe profile. Long edges get an extra point
   just inside each end so the lathe's averaged normals stay confined to the
   corners: faces shade flat and edges read as a tight moulded radius. */
function latheProfile(outline: Array<[number, number]>) {
  const points: Vector2[] = [];
  for (let index = 0; index < outline.length - 1; index += 1) {
    const [x1, y1] = outline[index];
    const [x2, y2] = outline[index + 1];
    const length = Math.hypot(x2 - x1, y2 - y1);
    points.push(new Vector2(x1, y1));
    if (length > 0.03) {
      const inset = 0.005 / length;
      points.push(new Vector2(x1 + (x2 - x1) * inset, y1 + (y2 - y1) * inset));
      points.push(new Vector2(x2 - (x2 - x1) * inset, y2 - (y2 - y1) * inset));
    }
  }
  const [lastX, lastY] = outline[outline.length - 1];
  points.push(new Vector2(lastX, lastY));
  return points;
}

function bevel(centerX: number, centerY: number, radius: number, from: number, to: number): Array<[number, number]> {
  const steps = 5;
  return Array.from({ length: steps + 1 }, (_, step) => {
    const angle = from + ((to - from) * step) / steps;
    return [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius] as [number, number];
  });
}

/* The canonical bumper plate: a rubber body with a raised outer lip, a
   recessed web, a raised boss around a steel hub insert, and a real bore. */
function buildPlateGeometry(): PlateGeometry {
  const half = PLATE_DEPTH / 2;
  const web = half - 0.032;
  const edge = 0.026;
  const rubberOutline: Array<[number, number]> = [
    [HUB_RADIUS, -half],
    [0.275, -half],
    [0.305, -web],
    [0.585, -web],
    [0.615, -half],
    ...bevel(PLATE_RADIUS - edge, -half + edge, edge, -Math.PI / 2, 0),
    ...bevel(PLATE_RADIUS - edge, half - edge, edge, 0, Math.PI / 2),
    [0.615, half],
    [0.585, web],
    [0.305, web],
    [0.275, half],
    [HUB_RADIUS, half],
    [HUB_RADIUS, -half],
  ];
  const hubHalf = half + 0.004;
  const hubOutline: Array<[number, number]> = [
    [BORE_RADIUS, -hubHalf],
    [HUB_RADIUS + 0.004, -hubHalf],
    [HUB_RADIUS + 0.004, hubHalf],
    [BORE_RADIUS, hubHalf],
    [BORE_RADIUS, -hubHalf],
  ];
  return {
    rubber: new LatheGeometry(latheProfile(rubberOutline), RADIAL_SEGMENTS),
    hub: new LatheGeometry(latheProfile(hubOutline), 64),
    stripe: new CylinderGeometry(PLATE_RADIUS + 0.0015, PLATE_RADIUS + 0.0015, 0.03, RADIAL_SEGMENTS, 1, true),
    label: new CylinderGeometry(PLATE_RADIUS + 0.002, PLATE_RADIUS + 0.002, LABEL_HEIGHT, 16, 1, true, LABEL_BEARING - LABEL_ARC / 2, LABEL_ARC),
    labelMap: buildLabelMap(),
  };
}

/* The weight marking moulded into the rim, as on a real bumper plate. */
function buildLabelMap() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#c4cacc";
    context.font = "700 84px 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("20 KG", 256, 68);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  /* A stacked plate's axis points down the bar, so the map is turned to read upright. */
  texture.center.set(0.5, 0.5);
  texture.rotation = Math.PI;
  texture.anisotropy = 4;
  return texture;
}

/* Built once and shared by every plate, so the plates cannot drift apart. */
export function usePlateGeometry() {
  const geometry = useMemo(() => buildPlateGeometry(), []);
  useEffect(() => () => {
    geometry.rubber.dispose();
    geometry.hub.dispose();
    geometry.stripe.dispose();
    geometry.label.dispose();
    geometry.labelMap.dispose();
  }, [geometry]);
  return geometry;
}

export function WeightPlate({ geometry }: { geometry: PlateGeometry }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh geometry={geometry.rubber} castShadow receiveShadow>
        <meshStandardMaterial color="#25292c" roughness={0.74} metalness={0} envMapIntensity={0.9} />
      </mesh>
      <mesh geometry={geometry.hub} castShadow receiveShadow>
        <meshStandardMaterial color="#b9c0c2" roughness={0.32} metalness={0.92} />
      </mesh>
      <mesh geometry={geometry.stripe}>
        <meshStandardMaterial color="#d8703a" roughness={0.62} metalness={0} />
      </mesh>
      <mesh geometry={geometry.label} position={[0, -0.062, 0]}>
        <meshStandardMaterial map={geometry.labelMap} transparent depthWrite={false} roughness={0.7} metalness={0} />
      </mesh>
    </group>
  );
}
