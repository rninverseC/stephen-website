import { PHYSICS_CONFIG } from "../config.js";
import { createDoubleFBO, createRenderTarget } from "../gl/fbo.js";
import { createFullscreenGeometry, createProgram } from "../gl/program.js";
import { ADVECTION_FRAGMENT_SHADER } from "../shaders/fluid/advect.js";
import { COMPOSITE_FRAGMENT_SHADER } from "../shaders/fluid/composite.js";
import { CURL_FRAGMENT_SHADER } from "../shaders/fluid/curl.js";
import { DIVERGENCE_FRAGMENT_SHADER } from "../shaders/fluid/divergence.js";
import { GRADIENT_SUBTRACT_FRAGMENT_SHADER } from "../shaders/fluid/gradient-subtract.js";
import { PRESSURE_JACOBI_FRAGMENT_SHADER } from "../shaders/fluid/pressure.js";
import { SPLAT_FRAGMENT_SHADER } from "../shaders/fluid/splat.js";
import { VORTICITY_FRAGMENT_SHADER } from "../shaders/fluid/vorticity.js";
import { FULLSCREEN_VERTEX_SHADER } from "../shaders/shared/fullscreen-vertex.js";

function setUniform1f(gl, location, value) {
  if (location) {
    gl.uniform1f(location, value);
  }
}

function setUniform1i(gl, location, value) {
  if (location) {
    gl.uniform1i(location, value);
  }
}

function setUniform2f(gl, location, x, y) {
  if (location) {
    gl.uniform2f(location, x, y);
  }
}

function setUniform3f(gl, location, x, y, z) {
  if (location) {
    gl.uniform3f(location, x, y, z);
  }
}

function bindTexture(gl, texture, unit) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

function clearRenderTarget(gl, target, r = 0, g = 0, b = 0, a = 1) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
  gl.viewport(0, 0, target.width, target.height);
  gl.clearColor(r, g, b, a);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

