<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  LayoutDashboard,
  Utensils,
  Map,
  Settings,
  LogOut,
  Globe,
} from "lucide-vue-next";
import ZonesView from "./views/ZonesView.vue";
import MenuView from "./views/MenuView.vue";
import PosView from "./views/PosView.vue";

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

const toggleLanguage = () => {
  locale.value = locale.value === "th" ? "en" : "th";
};

const stats = computed(() => [
  {
    label: t("stats.todaySales"),
    value: "฿12,450",
    change: "+12%",
    color: "text-emerald-600",
  },
  {
    label: t("stats.activeTables"),
    value: "8/15",
    change: t("stats.busy"),
    color: "text-amber-600",
  },
  {
    label: t("stats.popularMenu"),
    value: "Wagyu Beef",
    change: t("stats.orders", { count: 32 }),
    color: "text-indigo-600",
  },
]);

const navItems = computed(() => [
  {
    id: "dashboard",
    label: t("dashboard"),
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  { id: "menu", label: t("menu"), icon: Utensils, path: "/menu" },
  { id: "zones", label: t("zones"), icon: Map, path: "/zones" },
  { id: "settings", label: t("settings"), icon: Settings, path: "/settings" },
]);
</script>

<template>
  <div class="flex h-screen bg-slate-50 font-sans">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div class="p-6">
        <h1
          class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"
        >
          BuffetMaster
        </h1>
      </div>

      <nav class="flex-1 px-4 space-y-2 mt-4">
        <router-link
          v-for="item in navItems"
          :key="item.id"
          :to="item.path"
          class="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200"
          :class="
            route.path === item.path
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-600 hover:bg-slate-50'
          "
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span class="font-medium text-sm">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-slate-100">
        <button
          class="w-full flex items-center space-x-3 px-4 py-3 text-slate-500 hover:text-red-500 transition-colors"
        >
          <LogOut class="w-5 h-5" />
          <span class="font-medium text-sm">{{ t("logout") }}</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto p-8">
      <header class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 capitalize">
            {{ route.path.slice(1) ? t(route.path.slice(1)) : t("dashboard") }}
          </h2>
          <p class="text-slate-500 text-sm">
            {{ t("welcomeBack") }}, {{ t("admin") }}
          </p>
        </div>
        <div class="flex space-x-4 items-center">
          <button
            @click="toggleLanguage"
            class="flex items-center space-x-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-medium"
          >
            <Globe class="w-4 h-4" />
            <span>{{ locale === "th" ? "EN" : "TH" }}</span>
          </button>
          <div
            class="px-4 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-600 shadow-sm"
          >
            March 2, 2026
          </div>
        </div>
      </header>

      <!-- Dashboard View -->
      <div v-if="route.path === '/dashboard'" class="space-y-8">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="card p-6 border-none shadow-md bg-white hover:shadow-lg"
          >
            <p class="text-sm font-medium text-slate-500">{{ stat.label }}</p>
            <div class="flex items-end justify-between mt-2">
              <h3 class="text-3xl font-bold text-slate-800">
                {{ stat.value }}
              </h3>
              <span
                :class="[
                  'text-xs font-semibold px-2 py-1 rounded-lg bg-slate-50',
                  stat.color,
                ]"
              >
                {{ stat.change }}
              </span>
            </div>
          </div>
        </div>

        <!-- Recent Activity Placeholder -->
        <div class="card p-8 min-h-[400px]">
          <h4 class="text-lg font-bold text-slate-800 mb-6">
            {{ t("recentActivity") }}
          </h4>
          <div
            class="flex flex-col items-center justify-center text-slate-400 mt-20"
          >
            <LayoutDashboard class="w-12 h-12 mb-4 opacity-20" />
            <p>{{ t("activityPlaceholder") }}</p>
          </div>
        </div>
      </div>

      <!-- Menu & Tiers View -->
      <MenuView v-else-if="route.path === '/menu'" />

      <!-- POS View -->
      <PosView v-else-if="route.path === '/pos'" />

      <!-- Zones View -->
      <ZonesView v-else-if="route.path === '/zones'" />

      <!-- Other sections placeholder -->
      <div
        v-else
        class="flex flex-col items-center justify-center h-[60vh] text-slate-400"
      >
        <component
          :is="navItems.find((i) => i.path === route.path)?.icon"
          class="w-16 h-16 mb-4 opacity-10"
        />
        <p class="text-lg font-medium">
          {{ t("underConstruction", { module: route.path.slice(1) }) }}
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.font-sans {
  font-family: "Inter", sans-serif;
}
</style>
