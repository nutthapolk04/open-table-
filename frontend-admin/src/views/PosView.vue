<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  ArrowLeft,
  Search,
  Minus,
  Plus,
  ShoppingBag,
  Send,
} from "lucide-vue-next";

const router = useRouter();
const { t } = useI18n();

// This would usually be fetched via API based on route params or state store
const activeTable = ref({
  id: 2,
  name: "A2",
  zone: "Indoor",
  guests: 3,
  timeSeated: "18:30",
  orders: [
    { id: "m1", name: "Premium Wagyu", price: 150, qty: 1 },
    { id: "m4", name: "Cola", price: 30, qty: 2 },
  ],
});

// Categories Mock
const categories = [
  { id: "all", name: t("posModule.all") },
  { id: "beef", name: "Beef" },
  { id: "pork", name: "Pork" },
  { id: "seafood", name: "Seafood" },
  { id: "drinks", name: "Drinks" },
];
const activeCategory = ref("all");
const searchQuery = ref("");

// Menu Items Mock
const menuItems = [
  {
    id: "m1",
    name: "Premium Wagyu",
    category: "beef",
    price: 150,
    image: "🥩",
  },
  { id: "m2", name: "Pork Belly", category: "pork", price: 50, image: "🥓" },
  {
    id: "m3",
    name: "Salmon Sashimi",
    category: "seafood",
    price: 120,
    image: "🍣",
  },
  { id: "m4", name: "Cola", category: "drinks", price: 30, image: "🥤" },
  { id: "m5", name: "Ribeye", category: "beef", price: 130, image: "🥩" },
  { id: "m6", name: "Shrimp", category: "seafood", price: 80, image: "🦐" },
];

// Current un-sent order basket
interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}
const cart = ref<CartItem[]>([]);

