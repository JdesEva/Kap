'use strict';

import {Tray, app} from 'electron';
import {KeyboardEvent} from 'electron/main';
import path from 'path';
import {is} from 'electron-util';
import {getCogMenu} from './menus/cog';
import {getRecordMenu} from './menus/record';
import {track} from './common/analytics';
import {openFiles} from './utils/open-files';
import {windowManager} from './windows/manager';
import {pauseRecording, resumeRecording, stopRecording} from './aperture';

const getStaticPath = (filename: string) => {
  if (is.development) {
    // 开发环境：从项目根目录的 static 文件夹加载
    return path.join(__dirname, '..', '..', 'static', filename);
  }
  // 生产环境：从应用路径的 static 文件夹加载
  return path.join(app.getAppPath(), 'static', filename);
};

let tray: Tray;
let trayAnimation: NodeJS.Timeout | undefined;

const openContextMenu = async () => {
  tray.popUpContextMenu(await getCogMenu());
};

const openRecordingContextMenu = async () => {
  tray.popUpContextMenu(await getRecordMenu(false));
};

const openPausedContextMenu = async () => {
  tray.popUpContextMenu(await getRecordMenu(true));
};

const openCropperWindow = () => windowManager.cropper?.open();

export const initializeTray = () => {
  tray = new Tray(getStaticPath('menubarDefaultTemplate.png'));
  tray.on('click', openCropperWindow);
  tray.on('right-click', openContextMenu);
  tray.on('drop-files', (_, files) => {
    track('editor/opened/tray');
    openFiles(...files);
  });

  return tray;
};

export const disableTray = () => {
  tray.removeListener('click', openCropperWindow);
  tray.removeListener('right-click', openContextMenu);
};

export const resetTray = () => {
  if (trayAnimation) {
    clearTimeout(trayAnimation);
  }

  tray.removeAllListeners('click');
  tray.removeAllListeners('right-click');

  tray.setImage(getStaticPath('menubarDefaultTemplate.png'));
  tray.on('click', openCropperWindow);
  tray.on('right-click', openContextMenu);
};

export const setRecordingTray = () => {
  animateIcon();

  tray.removeAllListeners('right-click');

  // TODO: figure out why this is marked as missing. It's defined properly in the electron.d.ts file
  tray.once('click', onRecordingTrayClick);
  tray.on('right-click', openRecordingContextMenu);
};

export const setPausedTray = () => {
  if (trayAnimation) {
    clearTimeout(trayAnimation);
  }

  tray.removeAllListeners('right-click');

  tray.setImage(getStaticPath('pauseTemplate.png'));
  tray.once('click', resumeRecording);
  tray.on('right-click', openPausedContextMenu);
};

const onRecordingTrayClick = (event: KeyboardEvent) => {
  if (event.altKey) {
    pauseRecording();
    return;
  }

  stopRecording();
};

const animateIcon = async () => new Promise<void>(resolve => {
  const interval = 20;
  let i = 0;

  const next = () => {
    trayAnimation = setTimeout(() => {
      const number = String(i++).padStart(5, '0');
      const filename = `loading_${number}Template.png`;

      try {
        tray.setImage(getStaticPath(path.join('menubar-loading', filename)));
        next();
      } catch {
        trayAnimation = undefined;
        resolve();
      }
    }, interval);
  };

  next();
});
