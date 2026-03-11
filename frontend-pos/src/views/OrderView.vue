<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { onMounted, watch } from "vue";
import {
  ArrowLeft,
  Search,
  Minus,
  Plus,
  ShoppingBag,
  Send,
  Trash2,
  History,
  Clock,
  Flame,
  CheckCircle2,
  ListChecks,
  XCircle,
  Bell,
  Info,
  Check
} from "lucide-vue-next";
import { usePosStore } from "../stores/pos";
import type { OrderItem } from "../stores/pos";

const route = useRoute();
const router = useRouter();
const store = usePosStore();
const { t } = useI18n();

const viewMode = ref<"timeline" | "summary">("timeline");
const tableId = route.params.id as string;

// Initialize active table from URL
if (tableId) {
  store.setActiveTable(tableId);
}

onMounted(async () => {
  if (store.tables.length === 0) {
    await store.fetchInitialData();
  }
  if (!store.getTableById(tableId)) {
    router.push("/tables");
  }
});

const activeTable = computed(() => store.getTableById(tableId) || null);

// Categories Mock
const categories = computed(() => [
  { id: "all", name: t("posModule.all") },
  ...store.categories
]);
const activeCategory = ref("all");
const searchQuery = ref("");

// Current un-sent order basket
const cart = ref<OrderItem[]>([]);

// Computed
const filteredMenu = computed(() => {
  let filtered = store.menuItems;

  if (activeCategory.value !== "all") {
    filtered = filtered.filter(
      (item) => item.categoryId === activeCategory.value || item.category === activeCategory.value,
    );
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((item) =>
      item.name.toLowerCase().includes(query),
    );
  }

  return filtered;
});

const cartTotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.price * item.qty, 0);
});

const existingOrderTotal = computed(() => {
  if (!activeTable.value?.orders) return 0;
  return activeTable.value.orders.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
});

// Aggregate all sent orders to show a "Total Consumed" view
const consolidatedOrders = computed(() => {
  if (!activeTable.value?.rawOrders) return [];
  
  const map = new Map<string, { name: string, qty: number, price: number }>();
  
  activeTable.value.rawOrders.forEach(order => {
    order.items.forEach((item: any) => {
      const existing = map.get(item.menuId);
      if (existing) {
        existing.qty += item.quantity;
      } else {
        map.set(item.menuId, {
          name: item.menu.name,
          qty: item.quantity,
          price: item.menu.price
        });
      }
    });
  });
  
  return Array.from(map.values());
});

// Actions
const addToCart = (menuItem: any) => {
  const existing = cart.value.find((item) => item.id === menuItem.id);
  if (existing) {
    existing.qty++;
  } else {
    cart.value.push({
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      qty: 1,
    });
  }
};

const updateCartQty = (item: OrderItem, delta: number) => {
  item.qty += delta;
  if (item.qty <= 0) {
    cart.value = cart.value.filter((i) => i.id !== item.id);
  }
};

const sendOrderToKitchen = async () => {
  if (cart.value.length === 0 || !activeTable.value?.sessionId) return;

  const orderItems = cart.value.map((item) => ({
    menuId: item.id,
    quantity: item.qty,
    note: item.note,
  }));

  await store.placeOrder(activeTable.value.sessionId, orderItems);
  cart.value = [];
};

const notification = ref({ show: false, message: '', type: 'error' });
const showNotification = (msg: string, type: 'success' | 'error' | 'warning' = 'error') => {
    notification.value = { show: true, message: msg, type };
};
const confirmModal = ref({ show: false, title: '', message: '', onConfirm: () => {} });
const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    confirmModal.value = { show: true, title, message, onConfirm };
};

const voidItem = async (item: OrderItem) => {
  showConfirm(
    'ยืนยันการคืนรายการ',
    `${t('posModule.confirmVoid')}: ${item.name}?`,
    async () => {
      if (activeTable.value?.sessionId) {
        await store.voidOrderItem(activeTable.value.sessionId, item.id, 1);
        showNotification("คืนรายการสำเร็จ", 'success');
      }
    }
  );
};

const backToTables = () => {
  router.push("/tables");
};

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const handleStatusUpdate = async (orderId: string, currentStatus: string) => {
  let nextStatus = 'PENDING';
  if (currentStatus === 'PENDING') nextStatus = 'COOKING';
  else if (currentStatus === 'COOKING') nextStatus = 'SERVED';
  else return;
  await store.updateOrderStatus(orderId, nextStatus);
};
</script>