export function createFluidSimulation({ gl, config = PHYSICS_CONFIG }) {
  const simResolution = config.simResolution;
  const texelSizeX = 1 / simResolution;
  const texelSizeY = 1 / simResolution;

  const velocity = createDoubleFBO(gl, simResolution, simResolution, gl.RG16F, gl.RG, gl.HALF_FLOAT, gl.LINEAR);
  const dye = createDoubleFBO(gl, simResolution, simResolution, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
  const pressure = createDoubleFBO(gl, simResolution, simResolution, gl.RG16F, gl.RG, gl.HALF_FLOAT, gl.NEAREST);
  const divergence = createRenderTarget(gl, simResolution, simResolution, gl.RG16F, gl.RG, gl.HALF_FLOAT, gl.NEAREST);
  const curl = createRenderTarget(gl, simResolution, simResolution, gl.RG16F, gl.RG, gl.HALF_FLOAT, gl.NEAREST);

  const fullscreen = createFullscreenGeometry(gl);

  const advectProgram = createProgram(
    gl,
    FULLSCREEN_VERTEX_SHADER,
    ADVECTION_FRAGMENT_SHADER,
    ["uVelocity", "uSource", "uTexelSize", "uDt", "uDissipation"]
  );
  const divergenceProgram = createProgram(
    gl,
    FULLSCREEN_VERTEX_SHADER,
    DIVERGENCE_FRAGMENT_SHADER,
    ["uVelocity", "uTexelSize"]
  );
  const pressureProgram = createProgram(
    gl,
    FULLSCREEN_VERTEX_SHADER,
    PRESSURE_JACOBI_FRAGMENT_SHADER,
    ["uPressure", "uDivergence", "uTexelSize"]
  );
  const gradientProgram = createProgram(
    gl,
    FULLSCREEN_VERTEX_SHADER,
    GRADIENT_SUBTRACT_FRAGMENT_SHADER,
    ["uPressure", "uVelocity", "uTexelSize"]
  );
  const splatProgram = createProgram(
    gl,
    FULLSCREEN_VERTEX_SHADER,
    SPLAT_FRAGMENT_SHADER,
    ["uTarget", "uPoint", "uValue", "uRadius", "uAspect"]
  );
  const curlProgram = createProgram(
    gl,
    FULLSCREEN_VERTEX_SHADER,
    CURL_FRAGMENT_SHADER,
    ["uVelocity", "uTexelSize"]
  );
  const vorticityProgram = createProgram(
    gl,
    FULLSCREEN_VERTEX_SHADER,
    VORTICITY_FRAGMENT_SHADER,
    ["uVelocity", "uCurl", "uTexelSize", "uDt", "uStrength"]
  );
  const compositeProgram = createProgram(
    gl,
    FULLSCREEN_VERTEX_SHADER,
    COMPOSITE_FRAGMENT_SHADER,
    ["uDye", "uVelocity", "uTime", "uOverlayAlpha"]
  );

  const programs = [
    advectProgram,
    divergenceProgram,
    pressureProgram,
    gradientProgram,
    splatProgram,
    curlProgram,
    vorticityProgram,
    compositeProgram
  ];

  const targets = [velocity, dye, pressure, divergence, curl];

  clearRenderTarget(gl, velocity.read);
  clearRenderTarget(gl, velocity.write);
  clearRenderTarget(gl, dye.read);
  clearRenderTarget(gl, dye.write);
  clearRenderTarget(gl, pressure.read);
  clearRenderTarget(gl, pressure.write);
  clearRenderTarget(gl, divergence);
  clearRenderTarget(gl, curl);

  let viewportAspect = 1;

  function draw(program, target, width, height) {
    gl.useProgram(program.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(0, 0, width, height);
  }

  function runAdvection(velocityTexture, sourceTexture, destination, dt, dissipation) {
    gl.disable(gl.BLEND);
    draw(advectProgram, destination, simResolution, simResolution);
    bindTexture(gl, velocityTexture, 0);
    bindTexture(gl, sourceTexture, 1);
    setUniform1i(gl, advectProgram.uniforms.uVelocity, 0);
    setUniform1i(gl, advectProgram.uniforms.uSource, 1);
    setUniform2f(gl, advectProgram.uniforms.uTexelSize, texelSizeX, texelSizeY);
    setUniform1f(gl, advectProgram.uniforms.uDt, dt);
    setUniform1f(gl, advectProgram.uniforms.uDissipation, dissipation);
    fullscreen.draw();
  }

  function runSplat(doubleTarget, x, y, value, radius) {
    draw(splatProgram, doubleTarget.write, simResolution, simResolution);
    bindTexture(gl, doubleTarget.read.texture, 0);
    setUniform1i(gl, splatProgram.uniforms.uTarget, 0);
    setUniform2f(gl, splatProgram.uniforms.uPoint, x, y);
    setUniform3f(gl, splatProgram.uniforms.uValue, value[0], value[1], value[2]);
    setUniform1f(gl, splatProgram.uniforms.uRadius, radius);
    setUniform1f(gl, splatProgram.uniforms.uAspect, viewportAspect);
    fullscreen.draw();
    doubleTarget.swap();
  }

  function runCurlPass() {
    draw(curlProgram, curl, simResolution, simResolution);
    bindTexture(gl, velocity.read.texture, 0);
    setUniform1i(gl, curlProgram.uniforms.uVelocity, 0);
    setUniform2f(gl, curlProgram.uniforms.uTexelSize, texelSizeX, texelSizeY);
    fullscreen.draw();
  }

  function runVorticity(dt) {
    draw(vorticityProgram, velocity.write, simResolution, simResolution);
    bindTexture(gl, velocity.read.texture, 0);
    bindTexture(gl, curl.texture, 1);
    setUniform1i(gl, vorticityProgram.uniforms.uVelocity, 0);
    setUniform1i(gl, vorticityProgram.uniforms.uCurl, 1);
    setUniform2f(gl, vorticityProgram.uniforms.uTexelSize, texelSizeX, texelSizeY);
    setUniform1f(gl, vorticityProgram.uniforms.uDt, dt);
    setUniform1f(gl, vorticityProgram.uniforms.uStrength, config.vorticity);
    fullscreen.draw();
    velocity.swap();
  }

  function runDivergencePass() {
    draw(divergenceProgram, divergence, simResolution, simResolution);
    bindTexture(gl, velocity.read.texture, 0);
    setUniform1i(gl, divergenceProgram.uniforms.uVelocity, 0);
    setUniform2f(gl, divergenceProgram.uniforms.uTexelSize, texelSizeX, texelSizeY);
    fullscreen.draw();
  }

  function runPressureSolve() {
    clearRenderTarget(gl, pressure.read);
    clearRenderTarget(gl, pressure.write);

    for (let i = 0; i < config.pressureIterations; i += 1) {
      draw(pressureProgram, pressure.write, simResolution, simResolution);
      bindTexture(gl, pressure.read.texture, 0);
      bindTexture(gl, divergence.texture, 1);
      setUniform1i(gl, pressureProgram.uniforms.uPressure, 0);
      setUniform1i(gl, pressureProgram.uniforms.uDivergence, 1);
      setUniform2f(gl, pressureProgram.uniforms.uTexelSize, texelSizeX, texelSizeY);
      fullscreen.draw();
      pressure.swap();
    }
  }

  function runGradientSubtract() {
    draw(gradientProgram, velocity.write, simResolution, simResolution);
    bindTexture(gl, pressure.read.texture, 0);
    bindTexture(gl, velocity.read.texture, 1);
    setUniform1i(gl, gradientProgram.uniforms.uPressure, 0);
    setUniform1i(gl, gradientProgram.uniforms.uVelocity, 1);
    setUniform2f(gl, gradientProgram.uniforms.uTexelSize, texelSizeX, texelSizeY);
    fullscreen.draw();
    velocity.swap();
  }

  function applyImpulses(impulses) {
    if (!impulses || impulses.length === 0) {
      return;
    }

    for (const impulse of impulses) {
      const velocityX = impulse.dx * impulse.force * 0.00045;
      const velocityY = -impulse.dy * impulse.force * 0.00045;
      const speed = Math.hypot(impulse.dx, impulse.dy);
      const safeSpeed = speed > 0.0001 ? speed : 1;
      const dirX = impulse.dx / safeSpeed;
      const dirY = -impulse.dy / safeSpeed;
      const mainVelocityRadius = impulse.radius * 0.78;
      const mainDyeRadius = impulse.radius * 1.42;
      const colorR = impulse.color[0];
      const colorG = impulse.color[1];
      const colorB = impulse.color[2];
      const trailStep = 0.0028;

      runSplat(
        velocity,
        impulse.x,
        impulse.y,
        [velocityX, velocityY, 0],
        mainVelocityRadius
      );

      runSplat(
        dye,
        impulse.x,
        impulse.y,
        [colorR, colorG, colorB],
        mainDyeRadius
      );

      if (speed > 0.28) {
        for (let i = 1; i <= 3; i += 1) {
          const falloff = i === 1 ? 0.5 : i === 2 ? 0.32 : 0.18;
          const trailX = Math.min(0.995, Math.max(0.005, impulse.x - dirX * trailStep * i));
          const trailY = Math.min(0.995, Math.max(0.005, impulse.y - dirY * trailStep * i));

          runSplat(
            velocity,
            trailX,
            trailY,
            [velocityX * falloff * 0.34, velocityY * falloff * 0.34, 0],
            mainVelocityRadius * (1 - i * 0.18)
          );

          runSplat(
            dye,
            trailX,
            trailY,
            [colorR * falloff, colorG * falloff, colorB * falloff],
            mainDyeRadius * (1 - i * 0.2)
          );
        }
      }
    }
  }

  function step(deltaSec, impulses) {
    const baseDt = Math.min(Math.max(deltaSec, 0), config.maxDeltaSec);
    const dt = Math.max(0.00005, baseDt * (config.timeScale ?? 1));

    runAdvection(velocity.read.texture, velocity.read.texture, velocity.write, dt, config.velocityDissipation);
    velocity.swap();

    runAdvection(velocity.read.texture, dye.read.texture, dye.write, dt, config.dyeDissipation);
    dye.swap();

    applyImpulses(impulses);

    runCurlPass();
    runVorticity(dt);
    runDivergencePass();
    runPressureSolve();
    runGradientSubtract();
  }

  function render(width, height, timeSec) {
    gl.disable(gl.BLEND);
    draw(compositeProgram, null, width, height);
    bindTexture(gl, dye.read.texture, 0);
    bindTexture(gl, velocity.read.texture, 1);
    setUniform1i(gl, compositeProgram.uniforms.uDye, 0);
    setUniform1i(gl, compositeProgram.uniforms.uVelocity, 1);
    setUniform1f(gl, compositeProgram.uniforms.uTime, timeSec);
    setUniform1f(gl, compositeProgram.uniforms.uOverlayAlpha, config.overlayAlpha);
    fullscreen.draw();
  }

  function setAspect(aspect) {
    viewportAspect = Math.max(0.2, Math.min(5, aspect || 1));
  }

  function destroy() {
    for (const target of targets) {
      target.dispose();
    }

    for (const program of programs) {
      program.dispose();
    }

    fullscreen.dispose();
  }

  return {
    step,
    render,
    setAspect,
    getVelocityTexture() {
      return velocity.read.texture;
    },
    destroy
  };
}
