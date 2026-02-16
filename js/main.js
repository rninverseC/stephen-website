const STORAGE_KEYS = {
  guestbook: "mywebsite_guestbook_entries",
  effects: "mywebsite_effect_settings"
};

const APP_CONFIG = window.APP_CONFIG || {};
const SUPABASE_URL = typeof APP_CONFIG.supabaseUrl === "string" ? APP_CONFIG.supabaseUrl.trim() : "";
const SUPABASE_ANON_KEY = typeof APP_CONFIG.supabaseAnonKey === "string" ? APP_CONFIG.supabaseAnonKey.trim() : "";
const ADMIN_EMAIL = typeof APP_CONFIG.adminEmail === "string" ? APP_CONFIG.adminEmail.trim().toLowerCase() : "";
const GUESTBOOK_TABLE = typeof APP_CONFIG.guestbookTable === "string" && APP_CONFIG.guestbookTable.trim()
  ? APP_CONFIG.guestbookTable.trim()
  : "guestbook_messages";

const NAV_ITEMS = [
  { label: "Home", href: "#top" },
  { label: "About Me", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Guestbook", href: "#guestbook" },
  { label: "Album", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Life", href: "#" }
];

const PROJECTS = [];

const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/rninverseC", external: true },
];

const STATUS_LINES = [
  "Building in public, one stable release at a time.",
  "Currently in deep work mode: shipping and polishing.",
  "Maintaining clear interfaces and faster feedback loops.",
  "Testing ideas in orbit before landing them in production."
];

const NOW_PLAYING = {
  title: "Starlane Echo",
  artist: "Mock Transmission",
  durationSec: 243
};

const DEFAULT_GUESTBOOK_ENTRIES = [
  {
    name: "Mission Control",
    message: "Signal received. Loving the space-retro atmosphere.",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  }
];

const STARFIELD_DENSITY = {
  normal: 680,
  reduced: 240
};

const STARFIELD_PROFILE = {
  normal: {
    speedMin: 1.3,
    speedMax: 8.6,
    driftAmplitude: 6.6,
    driftFrequency: 0.52,
    twinkleFactor: 0.9
  },
  reduced: {
    speedMin: 0.35,
    speedMax: 2.4,
    driftAmplitude: 1.2,
    driftFrequency: 0.18,
    twinkleFactor: 0.5
  }
};

const NEBULA_CLOUDS = [
  {
    xPct: 18,
    yPct: 22,
    radiusPct: 38,
    color: { r: 78, g: 120, b: 188 },
    alpha: 0.03,
    driftX: 2.5,
    driftY: 1.2
  },
  {
    xPct: 78,
    yPct: 72,
    radiusPct: 44,
    color: { r: 64, g: 101, b: 170 },
    alpha: 0.022,
    driftX: -1.8,
    driftY: 0.9
  }
];

const RINGED_PLANET = {
  xPct: 77,
  yPct: 31,
  radiusPct: 11.5,
  driftX: -0.22,
  driftY: 0.14,
  parallaxX: 52,
  parallaxY: 28,
  tiltRangeDeg: 11,
  hoverScale: 0.14,
  palette: {
    outerGlow: "#f7b65e",
    mainAtmosphere: "#e8e5d8",
    warmShadow: "#dbc6a9",
    interiorCutout: "#050507",
    ringBase: "#f6ae4b",
    ringHighlight: "#ffd18d",
    ringShadowLine: "#e7d9bf"
  },
  ringTiltDeg: -14,
  ringOuterScaleX: 1.95,
  ringOuterScaleY: 0.24,
  ringInnerScaleX: 1.34,
  ringInnerScaleY: 0.085
};

const DEFAULT_EFFECT_SETTINGS = {
  stars: true
};

const dom = {
  starfieldCanvas: document.getElementById("starfield-layer"),
  pagesLinks: document.getElementById("pages-links"),
  projectsGrid: document.getElementById("projects-grid"),
  connectLinks: document.getElementById("connect-links"),
  localClock: document.getElementById("local-clock"),
  statusLine: document.getElementById("status-line"),
  trackTitle: document.getElementById("track-title"),
  trackArtist: document.getElementById("track-artist"),
  trackTimeCurrent: document.getElementById("track-time-current"),
  trackTimeTotal: document.getElementById("track-time-total"),
  trackProgress: document.getElementById("track-progress"),
  trackProgressShell: document.querySelector(".track-progress-shell"),
  guestbookForm: document.getElementById("guestbook-form"),
  guestbookList: document.getElementById("guestbook-list"),
  guestbookName: document.getElementById("guestbook-name"),
  guestbookMessage: document.getElementById("guestbook-message"),
  guestbookSubmit: document.querySelector("#guestbook-form button[type='submit']"),
  guestbookMode: document.getElementById("guestbook-mode"),
  guestbookAdminState: document.getElementById("guestbook-admin-state"),
  guestbookAdminNote: document.getElementById("guestbook-admin-note"),
  guestbookAdminRow: document.getElementById("guestbook-admin-row"),
  adminEmail: document.getElementById("admin-email"),
  adminPassword: document.getElementById("admin-password"),
  adminLogin: document.getElementById("admin-login"),
  adminLogout: document.getElementById("admin-logout"),
  toggleStars: document.getElementById("toggle-stars")
};

const reduceMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
let guestbookEntries = [];
let userEffectSettings = loadEffectSettings();
let guestbookMode = "local";
let supabaseClient = null;
let adminUser = null;
let guestbookBusy = false;
const starfieldState = {
  ctx: null,
  width: 0,
  height: 0,
  dpr: 1,
  stars: [],
  rafId: null,
  lastTs: 0,
  elapsedSec: 0,
  pointerX: 0,
  pointerY: 0,
  targetPointerX: 0,
  targetPointerY: 0,
  pointerActive: false,
  isReady: false,
  resizeBound: false,
  pointerBound: false
};

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage write failures in constrained environmnets
  }
}

