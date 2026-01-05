import { systemPreferences, shell, dialog, app } from "electron";
const {
  hasScreenCapturePermission,
  hasPromptedForPermission,
} = require("mac-screen-capture-permissions");
const { ensureDockIsShowing } = require("../utils/dock");
import i18n from "../i18n";

let isDialogShowing = false;

const promptSystemPreferences =
  (options: {
    message: string;
    detail: string;
    systemPreferencesPath: string;
  }) =>
  async ({ hasAsked }: { hasAsked?: boolean } = {}) => {
    if (hasAsked || isDialogShowing) {
      return false;
    }

    isDialogShowing = true;
    await ensureDockIsShowing(async () => {
      const { response } = await dialog.showMessageBox({
        type: "warning",
        buttons: [i18n.t("OpenSystemPreferences"), i18n.t("Cancel")],
        defaultId: 0,
        message: options.message,
        detail: options.detail,
        cancelId: 1,
      });
      isDialogShowing = false;

      if (response === 0) {
        await openSystemPreferences(options.systemPreferencesPath);
        app.quit();
      }
    });

    return false;
  };

export const openSystemPreferences = async (path: string) =>
  shell.openExternal(
    `x-apple.systempreferences:com.apple.preference.security?${path}`
  );

// Microphone

const getMicrophoneAccess = () =>
  systemPreferences.getMediaAccessStatus("microphone");

const microphoneFallback = promptSystemPreferences({
  message: i18n.t("CannotAccessMicrophone"),
  detail: i18n.t("CannotAccessMicrophoneDetail"),
  systemPreferencesPath: "Privacy_Microphone",
});

export const ensureMicrophonePermissions = async (
  fallback = microphoneFallback
) => {
  const access = getMicrophoneAccess();

  if (access === "granted") {
    return true;
  }

  if (access !== "denied") {
    const granted = await systemPreferences.askForMediaAccess("microphone");

    if (granted) {
      return true;
    }

    return fallback({ hasAsked: true });
  }

  return fallback();
};

export const hasMicrophoneAccess = () => getMicrophoneAccess() === "granted";

// Screen Capture (10.15 and newer)

const screenCaptureFallback = promptSystemPreferences({
  message: i18n.t("CannotRecordScreen"),
  detail: i18n.t("CannotRecordScreenDetail"),
  systemPreferencesPath: "Privacy_ScreenCapture",
});

export const ensureScreenCapturePermissions = (
  fallback = screenCaptureFallback
) => {
  const hadAsked = hasPromptedForPermission();

  const hasAccess = hasScreenCapturePermission();

  if (hasAccess) {
    return true;
  }

  fallback({ hasAsked: !hadAsked });
  return false;
};

export const hasScreenCaptureAccess = () => hasScreenCapturePermission();
