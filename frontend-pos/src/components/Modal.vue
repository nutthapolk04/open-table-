<script setup lang="ts">
import { X } from "lucide-vue-next";

const props = defineProps<{
  modelValue: boolean;
  title: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const close = () => {
  emit("update:modelValue", false);
};
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity pointer-events-auto"
      @click="close"
    ></div>

    <!-- Modal Content -->
    <div
      class="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden flex flex-col pointer-events-auto transform transition-all scale-100"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"
      >
        <h3 class="text-xl font-bold text-slate-800">{{ title }}</h3>
        <button
          @click="close"
          class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto max-h-[70vh]">
        <slot></slot>
      </div>

      <!-- Footer (Optional) -->
      <div
        v-if="$slots.footer"
        class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3"
      >
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>
