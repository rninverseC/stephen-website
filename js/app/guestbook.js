import {
  STORAGE_KEYS,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  ADMIN_EMAIL,
  GUESTBOOK_TABLE,
  DEFAULT_GUESTBOOK_ENTRIES
} from "./constants.js";
import { dom } from "./dom.js";
import { appState } from "./state.js";
import { readStorage, writeStorage, normalizeGuestbookEntry } from "./utils.js";

function setGuestbookNote(text, isError = false) {
  if (!dom.guestbookAdminNote) {
    return;
  }

  dom.guestbookAdminNote.textContent = text;
  dom.guestbookAdminNote.classList.toggle("is-error", isError);
}

function setGuestbookBusy(isBusy) {
  appState.guestbookBusy = isBusy;

  if (dom.guestbookSubmit) {
    dom.guestbookSubmit.disabled = isBusy;
  }

  if (dom.adminLogin) {
    dom.adminLogin.disabled = isBusy || appState.guestbookMode !== "supabase";
  }

  if (dom.adminLogout) {
    dom.adminLogout.disabled = isBusy || appState.guestbookMode !== "supabase";
  }
}

function isAdminUser(user) {
  if (!user || !user.email || !ADMIN_EMAIL) {
    return false;
  }

  return user.email.toLowerCase() === ADMIN_EMAIL;
}

function canDeleteGuestbookEntries() {
  return appState.guestbookMode === "supabase" && isAdminUser(appState.adminUser);
}

function renderGuestbookAdminState() {

  if (dom.guestbookAdminState) {
    if (appState.guestbookMode !== "supabase") {
      dom.guestbookAdminState.textContent = "Admin: unavailable in local mode";
    } else if (isAdminUser(appState.adminUser)) {
      dom.guestbookAdminState.textContent = `Admin: signed in (${appState.adminUser.email})`;
    } else if (appState.adminUser && appState.adminUser.email) {
      dom.guestbookAdminState.textContent = `Admin: signed in as non-admin (${appState.adminUser.email})`;
    } else {
      dom.guestbookAdminState.textContent = "Admin: signed out";
    }
  }

  if (dom.adminLogin && dom.adminLogout) {
    const canAuth = appState.guestbookMode === "supabase";
    const loggedIn = Boolean(appState.adminUser);

    dom.adminLogin.hidden = !canAuth || loggedIn;
    dom.adminLogout.hidden = !canAuth || !loggedIn;
  }

  if (dom.guestbookAdminRow) {
    dom.guestbookAdminRow.hidden = appState.guestbookMode !== "supabase";
  }

  if (dom.adminEmail && dom.adminPassword) {
    const canAuth = appState.guestbookMode === "supabase";
    const loggedIn = Boolean(appState.adminUser);

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

  if (appState.guestbookMode !== "supabase") {
    setGuestbookNote("Local mode active. Configure Supabase to enable shared guestbook and admin-only delete.");
  } else if (!ADMIN_EMAIL) {
    setGuestbookNote("Supabase connected, but APP_CONFIG.adminEmail is empty. Delete remains disabled.", true);
  } else if (isAdminUser(appState.adminUser)) {
    setGuestbookNote("Admin mode enabled. You can remove messages.");
  } else {
    setGuestbookNote("Welcome");
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
    appState.guestbookMode = "local";
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    appState.guestbookMode = "local";
    setGuestbookNote("Supabase library not loaded; using local mode.", true);
    return;
  }

  try {
    appState.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    appState.guestbookMode = "supabase";

    const sessionResult = await appState.supabaseClient.auth.getSession();
    appState.adminUser = sessionResult.data?.session?.user || null;

    appState.supabaseClient.auth.onAuthStateChange((_event, session) => {
      appState.adminUser = session?.user || null;
      renderGuestbookAdminState();
      renderGuestbook();
    });
  } catch {
    appState.guestbookMode = "local";
    appState.supabaseClient = null;
    appState.adminUser = null;
    setGuestbookNote("Could not connect to Supabase; using local mode.", true);
  }
}

async function loadRemoteGuestbookEntries() {
  if (!appState.supabaseClient) {
    return [];
  }

  const result = await appState.supabaseClient
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
  if (appState.guestbookMode === "supabase") {
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
    hour12: false,
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderGuestbook() {
  if (!dom.guestbookList) {
    return;
  }

  dom.guestbookList.textContent = "";

  if (appState.guestbookEntries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-note";
    empty.textContent = "No signals yet. Be the first to leave a message.";
    dom.guestbookList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  appState.guestbookEntries.forEach((entry) => {
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
  appState.guestbookEntries = await loadGuestbookEntries();
  renderGuestbook();
}

async function addGuestbookEntry(payload) {
  const entry = normalizeGuestbookEntry(payload);

  if (!entry.message) {
    return;
  }

  if (appState.guestbookMode === "supabase" && appState.supabaseClient) {
    const result = await appState.supabaseClient
      .from(GUESTBOOK_TABLE)
      .insert({ name: entry.name, message: entry.message });

    if (result.error) {
      throw new Error(result.error.message || "Failed to add message.");
    }

    await refreshGuestbook();
    return;
  }

  appState.guestbookEntries.unshift(entry);
  if (appState.guestbookEntries.length > 120) {
    appState.guestbookEntries = appState.guestbookEntries.slice(0, 120);
  }
  saveLocalGuestbookEntries(appState.guestbookEntries);
  renderGuestbook();
}

async function removeGuestbookEntry(entryId) {
  if (!canDeleteGuestbookEntries() || !appState.supabaseClient) {
    return;
  }

  const result = await appState.supabaseClient
    .from(GUESTBOOK_TABLE)
    .delete()
    .eq("id", entryId);

  if (result.error) {
    throw new Error(result.error.message || "Failed to remove message.");
  }

  await refreshGuestbook();
}

async function signInAdmin() {
  if (appState.guestbookMode !== "supabase" || !appState.supabaseClient) {
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
    const result = await appState.supabaseClient.auth.signInWithPassword({ email, password });
    if (result.error) {
      throw new Error(result.error.message || "Failed to sign in.");
    }

    appState.adminUser = result.data?.user || result.data?.session?.user || null;
    dom.adminPassword.value = "";

    renderGuestbookAdminState();
    renderGuestbook();

    if (isAdminUser(appState.adminUser)) {
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
  if (appState.guestbookMode !== "supabase" || !appState.supabaseClient) {
    return;
  }

  setGuestbookBusy(true);

  try {
    const result = await appState.supabaseClient.auth.signOut();
    if (result.error) {
      throw new Error(result.error.message || "Failed to sign out.");
    }

    appState.adminUser = null;
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
    setGuestbookNote(appState.guestbookMode === "supabase" ? "Message sent." : "Message saved locally.");
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

export async function initGuestbook() {
  await initGuestbookBackend();
  renderGuestbookAdminState();

  try {
    await refreshGuestbook();
  } catch (error) {
    setGuestbookNote(error.message || "Could not load guestbook.", true);
    appState.guestbookEntries = [];
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
