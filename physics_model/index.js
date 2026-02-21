import { PHYSICS_CONFIG } from "./config.js";
import { createParticleSystem } from "./engine/particles.js";
import { createPointerController } from "./engine/pointer.js";
import { createFluidSimulation } from "./engine/simulation.js";
import { createWebGLContext } from "./gl/context.js";

function createNoopScene() {
  return {
    start() {},
    stop() {},
    resize() {},
    onPointerMove() {},
    destroy() {},
    isSupported() {
      return false;
    }
  };
}

export function createPhysicsScene({ canvas }) {
  const gl = createWebGLContext(canvas);
  if (!canvas || !gl) {
    return createNoopScene();
  }

  let simulation;
  let particles;
  try {
    simulation = createFluidSimulation({ gl, config: PHYSICS_CONFIG });
    particles = createParticleSystem({ gl, config: PHYSICS_CONFIG });
  } catch (error) {
    if (simulation) {
      simulation.destroy();
    }
    if (particles) {
      particles.destroy();
    }
    console.warn("Physics model disabled:", error);
    return createNoopScene();
  }
  const pointer = createPointerController(PHYSICS_CONFIG);

  let animationFrameId = null;
  let running = false;
  let lastFrameTime = performance.now();
  let width = Math.max(1, canvas.width);
  let height = Math.max(1, canvas.height);

  function renderFrame(now) {
    if (!running) {
      return;
    }

    const deltaSec = Math.min((now - lastFrameTime) / 1000, PHYSICS_CONFIG.maxDeltaSec);
    const safeDelta = Number.isFinite(deltaSec) ? Math.max(0.0001, deltaSec) : 0.016;
    lastFrameTime = now;

    pointer.emitIdle(safeDelta);
    const impulses = pointer.drain();

    simulation.step(safeDelta, impulses);

    const velocityTexture = simulation.getVelocityTexture();
    particles.step(safeDelta, now * 0.001, velocityTexture);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    simulation.render(width, height, now * 0.001);
    particles.render(width, height, velocityTexture);

    animationFrameId = window.requestAnimationFrame(renderFrame);
  }

  function resize() {
    const dpr = Math.max(1, Math.min(2.6, window.devicePixelRatio || 1));
    const nextWidth = Math.max(1, Math.floor(window.innerWidth * dpr));
    const nextHeight = Math.max(1, Math.floor(window.innerHeight * dpr));

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }

    width = nextWidth;
    height = nextHeight;
    simulation.setAspect(width / Math.max(1, height));
  }

  function start() {
    if (running) {
      return;
    }

    running = true;
    lastFrameTime = performance.now();
    animationFrameId = window.requestAnimationFrame(renderFrame);
  }

  function stop() {
    if (!running) {
      return;
    }

    running = false;
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function onPointerMove(x, y, dx, dy, isDown) {
    pointer.push(x, y, dx, dy, isDown);
  }

  function destroy() {
    stop();
    simulation.destroy();
    particles.destroy();
  }

  resize();

  return {
    start,
    stop,
    resize,
    onPointerMove,
    destroy,
    isSupported() {
      return true;
    }
  };
}
