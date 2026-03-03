<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Plus, Edit2, Trash2, Users, Clock, Receipt } from "lucide-vue-next";
import Modal from "../components/Modal.vue";
import CheckoutModal from "../components/CheckoutModal.vue";

const { t } = useI18n();
const router = useRouter();

// Mock Data
interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

interface Table {
  id: string;
  name: string;
  seats: number;
  status: "available" | "occupied" | "reserved";
  timeSeated?: string;
  orders?: OrderItem[];
}

interface Zone {
  id: string;
  name: string;
  tables: Table[];
}

const zones = ref<Zone[]>([
  {
    id: "z1",
    name: "Indoor (แอร์)",
    tables: [
      { id: "t1", name: "A1", seats: 4, status: "available" },
      {
        id: "t2",
        name: "A2",
        seats: 4,
        status: "occupied",
        timeSeated: "18:30",
        orders: [
          { id: "o1", name: "Wagyu Set", qty: 1, price: 990 },
          { id: "o2", name: "Coke", qty: 2, price: 40 },
        ],
      },
      { id: "t3", name: "A3", seats: 8, status: "reserved" },
      { id: "t4", name: "A4", seats: 2, status: "available" },
    ],
  },
  {
    id: "z2",
    name: "Outdoor (รับลม)",
    tables: [
      { id: "t5", name: "B1", seats: 4, status: "available" },
      { id: "t6", name: "B2", seats: 6, status: "available" },
      { id: "t7", name: "B3", seats: 4, status: "occupied" },
    ],
  },
  {
    id: "z3",
    name: "VIP",
    tables: [{ id: "t8", name: "V1", seats: 10, status: "available" }],
  },
]);

const activeZoneId = ref(zones.value[0]?.id || "");

const activeZone = computed(() => {
  return zones.value.find((z) => z.id === activeZoneId.value);
});

