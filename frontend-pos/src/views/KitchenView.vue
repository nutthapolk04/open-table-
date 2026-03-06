<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { usePosStore } from "../stores/pos";
import { useI18n } from "vue-i18n";
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Timer, 
  LayoutGrid,
  History,
  ArrowRightCircle,
  Bell,
  UtensilsCrossed,
  Info,
  Flame
} from "lucide-vue-next";

const store = usePosStore();
const { t } = useI18n();

const filter = ref<"active" | "history">("active");
const now = ref(Date.now());
let timeUpdater: number | null = null;

onMounted(() => {
  store.fetchInitialData();
  timeUpdater = window.setInterval(() => {
    now.value = Date.now();
  }, 30000); 
});

onUnmounted(() => {
  if (timeUpdater) clearInterval(timeUpdater);
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

  return orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
});

const activeOrders = computed(() => {
  return allKitchenOrders.value.filter(o => o.status !== 'SERVED');
});

const servedOrders = computed(() => {
  return allKitchenOrders.value.filter(o => o.status === 'SERVED').reverse().slice(0, 50);
});

const getElapsedTime = (timeStr: string) => {
  return Math.floor((now.value - new Date(timeStr).getTime()) / 60000);
};

const getAgeSeverity = (minutes: number) => {
  if (minutes < 10) return "low";
  if (minutes < 20) return "medium";
  return "high";
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'PENDING': return { 
      label: "รอปรุง", 
      bg: 'bg-rose-500 text-white', 
      next: 'COOKING',
      nextLabel: "เริ่มทำอาหาร",
      icon: Clock
    };
    case 'COOKING': return { 
      label: "กำลังปรุง", 
      bg: 'bg-amber-500 text-white', 
      next: 'SERVED',
      nextLabel: "ปรุงเสร็จแล้ว",
      icon: Flame
    };
    default: return { 
      label: "เสิร์ฟแล้ว", 
      bg: 'bg-emerald-500 text-white', 
      next: 'SERVED', 
      nextLabel: "เสร็จสิ้น",
      icon: CheckCircle2
    };
  }
};

const handleStatusCycle = async (orderId: string, currentStatus: string) => {
  const config = getStatusConfig(currentStatus);
  if (config.next !== currentStatus) {
    await store.updateOrderStatus(orderId, config.next);
  }
};