function normalizeGuestbookEntry(entry) {
  return {
    id: entry.id ?? null,
    name: typeof entry.name === "string" && entry.name.trim() ? entry.name.trim().slice(0, 30) : "Anonymous",
    message: typeof entry.message === "string" ? entry.message.trim().slice(0, 180) : "",
    timestamp: typeof entry.timestamp === "string" ? entry.timestamp : new Date().toISOString()
  };
}

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
    stars: userEffectSettings.stars,
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

function applyEffects() {
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

function renderLinkList(target, items) {
  if (!target) {
    return;
  }

  target.textContent = "";
  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.textContent = item.label;
    link.href = item.href;

    if (item.external) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    li.appendChild(link);
    fragment.appendChild(li);
  });

  target.appendChild(fragment);
}

function renderProjects() {
  if (!dom.projectsGrid) {
    return;
  }

  dom.projectsGrid.textContent = "";
  if (PROJECTS.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  PROJECTS.forEach((project) => {
    const card = document.createElement("article");
    card.className = "project-card";

    const title = document.createElement("h3");
    title.textContent = project.title;

    const summary = document.createElement("p");
    summary.textContent = project.summary;

    const tags = document.createElement("p");
    tags.className = "project-tags";
    tags.textContent = project.tags;

    card.appendChild(title);
    card.appendChild(summary);
    card.appendChild(tags);
    fragment.appendChild(card);
  });

  dom.projectsGrid.appendChild(fragment);
}

function formatClock(date) {
  return date.toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function updateClock() {
  if (!dom.localClock) {
    return;
  }

  const now = new Date();
  dom.localClock.textContent = formatClock(now);
  dom.localClock.dateTime = now.toISOString();
}

function initClock() {
  updateClock();
  window.setInterval(updateClock, 1000);
}

function initStatusLine() {
  if (!dom.statusLine) {
    return;
  }

  const index = new Date().getDate() % STATUS_LINES.length;
  dom.statusLine.textContent = STATUS_LINES[index];
}

function formatDuration(totalSec) {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function initNowPlaying() {
  if (!dom.trackTitle || !dom.trackArtist || !dom.trackTimeCurrent || !dom.trackTimeTotal || !dom.trackProgress) {
    return;
  }

  dom.trackTitle.textContent = NOW_PLAYING.title;
  dom.trackArtist.textContent = NOW_PLAYING.artist;
  dom.trackTimeTotal.textContent = formatDuration(NOW_PLAYING.durationSec);

  const start = Date.now();

  const updateTrack = () => {
    const elapsedSec = Math.floor(((Date.now() - start) / 1000) % NOW_PLAYING.durationSec);
    const percent = (elapsedSec / NOW_PLAYING.durationSec) * 100;

    dom.trackTimeCurrent.textContent = formatDuration(elapsedSec);
    dom.trackProgress.style.width = `${percent.toFixed(2)}%`;

    if (dom.trackProgressShell) {
      dom.trackProgressShell.setAttribute("aria-valuenow", Math.round(percent).toString());
    }
  };

  updateTrack();
  window.setInterval(updateTrack, 1000);
}

function setGuestbookNote(text, isError = false) {
  if (!dom.guestbookAdminNote) {
    return;
  }

  dom.guestbookAdminNote.textContent = text;
  dom.guestbookAdminNote.classList.toggle("is-error", isError);
}

function setGuestbookBusy(isBusy) {
  guestbookBusy = isBusy;

  if (dom.guestbookSubmit) {
    dom.guestbookSubmit.disabled = isBusy;
  }

  if (dom.adminLogin) {
    dom.adminLogin.disabled = isBusy || guestbookMode !== "supabase";
  }

  if (dom.adminLogout) {
    dom.adminLogout.disabled = isBusy || guestbookMode !== "supabase";
  }
}

function isAdminUser(user) {
  if (!user || !user.email || !ADMIN_EMAIL) {
    return false;
  }

  return user.email.toLowerCase() === ADMIN_EMAIL;
}

function canDeleteGuestbookEntries() {
  return guestbookMode === "supabase" && isAdminUser(adminUser);
}

function renderGuestbookAdminState() {
  if (dom.guestbookMode) {
    dom.guestbookMode.textContent = `Guestbook mode: ${guestbookMode}`;
  }

  if (dom.guestbookAdminState) {
    if (guestbookMode !== "supabase") {
      dom.guestbookAdminState.textContent = "Admin: unavailable in local mode";
    } else if (isAdminUser(adminUser)) {
      dom.guestbookAdminState.textContent = `Admin: signed in (${adminUser.email})`;
    } else if (adminUser && adminUser.email) {
      dom.guestbookAdminState.textContent = `Admin: signed in as non-admin (${adminUser.email})`;
    } else {
      dom.guestbookAdminState.textContent = "Admin: signed out";
    }
  }

  if (dom.adminLogin && dom.adminLogout) {
    const canAuth = guestbookMode === "supabase";
    const loggedIn = Boolean(adminUser);

    dom.adminLogin.hidden = !canAuth || loggedIn;
    dom.adminLogout.hidden = !canAuth || !loggedIn;
  }

  if (dom.guestbookAdminRow) {
    dom.guestbookAdminRow.hidden = guestbookMode !== "supabase";
  }

  if (dom.adminEmail && dom.adminPassword) {
    const canAuth = guestbookMode === "supabase";
    const loggedIn = Boolean(adminUser);

    dom.adminEmail.disabled = !canAuth || loggedIn;
    dom.adminPassword.disabled = !canAuth || loggedIn;

    if (!canAuth) {
      dom.adminEmail.placeholder = "Set Supabase config to enable";
      dom.adminPassword.placeholder = "Set Supabase config to enable";
    } else {
      dom.adminEmail.placeholder = "Admin email";
      dom.adminPassword.placeholder = "Admin password";
    }
  }

  if (guestbookMode !== "supabase") {
    setGuestbookNote("Local mode active. Configure Supabase to enable shared guestbook and admin-only delete.");
  } else if (!ADMIN_EMAIL) {
    setGuestbookNote("Supabase connected, but APP_CONFIG.adminEmail is empty. Delete remains disabled.", true);
  } else if (isAdminUser(adminUser)) {
    setGuestbookNote("Admin mode enabled. You can remove messages.");
  } else {
    setGuestbookNote("Public mode: anyone can post, only admin can remove.");
  }
}

function loadLocalGuestbookEntries() {
  const stored = readStorage(STORAGE_KEYS.guestbook, DEFAULT_GUESTBOOK_ENTRIES);
  if (!Array.isArray(stored)) {
    return [...DEFAULT_GUESTBOOK_ENTRIES].map(normalizeGuestbookEntry);
  }

  return stored
    .filter((entry) => entry && typeof entry.message === "string")
    .slice(0, 120)
    .map(normalizeGuestbookEntry);
}

function saveLocalGuestbookEntries(entries) {
  writeStorage(STORAGE_KEYS.guestbook, entries);
}

async function initGuestbookBackend() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    guestbookMode = "local";
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    guestbookMode = "local";
    setGuestbookNote("Supabase library not loaded; using local mode.", true);
    return;
  }

  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    guestbookMode = "supabase";

    const sessionResult = await supabaseClient.auth.getSession();
    adminUser = sessionResult.data?.session?.user || null;

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      adminUser = session?.user || null;
      renderGuestbookAdminState();
      renderGuestbook();
    });
  } catch {
    guestbookMode = "local";
    supabaseClient = null;
    adminUser = null;
    setGuestbookNote("Could not connect to Supabase; using local mode.", true);
  }
}

