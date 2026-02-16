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
  { label: "GitHub", href: "https://github.com/", external: true },
  { label: "Discord", href: "#" },
  { label: "E-mail", href: "mailto:you@example.com" }
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

const MOTION_PROFILES = {
  low: { stars: 70, rain: 45 },
  medium: { stars: 130, rain: 90 },
  high: { stars: 180, rain: 130 }
};

const DEFAULT_EFFECT_SETTINGS = {
  stars: true,
  rain: true,
  motion: "medium"
};

const dom = {
  starLayer: document.getElementById("star-layer"),
  rainLayer: document.getElementById("rain-layer"),
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
  toggleStars: document.getElementById("toggle-stars"),
  toggleRain: document.getElementById("toggle-rain"),
  motionRadios: Array.from(document.querySelectorAll("input[data-motion]")),
  effectsNote: document.getElementById("effects-note")
};

const reduceMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
let guestbookEntries = [];
let userEffectSettings = loadEffectSettings();
let guestbookMode = "local";
let supabaseClient = null;
let adminUser = null;
let guestbookBusy = false;

function random(min, max) {
  return Math.random() * (max - min) + min;
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
    // Ignore storage write failures in constrained environments.
  }
}

function sanitizeMotion(value) {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
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
  return {
    stars: typeof stored.stars === "boolean" ? stored.stars : DEFAULT_EFFECT_SETTINGS.stars,
    rain: typeof stored.rain === "boolean" ? stored.rain : DEFAULT_EFFECT_SETTINGS.rain,
    motion: sanitizeMotion(stored.motion)
  };
}

function getEffectiveEffectSettings() {
  if (reduceMotionMedia.matches) {
    return {
      stars: userEffectSettings.stars,
      rain: false,
      motion: "low"
    };
  }

  return { ...userEffectSettings };
}

function applyBodyEffectAttributes(settings) {
  document.body.dataset.motion = settings.motion;
  document.body.dataset.stars = settings.stars ? "on" : "off";
  document.body.dataset.rain = settings.rain ? "on" : "off";
  document.body.classList.toggle("reduced-motion", reduceMotionMedia.matches);
}

function syncEffectControls(effectiveSettings) {
  if (!dom.toggleStars || !dom.toggleRain || !dom.motionRadios.length) {
    return;
  }

  dom.toggleStars.checked = userEffectSettings.stars;
  dom.toggleRain.checked = reduceMotionMedia.matches ? false : userEffectSettings.rain;

  dom.toggleRain.disabled = reduceMotionMedia.matches;

  dom.motionRadios.forEach((radio) => {
    if (reduceMotionMedia.matches) {
      radio.checked = radio.value === "low";
      radio.disabled = true;
      return;
    }

    radio.checked = radio.value === userEffectSettings.motion;
    radio.disabled = false;
  });

  if (dom.effectsNote) {
    dom.effectsNote.hidden = !reduceMotionMedia.matches;
  }

  if (dom.toggleStars.checked !== effectiveSettings.stars) {
    dom.toggleStars.checked = effectiveSettings.stars;
  }
}

function createStars(count) {
  if (!dom.starLayer) {
    return;
  }

  dom.starLayer.textContent = "";
  if (count <= 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i += 1) {
    const star = document.createElement("span");
    star.className = "star";
    star.style.setProperty("--x", random(0, 100).toFixed(2));
    star.style.setProperty("--y", random(0, 100).toFixed(2));
    star.style.setProperty("--size", `${random(0.7, 2.6).toFixed(2)}px`);
    star.style.setProperty("--duration", `${random(2.8, 8.5).toFixed(2)}s`);
    star.style.setProperty("--delay", `${random(-8, 0).toFixed(2)}s`);
    fragment.appendChild(star);
  }

  dom.starLayer.appendChild(fragment);
}

function createRain(count) {
  if (!dom.rainLayer) {
    return;
  }

  dom.rainLayer.textContent = "";
  if (count <= 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i += 1) {
    const drop = document.createElement("span");
    drop.className = "rain-drop";
    drop.style.setProperty("--x", random(-8, 96).toFixed(2));
    drop.style.setProperty("--y", random(-45, 85).toFixed(2));
    drop.style.setProperty("--length", `${random(30, 95).toFixed(1)}px`);
    drop.style.setProperty("--duration", `${random(1.4, 3.1).toFixed(2)}s`);
    drop.style.setProperty("--delay", `${random(-3, 0).toFixed(2)}s`);
    fragment.appendChild(drop);
  }

  dom.rainLayer.appendChild(fragment);
}

function applyEffects() {
  const effective = getEffectiveEffectSettings();
  const profile = MOTION_PROFILES[effective.motion];

  applyBodyEffectAttributes(effective);
  syncEffectControls(effective);

  createStars(effective.stars ? profile.stars : 0);
  createRain(effective.rain ? profile.rain : 0);
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
    } else if (!dom.adminEmail.value && ADMIN_EMAIL) {
      dom.adminEmail.value = ADMIN_EMAIL;
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

  if (dom.toggleRain) {
    dom.toggleRain.addEventListener("change", (event) => {
      userEffectSettings.rain = event.target.checked;
      persistEffectSettings();
      applyEffects();
    });
  }

  dom.motionRadios.forEach((radio) => {
    radio.addEventListener("change", (event) => {
      if (!event.target.checked) {
        return;
      }

      userEffectSettings.motion = sanitizeMotion(event.target.value);
      persistEffectSettings();
      applyEffects();
    });
  });

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
  await initGuestbook();
  initEffectControls();
  applyEffects();
}

void init();