// Computed
const filteredMenu = computed(() => {
  let filtered = menuItems;

  if (activeCategory.value !== "all") {
    filtered = filtered.filter(
      (item) => item.category === activeCategory.value,
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
  return activeTable.value.orders.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
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

const updateCartQty = (item: CartItem, delta: number) => {
  item.qty += delta;
  if (item.qty <= 0) {
    cart.value = cart.value.filter((i) => i.id !== item.id);
  }
};

const sendOrderToKitchen = () => {
  if (cart.value.length === 0) return;

  // Merge cart items with existing orders
  cart.value.forEach((cartItem) => {
    const existing = activeTable.value.orders.find((o) => o.id === cartItem.id);
    if (existing) {
      existing.qty += cartItem.qty;
    } else {
      activeTable.value.orders.push({ ...cartItem });
    }
  });

  // Clear cart
  cart.value = [];

  // Show notification in real app
};

const backToZones = () => {
  router.push("/zones");
};
</script>

<template>
  <div class="h-[calc(100vh-80px)] flex flex-col -m-6 hidden-scrollbar">
    <!-- Top Nav -->
    <div
      class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0"
    >
      <div class="flex items-center space-x-4">
        <button
          @click="backToZones"
          class="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h2 class="text-xl font-bold text-slate-800">
          {{ t("posModule.title") }}
        </h2>
      </div>

      <!-- Search -->
      <div class="relative w-64">
        <div
          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        >
          <Search class="h-4 w-4 text-slate-400" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('posModule.search')"
          class="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
        />
      </div>
    </div>

    <!-- Main Content Split -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Menu Area -->
      <div class="flex-1 flex flex-col bg-slate-50">
        <!-- Categories -->
        <div
          class="px-6 py-4 overflow-x-auto whitespace-nowrap shrink-0 border-b border-slate-200"
        >
          <div class="flex space-x-2">
            <button
              v-for="cat in categories"
              :key="cat.id"
              @click="activeCategory = cat.id"
              class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
              :class="
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              "
            >
              {{ cat.name }}
            </button>
          </div>
        </div>

        <!-- Menu Grid -->
        <div class="flex-1 overflow-y-auto p-6 hidden-scrollbar">
          <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <button
              v-for="item in filteredMenu"
              :key="item.id"
              @click="addToCart(item)"
              class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center text-center group active:scale-95"
            >
              <div
                class="text-4xl mb-3 group-hover:scale-110 transition-transform"
              >
                {{ item.image }}
              </div>
              <span
                class="font-bold text-slate-800 text-sm mb-1 leading-tight"
                >{{ item.name }}</span
              >
              <span class="text-indigo-600 font-semibold text-sm"
                >฿{{ item.price }}</span
              >
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Cart / Order Area -->
      <div
        class="w-96 bg-white border-l border-slate-200 flex flex-col shrink-0"
      >
        <!-- Order Header -->
        <div class="p-6 border-b border-slate-200 bg-indigo-50 shrink-0">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-xl font-bold text-slate-800">
              {{ t("posModule.table") }} {{ activeTable.name }}
            </h3>
            <span
              class="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-md"
              >{{ activeTable.guests }} Pax</span
            >
          </div>
          <p class="text-sm text-slate-500">
            Seated: {{ activeTable.timeSeated }}
          </p>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-6 hidden-scrollbar">
          <!-- Existing Orders (Readonly) -->
          <div v-if="activeTable.orders.length > 0">
            <h4
              class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3"
            >
              Sent Orders
            </h4>
            <div class="space-y-3">
              <div
                v-for="item in activeTable.orders"
                :key="'ex-' + item.id"
                class="flex justify-between items-start opacity-70"
              >
                <div class="flex items-center">
                  <span class="w-6 text-slate-500 font-medium"
                    >{{ item.qty }}x</span
                  >
                  <span class="text-slate-700 font-medium">{{
                    item.name
                  }}</span>
                </div>
                <span class="text-slate-600">฿{{ item.price * item.qty }}</span>
              </div>
            </div>
            <div
              class="mt-3 text-right text-sm text-slate-500 italic border-t border-slate-100 pt-2"
            >
              Subtotal: ฿{{ existingOrderTotal }}
            </div>
          </div>

          <!-- Current Pending Order (Cart) -->
          <div>
            <h4
              class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center"
            >
              <ShoppingBag class="w-3 h-3 mr-1" />
              {{ t("posModule.currentOrder") }}
            </h4>

            <div
              v-if="cart.length === 0"
              class="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl"
            >
              {{ t("posModule.emptyCart") }}
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="item in cart"
                :key="'new-' + item.id"
                class="flex flex-col p-3 bg-indigo-50/50 rounded-lg border border-indigo-100"
              >
                <div class="flex justify-between items-start mb-2">
                  <span class="font-bold text-indigo-900 leading-tight pr-2">{{
                    item.name
                  }}</span>
                  <span class="font-bold text-indigo-700"
                    >฿{{ item.price * item.qty }}</span
                  >
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-indigo-400 font-medium"
                    >฿{{ item.price }} / unit</span
                  >
                  <!-- Qty Controls -->
                  <div
                    class="flex items-center space-x-3 bg-white border border-indigo-100 rounded-md px-1 py-1"
                  >
                    <button
                      @click="updateCartQty(item, -1)"
                      class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    >
                      <Minus class="w-3 h-3" />
                    </button>
                    <span
                      class="font-bold text-indigo-900 w-4 text-center text-sm"
                      >{{ item.qty }}</span
                    >
                    <button
                      @click="updateCartQty(item, 1)"
                      class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    >
                      <Plus class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Action Area -->
        <div class="p-4 border-t border-slate-200 bg-white shrink-0">
          <div class="flex justify-between items-end mb-4 pr-2">
            <span class="text-sm font-medium text-slate-500"
              >New Items Total</span
            >
            <div class="text-2xl font-black text-indigo-600">
              ฿{{ cartTotal }}
            </div>
          </div>

          <button
            @click="sendOrderToKitchen"
            :disabled="cart.length === 0"
            class="w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center transition-all shadow-sm"
            :class="
              cart.length > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            "
          >
            <Send class="w-4 h-4 mr-2" />
            {{ t("posModule.sendOrder") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hidden-scrollbar::-webkit-scrollbar {
  display: none;
}
.hidden-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