async function loadRemoteGuestbookEntries() {
  if (!supabaseClient) {
    return [];
  }

  const result = await supabaseClient
    .from(GUESTBOOK_TABLE)
    .select("id,name,message,created_at")
    .order("created_at", { ascending: false })
    .limit(120);

  if (result.error) {
    throw new Error(result.error.message || "Failed to load messages.");
  }

  return (result.data || [])
    .filter((entry) => entry && typeof entry.message === "string")
    .map((entry) => normalizeGuestbookEntry({
      id: entry.id,
      name: entry.name,
      message: entry.message,
      timestamp: entry.created_at
    }));
}

async function loadGuestbookEntries() {
  if (guestbookMode === "supabase") {
    return loadRemoteGuestbookEntries();
  }

  return loadLocalGuestbookEntries();
}

function formatEntryTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) {
    return "just now";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderGuestbook() {
  if (!dom.guestbookList) {
    return;
  }

  dom.guestbookList.textContent = "";

  if (guestbookEntries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-note";
    empty.textContent = "No signals yet. Be the first to leave a message.";
    dom.guestbookList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  guestbookEntries.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "guestbook-entry";

    const header = document.createElement("header");

    const author = document.createElement("strong");
    author.textContent = entry.name;

    const meta = document.createElement("div");
    meta.className = "guestbook-meta";

    const time = document.createElement("time");
    time.dateTime = entry.timestamp;
    time.textContent = formatEntryTime(entry.timestamp);

    meta.appendChild(time);

    if (canDeleteGuestbookEntries() && entry.id !== null) {
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "guestbook-delete";
      removeButton.dataset.guestbookDeleteId = String(entry.id);
      removeButton.textContent = "Remove";
      removeButton.setAttribute("aria-label", `Remove message from ${author.textContent}`);
      meta.appendChild(removeButton);
    }

    const message = document.createElement("p");
    message.textContent = entry.message;

    header.appendChild(author);
    header.appendChild(meta);
    item.appendChild(header);
    item.appendChild(message);
    fragment.appendChild(item);
  });

  dom.guestbookList.appendChild(fragment);
}

