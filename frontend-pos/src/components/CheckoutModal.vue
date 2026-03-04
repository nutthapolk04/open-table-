<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Receipt, Banknote, CreditCard, QrCode, Printer, CheckCircle2, ChevronRight, X } from "lucide-vue-next";
import Modal from "./Modal.vue";
import { usePosStore } from "../stores/pos";

const store = usePosStore();
const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
  table: any;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "checkout-success"): void;
}>();

// --- State ---
const step = ref<"bill" | "payment" | "success">("bill");
const paymentMethod = ref<"cash" | "transfer" | "creditCard">("cash");
const discountAmount = ref(0);
const includeServiceCharge = ref(true);
const includeVat = ref(true);
const receivedAmount = ref<number | null>(null);
const isProcessing = ref(false);

// Reset state when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    step.value = "bill";
    discountAmount.value = 0;
    receivedAmount.value = null;
    isProcessing.value = false;
  }
});

// --- Calculations ---
const subtotal = computed(() => {
  if (!props.table?.orders) return 0;
  return props.table.orders.reduce((sum: number, item: any) => sum + item.price * item.qty, 0);
});

const serviceCharge = computed(() => {
  return includeServiceCharge.value ? Math.round(subtotal.value * 0.1) : 0;
});

const taxableAmount = computed(() => {
  return Math.max(0, subtotal.value + serviceCharge.value - discountAmount.value);
});

const vatAmount = computed(() => {
  return includeVat.value ? Math.round(taxableAmount.value * 0.07) : 0;
});

const grandTotal = computed(() => {
  return taxableAmount.value + vatAmount.value;
});

const changeAmount = computed(() => {
  if (receivedAmount.value === null || receivedAmount.value < grandTotal.value) return 0;
  return receivedAmount.value - grandTotal.value;
});

// --- Actions ---
const nextStep = () => {
  if (step.value === "bill") step.value = "payment";
  else confirmCheckout();
};

const confirmCheckout = async () => {
  if (!props.table?.sessionId) return;
  isProcessing.value = true;
  
  try {
    await store.checkoutTable(props.table.sessionId);
    step.value = "success";
    emit("checkout-success");
  } catch (err) {
    console.error("Checkout failed:", err);
  } finally {
    isProcessing.value = false;
  }
};

const handlePrint = () => {
  window.print();
};

const close = () => {
  emit("update:modelValue", false);
};

