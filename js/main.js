import { initializeEffects } from "./app/effects.js";
import { initGuestbook } from "./app/guestbook.js";
import { initWidgets } from "./app/widgets.js";

async function init() {
  initWidgets();
  initializeEffects();
  await initGuestbook();
}

void init();
