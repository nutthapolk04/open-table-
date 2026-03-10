<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Monitor, UserPlus, Receipt, Share2, Printer, QrCode, ArrowRightLeft, GitMerge, X, Users } from "lucide-vue-next";
import QrcodeVue from "qrcode.vue";
import { usePosStore } from "../stores/pos";
import CheckoutModal from "../components/CheckoutModal.vue";

const router = useRouter();
const store = usePosStore();
const { t } = useI18n();

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

// Active Table interaction
const activeTable = computed(() => store.activeTable);
const pax = ref(2);
const selectedZone = ref<string | null>(null);

const setActiveTable = (id: string | null) => {
  store.setActiveTable(id);
};

const openTable = () => {
  if (activeTable.value) {
    store.openTable(activeTable.value.id, pax.value, undefined);
  }
};

const goToOrderList = () => {
  if (activeTable.value) {
    router.push(`/order/${activeTable.value.id}`);
  }
};

// Checkout flow
const frontendCustomerUrl = import.meta.env.VITE_CUSTOMER_FRONTEND_URL || "http://localhost:5175";
const showCheckoutModal = ref(false);
const openCheckout = () => {
  if (activeTable.value) {
    showCheckoutModal.value = true;
  }
};

const handleCheckoutSuccess = () => {
  if (activeTable.value) {
    store.checkoutTable(activeTable.value.id);
  }
};

const copyOrderLink = () => {
  if (activeTable.value?.sessionId) {
    const link = `${frontendCustomerUrl}/table/${activeTable.value.sessionId}`;
    navigator.clipboard.writeText(link);
    alert("Order link copied to clipboard!");
  }
};

const handlePrintQr = () => {
  window.print();
};

const tablesByZoneAll = computed(() => {
  const groups: Record<string, any[]> = {};
  store.tables.forEach(table => {
    if (!groups[table.zone]) groups[table.zone] = [];
    groups[table.zone].push(table);
  });
  return groups;
});

const orderTotal = computed(() => {
  if (!activeTable.value?.orders) return 0;
  return activeTable.value.orders.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
});

const tablesByZone = computed(() => {
  const groups: Record<string, any[]> = {};
  store.tables.forEach(table => {
    if (selectedZone.value && table.zone !== selectedZone.value) return;
    if (!groups[table.zone]) groups[table.zone] = [];
    groups[table.zone].push(table);
  });
  return groups;
});

// Zone expansion state
const TABLES_PER_ZONE = 5;

const goToZoneTables = (zone: string) => {
  router.push(`/tables/zone/${encodeURIComponent(zone)}`);
};

const getVisibleTables = (tables: any[]) => {
  return tables.slice(0, TABLES_PER_ZONE);
};

// Move & Merge Logics
const showMoveModal = ref(false);
const showMergeModal = ref(false);
const selectedMoveTableId = ref("");
const selectedMergeSessionId = ref("");

const availableToMove = computed(() => store.tables.filter(t => t.status === 'FREE' || t.status === 'CLEANING'));
const availableToMerge = computed(() => store.tables.filter(t => (t.status === 'OCCUPIED' || t.status === 'CHECKING_BILL') && t.sessionId !== activeTable.value?.sessionId && t.sessionId != null));

const handleMoveTableClick = () => {
    selectedMoveTableId.value = "";
    showMoveModal.value = true;
};

const handleMergeTableClick = () => {
    selectedMergeSessionId.value = "";
    showMergeModal.value = true;
};

const confirmMoveTable = async () => {
    if (!activeTable.value?.sessionId || !selectedMoveTableId.value) return;
    try {
        await store.moveTable(activeTable.value.sessionId, selectedMoveTableId.value);
        showMoveModal.value = false;
        setActiveTable(selectedMoveTableId.value); // Set active to new table
    } catch (err) {
        alert("Failed to move table");
    }
};

const confirmMergeTable = async () => {
    if (!activeTable.value?.sessionId || !selectedMergeSessionId.value) return;
    try {
        await store.mergeTables(activeTable.value.sessionId, selectedMergeSessionId.value);
        showMergeModal.value = false;
        const targetTable = store.tables.find(t => t.sessionId === selectedMergeSessionId.value);
        if (targetTable) setActiveTable(targetTable.id);
    } catch (err) {
        alert("Failed to merge tables");
    }
};
</script>

