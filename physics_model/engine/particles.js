import { PHYSICS_CONFIG } from "../config.js";
import { createDoubleFBO } from "../gl/fbo.js";
import { createFullscreenGeometry, createProgram } from "../gl/program.js";
import { PARTICLE_RENDER_FRAGMENT_SHADER } from "../shaders/particles/particle-render-fragment.js";
import { PARTICLE_RENDER_VERTEX_SHADER } from "../shaders/particles/particle-render-vertex.js";
import { PARTICLE_UPDATE_FRAGMENT_SHADER } from "../shaders/particles/particle-update.js";
import { FULLSCREEN_VERTEX_SHADER } from "../shaders/shared/fullscreen-vertex.js";

function bindTexture(gl, texture, unit) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

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

function createIndexGeometry(gl, count) {
  const indices = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    indices[i] = i;
  }

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();

  if (!vao || !buffer) {
    if (vao) {
      gl.deleteVertexArray(vao);
    }
    if (buffer) {
      gl.deleteBuffer(buffer);
    }
    throw new Error("Unable to create particle geometry");
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return {
    vao,
    buffer,
    draw() {
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.bindVertexArray(null);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
    }
  };
}

function seedParticleTextures(gl, targets, textureSize) {
  const data = new Float32Array(textureSize * textureSize * 4);
  for (let i = 0; i < textureSize * textureSize; i += 1) {
    const offset = i * 4;
    data[offset] = Math.random();
    data[offset + 1] = Math.random();
    data[offset + 2] = 0;
    data[offset + 3] = 1;
  }

  gl.bindTexture(gl.TEXTURE_2D, targets.read.texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, data);

  gl.bindTexture(gl.TEXTURE_2D, targets.write.texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, data);

  gl.bindTexture(gl.TEXTURE_2D, null);
}

export function createParticleSystem({ gl, config = PHYSICS_CONFIG }) {
  const textureSize = Math.ceil(Math.sqrt(config.particleCount));
  const totalParticles = textureSize * textureSize;

  const positions = createDoubleFBO(
    gl,
    textureSize,
    textureSize,
    gl.RGBA32F,
    gl.RGBA,
    gl.FLOAT,
    gl.NEAREST
  );

  seedParticleTextures(gl, positions, textureSize);

  const updateFullscreen = createFullscreenGeometry(gl);
  const particleGeometry = createIndexGeometry(gl, totalParticles);

  const updateProgram = createProgram(
    gl,
    FULLSCREEN_VERTEX_SHADER,
    PARTICLE_UPDATE_FRAGMENT_SHADER,
    ["uPositions", "uVelocity", "uDt", "uTime", "uSpeedScale", "uNoise"]
  );

  const renderProgram = createProgram(
    gl,
    PARTICLE_RENDER_VERTEX_SHADER,
    PARTICLE_RENDER_FRAGMENT_SHADER,
    ["uPositions", "uVelocity", "uTextureSize", "uPointSize"]
  );

  function step(deltaSec, timeSec, velocityTexture) {
    if (!velocityTexture) {
      return;
    }

    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, positions.write.framebuffer);
    gl.viewport(0, 0, textureSize, textureSize);
    gl.useProgram(updateProgram.program);

    bindTexture(gl, positions.read.texture, 0);
    bindTexture(gl, velocityTexture, 1);

    setUniform1i(gl, updateProgram.uniforms.uPositions, 0);
    setUniform1i(gl, updateProgram.uniforms.uVelocity, 1);
    setUniform1f(gl, updateProgram.uniforms.uDt, deltaSec);
    setUniform1f(gl, updateProgram.uniforms.uTime, timeSec);
    setUniform1f(gl, updateProgram.uniforms.uSpeedScale, config.particleSpeedScale);
    setUniform1f(gl, updateProgram.uniforms.uNoise, config.particleNoise);

    updateFullscreen.draw();
    positions.swap();
  }

  function render(width, height, velocityTexture) {
    if (!velocityTexture) {
      return;
    }

    const pointSize = config.particleSizePx * Math.max(1, Math.min(2.2, window.devicePixelRatio || 1));

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(renderProgram.program);

    bindTexture(gl, positions.read.texture, 0);
    bindTexture(gl, velocityTexture, 1);

    setUniform1i(gl, renderProgram.uniforms.uPositions, 0);
    setUniform1i(gl, renderProgram.uniforms.uVelocity, 1);
    setUniform1f(gl, renderProgram.uniforms.uTextureSize, textureSize);
    setUniform1f(gl, renderProgram.uniforms.uPointSize, pointSize);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    particleGeometry.draw();
    gl.disable(gl.BLEND);
  }

  function destroy() {
    positions.dispose();
    updateFullscreen.dispose();
    particleGeometry.dispose();
    updateProgram.dispose();
    renderProgram.dispose();
  }

  return {
    step,
    render,
    destroy
  };
}