async function refreshGuestbook() {
  guestbookEntries = await loadGuestbookEntries();
  renderGuestbook();
}

async function addGuestbookEntry(payload) {
  const entry = normalizeGuestbookEntry(payload);

  if (!entry.message) {
    return;
  }

  if (guestbookMode === "supabase" && supabaseClient) {
    const result = await supabaseClient
      .from(GUESTBOOK_TABLE)
      .insert({ name: entry.name, message: entry.message });

    if (result.error) {
      throw new Error(result.error.message || "Failed to add message.");
    }

    await refreshGuestbook();
    return;
  }

  guestbookEntries.unshift(entry);
  if (guestbookEntries.length > 120) {
    guestbookEntries = guestbookEntries.slice(0, 120);
  }
  saveLocalGuestbookEntries(guestbookEntries);
  renderGuestbook();
}

async function removeGuestbookEntry(entryId) {
  if (!canDeleteGuestbookEntries() || !supabaseClient) {
    return;
  }

  const result = await supabaseClient
    .from(GUESTBOOK_TABLE)
    .delete()
    .eq("id", entryId);

  if (result.error) {
    throw new Error(result.error.message || "Failed to remove message.");
  }

  await refreshGuestbook();
}

async function signInAdmin() {
  if (guestbookMode !== "supabase" || !supabaseClient) {
    setGuestbookNote("Supabase not configured.", true);
    return;
  }

  if (!dom.adminEmail || !dom.adminPassword) {
    return;
  }

  const email = dom.adminEmail.value.trim();
  const password = dom.adminPassword.value;

  if (!email || !password) {
    setGuestbookNote("Enter admin email and password.", true);
    return;
  }

  setGuestbookBusy(true);

  try {
    const result = await supabaseClient.auth.signInWithPassword({ email, password });
    if (result.error) {
      throw new Error(result.error.message || "Failed to sign in.");
    }

    adminUser = result.data?.user || result.data?.session?.user || null;
    dom.adminPassword.value = "";

    renderGuestbookAdminState();
    renderGuestbook();

    if (isAdminUser(adminUser)) {
      setGuestbookNote("Admin signed in. Delete enabled.");
    } else {
      setGuestbookNote("Signed in, but this account is not the configured admin.", true);
    }
  } catch (error) {
    setGuestbookNote(error.message || "Admin sign-in failed.", true);
  } finally {
    setGuestbookBusy(false);
  }
}

