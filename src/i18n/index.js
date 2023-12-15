import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import translationsInEng from '../locales/en/translation.json';
import translationsInPl from '../locales/pl/translation.json';

// https://blog.openreplay.com/multilingual-sites-in-react/
const resources = {
  en: {
    translation: translationsInEng
  },
  pl: {
    translation: translationsInPl
  }
};

i18n
  .use(initReactI18next) 
  .init({
    resources, 
    lng: "en", 
    debug: true,
    fallbackLng: "en", 
    interpolation: {
      escapeValue: false
    },
    ns: "translation", 
    defaultNS: "translation"
  });

export default i18n;