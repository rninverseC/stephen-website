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
      // Order: Ocean -> China -> Joshua Tree -> Palm Springs -> San Francisco -> Sunset -> Beach.
      { file: "life/ocean-01.jpg", alt: "Ocean", caption: "Ocean 1" },
      { file: "life/ocean-02.png", alt: "Ocean", caption: "Ocean 2" },
      { file: "life/china-01.png", alt: "China", caption: "China 1" },
      { file: "life/china-02.jpg", alt: "China", caption: "China 2" },
      { file: "life/china-03.png", alt: "China", caption: "China 3" },
      { file: "life/china-04.png", alt: "China", caption: "China 4" },
      { file: "life/china-05.png", alt: "China", caption: "China 5" },
      { file: "life/joshua-tree-01.jpg", alt: "Joshua Tree", caption: "Joshua Tree 1" },
      { file: "life/joshua-tree-02.jpg", alt: "Joshua Tree", caption: "Joshua Tree 2" },
      { file: "life/palm-springs-01.jpg", alt: "Palm Springs", caption: "Palm Springs 1" },
      { file: "life/palm-springs-02.jpg", alt: "Palm Springs", caption: "Palm Springs 2" },
      { file: "life/palm-springs-03.jpg", alt: "Palm Springs", caption: "Palm Springs 3" },
      { file: "life/san-francisco-01.png", alt: "San Francisco", caption: "San Francisco 1" },
      { file: "life/san-francisco-02.jpg", alt: "San Francisco", caption: "San Francisco 2" },
      { file: "life/san-francisco-03.jpg", alt: "San Francisco", caption: "San Francisco 3" },
      { file: "life/sunset-01.png", alt: "Sunset", caption: "Sunset 1" },
      { file: "life/sunset-02.jpg", alt: "SpaceX", caption: "Spaceship" },
      { file: "life/beach-01.png", alt: "Beach", caption: "Beach 1" }
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
    id: "food",
    title: "Food",
    images: [
      { file: "food/IMG_6915.png", alt: "Food photo 1", caption: "Food photo 1" },
      { file: "food/IMG_9157.jpg", alt: "Food photo 2", caption: "Food photo 2" },
      { file: "food/IMG_9158.jpg", alt: "Food photo 3", caption: "Food photo 3" },
      { file: "food/IMG_9231.jpg", alt: "Food photo 4", caption: "Food photo 4" }
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
