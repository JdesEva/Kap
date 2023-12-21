"use strict";

import { app } from "electron";
import { is } from "electron-util";
import * as Sentry from "@sentry/electron/renderer";
import { settings } from "../common/settings";

const SENTRY_PUBLIC_DSN =
  "https://04c3d4bad20820a0f358028f28e04d16@o4505409681948672.ingest.sentry.io/4506432195461120";

export const isSentryEnabled =
  !is.development && settings.get("allowAnalytics");

if (isSentryEnabled) {
  const release = `${app.name}@${app.getVersion()}`.toLowerCase();
  Sentry.init({
    dsn: SENTRY_PUBLIC_DSN,
    release,
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // If the entire session is not sampled, use the below sample rate to sample
    // sessions when an error occurs.
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      new Sentry.Replay({
        // Additional SDK configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}

export default Sentry;
