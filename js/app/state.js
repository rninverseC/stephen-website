export const appState = {
  guestbookEntries: [],
  userEffectSettings: { snow: true },
  guestbookMode: "local",
  supabaseClient: null,
  adminUser: null,
  guestbookBusy: false
};

export const snowState = {
  isReady: false,
  resizeBound: false,
  flakeCount: 0
};