// UI Color Logic for Cards
const getCardClasses = (order: any) => {
  const minutes = getElapsedTime(order.createdAt);
  const severity = getAgeSeverity(minutes);
  const status = order.status;

  let classes = "relative rounded-[40px] overflow-hidden flex flex-col transition-all duration-500 border-2 ";

  if (status === 'COOKING') {
    classes += "bg-amber-50/80 border-amber-200 shadow-amber-100 ";
  } else if (severity === 'high') {
    classes += "bg-rose-50 border-rose-200 shadow-rose-200 animate-pulse-subtle ";
  } else if (severity === 'medium') {
    classes += "bg-orange-50/50 border-orange-200 shadow-orange-100 ";
  } else {
    classes += "bg-white border-slate-200/60 shadow-slate-200/50 ";
  }

  return classes;
};
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-500/30">
    <!-- Premium Header -->
    <header class="h-24 border-b border-slate-200 bg-white/70 backdrop-blur-3xl flex items-center justify-between px-10 sticky top-0 z-50">
      <div class="flex items-center space-x-6">
        <div class="relative">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-xl shadow-indigo-200 rotate-3 transition-transform">
                <ChefHat class="w-7 h-7 text-white" />
            </div>
            <div class="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-lg" v-if="activeOrders.length > 0">
                {{ activeOrders.length }}
            </div>
        </div>
        <div>
          <h1 class="text-2xl font-[950] tracking-tight text-slate-800 italic uppercase">ครัวกลาง <span class="text-indigo-600">KDS</span></h1>
          <div class="flex items-center text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mt-0.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            สถานะระบบ: ออนไลน์
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex bg-slate-100 p-1.5 rounded-[24px] border border-slate-200/50 shadow-inner">
        <button 
          @click="filter = 'active'"
          class="px-8 py-3 rounded-2xl font-[900] text-xs uppercase tracking-widest transition-all flex items-center group"
          :class="filter === 'active' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-800'"
        >
          <LayoutGrid class="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
          ออเดอร์ค้าง ({{ activeOrders.length }})
        </button>
        <button 
          @click="filter = 'history'"
          class="px-8 py-3 rounded-2xl font-[900] text-xs uppercase tracking-widest transition-all flex items-center group ml-1"
          :class="filter === 'history' ? 'bg-white text-slate-800 shadow-xl shadow-slate-200 border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'"
        >
          <History class="w-4 h-4 mr-2 group-hover:rotate-[-45deg] transition-transform" />
          เสิร์ฟแล้ว
        </button>
      </div>

      <!-- Stats context -->
      <div class="flex items-center space-x-6">
        <div class="hidden xl:flex flex-col items-end">
            <span class="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none">เวลาปัจจุบัน</span>
            <span class="text-slate-800 font-mono text-xl font-black mt-1">{{ new Date(now).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) }}</span>
        </div>
        <div class="w-px h-10 bg-slate-200 mx-2"></div>
        <button class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
            <Bell class="w-5 h-5" />
        </button>
      </div>
    </header>

    <main class="p-10">
      <!-- Active Orders Flow -->
      <div v-if="filter === 'active'" class="flex flex-col">
        <transition-group 
            name="list" 
            tag="div" 
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8"
        >
          <div 
            v-for="order in activeOrders" 
            :key="order.id"
            :class="getCardClasses(order)"
            class="shadow-2xl hover:scale-[1.03] hover:-translate-y-2 group"
          >
            <!-- Large Floating Table Number (Watermark style) -->
            <div class="absolute -right-4 -top-8 text-[120px] font-[1000] text-black/[0.03] italic select-none pointer-events-none group-hover:text-indigo-600/[0.05] transition-colors">
                {{ order.tableNumber }}
            </div>

            <!-- Card Header -->
            <div class="p-8 pb-6 border-b border-black/[0.03] relative z-10">
                <!-- Top Row: Zone & Status -->
                <div class="flex justify-between items-center mb-4">
                    <span class="px-2.5 py-1 rounded-lg bg-black/5 text-black/60 text-[10px] font-[900] uppercase tracking-[0.15em] backdrop-blur-md">
                        {{ order.zone }}
                    </span>
                    <div :class="getStatusConfig(order.status).bg" class="px-4 py-1.5 rounded-xl text-[10px] font-[1000] uppercase tracking-wider flex items-center shadow-lg">
                        <component :is="getStatusConfig(order.status).icon" class="w-3.5 h-3.5 mr-2" />
                        {{ getStatusConfig(order.status).label }}
                    </div>
                </div>

                <!-- Bottom Row: Table & Timer -->
                <div class="flex justify-between items-end">
                    <h2 class="text-6xl font-[1000] text-slate-900 italic tracking-tighter leading-none">
                        <span class="text-indigo-600">T</span>{{ order.tableNumber }}
                    </h2>
                    <div class="flex items-center text-sm font-[1000] font-mono px-4 py-2 rounded-2xl bg-white/60 border border-black/[0.05] shadow-sm mb-1" 
                        :class="[
                            getAgeSeverity(getElapsedTime(order.createdAt)) === 'high' ? 'text-rose-600' : 
                            getAgeSeverity(getElapsedTime(order.createdAt)) === 'medium' ? 'text-orange-500' : 'text-slate-500'
                        ]">
                        <Timer class="w-4 h-4 mr-2" />
                        {{ getElapsedTime(order.createdAt) }}m
                    </div>
                </div>
            </div>

            <!-- Items List -->
            <div class="flex-1 p-8 pt-6 space-y-6 custom-scrollbar overflow-y-auto max-h-[340px] relative z-10">
                <div v-for="item in order.items" :key="item.id" class="flex items-start group/item bg-white/40 p-3 rounded-[24px] border border-transparent hover:border-white/60 hover:bg-white/80 transition-all shadow-sm hover:shadow-md">
                    <div class="w-11 h-11 shrink-0 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-[1000] mr-5 shadow-lg shadow-indigo-100">
                        {{ item.quantity }}
                    </div>
                    <div class="flex-1">
                        <p class="text-[19px] font-[900] leading-[1.1] text-slate-800 tracking-tight transition-colors uppercase italic">{{ item.menu.name }}</p>
                        <div v-if="item.note" class="mt-3 text-rose-700 bg-rose-100/50 border-rose-200 border-2 p-3 rounded-2xl text-[11px] font-[900] flex items-center uppercase tracking-wider italic animate-in zoom-in-95">
                            <Info class="w-4 h-4 mr-2 shrink-0" />
                            <span class="underline decoration-2 decoration-rose-300">{{ item.note }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Action -->
            <div class="p-6 pt-2 relative z-10">
                <button 
                    @click="handleStatusCycle(order.id, order.status)"
                    class="w-full py-5 rounded-[28px] font-[1000] text-xs uppercase tracking-[0.3em] flex items-center justify-center transition-all shadow-xl active:scale-95 group/btn overflow-hidden relative border-b-4"
                    :class="[
                        order.status === 'PENDING' ? 'bg-indigo-600 border-indigo-800 text-white hover:bg-indigo-700' :
                        'bg-emerald-500 border-emerald-700 text-white hover:bg-emerald-600'
                    ]"
                >
                    <div class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500"></div>
                    <ArrowRightCircle v-if="order.status === 'PENDING'" class="w-5 h-5 mr-3 transition-transform group-hover/btn:translate-x-1" />
                    <UtensilsCrossed v-else class="w-5 h-5 mr-3 transition-transform group-hover/btn:rotate-12" />
                    {{ getStatusConfig(order.status).nextLabel }}
                </button>
            </div>
          </div>
        </transition-group>

        <!-- Empty State -->
        <div v-if="activeOrders.length === 0" class="py-48 flex flex-col items-center justify-center text-slate-400 bg-white/50 rounded-[80px] border-[6px] border-dashed border-slate-200/50 animate-in fade-in zoom-in-95 shadow-inner mt-10">
          <div class="w-40 h-40 bg-white rounded-full flex items-center justify-center mb-12 shadow-2xl border-8 border-slate-50 rotate-6 hover:rotate-0 transition-transform duration-700 overflow-hidden">
            <ChefHat class="w-20 h-20 text-indigo-600 animate-bounce" />
          </div>
          <h2 class="text-4xl font-[1000] uppercase tracking-[0.4em] text-slate-300 italic">ครัวว่าง (IDLE)</h2>
          <p class="text-slate-400 text-sm mt-5 font-black uppercase tracking-[0.2em] opacity-60">Ready for the next rush</p>
        </div>
      </div>

      <!-- History Table -->
      <div v-else class="bg-white border-2 border-slate-200/60 rounded-[60px] overflow-hidden shadow-2xl shadow-slate-200/20 animate-in slide-in-from-bottom-12 duration-700">
        <div class="p-12 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
                <h3 class="text-3xl font-[1000] italic tracking-tighter uppercase text-slate-900">ออเดอร์ที่เสิร์ฟแล้ววันนี้</h3>
                <div class="h-1.5 w-24 bg-indigo-600 rounded-full mt-3"></div>
            </div>
            <div class="flex items-center space-x-6">
                <div class="text-right">
                    <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Served</p>
                    <span class="text-3xl font-[1000] text-indigo-600 italic tracking-tighter">{{ servedOrders.length }} Items</span>
                </div>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-white">
                <tr class="text-[11px] font-[1000] text-slate-400 uppercase tracking-[0.2em]">
                  <th class="px-12 py-8 text-center w-36">ลำดับ</th>
                  <th class="px-8 py-8 w-44">โต๊ะ (Table)</th>
                  <th class="px-12 py-8">รายการอาหาร (Items)</th>
                  <th class="px-12 py-8 text-center">เวลา (Time)</th>
                  <th class="px-12 py-8 text-right">ดำเนินการ (Duration)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="(order, index) in servedOrders" :key="order.id" class="group/row hover:bg-indigo-50/30 transition-all duration-300">
                  <td class="px-12 py-8 text-center">
                    <span class="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xs font-[1000] text-slate-400 group-hover/row:bg-indigo-600 group-hover/row:text-white transition-all mx-auto italic shadow-sm">{{ index + 1 }}</span>
                  </td>
                  <td class="px-8 py-8">
                    <div class="flex flex-col">
                        <span class="text-3xl font-[1000] text-slate-900 italic tracking-tighter leading-none">T-{{ order.tableNumber }}</span>
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 px-2 py-0.5 bg-slate-100 w-fit rounded-md">{{ order.zone }}</span>
                    </div>
                  </td>
                  <td class="px-12 py-8">
                    <div class="flex flex-wrap gap-3">
                        <span v-for="i in order.items" :key="i.id" class="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-700 flex items-center shadow-sm hover:border-indigo-200 transition-colors">
                            <span class="text-indigo-600 font-[1000] text-sm mr-2.5">{{ i.quantity }}x</span> {{ i.menu.name }}
                        </span>
                    </div>
                  </td>
                  <td class="px-12 py-8 text-center font-mono text-xs font-black text-slate-800 italic bg-slate-50/30">
                    {{ new Date(order.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) }}
                  </td>
                  <td class="px-12 py-8 text-right">
                    <div class="inline-flex items-center px-5 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[11px] font-[1000] uppercase tracking-widest border border-emerald-100 shadow-sm">
                        <CheckCircle2 class="w-4 h-4 mr-2.5" />
                        {{ getElapsedTime(order.createdAt) }} นาที
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }

.list-enter-active, .list-leave-active { transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.list-enter-from { opacity: 0; transform: scale(0.9) translateY(40px); }
.list-leave-to { opacity: 0; transform: scale(0.9) translateX(40px); }
.list-move { transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }

@keyframes pulse-subtle {
  0%, 100% { transform: scale(1); box-shadow: 0 25px 50px -12px rgba(244, 63, 94, 0.25); }
  50% { transform: scale(1.01); box-shadow: 0 35px 60px -12px rgba(244, 63, 94, 0.4); }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s infinite ease-in-out;
}
</style>


