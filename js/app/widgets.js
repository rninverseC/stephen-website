import {
  NAV_ITEMS,
  PROJECTS,
  ALBUM_SECTIONS,
  ALBUM_IMAGE_BASE_PATH,
  SOCIAL_LINKS,
  STATUS_LINES,
  BIRTH_DATE_ISO,
  AGE_DECIMAL_PLACES,
  SPOTIFY_NOW_PLAYING_URL,
  NOW_PLAYING_POLL_MS
} from "./constants.js";
import { dom } from "./dom.js";

let nowPlayingPollTimer = null;
let nowPlayingTickTimer = null;
let nowPlayingRuntime = null;
const MS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;
const AGE_UPDATE_INTERVAL_MS = 250;
const birthDateMs = Date.parse(BIRTH_DATE_ISO);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

function resolveAlbumImageSrc(entry) {
  const rawSource = typeof entry === "string"
    ? entry.trim()
    : typeof entry?.src === "string"
      ? entry.src.trim()
      : typeof entry?.file === "string"
        ? entry.file.trim()
        : "";

  if (!rawSource) {
    return "";
  }

  if (
    rawSource.startsWith("http://") ||
    rawSource.startsWith("https://") ||
    rawSource.startsWith("data:") ||
    rawSource.startsWith("/") ||
    rawSource.startsWith("./") ||
    rawSource.startsWith("../")
  ) {
    return rawSource;
  }

  return `${ALBUM_IMAGE_BASE_PATH}${rawSource}`;
}

function buildAlbumFigure(entry, fallbackLabel) {
  const src = resolveAlbumImageSrc(entry);
  if (!src) {
    return null;
  }

  const figure = document.createElement("figure");
  figure.className = "album-item";

  const image = document.createElement("img");
  image.src = src;
  image.loading = "lazy";
  image.decoding = "async";
  image.alt = typeof entry === "object" && typeof entry?.alt === "string" && entry.alt.trim()
    ? entry.alt.trim()
    : typeof entry === "object" && typeof entry?.caption === "string" && entry.caption.trim()
      ? entry.caption.trim()
      : fallbackLabel;
  figure.appendChild(image);

  if (typeof entry === "object" && typeof entry?.caption === "string" && entry.caption.trim()) {
    const caption = document.createElement("figcaption");
    caption.textContent = entry.caption.trim();
    figure.appendChild(caption);
  }

  return figure;
}

function normalizeAlbumSections() {
  if (!Array.isArray(ALBUM_SECTIONS)) {
    return [];
  }

  return ALBUM_SECTIONS.map((section, index) => ({
    id: typeof section?.id === "string" && section.id.trim()
      ? section.id.trim()
      : `section-${index + 1}`,
    title: typeof section?.title === "string" && section.title.trim()
      ? section.title.trim()
      : `Section ${index + 1}`,
    images: Array.isArray(section?.images) ? section.images : []
  }));
}

function buildAlbumBookPage(section) {
  const page = document.createElement("article");
  page.className = "album-book-page";
  page.id = `album-book-page-${section.id}`;
  page.dataset.sectionId = section.id;
  page.setAttribute("role", "tabpanel");
  page.setAttribute("aria-labelledby", `album-book-tab-${section.id}`);

  const inner = document.createElement("div");
  inner.className = "album-book-page-inner";

  const title = document.createElement("h3");
  title.className = "album-chapter-title";
  title.textContent = section.title;
  inner.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "album-grid";

  let addedCount = 0;
  section.images.forEach((entry, imageIndex) => {
    const figure = buildAlbumFigure(entry, `${section.title} photo ${imageIndex + 1}`);
    if (!figure) {
      return;
    }
    grid.appendChild(figure);
    addedCount += 1;
  });

  if (addedCount === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = `Add photos to "${section.title}" in ALBUM_SECTIONS.`;
    grid.appendChild(empty);
  }

  inner.appendChild(grid);
  page.appendChild(inner);
  return page;
}

