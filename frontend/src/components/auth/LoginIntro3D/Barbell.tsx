"use client";

import type { Group } from "three";
import { usePlateGeometry, WeightPlate } from "./WeightPlate";
import { BAR_HALF_LENGTH, COLLAR_WIDTH, PLATE_SPECS, SHAFT_HALF_LENGTH, SHAFT_RADIUS, SLEEVE_RADIUS } from "./loginIntroTypes";

const sleeveLength = BAR_HALF_LENGTH - SHAFT_HALF_LENGTH;
const sleeveCenter = SHAFT_HALF_LENGTH + sleeveLength / 2;
const collarCenter = SHAFT_HALF_LENGTH + COLLAR_WIDTH / 2;
const ends = [-1, 1] as const;

/* The bar hardware lives in its own group so it can leave the scene while the
   plates, which are siblings of that group, stay exactly where they landed. */
export function Barbell({ groupRef, hardwareRef, plateRefs }: { groupRef: React.RefObject<Group | null>; hardwareRef: React.RefObject<Group | null>; plateRefs: React.MutableRefObject<Array<Group | null>> }) {
  const plateGeometry = usePlateGeometry();
  return (
    <group ref={groupRef}>
      <group ref={hardwareRef}>
        <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[SHAFT_RADIUS, SHAFT_RADIUS, SHAFT_HALF_LENGTH * 2, 32]} />
          <meshStandardMaterial color="#9aa2a5" roughness={0.42} metalness={0.9} />
        </mesh>
        {ends.map((end) => (
          <group key={end}>
            <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]} position={[end * sleeveCenter, 0, 0]}>
              <cylinderGeometry args={[SLEEVE_RADIUS, SLEEVE_RADIUS, sleeveLength, 32]} />
              <meshStandardMaterial color="#c3c9cb" roughness={0.28} metalness={0.95} />
            </mesh>
            <mesh castShadow rotation={[0, 0, Math.PI / 2]} position={[end * collarCenter, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, COLLAR_WIDTH, 32]} />
              <meshStandardMaterial color="#8d9598" roughness={0.36} metalness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
      {PLATE_SPECS.map((spec, index) => (
        <group key={index} ref={(node) => { plateRefs.current[index] = node; }} position={[spec.loadedX, 0, 0]}>
          <WeightPlate geometry={plateGeometry} />
        </group>
      ))}
    </group>
  );
}
