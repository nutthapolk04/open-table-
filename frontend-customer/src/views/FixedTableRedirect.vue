<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';
import { Loader2, AlertCircle } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const error = ref('');
const loading = ref(true);

onMounted(async () => {
    const tableId = route.params.tableId;
    try {
        const response = await api.get(`/tables/${tableId}/session/active`);
        if (response.data && response.data.id) {
            router.replace(`/table/${response.data.id}`);
        } else {
            error.value = 'ไม่พบโต๊ะที่กำลังเปิดให้บริการในขณะนี้ กรุณาติดต่อพนักงาน';
        }
    } catch (err: any) {
        if (err.response?.status === 403) {
            error.value = 'โซนนี้ปิดช่วงคราว กรุณาติดต่อพนักงาน';
        } else {
            error.value = 'ไม่สามารถดึงข้อมูลโต๊ะได้ กรุณาสแกน QR ใหม่ หรือติดต่อพนักงาน';
        }
    } finally {
        loading.value = false;
    }
});
const refresh = () => window.location.reload();
</script>

<template>
    <div class="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8 text-center">
        <div v-if="loading" class="space-y-4">
            <Loader2 class="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
            <p class="font-serif italic text-slate-600 text-xl">กำลังตรวจสอบข้อมูลโต๊ะ...</p>
        </div>
        
        <div v-else-if="error" class="space-y-6 max-w-sm">
            <div class="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle class="w-10 h-10" />
            </div>
            <h2 class="text-3xl font-serif text-slate-900 italic">ขออภัย</h2>
            <p class="text-slate-500 font-medium leading-relaxed">{{ error }}</p>
            <button @click="refresh" class="w-full py-5 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                ลองใหม่อีกครั้ง
            </button>
        </div>
    </div>
</template>
