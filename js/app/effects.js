import {
  STORAGE_KEYS,
  STARFIELD_DENSITY,
  STARFIELD_PROFILE,
  NEBULA_CLOUDS,
  RINGED_PLANET,
  DEFAULT_EFFECT_SETTINGS
} from "./constants.js";
import { dom, reduceMotionMedia } from "./dom.js";
import { appState, starfieldState } from "./state.js";
import { random, clamp, readStorage, writeStorage } from "./utils.js";

function loadEffectSettings() {
  const stored = readStorage(STORAGE_KEYS.effects, DEFAULT_EFFECT_SETTINGS);
  const starsFallback = typeof stored.stars === "boolean"
    ? stored.stars
    : typeof stored.snow === "boolean"
      ? stored.snow
      : DEFAULT_EFFECT_SETTINGS.stars;

  return {
    stars: starsFallback
  };
}

function getEffectiveEffectSettings() {
  return {
    stars: appState.userEffectSettings.stars,
    starCount: reduceMotionMedia.matches ? STARFIELD_DENSITY.reduced : STARFIELD_DENSITY.normal
  };
}

function getStarfieldProfile() {
  return reduceMotionMedia.matches ? STARFIELD_PROFILE.reduced : STARFIELD_PROFILE.normal;
}

function setPointerTarget(clientX, clientY) {
  if (window.innerWidth <= 0 || window.innerHeight <= 0) {
    return;
  }

  starfieldState.targetPointerX = clamp((clientX / window.innerWidth) * 2 - 1, -1, 1);
  starfieldState.targetPointerY = clamp((clientY / window.innerHeight) * 2 - 1, -1, 1);
  starfieldState.pointerActive = true;
}

function resetPointerTarget() {
  starfieldState.pointerActive = false;
  starfieldState.targetPointerX = 0;
  starfieldState.targetPointerY = 0;
}

function initStarfieldCanvas() {
  if (!dom.starfieldCanvas) {
    return false;
  }

  if (!starfieldState.isReady) {
    const ctx = dom.starfieldCanvas.getContext("2d");
    if (!ctx) {
      return false;
    }

    starfieldState.ctx = ctx;
    starfieldState.isReady = true;
  }

  if (!starfieldState.resizeBound) {
    window.addEventListener("resize", () => {
      resizeStarfield(true);
    });
    starfieldState.resizeBound = true;
  }

  if (!starfieldState.pointerBound) {
    window.addEventListener("pointermove", (event) => {
      setPointerTarget(event.clientX, event.clientY);
    }, { passive: true });

    window.addEventListener("pointerdown", (event) => {
      setPointerTarget(event.clientX, event.clientY);
    }, { passive: true });

    window.addEventListener("pointerout", (event) => {
      if (!event.relatedTarget) {
        resetPointerTarget();
      }
    });

    window.addEventListener("blur", () => {
      resetPointerTarget();
    });

    starfieldState.pointerBound = true;
  }

  resizeStarfield(false);
  return true;
}

function createStar(profile, width, height) {
  const zLayer = random(0.3, 1);
  const radius = 0.35 + Math.pow(Math.random(), 2.4) * 1.5;
  const alpha = random(0.2, 0.95);
  const twinkleSpeed = random(0.9, 3.1);
  const angle = random(0, Math.PI * 2);
  const speed = random(profile.speedMin, profile.speedMax) * (0.35 + zLayer);

  return {
    x: random(0, width),
    y: random(0, height),
    zLayer,
    radius,
    alpha,
    twinkleSpeed,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    driftPhase: random(0, Math.PI * 2)
  };
}

function buildStars(count) {
  if (!initStarfieldCanvas()) {
    return;
  }

  const profile = getStarfieldProfile();
  const stars = [];

  for (let i = 0; i < count; i += 1) {
    stars.push(createStar(profile, starfieldState.width, starfieldState.height));
  }

  starfieldState.stars = stars;
}