// Utilities
const formatDate = (date: Date = new Date()) => {
  return date.toLocaleString('th-TH', { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
};
</script>

<template>
  <div class="checkout-modal-root">
    <!-- Main Modal UI -->
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" 
        @click="close"
      ></div>

      <!-- Card -->
      <div class="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-xl font-black text-slate-800 tracking-tight">
              {{ t("posModule.checkout.title") }}
            </h3>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5" v-if="table">
              {{ t("posModule.table") }} {{ table.number }} • {{ table.zone }}
            </p>
          </div>
          <button @click="close" class="p-2 text-slate-300 hover:text-slate-500 transition-colors">
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-8 max-h-[70vh] overflow-y-auto hidden-scrollbar">
          <!-- Step 1: Bill Review -->
          <div v-if="step === 'bill'" class="space-y-6">
            <div class="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <div class="flex items-center space-x-2 mb-4">
                <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Receipt class="w-4 h-4" />
                </div>
                <h4 class="font-bold text-slate-800 uppercase text-xs tracking-wider">{{ t("posModule.checkout.summary") }}</h4>
              </div>

              <div class="space-y-3 mb-6">
                <div v-for="item in table?.orders" :key="item.id" class="flex justify-between items-center text-sm">
                  <span class="text-slate-600 font-medium">
                    <span class="text-indigo-600 font-bold mr-2">{{ item.qty }}x</span>
                    {{ item.name }}
                  </span>
                  <span class="font-bold text-slate-800">฿{{ (item.price * item.qty).toLocaleString() }}</span>
                </div>
              </div>

              <div class="pt-4 border-t border-slate-200 space-y-3">
                <div class="flex justify-between text-sm font-medium text-slate-500">
                  <span>{{ t("posModule.checkout.subtotal") }}</span>
                  <span>฿{{ subtotal.toLocaleString() }}</span>
                </div>
                
                <div class="flex items-center justify-between group">
                  <label class="flex items-center text-sm font-medium text-slate-500 cursor-pointer">
                    <input type="checkbox" v-model="includeServiceCharge" class="hidden" />
                    <div class="w-4 h-4 rounded border border-slate-300 mr-2 flex items-center justify-center transition-all" :class="includeServiceCharge ? 'bg-indigo-600 border-indigo-600' : 'bg-white'">
                      <CheckCircle2 v-if="includeServiceCharge" class="w-3 h-3 text-white" />
                    </div>
                    {{ t("posModule.checkout.serviceCharge") }} (10%)
                  </label>
                  <span class="text-sm font-bold text-slate-800">฿{{ serviceCharge.toLocaleString() }}</span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-red-500 uppercase tracking-wider">{{ t("posModule.checkout.discount") }}</span>
                  <div class="relative">
                    <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-red-400">฿</span>
                    <input v-model.number="discountAmount" type="number" class="w-20 pl-5 pr-2 py-1 bg-red-50 border border-red-100 rounded-lg text-right text-sm font-black text-red-600 outline-none focus:ring-1 focus:ring-red-300 h-8" />
                  </div>
                </div>

                <div class="flex items-center justify-between group">
                  <label class="flex items-center text-sm font-medium text-slate-500 cursor-pointer">
                    <input type="checkbox" v-model="includeVat" class="hidden" />
                    <div class="w-4 h-4 rounded border border-slate-300 mr-2 flex items-center justify-center transition-all" :class="includeVat ? 'bg-indigo-600 border-indigo-600' : 'bg-white'">
                      <CheckCircle2 v-if="includeVat" class="w-3 h-3 text-white" />
                    </div>
                    {{ t("posModule.checkout.vat") }} (7%)
                  </label>
                  <span class="text-sm font-bold text-slate-800">฿{{ vatAmount.toLocaleString() }}</span>
                </div>

                <div class="pt-4 flex justify-between items-end">
                  <span class="text-base font-black text-slate-400 uppercase tracking-[0.2em]">{{ t("posModule.checkout.total") }}</span>
                  <span class="text-4xl font-black text-indigo-600">฿{{ grandTotal.toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Payment -->
          <div v-else-if="step === 'payment'" class="animate-in slide-in-from-right-4 duration-300 space-y-8">
            <div class="grid grid-cols-3 gap-4">
              <button 
                v-for="method in (['cash', 'transfer', 'creditCard'] as const)" 
                :key="method" 
                @click="paymentMethod = method"
                class="flex flex-col items-center justify-center p-6 border-2 rounded-2xl transition-all group"
                :class="paymentMethod === method ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'"
              >
                <component :is="method === 'cash' ? Banknote : method === 'transfer' ? QrCode : CreditCard" class="w-8 h-8 mb-3 transition-transform group-active:scale-90" />
                <span class="text-xs font-black uppercase tracking-widest">{{ t(`posModule.checkout.${method}`) }}</span>
              </button>
            </div>

            <div v-if="paymentMethod === 'cash'" class="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 space-y-6">
              <div class="flex justify-between items-center">
                <span class="text-sm font-black text-emerald-800 uppercase tracking-wider italic">{{ t("posModule.checkout.received") }}</span>
                <div class="relative flex items-center">
                  <span class="mr-3 text-2xl font-black text-emerald-400">฿</span>
                  <input v-model.number="receivedAmount" type="number" class="w-48 bg-white border-2 border-emerald-200 rounded-xl px-4 py-3 text-right font-black text-3xl text-emerald-700 focus:ring-4 focus:ring-emerald-500 shadow-sm outline-none" placeholder="0" />
                </div>
              </div>

              <div class="flex gap-2">
                <button 
                  v-for="amt in [100, 500, 1000]" 
                  :key="amt" 
                  @click="receivedAmount = (receivedAmount || 0) + amt"
                  class="flex-1 py-3 bg-white border border-emerald-200 rounded-xl text-sm font-black text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm"
                >+{{ amt }}</button>
                <button @click="receivedAmount = grandTotal" class="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 shadow-lg">+ Exact</button>
              </div>

              <div class="pt-6 border-t border-emerald-200 flex justify-between items-center">
                <span class="text-sm font-black text-emerald-800 uppercase tracking-widest">{{ t("posModule.checkout.change") }}</span>
                <span class="text-5xl font-black text-emerald-600">฿{{ changeAmount.toLocaleString() }}</span>
              </div>
            </div>

            <div v-else class="text-center py-12 px-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <p class="text-slate-500 font-bold">{{ t("posModule.checkout.paymentInstructions") || 'Please process payment on terminal' }}</p>
              <p class="text-[10px] text-slate-300 mt-2 uppercase tracking-[0.2em] font-black">Waiting for confirmation</p>
            </div>
          </div>

          <!-- Step 3: Success -->
          <div v-else-if="step === 'success'" class="text-center py-12 animate-in zoom-in-50 duration-500 flex flex-col items-center">
            <div class="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-50 animate-bounce">
              <CheckCircle2 class="w-12 h-12" />
            </div>
            <h3 class="text-3xl font-black text-slate-800 mb-2 italic">Paid Successfully!</h3>
            <p class="text-slate-500 font-medium mb-8">Table {{ table.number }} has been cleared.</p>
            
            <button @click="handlePrint" class="flex items-center space-x-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-black text-sm hover:bg-slate-900 transition-all shadow-xl shadow-slate-200 active:scale-95">
              <Printer class="w-4 h-4" />
              <span>{{ t("posModule.checkout.print") }}</span>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between" v-if="step !== 'success'">
          <button 
            @click="step === 'payment' ? step = 'bill' : close()" 
            class="text-sm font-bold text-slate-400 hover:text-slate-600 px-4 py-2 transition-colors uppercase tracking-widest"
          >
            {{ step === 'payment' ? 'Back' : t("posModule.checkout.cancel") }}
          </button>
          
          <button 
            @click="nextStep"
            :disabled="isProcessing || (step === 'payment' && paymentMethod === 'cash' && (receivedAmount || 0) < grandTotal)"
            class="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-base flex items-center justify-center transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:shadow-none hover:bg-indigo-700 group active:scale-95"
          >
            <span v-if="isProcessing" class="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full mr-2"></span>
            <span>{{ step === 'bill' ? t("posModule.checkout.confirm") : t("posModule.checkout.confirm") }}</span>
            <ChevronRight class="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden Printable Receipt (Professional POS Style) -->
    <div class="receipt-print-area hidden print:block">
      <div class="receipt-container text-[12px] leading-tight font-mono p-4 max-w-[80mm] mx-auto text-black">
        <div class="text-center mb-4">
          <h2 class="text-xl font-black uppercase mb-1">OPEN TABLE</h2>
          <p class="text-[10px] mb-2 opacity-70 italic font-sans">Premium Buffet Experience</p>
          <div class="border-y border-dashed border-black py-1 my-2 flex justify-between text-[10px]">
             <span>Date: {{ formatDate() }}</span>
             <span>Table: {{ table?.number }}</span>
          </div>
        </div>

        <div class="space-y-1 mb-4">
           <div v-for="item in table?.orders" :key="item.id" class="flex justify-between">
              <span class="w-[70%] text-left">{{ item.qty }}x {{ item.name }}</span>
              <span class="w-[30%] text-right">{{ (item.price * item.qty).toLocaleString() }}</span>
           </div>
        </div>

        <div class="border-t border-dashed border-black pt-2 space-y-1">
           <div class="flex justify-between">
              <span>Subtotal:</span>
              <span>{{ subtotal.toLocaleString() }}</span>
           </div>
           <div v-if="serviceCharge > 0" class="flex justify-between italic">
              <span>Service Charge (10%):</span>
              <span>{{ serviceCharge.toLocaleString() }}</span>
           </div>
           <div v-if="discountAmount > 0" class="flex justify-between text-black">
              <span>Discount:</span>
              <span>-{{ discountAmount.toLocaleString() }}</span>
           </div>
           <div v-if="vatAmount > 0" class="flex justify-between italic">
              <span>Tax (7%):</span>
              <span>{{ vatAmount.toLocaleString() }}</span>
           </div>
           <div class="flex justify-between text-lg font-black pt-1 my-1 border-t border-double border-black">
              <span>GRAND TOTAL:</span>
              <span>฿{{ grandTotal.toLocaleString() }}</span>
           </div>
        </div>

        <div class="mt-4 border-t border-dashed border-black pt-2 space-y-1 text-[10px]">
           <div class="flex justify-between">
              <span>Payment Type:</span>
              <span class="uppercase">{{ paymentMethod }}</span>
           </div>
           <div v-if="paymentMethod === 'cash'" class="flex justify-between">
              <span>Received:</span>
              <span>{{ (receivedAmount || 0).toLocaleString() }}</span>
           </div>
           <div v-if="paymentMethod === 'cash'" class="flex justify-between font-bold">
              <span>Change:</span>
              <span>{{ changeAmount.toLocaleString() }}</span>
           </div>
        </div>

        <div class="text-center mt-8 space-y-1 opacity-60">
           <p class="uppercase text-[10px]">Thank you for your visit!</p>
           <p class="text-[8px]">Please keep your receipt for reference.</p>
           <p class="text-[8px] pt-2">Powered by OpenTable POS</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hidden-scrollbar::-webkit-scrollbar { display: none; }
.hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

@media print {
  body * {
    visibility: hidden;
  }
  .receipt-print-area, .receipt-print-area * {
    visibility: visible;
  }
  .receipt-print-area {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  .receipt-container {
    padding: 20px;
    width: 80mm;
    margin: auto;
  }
}

.checkout-modal-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

input[type="checkbox"]:checked + div {
  animation: pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop {
  0% { transform: scale(0.8); }
  100% { transform: scale(1); }
}
</style>
