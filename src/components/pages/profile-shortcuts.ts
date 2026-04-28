export const PROFILE_SHORTCUT_IDS = {
  general: "profile-shortcut-genel",
  team: "profile-shortcut-ekip",
  workshop: "profile-shortcut-atolye",
  integration: "profile-shortcut-entegrasyon",
  security: "profile-shortcut-guvenlik",
  notifications: "profile-shortcut-bildirim",
} as const;

export type ProfileShortcutId =
  (typeof PROFILE_SHORTCUT_IDS)[keyof typeof PROFILE_SHORTCUT_IDS];

export const PROFILE_OPEN_MODAL_EVENT = "profile:open-modal";
