'use strict';

import {app} from 'electron';
import {is} from 'electron-util';
import * as Sentry from '@sentry/electron';
import {settings} from '../common/settings';

const SENTRY_PUBLIC_DSN = 'https://04c3d4bad20820a0f358028f28e04d16@o4505409681948672.ingest.sentry.io/4506432195461120';

export const isSentryEnabled = !is.development && settings.get('allowAnalytics');

if (isSentryEnabled) {
  const release = `${app.name}@${app.getVersion()}`.toLowerCase();
  Sentry.init({
    dsn: SENTRY_PUBLIC_DSN,
    release
  });
}

export default Sentry;
