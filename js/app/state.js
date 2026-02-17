export const appState = {
  guestbookEntries: [],
  userEffectSettings: { stars: true },
  guestbookMode: "local",
  supabaseClient: null,
  adminUser: null,
  guestbookBusy: false
};

export const starfieldState = {
  ctx: null,
  width: 0,
  height: 0,
  dpr: 1,
  stars: [],
  rafId: null,
  lastTs: 0,
  elapsedSec: 0,
  isReady: false,
  resizeBound: false
};
