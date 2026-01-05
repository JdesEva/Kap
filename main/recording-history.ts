/* eslint-disable array-element-newline */
'use strict';

import {shell, clipboard} from 'electron';
import fs from 'fs';
import Store from 'electron-store';
import execa from 'execa';
import tempy from 'tempy';
import {SetOptional} from 'type-fest';

import {windowManager} from './windows/manager';
import {plugins} from './plugins';
import {generateTimestampedName} from './utils/timestamped-name';
import {Video} from './video';
import {ApertureOptions} from './common/types';
import Sentry, {isSentryEnabled} from './utils/sentry';
import i18n from './i18n';

import ffmpegPath from './utils/ffmpeg-path';

export interface PastRecording {
  filePath: string;
  name: string;
  date: string;
}

export interface ActiveRecording extends PastRecording {
  apertureOptions: ApertureOptions;
  plugins: Record<string, Record<string, any>>;
}

export const recordingHistory = new Store<{
  activeRecording: ActiveRecording;
  recordings: PastRecording[];
}>({
  name: 'recording-history',
  schema: {
    activeRecording: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string'
        },
        name: {
          type: 'string'
        },
        date: {
          type: 'string'
        },
        apertureOptions: {
          type: 'object'
        },
        plugins: {
          type: 'object'
        }
      }
    },
    recordings: {
      type: 'array',
      default: [],
      items: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string'
          },
          name: {
            type: 'string'
          },
          date: {
            type: 'string'
          }
        }
      }
    }
  }
});

export const setCurrentRecording = ({
  filePath,
  name = generateTimestampedName(),
  date = new Date().toISOString(),
  apertureOptions,
  plugins = {}
}: SetOptional<ActiveRecording, 'name' | 'date'>) => {
  recordingHistory.set('activeRecording', {
    filePath,
    name,
    date,
    apertureOptions,
    plugins
  });
};

export const updatePluginState = (state: ActiveRecording['plugins']) => {
  recordingHistory.set('activeRecording.plugins', state);
};

export const stopCurrentRecording = (recordingName?: string) => {
  const {filePath, name} = recordingHistory.get('activeRecording');
  addRecording({
    filePath,
    name: recordingName ?? name,
    date: new Date().toISOString()
  });
  recordingHistory.delete('activeRecording');
};

export const getPastRecordings = (): PastRecording[] => {
  const recordings = recordingHistory.get('recordings', []);
  const validRecordings = recordings.filter(({filePath}) => fs.existsSync(filePath));
  recordingHistory.set('recordings', validRecordings);
  return validRecordings;
};

export const addRecording = (newRecording: PastRecording): PastRecording[] => {
  const recordings = [newRecording, ...recordingHistory.get('recordings', [])];
  const validRecordings = recordings.filter(({filePath}) => fs.existsSync(filePath));
  recordingHistory.set('recordings', validRecordings);
  return validRecordings;
};

export const cleanPastRecordings = () => {
  const recordings = getPastRecordings();
  for (const recording of recordings) {
    fs.unlinkSync(recording.filePath);
  }

  recordingHistory.set('recordings', []);
};

export const cleanUpRecordingPlugins = (usedPlugins: ActiveRecording['plugins']) => {
  const recordingPlugins = plugins.recordingPlugins;

  for (const pluginName of Object.keys(usedPlugins)) {
    const plugin = recordingPlugins.find(p => p.name === pluginName);
    for (const [serviceTitle, persistedState] of Object.entries(usedPlugins[pluginName])) {
      const service = plugin?.recordServices.find(s => s.title === serviceTitle);

      if (service?.cleanUp) {
        service.cleanUp(persistedState);
      }
    }
  }
};

export const handleIncompleteRecording = async (recording: ActiveRecording) => {
  cleanUpRecordingPlugins(recording.plugins);

  try {
    await execa(ffmpegPath, [
      '-i', recording.filePath,
      // Verbosity level
      '-v', 'error',
      // Force file type to null (we don't want to actually generate a file)
      // https://trac.ffmpeg.org/wiki/Null
      '-f', 'null', '-'
    ]);
  } catch (error) {
    return handleCorruptRecording(recording, (error as any).stderr);
  }

  return handleRecording(recording);
};