const getStatusColor = (status: string) => {
  switch (status) {
    case "available":
      return "bg-emerald-100 text-emerald-700";
    case "occupied":
      return "bg-amber-100 text-amber-700";
    case "reserved":
      return "bg-indigo-100 text-indigo-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

// Modal States
const showAddZoneModal = ref(false);
const showAddTableModal = ref(false);
const showTableActionModal = ref(false);
const showCheckoutModal = ref(false);

// Form States
const newZoneName = ref("");
const newTableData = ref({ name: "", seats: 4 });
const selectedTable = ref<Table | null>(null);

// Actions
const saveZone = () => {
  if (!newZoneName.value.trim()) return;
  zones.value.push({
    id: `z${Date.now()}`,
    name: newZoneName.value,
    tables: [],
  });
  showAddZoneModal.value = false;
  newZoneName.value = "";
  activeZoneId.value = zones.value[zones.value.length - 1].id;
};

const saveTable = () => {
  if (!newTableData.value.name.trim() || !activeZone.value) return;
  activeZone.value.tables.push({
    id: `t${Date.now()}`,
    name: newTableData.value.name,
    seats: newTableData.value.seats,
    status: "available",
  });
  showAddTableModal.value = false;
  newTableData.value = { name: "", seats: 4 };
};

const openTableActions = (table: Table) => {
  selectedTable.value = table;
  showTableActionModal.value = true;
};

const openSeating = () => {
  if (selectedTable.value) {
    selectedTable.value.status = "occupied";
    selectedTable.value.timeSeated = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    selectedTable.value.orders = [];
    showTableActionModal.value = false;
  }
};

const openCheckout = () => {
  if (selectedTable.value) {
    showTableActionModal.value = false;
    showCheckoutModal.value = true;
  }
};

const goToPos = () => {
  if (selectedTable.value) {
    showTableActionModal.value = false;
    // In real app we would pass tableId via route params or state store
    router.push({ path: "/pos" });
  }
};

const handleCheckoutSuccess = () => {
  if (selectedTable.value) {
    selectedTable.value.status = "available";
    selectedTable.value.timeSeated = undefined;
    selectedTable.value.orders = undefined;
  }
};

const calculateTotal = (orders?: OrderItem[]) => {
  if (!orders) return 0;
  return orders.reduce((sum, item) => sum + item.price * item.qty, 0);
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-bold text-slate-800">
        {{ t("zonesModule.title") }}
      </h3>
      <button
        @click="showAddZoneModal = true"
        class="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
      >
        <Plus class="w-4 h-4" />
        <span>{{ t("zonesModule.addZone") }}</span>
      </button>
    </div>

    <!-- Zone Tabs -->
    <div class="flex border-b border-slate-200">
      <button
        v-for="zone in zones"
        :key="zone.id"
        @click="activeZoneId = zone.id"
        class="px-6 py-3 font-medium text-sm border-b-2 transition-colors duration-200"
        :class="
          activeZoneId === zone.id
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        "
      >
        {{ zone.name }}
        <span
          class="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs"
        >
          {{ zone.tables.length }}
        </span>
      </button>
    </div>

    <!-- Active Zone Content -->
    <div v-if="activeZone" class="pt-6">
      <div class="flex justify-between items-center mb-6">
        <h4 class="text-lg font-bold text-slate-700">{{ activeZone.name }}</h4>
        <button
          @click="showAddTableModal = true"
          class="flex items-center space-x-2 px-3 py-1.5 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium bg-white"
        >
          <Plus class="w-4 h-4" />
          <span>{{ t("zonesModule.addTable") }}</span>
        </button>
      </div>

      <!-- Tables Grid -->
      <div
        v-if="activeZone.tables.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <div
          v-for="table in activeZone.tables"
          :key="table.id"
          @click="openTableActions(table)"
          class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all relative group cursor-pointer hover:border-indigo-300 transform hover:-translate-y-1"
        >
          <!-- Actions overlay -->
          <div
            class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1"
            @click.stop
          >
            <button
              class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              :title="t('zonesModule.edit')"
            >
              <Edit2 class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              :title="t('zonesModule.delete')"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <div class="flex justify-between items-start mb-4">
            <h5 class="text-2xl font-bold text-slate-800">{{ table.name }}</h5>
            <span
              :class="[
                'text-xs font-semibold px-2.5 py-1 rounded-full',
                getStatusColor(table.status),
              ]"
            >
              {{ t(`zonesModule.status.${table.status}`) }}
            </span>
          </div>

          <div class="flex flex-col space-y-2 mt-4">
            <div
              class="text-slate-500 text-sm flex items-center bg-slate-50 rounded-lg p-2.5"
            >
              <Users class="w-4 h-4 mr-2 opacity-70" />
              <span>{{ t("zonesModule.seats", { count: table.seats }) }}</span>
            </div>

            <div
              v-if="table.status === 'occupied' && table.timeSeated"
              class="text-slate-500 text-sm flex items-center bg-amber-50 rounded-lg p-2.5"
            >
              <Clock class="w-4 h-4 mr-2 opacity-70" />
              <span>Seated: {{ table.timeSeated }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300"
      >
        <p class="text-slate-500">{{ t("zonesModule.noTables") }}</p>
      </div>
    </div>

    <!-- Modals -->
    <!-- Add Zone Modal -->
    <Modal v-model="showAddZoneModal" :title="t('zonesModule.addZone')">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{
            t("zonesModule.zoneName")
          }}</label>
          <input
            v-model="newZoneName"
            type="text"
            class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="e.g., Outdoor C"
            @keyup.enter="saveZone"
          />
        </div>
      </div>
      <template #footer>
        <button
          @click="showAddZoneModal = false"
          class="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium text-sm"
        >
          {{ t("zonesModule.cancel") }}
        </button>
        <button
          @click="saveZone"
          class="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          {{ t("zonesModule.save") }}
        </button>
      </template>
    </Modal>

    <!-- Add Table Modal -->
    <Modal v-model="showAddTableModal" :title="t('zonesModule.addTable')">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{
            t("zonesModule.tableName")
          }}</label>
          <input
            v-model="newTableData.name"
            type="text"
            class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="e.g., A5"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{
            t("zonesModule.seatCount")
          }}</label>
          <input
            v-model="newTableData.seats"
            type="number"
            min="1"
            class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>
      <template #footer>
        <button
          @click="showAddTableModal = false"
          class="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium text-sm"
        >
          {{ t("zonesModule.cancel") }}
        </button>
        <button
          @click="saveTable"
          class="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          {{ t("zonesModule.save") }}
        </button>
      </template>
    </Modal>

    <!-- Table Action/Details Modal -->
    <Modal v-model="showTableActionModal" :title="selectedTable?.name || ''">
      <div v-if="selectedTable" class="space-y-6">
        <!-- Status Banner -->
        <div
          class="flex items-center justify-between p-4 rounded-xl"
          :class="
            getStatusColor(selectedTable.status)
              .replace('text-', 'text-opacity-90 ')
              .replace('bg-', 'bg-opacity-50 bg-')
          "
        >
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-white/60 rounded-lg">
              <Users class="w-5 h-5" />
            </div>
            <div>
              <p class="text-sm font-medium opacity-80">Status</p>
              <p class="font-bold text-lg leading-tight">
                {{ t(`zonesModule.status.${selectedTable.status}`) }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium opacity-80">
              {{ t("zonesModule.seatCount") }}
            </p>
            <p class="font-bold text-lg leading-tight">
              {{ selectedTable.seats }}
            </p>
          </div>
        </div>

        <!-- Available State Actions -->
        <div
          v-if="selectedTable.status === 'available'"
          class="py-4 flex flex-col items-center justify-center space-y-4"
        >
          <div
            class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-2"
          >
            <Plus class="w-8 h-8 text-slate-400" />
          </div>
          <p class="text-slate-500 text-center px-4">
            This table is clean and ready for new guests.
          </p>
          <button
            @click="openSeating"
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all font-bold text-lg mt-4"
          >
            {{ t("zonesModule.openTable") }}
          </button>
        </div>

        <!-- Occupied State Details -->
        <div v-else-if="selectedTable.status === 'occupied'" class="space-y-4">
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-500 flex items-center"
              ><Clock class="w-4 h-4 mr-1" /> Seated at
              {{ selectedTable.timeSeated }}</span
            >
            <button
              @click="goToPos"
              class="text-indigo-600 font-medium hover:text-indigo-800 flex items-center"
            >
              <Edit2 class="w-3 h-3 mr-1" /> {{ t("zonesModule.manageOrders") }}
            </button>
          </div>

          <!-- Order List -->
          <div
            class="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden"
          >
            <div v-if="selectedTable.orders && selectedTable.orders.length > 0">
              <div
                v-for="item in selectedTable.orders"
                :key="item.id"
                class="flex justify-between items-center p-3 border-b border-slate-200 last:border-0"
              >
                <div class="flex items-center">
                  <span
                    class="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded w-8 text-center mr-3"
                    >{{ item.qty }}x</span
                  >
                  <span class="font-medium text-slate-800">{{
                    item.name
                  }}</span>
                </div>
                <span class="text-slate-600 font-medium"
                  >฿{{ item.price * item.qty }}</span
                >
              </div>
            </div>
            <div v-else class="p-6 text-center text-slate-400 text-sm">
              No orders yet. Add items to start billing.
            </div>
          </div>

          <!-- Bill Summary -->
          <div
            class="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm"
          >
            <h4 class="font-bold text-slate-800 mb-3 flex items-center">
              <Receipt class="w-4 h-4 mr-2 text-indigo-500" />
              {{ t("zonesModule.billSummary") }}
            </h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between text-slate-600">
                <span>{{ t("zonesModule.subtotal") }}</span>
                <span>฿{{ calculateTotal(selectedTable.orders) }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>{{ t("zonesModule.discount") }}</span>
                <span>฿0</span>
              </div>
              <div
                class="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-slate-100 mt-2"
              >
                <span>{{ t("zonesModule.total") }}</span>
                <span>฿{{ calculateTotal(selectedTable.orders) }}</span>
              </div>
            </div>
          </div>

          <div class="pt-4 grid grid-cols-2 gap-3">
            <button
              @click="goToPos"
              class="py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-all font-semibold"
            >
              {{ t("zonesModule.editBill") }}
            </button>
            <button
              @click="openCheckout"
              class="py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md transition-all font-bold"
            >
              {{ t("zonesModule.checkBill") }}
            </button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Checkout Modal -->
    <CheckoutModal
      v-model="showCheckoutModal"
      :table="selectedTable"
      @checkout-success="handleCheckoutSuccess"
    />
  </div>
</template>
