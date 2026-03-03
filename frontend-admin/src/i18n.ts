import { createI18n } from "vue-i18n";
import en from "./locales/en";
import th from "./locales/th";

const i18n = createI18n({
  legacy: false, // use Composition API
  locale: "th", // default to Thai
  fallbackLocale: "en",
  messages: {
    en,
    th,
  },
});

export default i18n;