function resizeStarfield(rebuild = true) {
  if (!dom.starfieldCanvas || !starfieldState.ctx) {
    return;
  }

  const width = Math.max(1, Math.floor(window.innerWidth));
  const height = Math.max(1, Math.floor(window.innerHeight));
  const dpr = clamp(window.devicePixelRatio || 1, 1, 2);

  if (
    starfieldState.width === width &&
    starfieldState.height === height &&
    starfieldState.dpr === dpr &&
    !rebuild
  ) {
    return;
  }

  starfieldState.width = width;
  starfieldState.height = height;
  starfieldState.dpr = dpr;

  dom.starfieldCanvas.width = Math.floor(width * dpr);
  dom.starfieldCanvas.height = Math.floor(height * dpr);
  dom.starfieldCanvas.style.width = `${width}px`;
  dom.starfieldCanvas.style.height = `${height}px`;

  starfieldState.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  starfieldState.ctx.clearRect(0, 0, width, height);

  if (rebuild) {
    const effective = getEffectiveEffectSettings();
    buildStars(effective.stars ? effective.starCount : 0);
  }
}

function wrapStar(star, margin) {
  if (star.x < -margin) {
    star.x = starfieldState.width + margin;
  } else if (star.x > starfieldState.width + margin) {
    star.x = -margin;
  }

  if (star.y < -margin) {
    star.y = starfieldState.height + margin;
  } else if (star.y > starfieldState.height + margin) {
    star.y = -margin;
  }
}

function updateStars(deltaSec, profile) {
  const margin = 24;

  starfieldState.stars.forEach((star) => {
    const driftScale = 0.45 + star.zLayer * 0.85;
    const phase = star.driftPhase + starfieldState.elapsedSec * profile.driftFrequency;
    const roamX = Math.sin(phase) * profile.driftAmplitude * driftScale;
    const roamY = Math.cos(phase * 0.7) * profile.driftAmplitude * 0.24 * driftScale;

    star.x += (star.vx + roamX) * deltaSec;
    star.y += (star.vy + roamY) * deltaSec;

    wrapStar(star, margin);
  });
}

function getBackgroundMotionScale() {
  return reduceMotionMedia.matches ? 0.4 : 1;
}

function drawNebula(elapsedSec) {
  if (!starfieldState.ctx) {
    return;
  }

  const ctx = starfieldState.ctx;
  const motionScale = getBackgroundMotionScale();

  NEBULA_CLOUDS.forEach((cloud, index) => {
    const baseX = starfieldState.width * (cloud.xPct / 100);
    const baseY = starfieldState.height * (cloud.yPct / 100);
    const cloudRadius = Math.max(starfieldState.width, starfieldState.height) * (cloud.radiusPct / 100);
    const driftX = Math.sin(elapsedSec * 0.035 + index) * cloud.driftX * 6 * motionScale;
    const driftY = Math.cos(elapsedSec * 0.03 + index * 0.7) * cloud.driftY * 6 * motionScale;
    const cx = baseX + driftX;
    const cy = baseY + driftY;

    const gradient = ctx.createRadialGradient(cx, cy, cloudRadius * 0.06, cx, cy, cloudRadius);
    gradient.addColorStop(0, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, ${cloud.alpha})`);
    gradient.addColorStop(0.48, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, ${(cloud.alpha * 0.46).toFixed(3)})`);
    gradient.addColorStop(1, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, starfieldState.width, starfieldState.height);
  });
}

function drawRingBand(ctx, outerLen, outerHeight, innerLen, innerHeight, fillColor) {
  ctx.beginPath();
  ctx.moveTo(-outerLen, 0);
  ctx.quadraticCurveTo(0, -outerHeight, outerLen, 0);
  ctx.quadraticCurveTo(0, outerHeight, -outerLen, 0);
  ctx.closePath();

  ctx.moveTo(-innerLen, 0);
  ctx.quadraticCurveTo(0, -innerHeight, innerLen, 0);
  ctx.quadraticCurveTo(0, innerHeight, -innerLen, 0);
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill("evenodd");
}

function drawRingBack(ctx, x, y, r, tilt, hoverStrength = 0) {
  const cfg = RINGED_PLANET;
  const outerLen = r * cfg.ringOuterScaleX;
  const outerHeight = r * cfg.ringOuterScaleY;
  const innerLen = r * cfg.ringInnerScaleX;
  const innerHeight = r * cfg.ringInnerScaleY;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  ctx.beginPath();
  ctx.rect(-outerLen * 1.3, -outerHeight * 2.6, outerLen * 2.6, outerHeight * 2.1);
  ctx.clip();

  drawRingBand(ctx, outerLen, outerHeight, innerLen, innerHeight, cfg.palette.ringBase);

  ctx.strokeStyle = cfg.palette.ringHighlight;
  ctx.lineWidth = Math.max(1, r * 0.03 * (1 + hoverStrength * 0.45));
  ctx.beginPath();
  ctx.moveTo(-outerLen * 0.98, 0);
  ctx.quadraticCurveTo(0, -outerHeight * 0.88, outerLen * 0.98, 0);
  ctx.stroke();

  ctx.restore();
}