function renderAlbum() {
  if (!dom.albumGrid) {
    return;
  }

  dom.albumGrid.textContent = "";
  const sections = normalizeAlbumSections();

  if (sections.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = "Define ALBUM_SECTIONS in js/app/constants.js.";
    dom.albumGrid.appendChild(empty);
    return;
  }

  const shell = document.createElement("div");
  shell.className = "album-book-shell";

  const nav = document.createElement("div");
  nav.className = "album-book-nav";
  nav.setAttribute("role", "tablist");
  nav.setAttribute("aria-label", "Album chapters");

  const frame = document.createElement("div");
  frame.className = "album-book-frame";

  let activeIndex = 0;
  let activePage = buildAlbumBookPage(sections[activeIndex]);
  activePage.classList.add("is-active");
  frame.appendChild(activePage);

  const tabButtons = [];

  function syncTabs(selectedIndex = activeIndex) {
    tabButtons.forEach((button, index) => {
      const isActive = index === selectedIndex;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
      button.tabIndex = isActive ? 0 : -1;
    });
  }

  let isAnimating = false;

  function switchChapter(nextIndex) {
    if (nextIndex === activeIndex || isAnimating || nextIndex < 0 || nextIndex >= sections.length) {
      return;
    }

    syncTabs(nextIndex);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || document.body.classList.contains("reduced-motion");
    const directionClass = nextIndex > activeIndex ? "flip-forward" : "flip-backward";
    const nextPage = buildAlbumBookPage(sections[nextIndex]);

    if (reduceMotion) {
      activePage.remove();
      nextPage.classList.add("is-active");
      frame.appendChild(nextPage);
      activePage = nextPage;
      activeIndex = nextIndex;
      syncTabs();
      return;
    }

    isAnimating = true;
    activePage.classList.remove("is-active");
    activePage.classList.add("is-leaving", directionClass);
    nextPage.classList.add("is-entering", directionClass);
    frame.appendChild(nextPage);

    let finished = false;
    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;

      activePage.remove();
      nextPage.classList.remove("is-entering", directionClass);
      nextPage.classList.add("is-active");
      activePage = nextPage;
      activeIndex = nextIndex;
      isAnimating = false;
      syncTabs();
    };

    nextPage.addEventListener("animationend", finish, { once: true });
    window.setTimeout(finish, 760);
  }

  sections.forEach((section, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "album-book-tab";
    tab.id = `album-book-tab-${section.id}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", `album-book-page-${section.id}`);
    tab.textContent = section.title;
    tab.addEventListener("click", () => {
      switchChapter(index);
    });
    tabButtons.push(tab);
    nav.appendChild(tab);
  });

  nav.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (activeIndex + delta + sections.length) % sections.length;
    switchChapter(nextIndex);
  });

  syncTabs();

  shell.appendChild(nav);
  shell.appendChild(frame);
  dom.albumGrid.appendChild(shell);
}

function formatClock(date) {
  return date.toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatAgeYears(nowMs) {
  if (!Number.isFinite(birthDateMs)) {
    return "--";
  }

  const ageYears = Math.max(0, (nowMs - birthDateMs) / MS_PER_YEAR);
  return ageYears.toFixed(AGE_DECIMAL_PLACES);
}

function updateAgeLine(nowMs) {
  if (!dom.ageLine) {
    return;
  }

  dom.ageLine.textContent = `I am ${formatAgeYears(nowMs)} years`;
}

function updateClock() {
  const now = new Date();

  if (dom.localClock) {
    dom.localClock.textContent = formatClock(now);
    dom.localClock.dateTime = now.toISOString();
  }
}

function initClock() {
  updateClock();
  window.setInterval(updateClock, 1000);
}

function initAgeLine() {
  if (!dom.ageLine) {
    return;
  }

  updateAgeLine(Date.now());
  window.setInterval(() => {
    updateAgeLine(Date.now());
  }, AGE_UPDATE_INTERVAL_MS);
}

function initStatusLine() {
  if (!dom.statusLine) {
    return;
  }

  const index = new Date().getDate() % STATUS_LINES.length;
  dom.statusLine.textContent = STATUS_LINES[index];
}

function formatDuration(totalSec) {
  const safeTotal = Math.max(0, Math.floor(totalSec));
  const minutes = Math.floor(safeTotal / 60);
  const seconds = safeTotal % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatRelativeTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) {
    return "just now";
  }

  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) {
    return `${diffSec}s ago`;
  }

  if (diffSec < 3600) {
    return `${Math.floor(diffSec / 60)}m ago`;
  }

  if (diffSec < 86400) {
    return `${Math.floor(diffSec / 3600)}h ago`;
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric"
  });
}

function clearNowPlayingTimers() {
  if (nowPlayingPollTimer !== null) {
    window.clearInterval(nowPlayingPollTimer);
    nowPlayingPollTimer = null;
  }

  if (nowPlayingTickTimer !== null) {
    window.clearInterval(nowPlayingTickTimer);
    nowPlayingTickTimer = null;
  }
}

function setAlbumArt(imageUrl) {
  if (!dom.trackArt) {
    return;
  }

  if (typeof imageUrl === "string" && imageUrl.trim()) {
    const safeUrl = imageUrl.trim().replace(/'/g, "\\'");
    dom.trackArt.style.backgroundImage = `url('${safeUrl}')`;
    dom.trackArt.classList.add("has-art");
    return;
  }

  dom.trackArt.style.removeProperty("background-image");
  dom.trackArt.classList.remove("has-art");
}

function setTrackProgress(currentSec, durationSec) {
  const safeDuration = Math.max(0, Math.floor(durationSec));
  const safeCurrent = Math.max(0, Math.floor(currentSec));

  let percent = 0;
  if (safeDuration > 0) {
    percent = clamp((safeCurrent / safeDuration) * 100, 0, 100);
  }

  if (dom.trackProgress) {
    dom.trackProgress.style.width = `${percent.toFixed(2)}%`;
  }

  if (dom.trackProgressShell) {
    dom.trackProgressShell.setAttribute("aria-valuenow", Math.round(percent).toString());
  }
}

function toSecondsFromSecOrMs(secondsValue, millisecondsValue) {
  const seconds = Number(secondsValue);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.floor(seconds);
  }

  const milliseconds = Number(millisecondsValue);
  if (Number.isFinite(milliseconds) && milliseconds > 0) {
    return Math.floor(milliseconds / 1000);
  }

  return 0;
}

function normalizeArtist(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") {
          return entry.trim();
        }

        if (entry && typeof entry.name === "string") {
          return entry.name.trim();
        }

        return "";
      })
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function normalizeTrack(rawTrack) {
  if (!rawTrack || typeof rawTrack !== "object") {
    return null;
  }

  const durationSec = toSecondsFromSecOrMs(rawTrack.durationSec ?? rawTrack.duration, rawTrack.duration_ms);
  const progressSec = toSecondsFromSecOrMs(rawTrack.progressSec ?? rawTrack.progress, rawTrack.progress_ms);

  return {
    title: typeof rawTrack.title === "string"
      ? rawTrack.title.trim()
      : typeof rawTrack.name === "string"
        ? rawTrack.name.trim()
        : "Unknown Track",
    artist: normalizeArtist(rawTrack.artist ?? rawTrack.artists),
    album: typeof rawTrack.album === "string"
      ? rawTrack.album.trim()
      : typeof rawTrack.albumName === "string"
        ? rawTrack.albumName.trim()
        : "",
    imageUrl: typeof rawTrack.imageUrl === "string"
      ? rawTrack.imageUrl.trim()
      : typeof rawTrack.image === "string"
        ? rawTrack.image.trim()
        : typeof rawTrack.albumArt === "string"
          ? rawTrack.albumArt.trim()
          : "",
    durationSec,
    progressSec: durationSec > 0 ? clamp(progressSec, 0, durationSec) : progressSec,
    isPlaying: Boolean(rawTrack.isPlaying ?? rawTrack.is_playing),
    playedAt: typeof rawTrack.playedAt === "string"
      ? rawTrack.playedAt
      : typeof rawTrack.played_at === "string"
        ? rawTrack.played_at
        : ""
  };
}

function parseNowPlayingPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (payload.track && typeof payload.track === "object") {
    return normalizeTrack({
      ...payload.track,
      isPlaying: payload.isPlaying ?? payload.is_playing ?? payload.track.isPlaying,
      playedAt: payload.playedAt ?? payload.played_at ?? payload.track.playedAt
    });
  }

  if (payload.item && typeof payload.item === "object") {
    return normalizeTrack({
      title: payload.item.name,
      artists: payload.item.artists,
      album: payload.item.album?.name,
      imageUrl: payload.item.album?.images?.[0]?.url,
      duration_ms: payload.item.duration_ms,
      progress_ms: payload.progress_ms,
      is_playing: payload.is_playing,
      played_at: payload.timestamp ? new Date(payload.timestamp).toISOString() : ""
    });
  }

  if (Array.isArray(payload.items) && payload.items.length > 0) {
    const recent = payload.items[0];
    return normalizeTrack({
      title: recent.track?.name,
      artists: recent.track?.artists,
      album: recent.track?.album?.name,
      imageUrl: recent.track?.album?.images?.[0]?.url,
      duration_ms: recent.track?.duration_ms,
      progress_ms: recent.track?.duration_ms,
      isPlaying: false,
      played_at: recent.played_at
    });
  }

  return normalizeTrack(payload);
}

async function fetchSpotifyNowPlaying() {
  if (!SPOTIFY_NOW_PLAYING_URL) {
    return null;
  }

  const response = await fetch(SPOTIFY_NOW_PLAYING_URL, {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Now playing request failed with ${response.status}`);
  }

  const payload = await response.json();
  return parseNowPlayingPayload(payload);
}

