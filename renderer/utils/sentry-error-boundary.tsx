import React from "react";
import * as Sentry from "@sentry/browser";
import electron from "electron";
import type { api as Api, is as Is } from "electron-util";

const SENTRY_PUBLIC_DSN =
  "https://96419da025da075ad44476df484de85a@o4505409681948672.ingest.us.sentry.io/4510657596293120";

class SentryErrorBoundary extends React.Component<{
  children: React.ReactNode;
}> {
  constructor(props) {
    super(props);
    // Sentry 数据上报功能已禁用
    // 不再初始化 Sentry
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
