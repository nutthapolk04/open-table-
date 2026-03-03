import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import en from "./locales/en";
import th from "./locales/th";

const i18n = createI18n({
  legacy: false,
  locale: "th",
  fallbackLocale: "en",
  messages: {
    en,
    th,
  },
});

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n);
app.mount("#app");
