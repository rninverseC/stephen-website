import {
  STORAGE_KEYS,
  SNOW_DENSITY,
  SNOW_PROFILE,
  SNOW_LAYER_PROFILE,
  DEFAULT_EFFECT_SETTINGS
} from "./constants.js";
import { dom, reduceMotionMedia } from "./dom.js";
import { appState, snowState } from "./state.js";
import { random, readStorage, writeStorage } from "./utils.js";

const SNOW_LAYER_DISTRIBUTION = {
  front: 0.34,
  mid: 0.36,
  back: 0.3
};
const SNOW_LAYER_REMAINDER_ORDER = ["mid", "front", "back"];
const SNOW_LAYER_ORDER = ["front", "mid", "back"];

function loadEffectSettings() {
  const stored = readStorage(STORAGE_KEYS.effects, DEFAULT_EFFECT_SETTINGS);
  const snowFallback = typeof stored.snow === "boolean"
    ? stored.snow
    : typeof stored.stars === "boolean"
      ? stored.stars
      : DEFAULT_EFFECT_SETTINGS.snow;

  return {
    snow: snowFallback
  };
}

function getSnowProfile() {
  return reduceMotionMedia.matches ? SNOW_PROFILE.reduced : SNOW_PROFILE.normal;
}

function getSnowLayerProfile() {
  return reduceMotionMedia.matches ? SNOW_LAYER_PROFILE.reduced : SNOW_LAYER_PROFILE.normal;
}

function getEffectiveEffectSettings() {
  return {
    snow: appState.userEffectSettings.snow,
    flakeCount: reduceMotionMedia.matches ? SNOW_DENSITY.reduced : SNOW_DENSITY.normal
  };
}

function initSnowLayer() {
  if (!dom.snowLayer) {
    return false;
  }

  if (!snowState.resizeBound) {
    window.addEventListener("resize", () => {
      if (appState.userEffectSettings.snow) {
        const effective = getEffectiveEffectSettings();
        createSnow(effective.flakeCount);
      }
    });
    snowState.resizeBound = true;
  }

  snowState.isReady = true;
  return true;
}

function clearSnow() {
  if (!dom.snowLayer) {
    return;
  }

  dom.snowLayer.textContent = "";
  snowState.flakeCount = 0;
}

function getLayerCounts(totalCount) {
  const counts = {
    front: Math.floor(totalCount * SNOW_LAYER_DISTRIBUTION.front),
    mid: Math.floor(totalCount * SNOW_LAYER_DISTRIBUTION.mid),
    back: Math.floor(totalCount * SNOW_LAYER_DISTRIBUTION.back)
  };
  let remaining = totalCount - counts.front - counts.mid - counts.back;

  let index = 0;
  while (remaining > 0) {
    const layer = SNOW_LAYER_REMAINDER_ORDER[index % SNOW_LAYER_REMAINDER_ORDER.length];
    counts[layer] += 1;
    remaining -= 1;
    index += 1;
  }

  return counts;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function createLayerFlake(profile, layerName, layerProfile) {
  const flake = document.createElement("span");
  const z = random(0.35, 1);
  const baseSize = profile.sizeMinPx + (profile.sizeMaxPx - profile.sizeMinPx) * Math.pow(z, 1.2);
  const size = baseSize * layerProfile.sizeMul;
  const baseDuration = profile.durationMaxSec - (profile.durationMaxSec - profile.durationMinSec) * Math.pow(z, 0.95);
  const duration = baseDuration * layerProfile.durationMul;
  const alphaRaw = random(profile.alphaMin, profile.alphaMax) * (0.45 + z * 0.55);
  const alphaScaled = layerName === "front"
    ? alphaRaw
    : layerName === "mid"
      ? alphaRaw * 0.88
      : alphaRaw * 0.9;

  flake.className = `snowflake snowflake-${layerName}`;
  flake.style.setProperty("--x", `${random(layerProfile.spawnX[0], layerProfile.spawnX[1]).toFixed(2)}vw`);
  flake.style.setProperty("--y", `${random(layerProfile.spawnY[0], layerProfile.spawnY[1]).toFixed(2)}vh`);
  flake.style.setProperty("--size", `${size.toFixed(2)}px`);
  flake.style.setProperty("--duration", `${duration.toFixed(2)}s`);
  flake.style.setProperty("--delay", `${random(-26, 0).toFixed(2)}s`);
  flake.style.setProperty("--alpha", `${clamp01(alphaScaled).toFixed(3)}`);
  flake.style.setProperty("--drift-mid", `${random(layerProfile.driftMidX[0], layerProfile.driftMidX[1]).toFixed(2)}vw`);
  flake.style.setProperty("--drift-end", `${random(layerProfile.driftEndX[0], layerProfile.driftEndX[1]).toFixed(2)}vw`);
  flake.style.setProperty("--travel-mid-y", `${layerProfile.travelMidY}`);
  flake.style.setProperty("--travel-end-y", `${layerProfile.travelEndY}`);

  return flake;
}

function createSnow(count) {
  if (!initSnowLayer()) {
    return;
  }

  clearSnow();

  if (!Number.isFinite(count) || count <= 0) {
    return;
  }

  const profile = getSnowProfile();
  const layerProfile = getSnowLayerProfile();
  const layerCounts = getLayerCounts(count);
  const fragment = document.createDocumentFragment();

  for (const layerName of SNOW_LAYER_ORDER) {
    const total = layerCounts[layerName];
    const layerSpec = layerProfile[layerName];
    for (let i = 0; i < total; i += 1) {
      fragment.appendChild(createLayerFlake(profile, layerName, layerSpec));
    }
  }

  dom.snowLayer.appendChild(fragment);
  snowState.flakeCount = count;
}

function applyBodyEffectAttributes(settings) {
  document.body.dataset.snow = settings.snow ? "on" : "off";
  document.body.classList.toggle("reduced-motion", reduceMotionMedia.matches);
}

function syncEffectControls(effectiveSettings) {
  if (!dom.toggleSnow) {
    return;
  }

  dom.toggleSnow.checked = effectiveSettings.snow;
  dom.toggleSnow.disabled = false;
}

export function applyEffects() {
  const effective = getEffectiveEffectSettings();

  applyBodyEffectAttributes(effective);
  syncEffectControls(effective);

  if (!effective.snow) {
    clearSnow();
    return;
  }

  if (!initSnowLayer()) {
    return;
  }

  createSnow(effective.flakeCount);
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
  if (dom.toggleSnow) {
    dom.toggleSnow.addEventListener("change", (event) => {
      appState.userEffectSettings.snow = event.target.checked;
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
