import { createPhysicsScene } from "../../physics_model/index.js";
import { dom } from "./dom.js";
import { physicsState } from "./state.js";

const MAX_POINTER_DELTA_PX = 120;

let pointerDown = false;
let lastPointerX = null;
let lastPointerY = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizePointer(clientX, clientY) {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  return {
    x: clamp(clientX / width, 0, 1),
    y: clamp(clientY / height, 0, 1)
  };
}

function getPointerDelta(clientX, clientY) {
  if (lastPointerX === null || lastPointerY === null) {
    lastPointerX = clientX;
    lastPointerY = clientY;
    return { dx: 0, dy: 0 };
  }

  const dx = clamp(clientX - lastPointerX, -MAX_POINTER_DELTA_PX, MAX_POINTER_DELTA_PX);
  const dy = clamp(clientY - lastPointerY, -MAX_POINTER_DELTA_PX, MAX_POINTER_DELTA_PX);
  lastPointerX = clientX;
  lastPointerY = clientY;
  return { dx, dy };
}

function emitPointer(clientX, clientY, isDown) {
  if (!physicsState.runtime) {
    return;
  }

  const { x, y } = normalizePointer(clientX, clientY);
  const { dx, dy } = getPointerDelta(clientX, clientY);
  physicsState.runtime.onPointerMove(x, y, dx, dy, isDown);
}

function bindPointerEvents() {
  if (physicsState.pointerBound) {
    return;
  }

  window.addEventListener("pointerdown", (event) => {
    pointerDown = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    emitPointer(event.clientX, event.clientY, true);
  }, { passive: true });

  window.addEventListener("pointermove", (event) => {
    const isDown = pointerDown || event.buttons > 0;
    if (!isDown) {
      return;
    }
    emitPointer(event.clientX, event.clientY, true);
  }, { passive: true });

  window.addEventListener("pointerup", (event) => {
    emitPointer(event.clientX, event.clientY, false);
    pointerDown = false;
  }, { passive: true });

  window.addEventListener("pointercancel", () => {
    pointerDown = false;
    lastPointerX = null;
    lastPointerY = null;
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    pointerDown = false;
    lastPointerX = null;
    lastPointerY = null;
  }, { passive: true });

  physicsState.pointerBound = true;
}

function bindResize() {
  if (physicsState.resizeBound) {
    return;
  }

  window.addEventListener("resize", () => {
    if (!physicsState.runtime) {
      return;
    }
    physicsState.runtime.resize();
  });

  physicsState.resizeBound = true;
}

function bindVisibility() {
  if (physicsState.visibilityBound) {
    return;
  }

  document.addEventListener("visibilitychange", () => {
    if (!physicsState.runtime) {
      return;
    }

    if (document.visibilityState === "visible") {
      physicsState.runtime.start();
    } else {
      physicsState.runtime.stop();
    }
  });

  physicsState.visibilityBound = true;
}

function ensureRuntime() {
  if (!dom.physicsLayer || physicsState.runtime) {
    return;
  }

  physicsState.runtime = createPhysicsScene({ canvas: dom.physicsLayer });
  physicsState.runtime.resize();
  physicsState.runtime.start();

  bindPointerEvents();
  bindResize();
  bindVisibility();

  physicsState.isReady = physicsState.runtime.isSupported();
}

export function applyEffects() {
  ensureRuntime();

  if (!dom.physicsLayer || !physicsState.runtime || !physicsState.runtime.isSupported()) {
    document.body.dataset.physics = "off";
    return;
  }

  document.body.dataset.physics = "on";
}

export function initializeEffects() {
  applyEffects();
}
