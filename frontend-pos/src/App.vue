<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { Monitor, RotateCw, LogOut, Globe } from "lucide-vue-next";
import { usePosStore } from "./stores/pos";

const route = useRoute();
const { t, locale } = useI18n();
const store = usePosStore();

onMounted(() => {
  store.fetchInitialData();
});

const getPageTitle = () => {
  switch (route.path) {
    case "/tables":
      return t("posModule.tableOverview");
    case "/order":
      return t("posModule.title");
    default:
      return t("posModule.title");
  }
};

const toggleLanguage = () => {
  locale.value = locale.value === "en" ? "th" : "en";
};

const handleSync = () => {
  store.fetchInitialData();
};
</script>

<template>
  <div class="flex flex-col h-screen bg-slate-100 font-sans">
    <!-- Header -->
    <header
      class="bg-indigo-700 text-white p-4 shadow-md flex justify-between items-center z-10"
    >
      <div class="flex items-center space-x-3">
        <Monitor class="w-6 h-6" />
        <h1 class="text-xl font-bold tracking-tight uppercase">
          {{ getPageTitle() }}
        </h1>
      </div>
      <div class="flex items-center space-x-4">
        <button
          @click="toggleLanguage"
          class="flex items-center text-white/80 hover:text-white transition-colors"
          title="Switch Language"
        >
          <Globe class="w-5 h-5 mr-1" />
          <span class="text-sm font-bold uppercase">{{ locale }}</span>
        </button>
        <div class="h-6 w-px bg-white/30 hidden md:block"></div>
        <button
          @click="handleSync"
          :disabled="store.loading"
          class="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
        >
          <RotateCw
            class="w-4 h-4"
            :class="{ 'animate-spin': store.loading }"
          />
          <span class="text-sm font-medium">{{
            store.loading ? "Syncing..." : "Sync Data"
          }}</span>
        </button>
        <div class="h-8 w-px bg-white/20"></div>
        <button
          class="text-white/80 hover:text-white transition-colors"
          title="Logout"
        >
          <LogOut class="w-6 h-6" />
        </button>
      </div>
    </header>

    <!-- Main Wrapper -->
    <main class="flex-1 w-full h-full overflow-hidden">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
.font-sans {
  font-family: "Inter", sans-serif;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