const handleRecording = async (recording: ActiveRecording) => {
  addRecording({
    filePath: recording.filePath,
    name: recording.name,
    date: recording.date
  });

  return windowManager.dialog?.open({
    title: i18n.t('KapDidntShutDownCorrectly'),
    detail: i18n.t('KapCrashedDuringRecording'),
    buttons: [
      i18n.t('Close'),
      {
        label: i18n.t('ShowInFinder'),
        action: () => {
          shell.showItemInFolder(recording.filePath);
        }
      },
      {
        label: i18n.t('ShowInEditor'),
        action: async () => Video.getOrCreate({filePath: recording.filePath, title: recording.name}).openEditorWindow()
      }
    ]
  });
};

const knownErrors = [{
  test: (error: string) => error.includes('moov atom not found'),
  fix: async (filePath: string): Promise<string | void> => {
    try {
      const outputPath = tempy.file({extension: 'mp4'});

      await execa(ffmpegPath, [
        '-i',
        filePath,
        // Copy both streams
        '-vcodec',
        'copy',
        '-acodec',
        'copy',
        // Attempt to move the moov atom to the start of the file
        '-movflags',
        'faststart',
        outputPath
      ]);

      return outputPath;
    } catch {}
  }
}];

const handleCorruptRecording = async (recording: ActiveRecording, error: string) => {
  const options: any = {
    title: i18n.t('KapDidntShutDownCorrectly'),
    detail: i18n.t('KapCrashedRecordingCorrupt', {error}),
    cancelId: 0,
    defaultId: 2,
    buttons: [
      i18n.t('Close'),
      {
        label: i18n.t('CopyError'),
        action: () => {
          clipboard.writeText(error);
        }
      },
      {
        label: i18n.t('ShowInFinder'),
        action: () => {
          shell.showItemInFolder(recording.filePath);
        }
      }
    ]
  };

  const applicableErrors = knownErrors.filter(({test}) => test(error));

  if (applicableErrors.length === 0) {
    if (isSentryEnabled) {
      // Collect info about possible unknown errors, to see if we can implement fixes using ffmpeg
      Sentry.captureException(new Error(`Corrupt recording: ${error}`));
    }

    return windowManager.dialog?.open(options);
  }

  options.message = i18n.t('CanAttemptRepair');
  options.defaultId = 3;
  options.buttons.push({
    label: i18n.t('AttemptToFix'),
    activeLabel: i18n.t('AttemptingToFix'),
    action: async (_: any, updateUi: any) => {
      for (const {fix} of applicableErrors) {
        const outputPath = await fix(recording.filePath);

        if (outputPath) {
          addRecording({
            filePath: outputPath,
            name: recording.name,
            date: new Date().toISOString()
          });

          return updateUi({
            message: i18n.t('RecordingSuccessfullyRepaired'),
            defaultId: 2,
            buttons: [
              i18n.t('Close'),
              {
                label: i18n.t('ShowInFinder'),
                action: () => {
                  shell.showItemInFolder(outputPath);
                }
              },
              {
                label: i18n.t('ShowInEditor'),
                action: async () => Video.getOrCreate({filePath: outputPath, title: recording.name}).openEditorWindow()
              }
            ]
          });
        }
      }

      return updateUi({
        message: i18n.t('UnableToRepairRecording'),
        defaultId: 2,
        buttons: [
          i18n.t('Close'),
          {
            label: i18n.t('CopyError'),
            action: () => {
              clipboard.writeText(error);
            }
          },
          {
            label: i18n.t('ShowInFinder'),
            action: () => {
              shell.showItemInFolder(recording.filePath);
            }
          }
        ]
      });
    }
  });

  return windowManager.dialog?.open(options);
};

export const hasActiveRecording = async () => {
  const activeRecording = recordingHistory.get('activeRecording');

  if (activeRecording) {
    await handleIncompleteRecording(activeRecording);
    recordingHistory.delete('activeRecording');
    return true;
  }

  return false;
};
