"use strict";

import * as Sentry from "@sentry/electron";

// Sentry 数据上报功能已禁用
export const isSentryEnabled = false;

// 不初始化 Sentry，保留导出以避免破坏代码
export default Sentry;
