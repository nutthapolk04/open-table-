<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { Monitor, RotateCw, LogOut, Globe, ChefHat } from "lucide-vue-next";
import { usePosStore } from "./stores/pos";

const route = useRoute();
const { t, locale } = useI18n();
const store = usePosStore();

onMounted(() => {
  console.log("POS App Initialized - Path:", route.path);
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
  <div class="flex h-screen bg-slate-100 font-sans overflow-hidden">
    <!-- Professional Dark Sidebar -->
    <aside v-if="route.path !== '/kitchen'" class="w-24 bg-[#1e2235] flex flex-col items-center py-6 shrink-0 z-20 shadow-2xl">
      <div class="mb-10 text-white flex flex-col items-center">
        <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-2">
          <Monitor class="w-6 h-6" />
        </div>
        <span class="text-[10px] font-black uppercase tracking-tighter opacity-50">pos</span>
      </div>

      <nav class="flex-1 flex flex-col space-y-4">
        <router-link to="/tables" class="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group relative" :class="route.path.startsWith('/tables') || route.path.startsWith('/order') ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'">
          <Monitor class="w-6 h-6" />
          <div class="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">POS SYSTEM</div>
        </router-link>

        <router-link to="/kitchen" class="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group relative" :class="route.path === '/kitchen' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'">
          <ChefHat class="w-6 h-6" />
          <div class="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">KITCHEN KDS</div>
        </router-link>

        <router-link to="/settings" class="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group relative" :class="route.path.startsWith('/settings') ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'">
          <Monitor class="w-6 h-6" />
          <div class="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">ADMIN SETTINGS</div>
        </router-link>
      </nav>

      <div class="mt-auto flex flex-col space-y-4">
        <button @click="toggleLanguage" class="w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800 transition-all">
          <Globe class="w-5 h-5 mb-1" />
          <span class="text-[9px] font-black uppercase">{{ locale }}</span>
        </button>
        <button class="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-red-900/30 hover:text-red-400 transition-all">
          <LogOut class="w-6 h-6" />
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Secondary Top Header -->
      <header v-if="route.path !== '/kitchen'" class="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10 shrink-0 shadow-sm">
        <div class="flex items-center space-x-4">
           <div class="p-2 bg-indigo-50 rounded-xl">
             <Monitor class="w-5 h-5 text-indigo-600" />
           </div>
           <div>
             <h1 class="text-sm font-black text-slate-800 uppercase tracking-widest">{{ getPageTitle() }}</h1>
             <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Branch: Rama 9 - Main Store</p>
           </div>
        </div>

        <div class="flex items-center space-x-4">
           <div class="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-1">
             <button @click="handleSync" :disabled="store.loading" class="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center space-x-2 transition-all" :class="store.loading ? 'text-slate-400' : 'text-slate-600 hover:bg-white hover:shadow-sm'">
                <RotateCw class="w-3 h-3" :class="{ 'animate-spin': store.loading }" />
                <span>{{ store.loading ? 'Syncing...' : 'Sync Data' }}</span>
             </button>
           </div>
        </div>
      </header>

      <main class="flex-1 overflow-hidden">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
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
