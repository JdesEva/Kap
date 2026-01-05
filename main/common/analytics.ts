"use strict";

import { settings } from "./settings";

const pkg = require("../../package.json");

// 数据上报功能已移除
// 保留函数调用以避免破坏代码，但实际不执行任何操作
export const track = (..._paths: string[]) => {
  // 空操作，不进行任何追踪
};

export const initializeAnalytics = () => {
  // 仅保留版本管理功能，移除所有数据上报
  if (settings.get("version") !== pkg.version) {
    settings.set("version", pkg.version);
  }
};
