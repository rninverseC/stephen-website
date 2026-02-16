const APP_CONFIG = window.APP_CONFIG || {};

export const STORAGE_KEYS = {
  guestbook: "mywebsite_guestbook_entries",
  effects: "mywebsite_effect_settings"
};

export const SUPABASE_URL = typeof APP_CONFIG.supabaseUrl === "string" ? APP_CONFIG.supabaseUrl.trim() : "";
export const SUPABASE_ANON_KEY = typeof APP_CONFIG.supabaseAnonKey === "string" ? APP_CONFIG.supabaseAnonKey.trim() : "";
export const ADMIN_EMAIL = typeof APP_CONFIG.adminEmail === "string" ? APP_CONFIG.adminEmail.trim().toLowerCase() : "";
export const GUESTBOOK_TABLE = typeof APP_CONFIG.guestbookTable === "string" && APP_CONFIG.guestbookTable.trim()
  ? APP_CONFIG.guestbookTable.trim()
  : "guestbook_messages";

export const NAV_ITEMS = [
  { label: "Home", href: "#top" },
  { label: "About Me", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Guestbook", href: "#guestbook" },
  { label: "Album", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Life", href: "#" }
];

export const PROJECTS = [];

export const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/rninverseC", external: true }
];

export const STATUS_LINES = [
  "Building in public, one stable release at a time.",
  "Currently in deep work mode: shipping and polishing.",
  "Maintaining clear interfaces and faster feedback loops.",
  "Testing ideas in orbit before landing them in production."
];

export const NOW_PLAYING = {
  title: "Starlane Echo",
  artist: "Mock Transmission",
  durationSec: 243
};

export const DEFAULT_GUESTBOOK_ENTRIES = [
  {
    name: "Mission Control",
    message: "Signal received. Loving the space-retro atmosphere.",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  }
];

export const STARFIELD_DENSITY = {
  normal: 680,
  reduced: 240
};

export const STARFIELD_PROFILE = {
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

export const NEBULA_CLOUDS = [
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

export const RINGED_PLANET = {
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

export const DEFAULT_EFFECT_SETTINGS = {
  stars: true
};