async function signOutAdmin() {
  if (guestbookMode !== "supabase" || !supabaseClient) {
    return;
  }

  setGuestbookBusy(true);

  try {
    const result = await supabaseClient.auth.signOut();
    if (result.error) {
      throw new Error(result.error.message || "Failed to sign out.");
    }

    adminUser = null;
    renderGuestbookAdminState();
    renderGuestbook();
    setGuestbookNote("Signed out.");
  } catch (error) {
    setGuestbookNote(error.message || "Admin sign-out failed.", true);
  } finally {
    setGuestbookBusy(false);
  }
}

async function onGuestbookSubmit(event) {
  event.preventDefault();

  if (!dom.guestbookName || !dom.guestbookMessage) {
    return;
  }

  const name = dom.guestbookName.value.trim().slice(0, 30);
  const message = dom.guestbookMessage.value.trim().slice(0, 180);

  if (!message) {
    dom.guestbookMessage.focus();
    return;
  }

  setGuestbookBusy(true);

  try {
    await addGuestbookEntry({
      name: name || "Anonymous",
      message,
      timestamp: new Date().toISOString()
    });

    dom.guestbookForm.reset();
    dom.guestbookName.focus();
    setGuestbookNote(guestbookMode === "supabase" ? "Message sent." : "Message saved locally.");
  } catch (error) {
    setGuestbookNote(error.message || "Could not post message.", true);
  } finally {
    setGuestbookBusy(false);
  }
}

async function onGuestbookListClick(event) {
  const button = event.target.closest("button[data-guestbook-delete-id]");
  if (!button) {
    return;
  }

  if (!canDeleteGuestbookEntries()) {
    return;
  }

  const entryId = button.dataset.guestbookDeleteId;
  if (!entryId) {
    return;
  }

  setGuestbookBusy(true);

  try {
    await removeGuestbookEntry(entryId);
    setGuestbookNote("Message removed.");
  } catch (error) {
    setGuestbookNote(error.message || "Could not remove message.", true);
  } finally {
    setGuestbookBusy(false);
  }
}

async function initGuestbook() {
  await initGuestbookBackend();
  renderGuestbookAdminState();

  try {
    await refreshGuestbook();
  } catch (error) {
    setGuestbookNote(error.message || "Could not load guestbook.", true);
    guestbookEntries = [];
    renderGuestbook();
  }

  if (dom.guestbookList) {
    dom.guestbookList.addEventListener("click", (event) => {
      void onGuestbookListClick(event);
    });
  }

  if (dom.guestbookForm) {
    dom.guestbookForm.addEventListener("submit", (event) => {
      void onGuestbookSubmit(event);
    });
  }

  if (dom.adminLogin) {
    dom.adminLogin.addEventListener("click", () => {
      void signInAdmin();
    });
  }

  if (dom.adminLogout) {
    dom.adminLogout.addEventListener("click", () => {
      void signOutAdmin();
    });
  }
}

function persistEffectSettings() {
  writeStorage(STORAGE_KEYS.effects, userEffectSettings);
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
      userEffectSettings.stars = event.target.checked;
      persistEffectSettings();
      applyEffects();
    });
  }

  onReducedMotionChange(() => {
    applyEffects();
  });
}

async function init() {
  renderLinkList(dom.pagesLinks, NAV_ITEMS);
  renderLinkList(dom.connectLinks, SOCIAL_LINKS);
  renderProjects();
  initClock();
  initStatusLine();
  initNowPlaying();
  initEffectControls();
  applyEffects();
  await initGuestbook();
}

void init();
