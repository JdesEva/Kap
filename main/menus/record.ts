import { Menu } from "electron";
import { MenuItemId, MenuOptions } from "./utils";
import { pauseRecording, resumeRecording, stopRecording } from "../aperture";
import formatTime from "../utils/format-time";
import {
  getCurrentDurationStart,
  getOverallDuration,
} from "../utils/track-duration";
import i18n from "../i18n";

const getDurationLabel = () => {
  if (getCurrentDurationStart() <= 0) {
    return formatTime(getOverallDuration() / 1000, undefined);
  }

  return formatTime(
    (getOverallDuration() + (Date.now() - getCurrentDurationStart())) / 1000,
    undefined
  );
};

const getDurationMenuItem = () => ({
  id: MenuItemId.duration,
  label: getDurationLabel(),
  enabled: false,
});

const getStopRecordingMenuItem = () => ({
  id: MenuItemId.stopRecording,
  label: i18n.t("Stop"),
  click: stopRecording,
});

const getPauseRecordingMenuItem = () => ({
  id: MenuItemId.pauseRecording,
  label: i18n.t("Pause"),
  click: pauseRecording,
});

const getResumeRecordingMenuItem = () => ({
  id: MenuItemId.resumeRecording,
  label: i18n.t("Resume"),
  click: resumeRecording,
});

export const getRecordMenuTemplate = (isPaused: boolean): MenuOptions => [
  getDurationMenuItem(),
  {
    type: "separator",
  },
  isPaused ? getResumeRecordingMenuItem() : getPauseRecordingMenuItem(),
  getStopRecordingMenuItem(),
  {
    type: "separator",
  },
  {
    role: "quit",
    accelerator: "Command+Q",
  },
];

export const getRecordMenu = async (isPaused: boolean) => {
  return Menu.buildFromTemplate(getRecordMenuTemplate(isPaused));
};