<template>
  <div class="h-full flex flex-col font-sans" v-if="activeTable">
    <div class="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between shrink-0 shadow-sm z-10">
      <div class="flex items-center space-x-6">
        <button @click="backToTables" class="p-2 -ml-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
          <ArrowLeft class="w-6 h-6" />
        </button>
        
        <div class="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 space-x-2">
           <Monitor class="w-4 h-4 text-slate-400" />
           <span class="text-xs font-black text-slate-600 uppercase tracking-widest">Rama 9 Branch</span>
        </div>

        <div class="h-6 w-px bg-slate-200"></div>

        <div class="flex items-center space-x-4">
           <div class="flex items-center space-x-2">
             <div class="w-8 h-4 bg-indigo-600 rounded-full relative">
               <div class="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
             </div>
             <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open Menu</span>
           </div>
           <div class="flex items-center space-x-2">
             <div class="w-8 h-4 bg-slate-200 rounded-full relative">
               <div class="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
             </div>
             <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Print Receipt</span>
           </div>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <div class="relative w-72">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search class="h-4 w-4 text-slate-400" />
          </div>
          <input v-model="searchQuery" type="text" :placeholder="t('posModule.search')" class="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all" />
        </div>
        <button class="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
           <Monitor class="w-5 h-5" />
        </button>
      </div>
    </div>
    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 flex flex-col bg-slate-50">
        <div class="px-6 py-4 overflow-x-auto whitespace-nowrap shrink-0 border-b border-slate-200">
          <div class="flex space-x-2">
            <button v-for="cat in categories" :key="cat.id" @click="activeCategory = cat.id" class="px-4 py-2 rounded-full text-sm font-medium transition-colors" :class="activeCategory === cat.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'">
              {{ cat.name }}
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-6 hidden-scrollbar">
        <div class="flex-1 overflow-y-auto p-6 hidden-scrollbar">
          <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div v-for="item in filteredMenu" :key="item.id" class="relative group h-64">
              <!-- Staff Action: Toggle Status -->
              <button 
                @click.stop="store.toggleMenuStatus(item.id, item.status || 'AVAILABLE')" 
                class="absolute top-2 right-2 p-2 rounded-xl z-20 transition-all shadow-lg opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-md border border-slate-100 text-slate-600 hover:text-indigo-600 active:scale-90"
              >
                <XCircle class="w-4 h-4" v-if="item.status !== 'SOLD_OUT'" />
                <CheckCircle2 class="w-4 h-4" v-else />
              </button>
              
              <button 
                @click="item.status !== 'SOLD_OUT' && addToCart(item)" 
                class="w-full h-full relative rounded-[2rem] overflow-hidden shadow-lg transition-all border-4"
                :class="[
                  item.status === 'SOLD_OUT' ? 'opacity-40 grayscale pointer-events-none' : 'hover:scale-[1.02] active:scale-95 border-transparent hover:border-indigo-400'
                ]"
              >
                <!-- Image with fallback -->
                <img 
                  v-if="item.image && item.image.startsWith('http')" 
                  :src="item.image" 
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  :alt="item.name"
                />
                <div v-else class="w-full h-full bg-slate-200 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500">
                  {{ item.image || '🍽️' }}
                </div>

                <!-- Price Badge -->
                <div v-if="item.price" class="absolute top-4 left-4 z-10 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl shadow-md border border-white/50">
                   <div class="text-[10px] font-black text-slate-400 uppercase leading-none mb-0.5 whitespace-nowrap">Price</div>
                   <div class="text-sm font-black text-slate-800 leading-none">฿{{ item.price }}</div>
                </div>

                <!-- Title Overlay Card -->
                <div class="absolute bottom-0 inset-x-0 p-4 pt-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <h4 class="text-white font-black text-sm leading-tight drop-shadow-md text-center">{{ item.name }}</h4>
                  <div v-if="item.nameTh" class="text-white/60 text-[10px] font-medium text-center mt-1 truncate">{{ item.nameTh }}</div>
                </div>

                <!-- Sold Out Overlay -->
                <div v-if="item.status === 'SOLD_OUT'" class="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-[2px]">
                   <div class="bg-red-600 text-white font-black text-xs px-5 py-2 rounded-full uppercase tracking-widest shadow-2xl border-2 border-white/20 -rotate-12">
                     Sold Out
                   </div>
                </div>

                <!-- Quantity Indicator in Cart -->
                <div v-if="cart.find(i => i.id === item.id)" class="absolute top-4 right-4 bg-indigo-600 text-white w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shadow-lg animate-bounce border-2 border-white">
                   {{ cart.find(i => i.id === item.id)?.qty }}
                </div>
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
      <div class="w-96 bg-white border-l border-slate-200 flex flex-col shrink-0">
        <div class="p-6 border-b border-slate-200 bg-indigo-50 shrink-0">
          <div class="flex justify-between items-start mb-2">
            <div>
              <h3 class="text-xl font-bold text-slate-800">{{ t("posModule.table") }} {{ activeTable?.number }}</h3>
              <p class="text-sm text-slate-500">{{ activeTable?.zone }}</p>
            </div>
            <div class="flex flex-col items-end">
              <span class="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-md mb-1">{{ activeTable?.pax || 0 }} Pax</span>
              <span class="text-xs font-medium text-slate-400">{{ store.tiers.find((t) => t.id === activeTable?.tierId)?.name || "No Tier" }}</span>
            </div>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-6 hidden-scrollbar">
          <div class="flex p-1 bg-slate-100 rounded-lg mb-4">
            <button @click="viewMode = 'timeline'" class="flex-1 flex items-center justify-center space-x-2 py-2 rounded-md text-xs font-bold transition-all" :class="viewMode === 'timeline' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
              <History class="w-3.5 h-3.5" />
              <span>{{ t('posModule.orderTimeline') }}</span>
            </button>
            <button @click="viewMode = 'summary'" class="flex-1 flex items-center justify-center space-x-2 py-2 rounded-md text-xs font-bold transition-all" :class="viewMode === 'summary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
              <ListChecks class="w-3.5 h-3.5" />
              <span>{{ t('posModule.orderTotalConsumed') }}</span>
            </button>
          </div>
          <div v-if="viewMode === 'timeline' && activeTable.rawOrders && activeTable.rawOrders.length > 0">
            <div class="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              <div v-for="order in activeTable.rawOrders" :key="order.id" class="relative pl-10">
                <div class="absolute left-0 top-1 w-9 h-9 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center z-10">
                  <Clock v-if="order.status === 'PENDING'" class="w-4 h-4 text-amber-500" />
                  <Flame v-else-if="order.status === 'COOKING'" class="w-4 h-4 text-orange-500" />
                  <CheckCircle2 v-else class="w-4 h-4 text-emerald-500" />
                </div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs font-bold text-slate-400 uppercase">{{ formatTime(order.createdAt) }}</span>
                  <button @click="handleStatusUpdate(order.id, order.status)" class="text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter transition-all active:scale-90" :class="{'bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer': order.status === 'PENDING', 'bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer': order.status === 'COOKING', 'bg-emerald-100 text-emerald-700 cursor-default': order.status === 'SERVED'}" :title="order.status !== 'SERVED' ? 'Click to update status' : ''">{{ order.status }}</button>
                </div>
                <div class="space-y-2">
                  <div v-for="item in order.items" :key="item.id" class="flex justify-between items-start group">
                    <div class="flex flex-col">
                      <div class="flex items-center">
                        <span class="text-xs font-bold text-slate-700 mr-2">{{ item.quantity }}x</span>
                        <span class="text-xs font-medium text-slate-600">{{ item.menu.name }}</span>
                      </div>
                      <span v-if="item.note" class="text-[10px] italic text-amber-600 ml-6 leading-tight">{{ item.note }}</span>
                    </div>
                    <button @click="voidItem({ id: item.menuId, name: item.menu.name, price: item.menu.price, qty: item.quantity })" class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1">
                      <Trash2 class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="viewMode === 'summary' && consolidatedOrders.length > 0">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
              <ListChecks class="w-3 h-3 mr-1" />
              {{ t("posModule.orderTotalConsumed") }}
            </h4>
            <div class="bg-indigo-50/50 border border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-indigo-100/50 text-indigo-900 border-b border-indigo-100">
                    <th class="text-left px-4 py-3 font-black uppercase text-[10px] tracking-widest">{{ t('posModule.menuItem') }}</th>
                    <th class="text-center px-4 py-3 font-black uppercase text-[10px] tracking-widest w-16">{{ t('posModule.qty') }}</th>
                    <th class="text-right px-4 py-3 font-black uppercase text-[10px] tracking-widest">{{ t('posModule.amount') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-indigo-100 text-indigo-900 font-medium">
                  <tr v-for="item in consolidatedOrders" :key="item.name" class="hover:bg-white transition-colors">
                    <td class="px-4 py-3 text-xs">{{ item.name }}</td>
                    <td class="px-4 py-3 text-center font-bold text-indigo-600 font-mono">{{ item.qty }}</td>
                    <td class="px-4 py-3 text-right font-black">฿{{ item.price * item.qty }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="p-4 bg-indigo-100/30 border-t border-indigo-100 flex justify-between items-center">
                <span class="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{{ t('posModule.grandTotal') }}</span>
                <span class="text-lg font-black text-indigo-700">฿{{ existingOrderTotal }}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center">
              <ShoppingBag class="w-3 h-3 mr-1" /> {{ t("posModule.newItems") }}
            </h4>
            <div v-if="cart.length === 0" class="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
              {{ t("posModule.emptyCart") }}
            </div>
            <div v-else class="space-y-4">
              <div v-for="item in cart" :key="'new-' + item.id" class="flex flex-col p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <div class="flex justify-between items-start mb-2">
                  <span class="font-bold text-indigo-900 leading-tight pr-2">{{ item.name }}</span>
                  <span class="font-bold text-indigo-700">฿{{ item.price * item.qty }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-indigo-400 font-medium">฿{{ item.price }} / unit</span>
                  <div class="flex items-center space-x-3 bg-white border border-indigo-100 rounded-md px-1 py-1">
                    <button @click="updateCartQty(item, -1)" class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Minus class="w-3 h-3" /></button>
                    <span class="font-bold text-indigo-900 w-4 text-center text-sm">{{ item.qty }}</span>
                    <button @click="updateCartQty(item, 1)" class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Plus class="w-3 h-3" /></button>
                  </div>
                </div>
                <input v-model="item.note" type="text" :placeholder="t('posModule.addNote')" class="mt-2 w-full bg-white/50 border border-indigo-100 rounded-lg px-3 py-1.5 text-xs text-indigo-900 placeholder-indigo-300 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-300 transition-all" />
              </div>
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-slate-200 bg-white shrink-0">
          <div class="flex justify-between items-end mb-4 pr-2">
            <span class="text-sm font-medium text-slate-500">{{ t("posModule.newItems") }}</span>
            <div class="text-2xl font-black text-indigo-600">฿{{ cartTotal }}</div>
          </div>
          <button @click="sendOrderToKitchen" :disabled="cart.length === 0" class="w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center transition-all shadow-sm" :class="cart.length > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed'">
            <Send class="w-4 h-4 mr-2" />
            {{ t("posModule.sendOrder") }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="confirmModal.show" class="fixed inset-0 z-[100] flex items-center justify-center p-6 text-slate-900">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" @click="confirmModal.show = false"></div>
      <div class="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 p-10 flex flex-col items-center text-center">
        <div class="w-20 h-20 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mb-6 shadow-xl shadow-red-100/50">
          <Trash2 class="w-10 h-10" />
        </div>
        <h3 class="text-2xl font-black text-slate-800 tracking-tighter uppercase italic mb-2">{{ confirmModal.title }}</h3>
        <p class="text-slate-500 font-bold text-sm leading-relaxed mb-8">{{ confirmModal.message }}</p>
        <div class="grid grid-cols-2 gap-4 w-full">
          <button @click="confirmModal.show = false" class="h-16 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">ยกเลิก</button>
          <button @click="confirmModal.onConfirm(); confirmModal.show = false" class="h-16 bg-red-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-red-700 transition-all">ยืนยัน</button>
        </div>
      </div>
    </div>

    <div v-if="notification.show" class="fixed inset-0 z-[200] flex items-center justify-center p-6 text-slate-900">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" @click="notification.show = false"></div>
      <div class="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 p-10 flex flex-col items-center text-center">
        <div :class="[
          'w-20 h-20 rounded-[32px] flex items-center justify-center mb-6 shadow-xl',
          notification.type === 'error' ? 'bg-red-50 text-red-500 shadow-red-100/50' : 
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-500 shadow-emerald-100/50' : 
          'bg-amber-50 text-amber-500 shadow-amber-100/50'
        ]">
          <component :is="notification.type === 'success' ? Check : (notification.type === 'error' ? Bell : Info)" class="w-10 h-10" />
        </div>
        <h3 class="text-xl font-black text-slate-800 tracking-tighter uppercase italic mb-2">
          {{ notification.type === 'error' ? 'เกิดข้อผิดพลาด' : notification.type === 'success' ? 'สำเร็จ' : 'แจ้งเตือน' }}
        </h3>
        <p class="text-slate-500 font-bold text-sm leading-relaxed mb-8">{{ notification.message }}</p>
        <button @click="notification.show = false" class="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl transition-all">ตกลง</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.hidden-scrollbar::-webkit-scrollbar { display: none; }
.hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.font-sans { font-family: "Inter", sans-serif; }
</style>