function drawPlanetBody(ctx, x, y, r, hoverStrength = 0) {
  const palette = RINGED_PLANET.palette;

  ctx.save();

  if (hoverStrength > 0.001) {
    ctx.globalAlpha = Math.min(0.28, hoverStrength * 0.22);
    ctx.fillStyle = palette.ringHighlight;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = palette.outerGlow;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.mainAtmosphere;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.04, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.warmShadow;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.16, y - r * 0.06, r * 0.92, r * 0.86, -0.16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.interiorCutout;
  ctx.beginPath();
  ctx.arc(x - r * 0.02, y + r * 0.02, r * 0.78, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = palette.mainAtmosphere;
  ctx.lineWidth = Math.max(1, r * 0.025);
  ctx.beginPath();
  ctx.arc(x - r * 0.03, y + r * 0.02, r * 0.69, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawRingFront(ctx, x, y, r, tilt, hoverStrength = 0) {
  const cfg = RINGED_PLANET;
  const outerLen = r * cfg.ringOuterScaleX;
  const outerHeight = r * cfg.ringOuterScaleY;
  const innerLen = r * cfg.ringInnerScaleX;
  const innerHeight = r * cfg.ringInnerScaleY;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  ctx.beginPath();
  ctx.rect(-outerLen * 1.3, -outerHeight * 0.82, outerLen * 2.6, outerHeight * 1.64);
  ctx.clip();

  drawRingBand(ctx, outerLen, outerHeight, innerLen, innerHeight, cfg.palette.ringBase);

  ctx.strokeStyle = cfg.palette.ringHighlight;
  ctx.lineWidth = Math.max(1, r * 0.028 * (1 + hoverStrength * 0.4));
  ctx.beginPath();
  ctx.moveTo(-outerLen * 0.99, -outerHeight * 0.08);
  ctx.quadraticCurveTo(0, -outerHeight * 0.95, outerLen * 0.99, -outerHeight * 0.08);
  ctx.stroke();

  ctx.strokeStyle = cfg.palette.ringShadowLine;
  ctx.lineWidth = Math.max(1, r * 0.019 * (1 + hoverStrength * 0.32));
  ctx.beginPath();
  ctx.moveTo(-outerLen * 0.93, outerHeight * 0.03);
  ctx.quadraticCurveTo(0, outerHeight * 0.87, outerLen * 0.93, outerHeight * 0.03);
  ctx.stroke();

  ctx.restore();
}

function drawRingedPlanet(elapsedSec) {
  if (!starfieldState.ctx) {
    return;
  }

  const cfg = RINGED_PLANET;
  const ctx = starfieldState.ctx;
  const motionScale = getBackgroundMotionScale();
  const baseX = starfieldState.width * (cfg.xPct / 100);
  const baseY = starfieldState.height * (cfg.yPct / 100);
  const baseRadius = Math.min(starfieldState.width, starfieldState.height) * (cfg.radiusPct / 100);
  const pointerX = starfieldState.pointerX * motionScale;
  const pointerY = starfieldState.pointerY * motionScale;
  const x = baseX + Math.sin(elapsedSec * 0.21) * cfg.driftX * 9 * motionScale + pointerX * cfg.parallaxX;
  const y = baseY + Math.cos(elapsedSec * 0.19) * cfg.driftY * 9 * motionScale + pointerY * cfg.parallaxY;

  let hoverStrength = 0;
  if (starfieldState.pointerActive) {
    const pointerPxX = ((starfieldState.pointerX + 1) * 0.5) * starfieldState.width;
    const pointerPxY = ((starfieldState.pointerY + 1) * 0.5) * starfieldState.height;
    const distance = Math.hypot(pointerPxX - x, pointerPxY - y);
    hoverStrength = 1 - clamp(distance / (baseRadius * 3.2), 0, 1);
  }

  const radius = baseRadius * (1 + hoverStrength * cfg.hoverScale * motionScale);
  const tiltDeg = cfg.ringTiltDeg + pointerX * cfg.tiltRangeDeg;
  const tilt = (tiltDeg * Math.PI) / 180;

  drawRingBack(ctx, x, y, radius, tilt, hoverStrength);
  drawPlanetBody(ctx, x, y, radius, hoverStrength);
  drawRingFront(ctx, x, y, radius, tilt, hoverStrength);
}

function drawStars(profile) {
  if (!starfieldState.ctx) {
    return;
  }

  const ctx = starfieldState.ctx;

  starfieldState.stars.forEach((star) => {
    const twinkle = 0.72 + Math.sin(starfieldState.elapsedSec * star.twinkleSpeed + star.driftPhase) * 0.28;
    const alpha = clamp(star.alpha * twinkle * profile.twinkleFactor, 0.04, 1);
    ctx.fillStyle = `rgba(233, 241, 255, ${alpha.toFixed(3)})`;

    if (star.radius < 1.05) {
      ctx.fillRect(star.x, star.y, 1, 1);
      return;
    }

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function renderStarfield(ts) {
  if (!starfieldState.ctx) {
    stopStarfieldLoop(false);
    return;
  }

  if (starfieldState.lastTs === 0) {
    starfieldState.lastTs = ts;
  }

  const deltaSec = Math.min(0.05, Math.max(0, (ts - starfieldState.lastTs) / 1000));
  starfieldState.lastTs = ts;
  starfieldState.elapsedSec += deltaSec;
  const pointerBlend = Math.min(1, deltaSec * 4.2);
  starfieldState.pointerX += (starfieldState.targetPointerX - starfieldState.pointerX) * pointerBlend;
  starfieldState.pointerY += (starfieldState.targetPointerY - starfieldState.pointerY) * pointerBlend;

  const profile = getStarfieldProfile();
  starfieldState.ctx.clearRect(0, 0, starfieldState.width, starfieldState.height);
  drawNebula(starfieldState.elapsedSec);
  drawRingedPlanet(starfieldState.elapsedSec);
  updateStars(deltaSec, profile);
  drawStars(profile);

  starfieldState.rafId = window.requestAnimationFrame(renderStarfield);
}

function applyBodyEffectAttributes(settings) {
  document.body.dataset.stars = settings.stars ? "on" : "off";
  document.body.classList.toggle("reduced-motion", reduceMotionMedia.matches);
}

function syncEffectControls(effectiveSettings) {
  if (!dom.toggleStars) {
    return;
  }

  dom.toggleStars.checked = effectiveSettings.stars;
  dom.toggleStars.disabled = false;
}

function startStarfieldLoop() {
  if (!initStarfieldCanvas()) {
    return false;
  }

  if (starfieldState.rafId !== null) {
    return true;
  }

  if (starfieldState.stars.length === 0) {
    const effective = getEffectiveEffectSettings();
    buildStars(effective.starCount);
  }

  starfieldState.lastTs = 0;
  starfieldState.elapsedSec = 0;
  starfieldState.rafId = window.requestAnimationFrame(renderStarfield);
  return true;
}

function stopStarfieldLoop(reset = true) {
  if (starfieldState.rafId !== null) {
    window.cancelAnimationFrame(starfieldState.rafId);
    starfieldState.rafId = null;
  }

  starfieldState.lastTs = 0;
  starfieldState.elapsedSec = 0;

  if (reset) {
    starfieldState.stars = [];
    if (starfieldState.ctx) {
      starfieldState.ctx.clearRect(0, 0, starfieldState.width, starfieldState.height);
    }
  }
}

export function applyEffects() {
  const effective = getEffectiveEffectSettings();

  applyBodyEffectAttributes(effective);
  syncEffectControls(effective);

  if (effective.stars) {
    if (!initStarfieldCanvas()) {
      return;
    }
    buildStars(effective.starCount);
    startStarfieldLoop();
  } else {
    stopStarfieldLoop(true);
  }
}

function persistEffectSettings() {
  writeStorage(STORAGE_KEYS.effects, appState.userEffectSettings);
}

function onReducedMotionChange(handler) {
  if (typeof reduceMotionMedia.addEventListener === "function") {
    reduceMotionMedia.addEventListener("change", handler);
    return;
  }

  if (typeof reduceMotionMedia.addListener === "function") {
    reduceMotionMedia.addListener(handler);
  }
}

function initEffectControls() {
  if (dom.toggleStars) {
    dom.toggleStars.addEventListener("change", (event) => {
      appState.userEffectSettings.stars = event.target.checked;
      persistEffectSettings();
      applyEffects();
    });
  }

  onReducedMotionChange(() => {
    applyEffects();
  });
}

export function initializeEffects() {
  appState.userEffectSettings = loadEffectSettings();
  initEffectControls();
  applyEffects();
}
