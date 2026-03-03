<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { Plus, Edit2, Clock } from "lucide-vue-next";
import Modal from "../components/Modal.vue";

const { t } = useI18n();

// Mock Data for Tiers
interface Tier {
  id: number;
  name: string;
  price: number;
  timeLimit: number;
  isActive: boolean;
}

const tiers = ref<Tier[]>([
  { id: 1, name: "Standard Buffet", price: 299, timeLimit: 90, isActive: true },
  {
    id: 2,
    name: "Premium Seafood",
    price: 399,
    timeLimit: 120,
    isActive: true,
  },
  { id: 3, name: "Gold Wagyu", price: 599, timeLimit: 120, isActive: false },
]);

// Modal States
const showTierModal = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

// Form State
const tierForm = ref({
  name: "",
  price: 299,
  timeLimit: 90,
  isActive: true,
});

// Actions
const openAddTierModal = () => {
  isEditing.value = false;
  editingId.value = null;
  tierForm.value = { name: "", price: 299, timeLimit: 90, isActive: true };
  showTierModal.value = true;
};

const editTier = (tier: Tier) => {
  isEditing.value = true;
  editingId.value = tier.id;
  tierForm.value = { ...tier };
  showTierModal.value = true;
};

const toggleTierStatus = (tier: Tier) => {
  tier.isActive = !tier.isActive;
};

const saveTier = () => {
  if (!tierForm.value.name.trim()) return;

  if (isEditing.value && editingId.value) {
    const index = tiers.value.findIndex((t) => t.id === editingId.value);
    if (index !== -1) {
      tiers.value[index] = { ...tierForm.value, id: editingId.value };
    }
  } else {
    tiers.value.push({
      ...tierForm.value,
      id: Date.now(),
    });
  }

  showTierModal.value = false;
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-bold text-slate-800">
        {{ t("menuModule.title") }}
      </h3>
      <button
        @click="openAddTierModal"
        class="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
      >
        <Plus class="w-4 h-4" />
        <span>{{ t("menuModule.addTier") }}</span>
      </button>
    </div>

    <!-- Tiers Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="tier in tiers"
        :key="tier.id"
        class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md relative group"
        :class="{ 'opacity-70': !tier.isActive }"
      >
        <!-- Card Header -->
        <div
          class="h-2 w-full"
          :class="tier.isActive ? 'bg-indigo-500' : 'bg-slate-300'"
        ></div>

        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h4 class="text-xl font-bold text-slate-800">{{ tier.name }}</h4>
              <div class="flex items-center text-slate-500 text-sm mt-1">
                <Clock class="w-4 h-4 mr-1" />
                <span>{{ tier.timeLimit }} {{ t("menuModule.minutes") }}</span>
              </div>
            </div>

            <!-- Actions Dropdown / overlay -->
            <button
              @click="editTier(tier)"
              class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
            >
              <Edit2 class="w-4 h-4" />
            </button>
          </div>

          <div class="mt-6 flex items-end justify-between">
            <div>
              <span class="text-3xl font-black text-slate-800">{{
                tier.price
              }}</span>
              <span class="text-slate-500 text-sm font-medium ml-1"
                >{{ t("menuModule.baht") }} / pax</span
              >
            </div>

            <!-- Toggle Status -->
            <button
              @click="toggleTierStatus(tier)"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
              :class="tier.isActive ? 'bg-emerald-500' : 'bg-slate-300'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="tier.isActive ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <!-- Status Text -->
          <div class="mt-4 pt-4 border-t border-slate-100 flex justify-end">
            <span
              class="text-xs font-semibold px-2 py-1 rounded-full"
              :class="
                tier.isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              "
            >
              {{
                tier.isActive
                  ? t("menuModule.active")
                  : t("menuModule.inactive")
              }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tier Edit/Add Modal -->
    <Modal
      v-model="showTierModal"
      :title="isEditing ? t('menuModule.editTier') : t('menuModule.addTier')"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{
            t("menuModule.tierName")
          }}</label>
          <input
            v-model="tierForm.name"
            type="text"
            class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="e.g., Premium Seafood"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >{{ t("menuModule.price") }} ({{ t("menuModule.baht") }})</label
            >
            <input
              v-model="tierForm.price"
              type="number"
              min="0"
              class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{
              t("menuModule.timeLimit")
            }}</label>
            <input
              v-model="tierForm.timeLimit"
              type="number"
              min="0"
              class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div class="flex items-center mt-4">
          <input
            type="checkbox"
            id="status-active"
            v-model="tierForm.isActive"
            class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <label
            for="status-active"
            class="ml-2 text-sm font-medium text-slate-700"
            >{{ t("menuModule.active") }}</label
          >
        </div>
      </div>

      <template #footer>
        <button
          @click="showTierModal = false"
          class="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium text-sm"
        >
          {{ t("menuModule.cancel") }}
        </button>
        <button
          @click="saveTier"
          class="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          {{ t("menuModule.save") }}
        </button>
      </template>
    </Modal>
  </div>
</template>
