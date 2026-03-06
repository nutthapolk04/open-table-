<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { usePosStore } from "../stores/pos";
import { useI18n } from "vue-i18n";
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Timer, 
  ChevronRight, 
  AlertCircle,
  LayoutGrid,
  History,
  ArrowRightCircle
} from "lucide-vue-next";

const store = usePosStore();
const { t } = useI18n();

const filter = ref<"active" | "history">("active");

// Timer for auto-refresh and card ages
let timer: number | null = null;
const now = ref(Date.now());

onMounted(() => {
  store.fetchInitialData();
  timer = window.setInterval(() => {
    store.fetchInitialData(); // Polling for new orders
    now.value = Date.now();
  }, 10000); // 10s polling
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

// Calculate orders from all sessions
const allKitchenOrders = computed(() => {
  const orders: any[] = [];
  store.tables.forEach(table => {
    if (table.rawOrders) {
      table.rawOrders.forEach((order: any) => {
        orders.push({
          ...order,
          tableId: table.id,
          tableNumber: table.number,
          zone: table.zone
        });
      });
    }
  });

  // Sort by created time (oldest first)
  return orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
});

const activeOrders = computed(() => {
  return allKitchenOrders.value.filter(o => o.status !== 'SERVED');
});

const servedOrders = computed(() => {
  return allKitchenOrders.value.filter(o => o.status === 'SERVED').reverse().slice(0, 20); // Last 20
});

const getElapsedTime = (timeStr: string) => {
  const diff = Math.floor((now.value - new Date(timeStr).getTime()) / 60000);
  return diff;
};

const getAgeColor = (minutes: number) => {
  if (minutes < 5) return "text-emerald-400";
  if (minutes < 15) return "text-amber-400";
  return "text-rose-400 animate-pulse";
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'PENDING': return { 
      label: t('kitchenModule.status.pending'), 
      bg: 'bg-rose-500/10 border-rose-500/50 text-rose-400', 
      next: 'COOKING',
      nextLabel: t('kitchenModule.status.startCook')
    };
    case 'COOKING': return { 
      label: t('kitchenModule.status.cooking'), 
      bg: 'bg-amber-500/10 border-amber-500/50 text-amber-400', 
      next: 'SERVED',
      nextLabel: t('kitchenModule.status.doneServe')
    };
    default: return { 
      label: t('kitchenModule.status.served'), 
      bg: 'bg-emerald-500/10 text-emerald-400', 
      next: 'SERVED', 
      nextLabel: t('kitchenModule.status.completed') 
    };
  }
};

const handleStatusCycle = async (orderId: string, currentStatus: string) => {
  const config = getStatusConfig(currentStatus);
  if (config.next !== currentStatus) {
    await store.updateOrderStatus(orderId, config.next);
  }
};

const getCardStyle = (order: any) => {
  const pendingElapsed = getElapsedTime(order.createdAt);
  const cookingElapsed = getElapsedTime(order.updatedAt || order.createdAt);
  
  if (order.status === 'COOKING') {
    if (cookingElapsed > 15) {
      return "bg-amber-100 border-amber-300 animate-pulse shadow-[0_0_30px_rgba(251,191,36,0.4)]";
    }
    return "bg-amber-50 border-amber-200";
  }
  
  if (order.status === 'PENDING' && pendingElapsed > 15) {
    return "bg-rose-50 border-rose-200 animate-pulse shadow-[0_0_30px_rgba(251,113,133,0.4)]";
  }
  
  return "bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md";
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30">
    <!-- Header -->
    <header class="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-10">
      <div class="flex items-center space-x-4">
        <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <ChefHat class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-xl font-black tracking-tight uppercase text-slate-800">{{ t('kitchenModule.title') }}</h1>
          <div class="flex items-center text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
            <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping"></span>
            {{ t('kitchenModule.subtitle') }}
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button 
          @click="filter = 'active'"
          class="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center"
          :class="filter === 'active' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-white'"
        >
          <LayoutGrid class="w-4 h-4 mr-2" />
          {{ t('kitchenModule.activeOrders') }} ({{ activeOrders.length }})
        </button>
        <button 
          @click="filter = 'history'"
          class="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center"
          :class="filter === 'history' ? 'bg-white text-slate-800 shadow-md border border-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent'"
        >
          <History class="w-4 h-4 mr-2" />
          {{ t('kitchenModule.history') }}
        </button>
      </div>

      <!-- System Stats -->
      <div class="hidden lg:flex items-center space-x-6 text-xs font-bold">
        <div class="flex flex-col items-end">
          <span class="text-slate-500 uppercase tracking-widest text-[9px]">{{ t('kitchenModule.serverTime') }}</span>
          <span class="text-indigo-600 font-mono text-sm leading-none mt-1">{{ new Date(now).toLocaleTimeString() }}</span>
        </div>
      </div>
    </header>

    <main class="p-8">
      <!-- Active Orders Grid -->
      <div v-if="filter === 'active'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6">
        <div 
          v-for="order in activeOrders" 
          :key="order.id"
          class="group rounded-3xl overflow-hidden flex flex-col shadow-xl transition-all hover:scale-[1.02] border"
          :class="getCardStyle(order)"
        >
          <!-- Card Header -->
          <div class="p-5 flex justify-between items-start border-b border-slate-100">
            <div>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                {{ order.zone }} • {{ t('kitchenModule.tablePrefix') }}
              </span>
              <h2 class="text-3xl font-black text-slate-800 italic">#{{ order.tableNumber }}</h2>
            </div>
            <div class="flex flex-col items-end">
              <div :class="getStatusConfig(order.status).bg" class="px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest">
                {{ getStatusConfig(order.status).label }}
              </div>
              <div class="flex items-center mt-2 text-xs font-black" :class="getAgeColor(getElapsedTime(order.createdAt))">
                <Timer class="w-3 h-3 mr-1" />
                {{ getElapsedTime(order.createdAt) }}m
              </div>
            </div>
          </div>

          <!-- Items List -->
          <div class="flex-1 p-5 space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
            <div v-for="item in order.items" :key="item.id" class="flex items-start group/item">
              <div class="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black mr-3 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-colors">
                {{ item.quantity }}
              </div>
              <div class="flex-1">
                <p class="text-lg font-bold leading-tight text-slate-800 group-hover/item:text-indigo-900">{{ item.menu.name }}</p>
                <div v-if="item.note" class="mt-1 flex items-center text-amber-700 bg-amber-50 w-fit px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                  <AlertCircle class="w-3 h-3 mr-1" />
                  {{ item.note }}
                </div>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="p-4 bg-slate-50/50 border-t border-slate-100">
            <button 
              @click="handleStatusCycle(order.id, order.status)"
              class="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95 group/btn"
            >
              <ArrowRightCircle v-if="order.status === 'PENDING'" class="w-5 h-5 mr-3 transition-transform group-hover/btn:translate-x-1" />
              <CheckCircle2 v-else class="w-5 h-5 mr-3" />
              {{ getStatusConfig(order.status).nextLabel }}
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="activeOrders.length === 0" class="col-span-full py-32 flex flex-col items-center justify-center text-slate-400 animate-in fade-in zoom-in-50">
          <ChefHat class="w-24 h-24 mb-6 opacity-30 text-indigo-200" />
          <h2 class="text-2xl font-black uppercase tracking-widest opacity-40">{{ t('kitchenModule.emptyTitle') }}</h2>
          <p class="text-slate-400 text-sm mt-2">{{ t('kitchenModule.emptySubtitle') }}</p>
        </div>
      </div>

      <div v-else class="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-4">
        <table class="w-full text-left">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr class="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <th class="px-6 py-4">{{ t('kitchenModule.tableHeaders.status') }}</th>
              <th class="px-6 py-4">{{ t('kitchenModule.tableHeaders.table') }}</th>
              <th class="px-6 py-4">{{ t('kitchenModule.tableHeaders.items') }}</th>
              <th class="px-6 py-4">{{ t('kitchenModule.tableHeaders.timeCreated') }}</th>
              <th class="px-6 py-4 text-right">{{ t('kitchenModule.tableHeaders.elapsed') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 uppercase">
            <tr v-for="order in servedOrders" :key="order.id" class="hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700">
              <td class="px-6 py-4">
                <span class="px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-black">{{ t('kitchenModule.status.served') }}</span>
              </td>
              <td class="px-6 py-4 text-slate-900">#{{ order.tableNumber }} <span class="text-[9px] text-slate-400 ml-1">({{ order.zone }})</span></td>
              <td class="px-6 py-4 text-slate-600">
                {{ order.items.map((i: any) => `${i.quantity}x ${i.menu.name}`).join(", ") }}
              </td>
              <td class="px-6 py-4 text-slate-400">{{ new Date(order.createdAt).toLocaleTimeString() }}</td>
              <td class="px-6 py-4 text-right text-slate-400">{{ getElapsedTime(order.createdAt) }}{{ t('kitchenModule.elapsedAgo') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.02);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* Add subtle shadow to cards for depth */
.grid > div {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
}
</style>
