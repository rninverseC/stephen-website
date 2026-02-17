import {
  STORAGE_KEYS,
  STARFIELD_DENSITY,
  STARFIELD_PROFILE,
  STARFIELD_SWIRL_PROFILE,
  NEBULA_CLOUDS,
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

function getStarfieldSwirlProfile() {
  return reduceMotionMedia.matches ? STARFIELD_SWIRL_PROFILE.reduced : STARFIELD_SWIRL_PROFILE.normal;
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

  resizeStarfield(false);
  return true;
}

function createStar(width, height, swirlProfile) {
  const zLayer = random(0.3, 1);
  const radius = 0.35 + Math.pow(Math.random(), 2.4) * 1.5;
  const alpha = random(0.2, 0.95);
  const twinkleSpeed = random(0.9, 3.1);
  const laneBase = Math.min(width, height) * random(swirlProfile.orbitLaneMinPct, swirlProfile.orbitLaneMaxPct) / 100;
  const orbitA = laneBase * (0.58 + zLayer * 0.7) * random(0.9, 1.12);
  const orbitB = orbitA * swirlProfile.orbitAspect * random(0.9, 1.12);
  const orbitPhase = random(0, Math.PI * 2);
  const orbitSpeed = (swirlProfile.orbitAngularBaseRadPerSec + zLayer * swirlProfile.orbitAngularDepthBoostRadPerSec)
    * random(1 - swirlProfile.orbitAngularVariance, 1 + swirlProfile.orbitAngularVariance);
  const radialPhase = random(0, Math.PI * 2);
  const centerX = width * 0.58;
  const centerY = height * 0.56;
  const tilt = (swirlProfile.orbitTiltDeg * Math.PI) / 180;
  const cosTilt = Math.cos(tilt);
  const sinTilt = Math.sin(tilt);
  const localX = orbitA * Math.cos(orbitPhase);
  const localY = orbitB * Math.sin(orbitPhase);
  const x = centerX + localX * cosTilt - localY * sinTilt;
  const y = centerY + localX * sinTilt + localY * cosTilt;

  return {
    x,
    y,
    zLayer,
    radius,
    alpha,
    twinkleSpeed,
    driftPhase: random(0, Math.PI * 2),
    orbitA,
    orbitB,
    orbitPhase,
    orbitSpeed,
    radialPhase,
    jitterPhase: random(0, Math.PI * 2)
  };
}

function buildStars(count) {
  if (!initStarfieldCanvas()) {
    return;
  }
  const swirlProfile = getStarfieldSwirlProfile();
  const stars = [];

  for (let i = 0; i < count; i += 1) {
    stars.push(createStar(starfieldState.width, starfieldState.height, swirlProfile));
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

function updateStars(deltaSec, swirlProfile) {
  const centerX = starfieldState.width * (0.58 + Math.sin(starfieldState.elapsedSec * swirlProfile.centerDriftFreqX) * (swirlProfile.centerDriftXPct / 100));
  const centerY = starfieldState.height * (0.56 + Math.cos(starfieldState.elapsedSec * swirlProfile.centerDriftFreqY) * (swirlProfile.centerDriftYPct / 100));
  const tilt = (swirlProfile.orbitTiltDeg * Math.PI) / 180;
  const cosTilt = Math.cos(tilt);
  const sinTilt = Math.sin(tilt);

  starfieldState.stars.forEach((star) => {
    star.orbitPhase += star.orbitSpeed * deltaSec * swirlProfile.swirlDirection;
    const breath = 1 + Math.sin(star.radialPhase + starfieldState.elapsedSec * swirlProfile.radialPulseFreq)
      * swirlProfile.orbitBreathPct
      * (0.42 + star.zLayer * 0.85);
    const laneA = star.orbitA * breath;
    const laneB = star.orbitB * breath;
    const localX = laneA * Math.cos(star.orbitPhase);
    const localY = laneB * Math.sin(star.orbitPhase);
    const jitterScale = swirlProfile.microJitterPxPerSec * (0.2 + star.zLayer * 0.62);
    const jitterX = Math.cos(star.jitterPhase + starfieldState.elapsedSec * 1.1) * jitterScale;
    const jitterY = Math.sin(star.jitterPhase * 1.3 + starfieldState.elapsedSec * 0.84) * jitterScale;

    star.x = centerX + localX * cosTilt - localY * sinTilt + jitterX;
    star.y = centerY + localX * sinTilt + localY * cosTilt + jitterY;
    star.radialPhase += deltaSec * (0.85 + star.zLayer * 1.35);
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

  const profile = getStarfieldProfile();
  const swirlProfile = getStarfieldSwirlProfile();
  starfieldState.ctx.clearRect(0, 0, starfieldState.width, starfieldState.height);
  drawNebula(starfieldState.elapsedSec);
  updateStars(deltaSec, swirlProfile);
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
