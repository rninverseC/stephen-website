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
  "Curiosity is the engine of progress.",
  "Invest time with intent.",
  "Build today with the future in mind.",
  "Progress begins with noticing what’s wrong."
];

export const SPOTIFY_NOW_PLAYING_URL = typeof APP_CONFIG.spotifyNowPlayingUrl === "string"
  ? APP_CONFIG.spotifyNowPlayingUrl.trim()
  : "";

const rawSpotifyPollMs = Number(APP_CONFIG.spotifyPollMs);
export const NOW_PLAYING_POLL_MS = Number.isFinite(rawSpotifyPollMs) && rawSpotifyPollMs >= 5000
  ? Math.floor(rawSpotifyPollMs)
  : 15000;

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

export const STARFIELD_SWIRL_PROFILE = {
  normal: {
    swirlDirection: -1,
    centerDriftXPct: 2.6,
    centerDriftYPct: 2.1,
    centerDriftFreqX: 0.045,
    centerDriftFreqY: 0.037,
    orbitTiltDeg: 29,
    orbitAspect: 0.42,
    orbitLaneMinPct: 18,
    orbitLaneMaxPct: 112,
    orbitAngularBaseRadPerSec: 0.05,
    orbitAngularDepthBoostRadPerSec: 0.2,
    orbitAngularVariance: 0.28,
    orbitBreathPct: 0.028,
    radialPulseFreq: 0.86,
    microJitterPxPerSec: 0.9
  },
  reduced: {
    swirlDirection: -1,
    centerDriftXPct: 1,
    centerDriftYPct: 0.8,
    centerDriftFreqX: 0.03,
    centerDriftFreqY: 0.026,
    orbitTiltDeg: 29,
    orbitAspect: 0.42,
    orbitLaneMinPct: 20,
    orbitLaneMaxPct: 104,
    orbitAngularBaseRadPerSec: 0.02,
    orbitAngularDepthBoostRadPerSec: 0.075,
    orbitAngularVariance: 0.18,
    orbitBreathPct: 0.012,
    radialPulseFreq: 0.55,
    microJitterPxPerSec: 0.3
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

export const DEFAULT_EFFECT_SETTINGS = {
  stars: true
};