<template>
  <div class="h-full flex" style="overflow: hidden;">
    <div class="flex-1 p-8 overflow-y-auto hidden-scrollbar">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">{{ t("posModule.tableOverview") }}</h2>
          <p class="text-sm text-slate-500 mt-1">{{ t("posModule.liveStatus") }}</p>
        </div>
        <div class="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button 
            @click="selectedZone = null"
            :class="!selectedZone ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'"
            class="px-4 py-2 text-sm font-bold rounded-lg transition-all"
          >
            {{ t("posModule.allZones") }}
          </button>
          <button 
            v-for="zone in Object.keys(tablesByZoneAll)" 
            :key="zone"
            @click="selectedZone = zone"
            :class="selectedZone === zone ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'"
            class="px-4 py-2 text-sm font-bold rounded-lg transition-all"
          >
            {{ zone }}
          </button>
        </div>
      </div>
      <div v-if="store.error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
        {{ store.error }}
        <button @click="store.fetchInitialData" class="ml-4 underline">Try Again</button>
      </div>

      <div v-if="!store.loading && Object.keys(tablesByZone).length === 0" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <Monitor class="w-16 h-16 opacity-10 mb-4" />
        <h3 class="text-xl font-bold text-slate-400">No zones or tables found.</h3>
        <p class="mt-2">Use Admin Settings to create zones and tables.</p>
      </div>

      <div class="space-y-12">
        <div v-for="(tables, zone) in tablesByZone" :key="zone">
          <h3 class="text-lg font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center">
            <span class="w-8 h-px bg-slate-200 mr-4"></span>
            {{ zone }}
            <span class="ml-3 text-xs font-medium text-slate-300">({{ tables.length }} Tables)</span>
            <button v-if="tables.length > TABLES_PER_ZONE" @click="goToZoneTables(zone as string)" class="ml-4 px-4 py-1.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all active:scale-95">
              ดูโต๊ะทั้งหมด ({{ tables.length }})
            </button>
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <div v-for="table in getVisibleTables(tables)" :key="table.id" class="card group cursor-pointer hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 relative border-2 bg-white rounded-xl shadow-sm overflow-hidden" :class="activeTable?.id === table.id ? 'border-indigo-500' : 'border-slate-100'" @click="setActiveTable(table.id)">
              <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                  <span class="text-2xl font-black transition-colors" :class="activeTable?.id === table.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'">{{ table.number }}</span>
                  <span :class="['text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border', getStatusColor(table.status)]">{{ getStatusLabel(table.status) }}</span>
                </div>
                <div class="flex items-center space-x-1.5 mb-2">
                    <div class="px-2 py-0.5 rounded-md text-[10px] font-black flex items-center space-x-1 transition-colors"
                        :class="table.status === 'OCCUPIED' || table.status === 'CHECKING_BILL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'">
                        <Users class="w-3 h-3" :class="table.status === 'OCCUPIED' || table.status === 'CHECKING_BILL' ? 'text-indigo-200' : 'text-slate-400'" />
                        <span v-if="table.pax">
                            {{ table.pax }} <span class="opacity-40 font-medium">/</span> {{ table.seats }}
                        </span>
                        <span v-else>
                            {{ table.seats }} {{ t("posModule.seats") }}
                        </span>
                    </div>
                </div>
                <div v-if="table.status === 'OCCUPIED' || table.status === 'CHECKING_BILL'" class="space-y-2">
                  <p class="text-xs font-medium text-slate-400">{{ t("posModule.elapsedTime") }}</p>
                  <p class="text-lg font-bold text-indigo-700 font-mono">{{ table.time }}</p>
                </div>
                <div v-else class="h-10 flex items-center justify-center opacity-10"><UserPlus class="w-8 h-8" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <aside class="w-96 bg-white border-l border-slate-200 shadow-2xl" style="display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden;">
      <div v-if="!activeTable" class="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
        <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6"><Monitor class="w-10 h-10 opacity-20" /></div>
        <h3 class="text-lg font-bold text-slate-800 mb-2">{{ t("posModule.selectATable") }}</h3>
        <p class="text-sm">{{ t("posModule.tapToView") }}</p>
      </div>
      <div v-else style="flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0;">
        <div class="p-8 border-b border-slate-100 bg-slate-50/50">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-3xl font-black text-slate-800">{{ t("posModule.table") }} {{ activeTable?.number }}</h3>
            <button @click="setActiveTable(null)" class="text-slate-400 hover:text-slate-600">×</button>
          </div>
          <p class="text-sm font-medium text-slate-500">{{ activeTable?.zone }} {{ t("posModule.zone") }}</p>
        </div>
        <div class="p-8 space-y-6 custom-scrollbar" style="flex: 1; overflow-y: auto; min-height: 0;">
          <div v-if="activeTable.status === 'FREE' || activeTable.status === 'CLEANING'" class="space-y-4">
            <button @click="openTable" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-14 flex items-center justify-center space-x-3 text-lg font-bold shadow-md transition-all active:scale-95">
              <UserPlus class="w-6 h-6" />
              <span>{{ t("posModule.openTable") }}</span>
            </button>
            <div class="grid grid-cols-1 gap-4">
              <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p class="text-xs text-slate-400 mb-1 font-bold">{{ t("posModule.adults") }}</p>
                <div class="flex items-center justify-between">
                    <button @click="pax > 1 ? pax-- : null" class="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">-</button>
                    <span class="text-2xl font-black text-slate-800">{{ pax }}</span>
                    <button @click="pax++" class="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">+</button>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="activeTable.status === 'OCCUPIED' || activeTable.status === 'CHECKING_BILL'" class="space-y-4">
            <div class="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center">
              <p class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">{{ t("posModule.customerOrdering") }}</p>
              <div class="bg-white p-4 rounded-xl shadow-sm mb-4 border border-indigo-100">
                <qrcode-vue v-if="activeTable.sessionId" :value="`${frontendCustomerUrl}/table/${activeTable.sessionId}`" :size="140" level="H" render-as="svg" />
              </div>
              <button @click="handlePrintQr" class="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-bold text-sm shadow-sm">
                <Printer class="w-4 h-4" />
                <span>{{ t("posModule.checkout.printQr") }}</span>
              </button>
              <p class="text-[10px] text-indigo-400 mt-2 text-center opacity-70">{{ t("posModule.checkout.printQrSub") }}</p>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-4">
              <button @click="handleMoveTableClick" class="flex items-center justify-center p-3 text-sm font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-xl transition-all shadow-sm active:scale-95 space-x-2">
                <ArrowRightLeft class="w-4 h-4" />
                <span>{{ t('posModule.moveTable') }}</span>
              </button>
              <button @click="handleMergeTableClick" class="flex items-center justify-center p-3 text-sm font-bold text-teal-700 bg-teal-100 hover:bg-teal-200 rounded-xl transition-all shadow-sm active:scale-95 space-x-2">
                <GitMerge class="w-4 h-4" />
                <span>{{ t('posModule.mergeTable') }}</span>
              </button>
            </div>
            <div class="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div class="flex justify-between items-center mb-4">
                <span class="text-sm font-medium text-indigo-700">{{ t("posModule.orderSummary") }}</span>
                <span class="text-lg font-bold text-indigo-800">฿{{ orderTotal }}</span>
              </div>
              <div v-if="activeTable?.orders && activeTable?.orders.length > 0" class="space-y-2 max-h-40 overflow-y-auto pr-2">
                <div v-for="item in activeTable?.orders" :key="item.id" class="flex justify-between text-xs text-indigo-600/80">
                  <span class="truncate pr-2 w-3/4">{{ item.qty }}x {{ item.name }}</span>
                  <span>฿{{ item.price * item.qty }}</span>
                </div>
              </div>
              <div v-else class="text-sm text-indigo-400/70 py-4 text-center italic">{{ t("posModule.noItemsOrdered") }}</div>
            </div>
            <button @click="goToOrderList" class="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-14 font-bold shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2">
              <span>{{ t("posModule.manageOrders") }}</span>
            </button>
            <button @click="openCheckout" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-14 flex items-center justify-center space-x-3 shadow-md transition-all active:scale-95 font-bold">
              <Receipt class="w-6 h-6" />
              <span>{{ t("posModule.checkout.title") }}</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  </div>

  <!-- Move Table Modal -->
  <div v-if="showMoveModal" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="showMoveModal = false"></div>
    <div class="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-8">
        <h3 class="text-xl font-black text-slate-800 tracking-tight mb-2">{{ t('posModule.moveTable') }} {{ activeTable?.number }}</h3>
        <p class="text-sm text-slate-500 mb-6">{{ t('posModule.selectTargetTable') }}</p>
        
        <div class="space-y-4 mb-8">
            <select v-model="selectedMoveTableId" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="" disabled>{{ t('posModule.selectTargetTable') }}...</option>
                <option v-for="tbl in availableToMove" :key="tbl.id" :value="tbl.id">{{ t('posModule.table') }} {{ tbl.number }} ({{ tbl.zone }})</option>
            </select>
        </div>

        <div class="flex space-x-3">
            <button @click="showMoveModal = false" class="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">{{ t('posModule.checkout.cancel') }}</button>
            <button @click="confirmMoveTable" :disabled="!selectedMoveTableId" class="flex-1 py-3 px-4 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors active:scale-95">{{ t('posModule.moveTable') }}</button>
        </div>
    </div>
  </div>

  <!-- Merge Table Modal -->
  <div v-if="showMergeModal" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="showMergeModal = false"></div>
    <div class="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-8">
        <h3 class="text-xl font-black text-slate-800 tracking-tight mb-2">{{ t('posModule.mergeTable') }} {{ activeTable?.number }}</h3>
        <p class="text-sm text-slate-500 mb-6">{{ t('posModule.selectBaseTable') }}</p>
        
        <div class="space-y-4 mb-8">
            <select v-model="selectedMergeSessionId" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="" disabled>{{ t('posModule.selectBaseTable') }}...</option>
                <option v-for="tbl in availableToMerge" :key="tbl.id" :value="tbl.sessionId">{{ t('posModule.table') }} {{ tbl.number }} ({{ tbl.zone }})</option>
            </select>
        </div>

        <div class="flex space-x-3">
            <button @click="showMergeModal = false" class="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">{{ t('posModule.checkout.cancel') }}</button>
            <button @click="confirmMergeTable" :disabled="!selectedMergeSessionId" class="flex-1 py-3 px-4 rounded-xl font-bold bg-teal-600 text-white shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700 transition-colors active:scale-95">{{ t('posModule.mergeTable') }}</button>
        </div>
    </div>
  </div>

  <CheckoutModal v-model="showCheckoutModal" :table="activeTable" @checkout-success="handleCheckoutSuccess" />
  <div class="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[9999]">
    <div class="flex flex-col items-center justify-center h-full p-8 text-center bg-white" v-if="activeTable">
      <h1 class="text-6xl font-black mb-4">TABLE {{ activeTable?.number }}</h1>
      <p class="text-2xl mb-8 opacity-60">Scan this QR to order your food</p>
      <div class="border-[16px] border-black p-8 rounded-[40px] mb-12 bg-white shadow-2xl">
        <qrcode-vue v-if="activeTable?.sessionId" :value="`${frontendCustomerUrl}/table/${activeTable.sessionId}`" :size="500" level="H" render-as="svg" />
      </div>
      <p class="text-xl font-mono opacity-40 uppercase tracking-widest">OpenTable POS System</p>
      <div class="mt-4 text-sm opacity-30 italic">Thank you for your visit</div>
    </div>
  </div>
</template>

<style>
.hidden-scrollbar::-webkit-scrollbar {
  display: none;
}
.hidden-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Custom Scrollbar for Sidebar */
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

@media print {
  body * { visibility: hidden !important; }
  .print\:block, .print\:block * { visibility: visible !important; }
  .print\:fixed { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; }
}
</style>
