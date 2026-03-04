<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { 
  LayoutDashboard, 
  Map, 
  ChefHat, 
  Settings, 
  LogOut,
  ChevronRight,
  User
} from 'lucide-vue-next';

const route = useRoute();
const isCollapsed = ref(false);

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Zones & Tables', path: '/floor-plan', icon: Map },
  { name: 'Menu & Buffet', path: '/menu', icon: ChefHat },
  { name: 'Settings', path: '/settings', icon: Settings },
];

</script>

<template>
  <div class="flex h-screen bg-slate-50 font-['Outfit'] overflow-hidden">
    <!-- Sidebar -->
    <aside 
      :class="isCollapsed ? 'w-20' : 'w-72'"
      class="bg-white border-r border-slate-200/60 flex flex-col transition-all duration-500 ease-in-out z-30 shadow-2xl shadow-indigo-100/20"
    >
      <!-- Logo -->
      <div class="h-24 flex items-center px-8 shrink-0">
        <div class="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
          <span class="text-white font-black text-xl italic">OT</span>
        </div>
        <span v-if="!isCollapsed" class="ml-4 font-black text-2xl tracking-tighter text-slate-800 uppercase italic">Admin</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto hidden-scrollbar">
        <router-link 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          class="flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden"
          :class="route.path === item.path ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span v-if="!isCollapsed" class="ml-4 font-bold text-sm tracking-wide">{{ item.name }}</span>
          
          <!-- Active Indicator dot when collapsed -->
          <div v-if="isCollapsed && route.path === item.path" class="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full mr-2"></div>
        </router-link>
      </nav>

      <!-- User Profile -->
      <div class="p-6 border-t border-slate-100">
        <div class="flex items-center p-3 rounded-3xl bg-slate-50 border border-slate-200/40 relative group cursor-pointer hover:bg-white hover:shadow-lg transition-all">
          <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold shrink-0">
            <User class="w-5 h-5" />
          </div>
          <div v-if="!isCollapsed" class="ml-3 overflow-hidden">
            <p class="text-sm font-black text-slate-800 truncate">Manager</p>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administrator</p>
          </div>
          <ChevronRight v-if="!isCollapsed" class="ml-auto w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 relative overflow-hidden">
      <!-- Top Header -->
      <header class="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-10 flex items-center justify-between shrink-0 z-20 sticky top-0">
        <div class="flex items-center">
            <h1 class="text-xl font-black text-slate-800 uppercase tracking-widest italic">{{ route.name?.toString() || 'Management' }}</h1>
        </div>
        <div class="flex items-center space-x-4">
            <button class="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all">
                <LayoutDashboard class="w-5 h-5" />
            </button>
            <div class="h-6 w-px bg-slate-200 mx-2"></div>
            <button class="bg-indigo-50 text-indigo-600 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center shadow-sm">
                <LogOut class="w-4 h-4 mr-2" />
                Sign Out
            </button>
        </div>
      </header>

      <!-- View Wrapper -->
      <div class="flex-1 overflow-y-auto p-10 hidden-scrollbar custom-scrollbar bg-slate-50/50">
          <router-view v-slot="{ Component }">
            <transition 
              name="fade-slide" 
              mode="out-in"
            >
              <component :is="Component" />
            </transition>
          </router-view>
      </div>
    </main>
  </div>
</template>

<style>
.hidden-scrollbar::-webkit-scrollbar { display: none; }
.hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
