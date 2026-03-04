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
    if (table.orders) {
      table.orders.forEach((order: any) => {
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

const getElapsedTime = (createdAt: string) => {
  const diff = Math.floor((now.value - new Date(createdAt).getTime()) / 60000);
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
      label: 'NEW', 
      bg: 'bg-rose-500/10 border-rose-500/50 text-rose-400', 
      next: 'COOKING',
      nextLabel: 'START COOK'
    };
    case 'COOKING': return { 
      label: 'COOKING', 
      bg: 'bg-amber-500/10 border-amber-500/50 text-amber-400', 
      next: 'SERVED',
      nextLabel: 'DONE / SERVE'
    };
    default: return { label: 'SERVED', bg: 'bg-emerald-500/10 text-emerald-400', next: 'SERVED', nextLabel: 'COMPLETED' };
  }
};

const handleStatusCycle = async (orderId: string, currentStatus: string) => {
  const config = getStatusConfig(currentStatus);
  if (config.next !== currentStatus) {
    await store.updateOrderStatus(orderId, config.next);
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
    <!-- Header -->
    <header class="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-10">
      <div class="flex items-center space-x-4">
        <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <ChefHat class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-xl font-black tracking-tight uppercase">Kitchen Display</h1>
          <div class="flex items-center text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
            <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping"></span>
            Real-time Monitoring
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50">
        <button 
          @click="filter = 'active'"
          class="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center"
          :class="filter === 'active' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-100'"
        >
          <LayoutGrid class="w-4 h-4 mr-2" />
          Active Orders ({{ activeOrders.length }})
        </button>
        <button 
          @click="filter = 'history'"
          class="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center"
          :class="filter === 'history' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-100'"
        >
          <History class="w-4 h-4 mr-2" />
          History
        </button>
      </div>

      <!-- System Stats -->
      <div class="hidden lg:flex items-center space-x-6 text-xs font-bold">
        <div class="flex flex-col items-end">
          <span class="text-slate-500 uppercase tracking-widest text-[9px]">Server Time</span>
          <span class="text-indigo-400 font-mono text-sm leading-none mt-1">{{ new Date(now).toLocaleTimeString() }}</span>
        </div>
      </div>
    </header>

    <main class="p-8">
      <!-- Active Orders Grid -->
      <div v-if="filter === 'active'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6">
        <div 
          v-for="order in activeOrders" 
          :key="order.id"
          class="group bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-xl transition-all hover:border-slate-700 hover:scale-[1.02] hover:bg-slate-900"
        >
          <!-- Card Header -->
          <div class="p-5 flex justify-between items-start border-b border-white/5">
            <div>
              <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                {{ order.zone }} • Table
              </span>
              <h2 class="text-3xl font-black text-white italic">#{{ order.tableNumber }}</h2>
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
              <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-indigo-400 font-black mr-3 group-hover/item:bg-indigo-500 group-hover/item:text-white transition-colors">
                {{ item.quantity }}
              </div>
              <div class="flex-1">
                <p class="text-lg font-bold leading-tight text-slate-200 group-hover/item:text-white">{{ item.menu.name }}</p>
                <div v-if="item.note" class="mt-1 flex items-center text-amber-400/80 bg-amber-400/10 w-fit px-2 py-0.5 rounded text-[11px] font-medium border border-amber-400/20">
                  <AlertCircle class="w-3 h-3 mr-1" />
                  {{ item.note }}
                </div>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="p-4 bg-slate-800/20">
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
        <div v-if="activeOrders.length === 0" class="col-span-full py-32 flex flex-col items-center justify-center text-slate-700 animate-in fade-in zoom-in-50">
          < ChefHat class="w-24 h-24 mb-6 opacity-20" />
          <h2 class="text-2xl font-black uppercase tracking-widest opacity-20">No active orders</h2>
          <p class="text-indigo-400/40 text-sm mt-2">The kitchen is currently quiet.</p>
        </div>
      </div>

      <!-- History Table -->
      <div v-else class="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
        <table class="w-full text-left">
          <thead class="bg-white/5 border-b border-white/5">
            <tr class="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Table</th>
              <th class="px-6 py-4">Items</th>
              <th class="px-6 py-4">Time Created</th>
              <th class="px-6 py-4 text-right">Elapsed</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 uppercase">
            <tr v-for="order in servedOrders" :key="order.id" class="hover:bg-white/5 transition-colors text-xs font-bold">
              <td class="px-6 py-4">
                <span class="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black">SERVED</span>
              </td>
              <td class="px-6 py-4 text-white">#{{ order.tableNumber }} <span class="text-[9px] text-slate-500 ml-1">({{ order.zone }})</span></td>
              <td class="px-6 py-4 text-slate-400">
                {{ order.items.map((i: any) => `${i.quantity}x ${i.menu.name}`).join(", ") }}
              </td>
              <td class="px-6 py-4 opacity-50">{{ new Date(order.createdAt).toLocaleTimeString() }}</td>
              <td class="px-6 py-4 text-right opacity-30">{{ getElapsedTime(order.createdAt) }}m ago</td>
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
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Glassmorphism background for active orders */
.grid > div {
  backdrop-filter: blur(8px);
}
</style>
