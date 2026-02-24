function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function fract(value) {
  return value - Math.floor(value);
}

function hash(value) {
  return fract(Math.sin(value) * 43758.5453123);
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function createColor(intensity, tint) {
  const cold = [0.09, 0.17, 0.29];
  const hot = [0.27, 0.45, 0.71];
  return [
    mix(cold[0], hot[0], intensity) * tint,
    mix(cold[1], hot[1], intensity) * tint,
    mix(cold[2], hot[2], intensity) * tint
  ];
}

export function createPointerController(config) {
  const queue = [];
  let idleAccumulator = 0;
  let idleSeed = Math.random() * 1000;

  function enqueue(impulse) {
    queue.push(impulse);
    if (queue.length > 96) {
      queue.shift();
    }
  }

  function push(x, y, dx, dy, isDown) {
    const safeX = clamp01(x);
    const safeY = clamp01(1 - y);
    if (!isDown) {
      return;
    }

    const speed = Math.hypot(dx, dy);
    const intensity = clamp01(speed / 54);
    const forceScale = 1.2;

    enqueue({
      x: safeX,
      y: safeY,
      dx,
      dy,
      force: config.pointerForce * forceScale * (0.35 + intensity),
      radius: config.pointerRadius * (0.82 + intensity * 0.86),
      color: createColor(intensity, 1.0)
    });
  }

  function emitIdle(dt) {
    idleAccumulator += dt;
    if (idleAccumulator < config.idleIntervalSec) {
      return;
    }

    idleAccumulator = 0;
    idleSeed += 0.73;

    const x = 0.12 + hash(idleSeed * 1.11) * 0.76;
    const y = 0.1 + hash(idleSeed * 0.91 + 4.17) * 0.8;
    const dx = (hash(idleSeed * 1.37 + 9.31) - 0.5) * 18;
    const dy = (hash(idleSeed * 1.93 + 1.07) - 0.5) * 18;
    const tint = 0.9 + hash(idleSeed * 2.17) * 0.28;
    const intensity = 0.3 + hash(idleSeed * 0.57) * 0.4;

    enqueue({
      x,
      y,
      dx,
      dy,
      force: config.idleForce * (0.75 + intensity),
      radius: config.pointerRadius * 2.4,
      color: createColor(intensity, tint)
    });
  }

  function drain() {
    if (queue.length === 0) {
      return [];
    }

    const pending = queue.slice();
    queue.length = 0;
    return pending;
  }

  return {
    push,
    emitIdle,
    drain
  };
}
