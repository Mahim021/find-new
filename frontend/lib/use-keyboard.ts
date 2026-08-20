"use client";

import { useEffect, useRef } from "react";

export interface KeyboardState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
}

const FORWARD_KEYS = new Set(["KeyW", "ArrowUp"]);
const BACKWARD_KEYS = new Set(["KeyS", "ArrowDown"]);
const LEFT_KEYS = new Set(["KeyA", "ArrowLeft"]);
const RIGHT_KEYS = new Set(["KeyD", "ArrowRight"]);

export function useKeyboard() {
  const state = useRef<KeyboardState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => setKey(e, true);
    const up = (e: KeyboardEvent) => setKey(e, false);

    function setKey(e: KeyboardEvent, value: boolean) {
      if (FORWARD_KEYS.has(e.code)) state.current.forward = value;
      else if (BACKWARD_KEYS.has(e.code)) state.current.backward = value;
      else if (LEFT_KEYS.has(e.code)) state.current.left = value;
      else if (RIGHT_KEYS.has(e.code)) state.current.right = value;
      else if (e.code === "ShiftLeft" || e.code === "ShiftRight") state.current.sprint = value;
    }

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return state;
}
