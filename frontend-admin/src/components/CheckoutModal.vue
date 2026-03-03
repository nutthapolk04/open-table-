<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { Receipt, Banknote, CreditCard, QrCode } from "lucide-vue-next";
import Modal from "./Modal.vue";

const props = defineProps<{
  modelValue: boolean;
  table: any;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "checkout-success"): void;
}>();

const { t } = useI18n();

// Payment State
const paymentMethod = ref<"cash" | "transfer" | "creditCard">("cash");
const discountAmount = ref(0);
const includeServiceCharge = ref(true);
const includeVat = ref(true);

// Calculations
const subtotal = computed(() => {
  if (!props.table?.orders) return 0;
  return props.table.orders.reduce(
    (sum: number, item: any) => sum + item.price * item.qty,
    0,
  );
});

const serviceCharge = computed(() => {
  return includeServiceCharge.value ? Math.round(subtotal.value * 10) / 100 : 0;
});

const vatAmount = computed(() => {
  return includeVat.value
    ? Math.round(
        (subtotal.value + serviceCharge.value - discountAmount.value) * 7,
      ) / 100
    : 0;
});

const grandTotal = computed(() => {
  return Math.max(
    0,
    subtotal.value +
      serviceCharge.value +
      vatAmount.value -
      discountAmount.value,
  );
});

// Actions
const confirmCheckout = () => {
  // In a real app, this would call an API to close the table and register the payment
  setTimeout(() => {
    emit("checkout-success");
    emit("update:modelValue", false);
  }, 500);
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="t('posModule.checkout.title') + (table ? ` - ${table.name}` : '')"
  >
    <div class="space-y-6" v-if="table">
      <!-- Order Summary -->
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h4 class="font-bold text-slate-800 mb-3 flex items-center">
          <Receipt class="w-4 h-4 mr-2 text-indigo-500" />
          {{ t("posModule.checkout.summary") }}
        </h4>

        <div
          class="max-h-40 overflow-y-auto mb-4 border-b border-slate-200 pb-4"
        >
          <div v-if="table.orders && table.orders.length > 0">
            <div
              v-for="item in table.orders"
              :key="item.id"
              class="flex justify-between items-center py-1 text-sm"
            >
              <span class="text-slate-600 truncate mr-2"
                >{{ item.qty }}x {{ item.name }}</span
              >
              <span class="font-medium text-slate-800"
                >฿{{ item.price * item.qty }}</span
              >
            </div>
          </div>
          <div v-else class="text-slate-400 text-sm text-center py-2">
            No items in order
          </div>
        </div>

        <!-- Totals Calculation -->
        <div class="space-y-3 text-sm">
          <div class="flex justify-between text-slate-600">
            <span>{{ t("posModule.checkout.subtotal") }}</span>
            <span class="font-medium text-slate-800">฿{{ subtotal }}</span>
          </div>

          <div class="flex items-center justify-between">
            <label class="flex items-center text-slate-600">
              <input
                type="checkbox"
                v-model="includeServiceCharge"
                class="mr-2 text-indigo-600 rounded border-slate-300"
              />
              {{ t("posModule.checkout.serviceCharge") }}
            </label>
            <span class="text-slate-800">฿{{ serviceCharge }}</span>
          </div>

          <div class="flex items-center justify-between mb-2">
            <label class="flex items-center text-slate-600">
              <span class="mr-2"
                >{{ t("posModule.checkout.discount") }} (฿)</span
              >
            </label>
            <input
              v-model="discountAmount"
              type="number"
              min="0"
              class="w-24 text-right border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none h-7"
            />
          </div>

          <div class="flex items-center justify-between">
            <label class="flex items-center text-slate-600">
              <input
                type="checkbox"
                v-model="includeVat"
                class="mr-2 text-indigo-600 rounded border-slate-300"
              />
              {{ t("posModule.checkout.vat") }}
            </label>
            <span class="text-slate-800">฿{{ vatAmount }}</span>
          </div>

          <div
            class="flex justify-between text-xl font-bold text-slate-800 pt-3 border-t border-slate-200 mt-2"
          >
            <span>{{ t("posModule.checkout.total") }}</span>
            <span class="text-indigo-600">฿{{ grandTotal }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Methods -->
      <div>
        <h4 class="font-bold text-slate-800 mb-3 text-sm">
          {{ t("posModule.checkout.paymentMethod") }}
        </h4>
        <div class="grid grid-cols-3 gap-3">
          <button
            @click="paymentMethod = 'cash'"
            class="flex flex-col items-center justify-center py-3 border rounded-xl transition-all"
            :class="
              paymentMethod === 'cash'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
            "
          >
            <Banknote class="w-6 h-6 mb-1" />
            <span class="text-xs font-semibold">{{
              t("posModule.checkout.cash")
            }}</span>
          </button>

          <button
            @click="paymentMethod = 'transfer'"
            class="flex flex-col items-center justify-center py-3 border rounded-xl transition-all"
            :class="
              paymentMethod === 'transfer'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
            "
          >
            <QrCode class="w-6 h-6 mb-1" />
            <span class="text-xs font-semibold">{{
              t("posModule.checkout.transfer")
            }}</span>
          </button>

          <button
            @click="paymentMethod = 'creditCard'"
            class="flex flex-col items-center justify-center py-3 border rounded-xl transition-all"
            :class="
              paymentMethod === 'creditCard'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
            "
          >
            <CreditCard class="w-6 h-6 mb-1" />
            <span class="text-xs font-semibold">{{
              t("posModule.checkout.creditCard")
            }}</span>
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        @click="$emit('update:modelValue', false)"
        class="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium text-sm"
      >
        {{ t("posModule.checkout.cancel") }}
      </button>
      <button
        @click="confirmCheckout"
        class="px-6 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition-colors font-bold text-sm shadow-md w-full flex-grow text-center"
      >
        {{ t("posModule.checkout.confirm") }}
      </button>
    </template>
  </Modal>
</template>
