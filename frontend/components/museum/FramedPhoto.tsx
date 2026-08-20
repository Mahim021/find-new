"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { FRAME_BORDER, type PlacedPhoto } from "@/lib/level";
import { useMuseumStore } from "@/lib/store";
import { frameMaterialFor, type FrameStyle } from "@/lib/themes";

const MAT_BORDER = 0.045;

export default function FramedPhoto({ photo, frameStyle }: { photo: PlacedPhoto; frameStyle: FrameStyle }) {
  const texture = useTexture(photo.src);
  const hitRef = useRef<THREE.Mesh>(null);
  const registerInteractable = useMuseumStore((s) => s.registerInteractable);
  const unregisterInteractable = useMuseumStore((s) => s.unregisterInteractable);
  const hoveredKey = useMuseumStore((s) => s.hoveredKey);
  const key = `photo:${photo.id}`;
  const isHovered = hoveredKey === key;
  const material = frameMaterialFor(frameStyle);

  useEffect(() => {
    if (hitRef.current) {
      hitRef.current.userData.kind = "photo";
      hitRef.current.userData.id = photo.id;
      registerInteractable(key, hitRef.current);
    }
    return () => unregisterInteractable(key);
  }, [key, photo.id, registerInteractable, unregisterInteractable]);

  const w = photo.frameWidth;
  const h = photo.frameHeight;
  const frameW = w + FRAME_BORDER * 2;
  const frameH = h + FRAME_BORDER * 2;
  const matW = w + MAT_BORDER * 2;
  const matH = h + MAT_BORDER * 2;

  return (
    <group position={photo.position} rotation={[0, photo.rotationY, 0]}>
      {/* Outer frame */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[frameW, frameH, 0.06]} />
        <meshStandardMaterial color={material.color} roughness={material.roughness} metalness={material.metalness} />
      </mesh>
      {/* Mat */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[matW, matH]} />
        <meshStandardMaterial color={material.matColor} roughness={0.9} />
      </mesh>
      {/* Photo (unlit so it reads true regardless of room mood lighting) */}
      <mesh position={[0, 0, 0.011]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* Soft glow ring when in interaction range */}
      {isHovered && (
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[w + 0.06, h + 0.06]} />
          <meshBasicMaterial color="#ffe8b8" transparent opacity={0.28} />
        </mesh>
      )}
      {/* Invisible, larger hit target for comfortable center-screen aiming */}
      <mesh ref={hitRef} position={[0, 0, 0.02]}>
        <planeGeometry args={[matW + 0.2, matH + 0.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
