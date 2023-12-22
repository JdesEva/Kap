import i18n from "i18next";
import { initReactI18next } from "react-i18next";
// import LanguageDetector from "i18next-browser-languagedetector";
import resources from "../locales/resources";

i18n.use(initReactI18next).init({
  resources,
  lng: "zh_CN",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, //阻止xss攻击
  },
});

export default i18n;
