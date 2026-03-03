<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Monitor, UserPlus, Receipt } from "lucide-vue-next";
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

const getStatusLabel = (status: string) => status.replace("_", " ");

// Active Table interaction
const activeTable = computed(() => store.activeTable);
const pax = ref(2);
const tierId = ref("");

// Initialize tierId when tiers are available
onMounted(() => {
  if (store.tiers.length > 0) {
    tierId.value = store.tiers[0].id;
  }
});

// Watch tiers for changes (if they load after mount)
import { watch, onMounted } from "vue";
watch(
  () => store.tiers,
  (newTiers) => {
    if (newTiers.length > 0 && !tierId.value) {
      tierId.value = newTiers[0].id;
    }
  },
  { immediate: true },
);

const setActiveTable = (id: string) => {
  store.setActiveTable(id);
};

const openTable = () => {
  if (activeTable.value && tierId.value) {
    store.openTable(activeTable.value.id, pax.value, tierId.value);
  }
};

const goToOrderList = () => {
  if (activeTable.value) {
    router.push("/order");
  }
};

// Checkout flow
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

const orderTotal = computed(() => {
  if (!activeTable.value?.orders) return 0;
  return activeTable.value.orders.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
});
</script>

<template>
  <div class="flex-1 flex overflow-hidden">
    <!-- Table Map -->
    <div class="flex-1 p-8 overflow-y-auto hidden-scrollbar">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">
            / {{ t("posModule.tableOverview") }}
          </h2>
          <p class="text-sm text-slate-500 mt-1">
            {{ t("posModule.liveStatus") }}
          </p>
        </div>
        <div
          class="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200"
        >
          <button
            class="px-4 py-2 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-lg"
          >
            {{ t("posModule.allZones") }}
          </button>
        </div>
      </div>

      <div
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
      >
        <div
          v-for="table in store.tables"
          :key="table.id"
          class="card group cursor-pointer hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 relative border-2 bg-white rounded-xl shadow-sm overflow-hidden"
          :class="
            activeTable?.id === table.id
              ? 'border-indigo-500'
              : 'border-slate-100'
          "
          @click="setActiveTable(table.id)"
        >
          <div class="p-6">
            <div class="flex justify-between items-start mb-4">
              <span
                class="text-2xl font-black transition-colors"
                :class="
                  activeTable?.id === table.id
                    ? 'text-indigo-600'
                    : 'text-slate-400 group-hover:text-indigo-500'
                "
              >
                {{ table.number }}
              </span>
              <span
                :class="[
                  'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border',
                  getStatusColor(table.status),
                ]"
              >
                {{ getStatusLabel(table.status) }}
              </span>
            </div>

            <div
              v-if="
                table.status === 'OCCUPIED' || table.status === 'CHECKING_BILL'
              "
              class="space-y-2"
            >
              <p class="text-xs font-medium text-slate-400">
                {{ t("posModule.elapsedTime") }}
              </p>
              <p class="text-lg font-bold text-indigo-700 font-mono">
                {{ table.time }}
              </p>
            </div>
            <div
              v-else
              class="h-10 flex items-center justify-center opacity-10"
            >
              <UserPlus class="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Side Sidebar / Table Detail -->
    <aside
      class="w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl shrink-0"
    >
      <div
        v-if="!activeTable"
        class="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400"
      >
        <div
          class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6"
        >
          <Monitor class="w-10 h-10 opacity-20" />
        </div>
        <h3 class="text-lg font-bold text-slate-800 mb-2">
          {{ t("posModule.selectATable") }}
        </h3>
        <p class="text-sm">{{ t("posModule.tapToView") }}</p>
      </div>

      <div v-else class="flex-1 flex flex-col">
        <!-- Table Header -->
        <div class="p-8 border-b border-slate-100 bg-slate-50/50">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-3xl font-black text-slate-800">
              {{ t("posModule.table") }} {{ activeTable.number }}
            </h3>
            <button
              @click="store.setActiveTable(null)"
              class="text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>
          <p class="text-sm font-medium text-slate-500">
            {{ activeTable.zone }} {{ t("posModule.zone") }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex-1 p-8 space-y-6">
          <div
            v-if="
              activeTable.status === 'FREE' || activeTable.status === 'CLEANING'
            "
            class="space-y-4"
          >
            <button
              @click="openTable"
              class="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-14 flex items-center justify-center space-x-3 text-lg font-bold shadow-md transition-all active:scale-95"
            >
              <UserPlus class="w-6 h-6" />
              <span>{{ t("posModule.openTable") }}</span>
            </button>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p class="text-xs text-slate-400 mb-1">
                  {{ t("posModule.adults") }}
                </p>
                <input
                  v-model="pax"
                  type="number"
                  min="1"
                  class="bg-transparent text-xl font-bold w-full outline-none"
                />
              </div>
              <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p class="text-xs text-slate-400 mb-1">
                  {{ t("posModule.buffetTier") }}
                </p>
                <select
                  v-model="tierId"
                  class="bg-transparent text-sm font-bold w-full outline-none appearance-none cursor-pointer"
                >
                  <option v-for="t in store.tiers" :key="t.id" :value="t.id">
                    {{ t.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div
            v-else-if="
              activeTable.status === 'OCCUPIED' ||
              activeTable.status === 'CHECKING_BILL'
            "
            class="space-y-4"
          >
            <div class="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div class="flex justify-between items-center mb-4">
                <span class="text-sm font-medium text-indigo-700">{{
                  t("posModule.orderSummary")
                }}</span>
                <span class="text-lg font-bold text-indigo-800"
                  >฿{{ orderTotal }}</span
                >
              </div>
              <div
                v-if="activeTable.orders.length > 0"
                class="space-y-2 max-h-40 overflow-y-auto pr-2"
              >
                <div
                  v-for="item in activeTable.orders"
                  :key="item.id"
                  class="flex justify-between text-xs text-indigo-600/80"
                >
                  <span class="truncate pr-2 w-3/4"
                    >{{ item.qty }}x {{ item.name }}</span
                  >
                  <span>฿{{ item.price * item.qty }}</span>
                </div>
              </div>
              <div
                v-else
                class="text-sm text-indigo-400/70 py-4 text-center italic"
              >
                {{ t("posModule.noItemsOrdered") }}
              </div>
            </div>
            <button
              @click="goToOrderList"
              class="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-14 font-bold shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>{{ t("posModule.manageOrders") }}</span>
            </button>
            <button
              @click="openCheckout"
              class="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-14 flex items-center justify-center space-x-3 shadow-md transition-all active:scale-95 font-bold"
            >
              <Receipt class="w-6 h-6" />
              <span>{{ t("posModule.checkout.title") }}</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  </div>

  <!-- Modals -->
  <CheckoutModal
    v-model="showCheckoutModal"
    :table="activeTable"
    @checkout-success="handleCheckoutSuccess"
  />
</template>
