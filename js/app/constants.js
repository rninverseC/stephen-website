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
  { label: "Home", href: "index.html" },
  { label: "About Me", href: "about.html" },
  { label: "Projects", href: "projects.html" },
  { label: "Album", href: "album.html" },
  { label: "Blog", href: "blog.html" },
  { label: "Life", href: "life.html" }
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

export const SNOW_DENSITY = {
  normal: 2000,
  reduced: 1800
};

export const SNOW_PROFILE = {
  normal: {
    sizeMinPx: 3.1,
    sizeMaxPx: 7.4,
    durationMinSec: 7,
    durationMaxSec: 21,
    straightRatio: 0.45,
    straightMidDriftVw: 1.2,
    straightEndDriftVw: 2.4,
    swayMidDriftVw: 8,
    swayEndDriftVw: 16,
    alphaMin: 0.35,
    alphaMax: 0.95
  },
  reduced: {
    sizeMinPx: 2.6,
    sizeMaxPx: 5.8,
    durationMinSec: 10,
    durationMaxSec: 26,
    straightRatio: 0.65,
    straightMidDriftVw: 0.8,
    straightEndDriftVw: 1.5,
    swayMidDriftVw: 4,
    swayEndDriftVw: 7,
    alphaMin: 0.3,
    alphaMax: 0.8
  }
};

export const SNOW_LAYER_PROFILE = {
  normal: {
    front: {
      sizeMul: 1.28,
      durationMul: 1.4,
      spawnX: [-20, 98],
      spawnY: [-36, 102],
      driftMidX: [10, 20],
      driftEndX: [24, 42],
      travelMidY: 56,
      travelEndY: 118
    },
    mid: {
      sizeMul: 0.98,
      durationMul: 2.7,
      spawnX: [-14, 104],
      spawnY: [-22, 102],
      driftMidX: [14, 30],
      driftEndX: [34, 60],
      travelMidY: 42,
      travelEndY: 96
    },
    back: {
      sizeMul: 0.84,
      durationMul: 4.1,
      spawnX: [34, 130],
      spawnY: [-40, 28],
      driftMidX: [-24, -12],
      driftEndX: [-54, -28],
      travelMidY: 34,
      travelEndY: 102
    }
  },
  reduced: {
    front: {
      sizeMul: 1.2,
      durationMul: 1.3,
      spawnX: [-18, 100],
      spawnY: [-28, 100],
      driftMidX: [7, 14],
      driftEndX: [16, 30],
      travelMidY: 48,
      travelEndY: 108
    },
    mid: {
      sizeMul: 0.95,
      durationMul: 1.9,
      spawnX: [-12, 104],
      spawnY: [-18, 100],
      driftMidX: [10, 20],
      driftEndX: [22, 40],
      travelMidY: 34,
      travelEndY: 78
    },
    back: {
      sizeMul: 0.82,
      durationMul: 2.6,
      spawnX: [34, 128],
      spawnY: [-30, 24],
      driftMidX: [-16, -8],
      driftEndX: [-34, -18],
      travelMidY: 26,
      travelEndY: 74
    }
  }
};

export const DEFAULT_EFFECT_SETTINGS = {
  snow: true
};
