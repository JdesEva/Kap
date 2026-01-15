import i18n from "i18next";
import {app} from "electron";
import resources from "../locales/resources";

// 获取系统语言
const getSystemLanguage = () => {
  const locale = app.getLocale();
  // 将 locale 转换为 i18next 支持的语言代码
  if (locale.startsWith("zh")) {
    // 处理中文变体
    return locale === "zh_CN" || locale === "zh-Hans" ? "zh_CN" : "zh_CN";
  }
  // 默认返回英文
  return "zh_CN";
};

i18n.init({
  resources,
  lng: getSystemLanguage(),
  fallbackLng: "zh_CN",
  debug: false,
  interpolation: {
    escapeValue: false, //阻止xss攻击
  },
});

export default i18n;