function renderUnavailableNowPlaying(message) {
  if (!dom.trackTitle || !dom.trackArtist || !dom.trackTimeCurrent || !dom.trackTimeTotal || !dom.trackProgress) {
    return;
  }

  dom.trackTitle.textContent = "No Spotify track";
  dom.trackArtist.textContent = message;
  dom.trackTimeCurrent.textContent = "--";
  dom.trackTimeTotal.textContent = "--:--";
  setTrackProgress(0, 0);
  setAlbumArt("");
}

function startSpotifyProgressTicker() {
  if (nowPlayingTickTimer !== null) {
    window.clearInterval(nowPlayingTickTimer);
    nowPlayingTickTimer = null;
  }

  if (!nowPlayingRuntime || !nowPlayingRuntime.isPlaying || nowPlayingRuntime.durationSec <= 0) {
    return;
  }

  nowPlayingTickTimer = window.setInterval(() => {
    if (!nowPlayingRuntime || !dom.trackTimeCurrent) {
      return;
    }

    const elapsedSec = Math.floor((Date.now() - nowPlayingRuntime.fetchedAtMs) / 1000);
    const currentSec = clamp(nowPlayingRuntime.progressSec + elapsedSec, 0, nowPlayingRuntime.durationSec);

    dom.trackTimeCurrent.textContent = formatDuration(currentSec);
    setTrackProgress(currentSec, nowPlayingRuntime.durationSec);

    if (currentSec >= nowPlayingRuntime.durationSec) {
      window.clearInterval(nowPlayingTickTimer);
      nowPlayingTickTimer = null;
    }
  }, 1000);
}

