<!-- <script> tag here -->
<script setup lang="ts">
/// <reference types="vite/client" />
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Monitor, UserPlus, Receipt, Share2, Printer, QrCode, ArrowRightLeft, GitMerge, X, Users, Sparkles, Minus, Plus, Bell, Info, Check } from "lucide-vue-next";
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

const selectedTierId = ref<string | null>(null);

watch(() => store.tiers, (newTiers) => {
  if (newTiers.length > 0 && !selectedTierId.value) {
    selectedTierId.value = newTiers[0].id;
  }
}, { immediate: true });

const showNotification = (msg: string, type: 'success' | 'error' | 'warning' = 'error') => {
    notification.value = { show: true, message: msg, type };
};
const notification = ref({ show: false, message: '', type: 'error' });

const confirmModal = ref({ show: false, title: '', message: '', onConfirm: () => {} });
const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    confirmModal.value = { show: true, title, message, onConfirm };
};

const openTable = async () => {
  if (activeTable.value) {
    try {
      if (!selectedTierId.value && store.tiers.length > 0) {
        selectedTierId.value = store.tiers[0].id;
      }
      await store.openTable(activeTable.value.id, pax.value, selectedTierId.value || undefined);
    } catch (err: any) {
      showNotification("ไม่สามารถเปิดโต๊ะได้: " + err, 'error');
    }
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
    showNotification("Order link copied to clipboard!", 'success');
  }
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

const isPrinting = ref(false);
const handlePrintQr = async () => {
  isPrinting.value = true;
  // Wait for next tick and a small delay for QR to render
  setTimeout(() => {
    window.print();
    isPrinting.value = false;
  }, 500);
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
        showNotification("ย้ายโต๊ะสำเร็จ", 'success');
    } catch (err) {
        showNotification("Failed to move table", 'error');
    }
};

const confirmMergeTable = async () => {
    if (!activeTable.value?.sessionId || !selectedMergeSessionId.value) return;
    try {
        await store.mergeTables(activeTable.value.sessionId, selectedMergeSessionId.value);
        showMergeModal.value = false;
        const targetTable = store.tables.find(t => t.sessionId === selectedMergeSessionId.value);
        if (targetTable) setActiveTable(targetTable.id);
        showNotification("รวมโต๊ะสำเร็จ", 'success');
    } catch (err) {
        showNotification("Failed to merge tables", 'error');
    }
};

