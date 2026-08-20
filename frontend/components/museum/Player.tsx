"use client";
/* eslint-disable react-hooks/immutability --
   this component drives react-three-fiber's imperative render loop
   (useFrame), where mutating camera/scene-graph objects outside React's
   render phase is the documented, correct r3f pattern — not a purity bug. */

import { useRef, useEffect, type ComponentRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useKeyboard } from "@/lib/use-keyboard";
import { resolveMove } from "@/lib/collision";
import { getRoomAt, PLAYER_EYE_HEIGHT, type LevelData } from "@/lib/level";
import { useMuseumStore } from "@/lib/store";

const WALK_SPEED = 3.1;
const SPRINT_SPEED = 5.4;
const MAX_INTERACT_DISTANCE = 4.5;

export default function Player({ level }: { level: LevelData }) {
  const controlsRef = useRef<ComponentRef<typeof PointerLockControls>>(null);
  const keys = useKeyboard();
  const { camera, raycaster, gl } = useThree();
  const setLocked = useMuseumStore((s) => s.setLocked);
  const setCurrentRoomId = useMuseumStore((s) => s.setCurrentRoomId);
  const setHoveredKey = useMuseumStore((s) => s.setHoveredKey);
  const selectedPhoto = useMuseumStore((s) => s.selectedPhoto);
  const setSelectedPhoto = useMuseumStore((s) => s.setSelectedPhoto);
  const collectHeart = useMuseumStore((s) => s.collectHeart);
  const lastRoomId = useRef<string | null>(null);
  const forwardVec = useRef(new THREE.Vector3());
  const rightVec = useRef(new THREE.Vector3());
  const upVec = useRef(new THREE.Vector3(0, 1, 0));

  useEffect(() => {
    camera.position.set(...level.spawn);
  }, [camera, level.spawn]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onLock = () => setLocked(true);
    const onUnlock = () => setLocked(false);
    controls.addEventListener("lock", onLock);
    controls.addEventListener("unlock", onUnlock);
    return () => {
      controls.removeEventListener("lock", onLock);
      controls.removeEventListener("unlock", onUnlock);
    };
  }, [setLocked]);

  // Drive pointer-lock acquisition ourselves rather than relying solely on
  // drei's internal document click listener, whose one-shot connect effect
  // can miss the canvas element when it mounts behind a Suspense boundary.
  useEffect(() => {
    function onClickToLock() {
      if (!useMuseumStore.getState().isLocked && !useMuseumStore.getState().selectedPhoto && !useMuseumStore.getState().openNote) {
        controlsRef.current?.lock();
      }
    }
    window.addEventListener("click", onClickToLock);
    return () => window.removeEventListener("click", onClickToLock);
  }, []);

  // Click-to-interact with whatever is currently hovered (crosshair-centered).
  useEffect(() => {
    function onClick() {
      const isLocked = useMuseumStore.getState().isLocked;
      const hoveredKey = useMuseumStore.getState().hoveredKey;
      if (!isLocked || !hoveredKey) return;
      const [kind, id] = hoveredKey.split(":");

      if (kind === "photo") {
        const photo = level.photos.find((p) => p.id === id);
        if (photo) {
          setSelectedPhoto(photo);
          controlsRef.current?.unlock();
        }
      } else if (kind === "collectible") {
        const heart = level.hearts.find((h) => h.id === id);
        if (heart) {
          collectHeart(heart.id, heart.note);
          controlsRef.current?.unlock();
        }
      }
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [level.photos, level.hearts, setSelectedPhoto, collectHeart]);

  useFrame((_, delta) => {
    const isLocked = useMuseumStore.getState().isLocked;
    const paused = !!selectedPhoto || !!useMuseumStore.getState().openNote;

    if (isLocked && !paused) {
      const k = keys.current;
      const speed = (k.sprint ? SPRINT_SPEED : WALK_SPEED) * delta;

      camera.getWorldDirection(forwardVec.current);
      forwardVec.current.y = 0;
      forwardVec.current.normalize();
      rightVec.current.crossVectors(forwardVec.current, upVec.current).normalize();

      let moveX = 0;
      let moveZ = 0;
      if (k.forward) {
        moveX += forwardVec.current.x * speed;
        moveZ += forwardVec.current.z * speed;
      }
      if (k.backward) {
        moveX -= forwardVec.current.x * speed;
        moveZ -= forwardVec.current.z * speed;
      }
      if (k.right) {
        moveX += rightVec.current.x * speed;
        moveZ += rightVec.current.z * speed;
      }
      if (k.left) {
        moveX -= rightVec.current.x * speed;
        moveZ -= rightVec.current.z * speed;
      }

      if (moveX !== 0 || moveZ !== 0) {
        const desiredX = camera.position.x + moveX;
        const desiredZ = camera.position.z + moveZ;
        const resolved = resolveMove(camera.position.x, camera.position.z, desiredX, desiredZ, level.walls);
        camera.position.x = resolved.x;
        camera.position.z = resolved.z;
        camera.position.y = PLAYER_EYE_HEIGHT;
      }

      const room = getRoomAt(camera.position.z, level.rooms, level.lobby);
      const roomId = room?.id ?? null;
      if (roomId !== lastRoomId.current) {
        lastRoomId.current = roomId;
        setCurrentRoomId(roomId);
      }
    }

    // Center-screen raycast to find the nearest interactable (photo or collectible).
    if (!paused) {
      const cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir);
      raycaster.set(camera.position, cameraDir);
      const objects = Array.from(useMuseumStore.getState().interactables.values());
      const hits = raycaster.intersectObjects(objects, true);
      const hit = hits.find((h) => h.distance <= MAX_INTERACT_DISTANCE);
      let hitObj = hit?.object ?? null;
      while (hitObj && !hitObj.userData.kind && hitObj.parent) hitObj = hitObj.parent;
      const kind = hitObj?.userData.kind as string | undefined;
      const id = hitObj?.userData.id as string | undefined;
      const hitKey = kind && id ? `${kind}:${id}` : null;
      if (hitKey !== useMuseumStore.getState().hoveredKey) {
        setHoveredKey(hitKey);
      }
    } else if (useMuseumStore.getState().hoveredKey !== null) {
      setHoveredKey(null);
    }
  });

  return <PointerLockControls ref={controlsRef} domElement={gl.domElement} />;
}