function renderSpotifyTrack(track) {
  if (!track || !dom.trackTitle || !dom.trackArtist || !dom.trackTimeCurrent || !dom.trackTimeTotal) {
    return;
  }

  nowPlayingRuntime = {
    ...track,
    fetchedAtMs: Date.now()
  };

  const details = [];
  if (track.artist) {
    details.push(track.artist);
  }
  if (track.album) {
    details.push(track.album);
  }

  if (track.isPlaying) {
    details.push("Playing now");
  } else if (track.playedAt) {
    details.push(`Last played ${formatRelativeTime(track.playedAt)}`);
  } else {
    details.push("Last played");
  }

  dom.trackTitle.textContent = track.title;
  dom.trackArtist.textContent = details.join(" · ");
  dom.trackTimeTotal.textContent = track.durationSec > 0 ? formatDuration(track.durationSec) : "--:--";

  if (track.isPlaying) {
    dom.trackTimeCurrent.textContent = formatDuration(track.progressSec);
    setTrackProgress(track.progressSec, track.durationSec);
  } else {
    dom.trackTimeCurrent.textContent = track.playedAt ? formatRelativeTime(track.playedAt) : "--";
    setTrackProgress(track.durationSec, track.durationSec);
  }

  setAlbumArt(track.imageUrl);
  startSpotifyProgressTicker();
}

async function refreshSpotifyNowPlaying() {
  try {
    const track = await fetchSpotifyNowPlaying();
    if (!track) {
      if (!nowPlayingRuntime) {
        renderUnavailableNowPlaying("No recent track found");
      }
      return;
    }

    renderSpotifyTrack(track);
  } catch (error) {
    console.warn("Spotify now playing unavailable:", error);
    if (!nowPlayingRuntime) {
      renderUnavailableNowPlaying("Spotify feed unavailable");
    }
  }
}

function initNowPlaying() {
  if (!dom.trackTitle || !dom.trackArtist || !dom.trackTimeCurrent || !dom.trackTimeTotal || !dom.trackProgress) {
    return;
  }

  clearNowPlayingTimers();

  if (!SPOTIFY_NOW_PLAYING_URL) {
    nowPlayingRuntime = null;
    renderUnavailableNowPlaying("Set spotifyNowPlayingUrl in js/config.js");
    return;
  }

  void refreshSpotifyNowPlaying();

  nowPlayingPollTimer = window.setInterval(() => {
    void refreshSpotifyNowPlaying();
  }, NOW_PLAYING_POLL_MS);
}

export function initWidgets() {
  renderLinkList(dom.pagesLinks, NAV_ITEMS);
  renderLinkList(dom.connectLinks, SOCIAL_LINKS);
  renderProjects();
  renderAlbum();
  initClock();
  initAgeLine();
  initStatusLine();
  initNowPlaying();
}
