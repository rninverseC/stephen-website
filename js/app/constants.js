const APP_CONFIG = window.APP_CONFIG || {};

export const STORAGE_KEYS = {
  guestbook: "mywebsite_guestbook_entries"
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
