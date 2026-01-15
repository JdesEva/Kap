import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resources from "../locales/resources";

// 语言检测器配置
const languageDetector = new LanguageDetector(null, {
  // 使用浏览器语言设置
  order: ["navigator", "localStorage"],
  caches: ["localStorage"],
  lookupLocalStorage: "i18nextLng",
  // 将浏览器语言代码映射到我们支持的语言
  convertDetectedLanguage: (lng: string) => {
    if (lng.startsWith("zh")) {
      return "zh_CN";
    }
    return "en";
  },
});

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: false,
    interpolation: {
      escapeValue: false, //阻止xss攻击
    },
  });

export default i18n;
