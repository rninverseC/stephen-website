import { NAV_ITEMS, PROJECTS, SOCIAL_LINKS, STATUS_LINES, NOW_PLAYING } from "./constants.js";
import { dom } from "./dom.js";

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

export function initWidgets() {
  renderLinkList(dom.pagesLinks, NAV_ITEMS);
  renderLinkList(dom.connectLinks, SOCIAL_LINKS);
  renderProjects();
  initClock();
  initStatusLine();
  initNowPlaying();
}