const cleanTable = async () => {
  if (activeTable.value && activeTable.value.status === 'CLEANING') {
    showConfirm(
      'ยืนยันการทำความสะอาด',
      `ยืนยันการทำความสะอาดโต๊ะ ${activeTable.value.number} เสร็จสิ้นหรือไม่?`,
      async () => {
        await store.markTableCleaned(activeTable.value!.id);
        showNotification("ทำความสะอาดเสร็จสิ้น", 'success');
      }
    );
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
        <div class="relative bg-white rounded-xl shadow-sm border border-slate-200">
          <select 
            v-model="selectedZone"
            class="w-48 pl-4 pr-10 py-2.5 text-sm font-bold text-slate-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl appearance-none cursor-pointer"
            style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat, repeat; background-position: right .7em top 50%, 0 0; background-size: .65em auto, 100%;"
          >
            <option :value="null">{{ t("posModule.allZones") }}</option>
            <option 
              v-for="zone in Object.keys(tablesByZoneAll)" 
              :key="zone"
              :value="zone"
            >
              {{ zone }}
            </option>
          </select>
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
            <div v-for="table in getVisibleTables(tables)" :key="table.id" 
              class="card group cursor-pointer hover:shadow-2xl hover:-translate-y-2 transform transition-all duration-500 relative border-2 rounded-[2rem] overflow-hidden" 
              :class="[
                activeTable?.id === table.id ? 'border-indigo-500 shadow-indigo-100' : 'border-slate-100',
                table.status === 'OCCUPIED' ? 'bg-gradient-to-br from-indigo-50/50 to-white shadow-lg shadow-indigo-50/50 border-indigo-100' : 'bg-white shadow-sm',
                table.status === 'CHECKING_BILL' ? 'bg-amber-50/50 border-amber-200' : '',
                table.status === 'CLEANING' ? 'bg-slate-50 border-slate-200 outline-dashed outline-1 outline-slate-300' : ''
              ]" 
              @click="setActiveTable(table.id)">
              
              <!-- Left accent bar for active statuses -->
              <div v-if="table.status === 'OCCUPIED'" class="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600"></div>
              <div v-if="table.status === 'CHECKING_BILL'" class="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500"></div>

              <div class="p-7">
                <div class="flex justify-between items-start mb-6">
                  <div class="flex flex-col">
                    <span class="text-3xl font-black tracking-tight transition-colors" 
                      :class="[
                        activeTable?.id === table.id ? 'text-indigo-600' : 
                        (table.status === 'OCCUPIED' ? 'text-indigo-900' : 'text-slate-300 group-hover:text-indigo-400')
                      ]">
                      {{ table.number }}
                    </span>
                    <span v-if="table.status === 'OCCUPIED'" class="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1">active session</span>
                  </div>
                  <span :class="['text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-2 shadow-sm', getStatusColor(table.status)]">
                    {{ getStatusLabel(table.status) }}
                  </span>
                </div>

                <div class="flex items-center justify-between">
                    <div class="px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-2 transition-all shadow-sm"
                        :class="table.status === 'OCCUPIED' || table.status === 'CHECKING_BILL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'">
                        <Users class="w-4 h-4" :class="table.status === 'OCCUPIED' || table.status === 'CHECKING_BILL' ? 'text-indigo-200' : 'text-slate-400'" />
                        <span v-if="table.pax" class="flex items-center">
                            {{ table.pax }} <span class="mx-1 opacity-40 font-bold">/</span> {{ table.seats }}
                        </span>
                        <span v-else>
                            {{ table.seats }}
                        </span>
                    </div>

                    <div v-if="table.status === 'OCCUPIED' || table.status === 'CHECKING_BILL'" class="flex flex-col items-end">
                       <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{{ t("posModule.elapsedTime") }}</span>
                       <span class="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/50">{{ table.time }}</span>
                    </div>
                    <div v-else class="opacity-10 group-hover:opacity-30 transition-opacity">
                       <UserPlus class="w-6 h-6 text-slate-400" />
                    </div>
                </div>
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
            <button v-if="activeTable.status === 'CLEANING'" @click="cleanTable" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-14 flex items-center justify-center space-x-3 text-lg font-bold shadow-md transition-all active:scale-95 mb-4 border border-emerald-500/20">
              <Sparkles class="w-6 h-6" />
              <span>ทำความสะอาดเสร็จสิ้น</span>
            </button>
            <button @click="openTable" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-14 flex items-center justify-center space-x-3 text-lg font-bold shadow-md transition-all active:scale-95 border border-indigo-500/20">
              <UserPlus class="w-6 h-6" />
              <span>{{ t("posModule.openTable") }}</span>
            </button>
            <div class="grid grid-cols-1 gap-4">

              <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p class="text-[10px] text-slate-400 mb-2 font-black uppercase tracking-widest">{{ t("posModule.adults") }}</p>
                <div class="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100">
                    <button @click="pax > 1 ? pax-- : null" class="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                      <Minus class="w-5 h-5" />
                    </button>
                    <span class="text-2xl font-black text-slate-800">{{ pax }}</span>
                    <button @click="pax++" class="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                      <Plus class="w-5 h-5" />
                    </button>
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
  
  <div v-if="confirmModal.show" class="fixed inset-0 z-[100] flex items-center justify-center p-6 text-slate-900">
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" @click="confirmModal.show = false"></div>
    <div class="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 p-10 flex flex-col items-center text-center">
      <div class="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-[32px] flex items-center justify-center mb-6 shadow-xl shadow-indigo-100/50">
        <Sparkles class="w-10 h-10" />
      </div>
      <h3 class="text-2xl font-black text-slate-800 tracking-tighter uppercase italic mb-2">{{ confirmModal.title }}</h3>
      <p class="text-slate-500 font-bold text-sm leading-relaxed mb-8">{{ confirmModal.message }}</p>
      <div class="grid grid-cols-2 gap-4 w-full">
        <button @click="confirmModal.show = false" class="h-16 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">ยกเลิก</button>
        <button @click="confirmModal.onConfirm(); confirmModal.show = false" class="h-16 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-indigo-700 transition-all">ยืนยัน</button>
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

  <div v-if="isPrinting" class="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[9999]">
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
  body * { 
    visibility: hidden !important; 
  }
  .print\:block, .print\:block * { 
    visibility: visible !important; 
  }
}
</style>
