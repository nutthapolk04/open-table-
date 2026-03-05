<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { Monitor, UserPlus, ArrowLeft } from "lucide-vue-next";
import { usePosStore } from "../stores/pos";

const router = useRouter();
const route = useRoute();
const store = usePosStore();
const { t } = useI18n();

const zoneName = computed(() => decodeURIComponent(route.params.zone as string));

const tables = computed(() => {
  return store.tables.filter(table => table.zone === zoneName.value);
});

const getStatusColor = (status: string) => {
  switch (status) {
    case "FREE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "OCCUPIED":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "CHECKING_BILL":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "CLEANING":
      return "bg-slate-50 text-slate-500 border-slate-200";
    default:
      return "bg-slate-50 text-slate-500";
  }
};

const getStatusLabel = (status: string) => {
  const key = `posModule.status.${status}`;
  return t(key);
};

const setActiveTable = (id: string | null) => {
  store.setActiveTable(id);
  if (id) {
    router.push('/tables');
  }
};

const goBack = () => {
  router.push('/tables');
};

onMounted(() => {
  if (store.tables.length === 0) {
    store.fetchInitialData();
  }
});
</script>

<template>
  <div class="h-full flex flex-col bg-slate-50/50 font-sans" style="overflow: hidden;">
    <!-- Top Header -->
    <header class="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-10 flex items-center shrink-0 z-20 sticky top-0">
      <button @click="goBack" class="mr-6 w-10 h-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-95 shadow-sm">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-xl font-black text-slate-800 uppercase tracking-widest italic">{{ zoneName }}</h1>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">{{ tables.length }} โต๊ะทั้งหมดในโซนนี้</p>
      </div>
    </header>

    <div class="flex-1 p-10 overflow-y-auto custom-scrollbar animate-in">
      <!-- No tables -->
      <div v-if="tables.length === 0" class="flex flex-col items-center justify-center py-24 text-slate-300">
        <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-indigo-100 shadow-xl mb-6">
          <Monitor class="w-10 h-10 opacity-20" />
        </div>
        <h3 class="text-lg font-black text-slate-400 uppercase tracking-widest">ไม่มีโต๊ะในโซนนี้</h3>
      </div>

      <!-- Tables Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
        <div 
          v-for="table in tables" 
          :key="table.id" 
          class="card group cursor-pointer hover:shadow-2xl hover:-translate-y-2 transform transition-all duration-500 relative border-2 bg-white rounded-[32px] shadow-sm overflow-hidden"
          :class="store.activeTable?.id === table.id ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-100'"
          @click="setActiveTable(table.id)"
        >
          <!-- Decoration -->
          <div class="absolute -top-12 -right-12 w-24 h-24 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          
          <div class="p-8 relative z-10">
            <div class="flex justify-between items-start mb-6">
              <span class="text-3xl font-black transition-colors" :class="store.activeTable?.id === table.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500 italic'">{{ table.number }}</span>
              <span :class="['text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border-2 shadow-sm', getStatusColor(table.status)]">{{ getStatusLabel(table.status) }}</span>
            </div>
            
            <div v-if="table.status === 'OCCUPIED' || table.status === 'CHECKING_BILL'" class="space-y-3">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ t("posModule.elapsedTime") }}</p>
              <div class="flex items-baseline space-x-1">
                <span class="text-2xl font-black text-indigo-700 font-mono tracking-tighter">{{ table.time }}</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase">min</span>
              </div>
            </div>
            <div v-else class="h-14 flex items-center justify-center opacity-5 group-hover:opacity-20 transition-opacity">
              <UserPlus class="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.animate-in {
  animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
