import React from "react";
import * as Sentry from "@sentry/browser";
import electron from "electron";
import type { api as Api, is as Is } from "electron-util";

const SENTRY_PUBLIC_DSN =
  "https://04c3d4bad20820a0f358028f28e04d16@o4505409681948672.ingest.sentry.io/4506432195461120";

class SentryErrorBoundary extends React.Component<{
  children: React.ReactNode;
}> {
  constructor(props) {
    super(props);
    const { settings } = electron.remote.require("./common/settings");
    // Done in-line because this is used in _app
    const { is, api } = require("electron-util") as {
      api: typeof Api;
      is: typeof Is;
    };

    if (!is.development && settings.get("allowAnalytics")) {
      const release = `${api.app.name}@${api.app.getVersion()}`.toLowerCase();
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
  }

  componentDidCatch(error, errorInfo) {
    console.log(error, errorInfo);
    Sentry.configureScope((scope) => {
      for (const [key, value] of Object.entries(errorInfo)) {
        scope.setExtra(key, value);
      }
    });

    Sentry.captureException(error);

    // This is needed to render errors correctly in development / production
    super.componentDidCatch(error, errorInfo);
  }

  render() {
    return this.props.children;
  }
}

export default SentryErrorBoundary;
