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

export const ALBUM_IMAGE_BASE_PATH = "../assets/album/";

export const ALBUM_SECTIONS = [
  {
    id: "life",
    title: "Life",
    images: [
      // { file: "life-01.jpg", alt: "Random moment", caption: "Life lately" }
    ]
  },
  {
    id: "soccer",
    title: "Soccer",
    images: [
      // { file: "soccer-01.jpg", alt: "On the field", caption: "Game day" }
    ]
  },
  {
    id: "china",
    title: "China",
    images: [
      // { file: "china-01.jpg", alt: "Street in China", caption: "Trip memory" }
    ]
  },
  {
    id: "food",
    title: "Food",
    images: [
      // { file: "food-01.jpg", alt: "Favorite meal", caption: "Food memory" }
    ]
  }
];

export const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/rninverseC", external: true }
];

export const STATUS_LINES = [
  "Don't roast me lad 😭"
];

export const BIRTH_DATE_ISO = "2008-10-22T00:00:00Z";
export const AGE_DECIMAL_PLACES = 10;

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
  normal: 220,
  reduced: 140
};

export const SNOW_PROFILE = {
  normal: {
    sizeMinPx: 7.2,
    sizeMaxPx: 14.8,
    durationMinSec: 14,
    durationMaxSec: 34,
    straightRatio: 0.12,
    straightMidDriftVw: 1.4,
    straightEndDriftVw: 3.2,
    swayMidDriftVw: 11,
    swayEndDriftVw: 24,
    alphaMin: 0.48,
    alphaMax: 0.94
  },
  reduced: {
    sizeMinPx: 6.6,
    sizeMaxPx: 12.2,
    durationMinSec: 20,
    durationMaxSec: 40,
    straightRatio: 0.2,
    straightMidDriftVw: 1.1,
    straightEndDriftVw: 2.4,
    swayMidDriftVw: 7,
    swayEndDriftVw: 14,
    alphaMin: 0.36,
    alphaMax: 0.8
  }
};

export const SNOW_LAYER_PROFILE = {
  normal: {
    front: {
      sizeMul: 1.16,
      durationMul: 1.2,
      spawnX: [-18, 102],
      spawnY: [-28, 96],
      driftMidX: [8, 20],
      driftEndX: [20, 34],
      travelMidY: 58,
      travelEndY: 116
    },
    mid: {
      sizeMul: 0.95,
      durationMul: 1.6,
      spawnX: [-14, 106],
      spawnY: [-24, 98],
      driftMidX: [-12, 14],
      driftEndX: [-20, 22],
      travelMidY: 50,
      travelEndY: 104
    },
    back: {
      sizeMul: 0.78,
      durationMul: 2.2,
      spawnX: [-10, 110],
      spawnY: [-20, 100],
      driftMidX: [-18, 12],
      driftEndX: [-30, 16],
      travelMidY: 46,
      travelEndY: 108
    }
  },
  reduced: {
    front: {
      sizeMul: 1.1,
      durationMul: 1.3,
      spawnX: [-14, 102],
      spawnY: [-24, 94],
      driftMidX: [5, 12],
      driftEndX: [12, 22],
      travelMidY: 52,
      travelEndY: 112
    },
    mid: {
      sizeMul: 0.92,
      durationMul: 1.8,
      spawnX: [-12, 104],
      spawnY: [-18, 98],
      driftMidX: [-8, 10],
      driftEndX: [-14, 14],
      travelMidY: 42,
      travelEndY: 92
    },
    back: {
      sizeMul: 0.74,
      durationMul: 2.4,
      spawnX: [-8, 108],
      spawnY: [-16, 100],
      driftMidX: [-12, 8],
      driftEndX: [-20, 12],
      travelMidY: 38,
      travelEndY: 96
    }
  }
};

export const DEFAULT_EFFECT_SETTINGS = {
  snow: true
};
