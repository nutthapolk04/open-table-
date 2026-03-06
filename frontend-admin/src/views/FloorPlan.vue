<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Table as TableIcon, 
  Layers,
  Search,
  ChevronRight,
  Monitor,
  Zap,
  Info,
  Users,
  QrCode,
  ExternalLink
} from 'lucide-vue-next';
import api from '../api';

const zones = ref<any[]>([]);
const loading = ref(false);
const showAddZone = ref(false);
const showAddTable = ref(false);

const newZone = ref({ name: '' });
const newTable = ref({ number: '', zoneId: '', seats: 4 });
const showQRModal = ref(false);
const selectedTableForQR = ref<any>(null);

const frontendCustomerUrl = "http://localhost:5174";

const fetchData = async () => {
    loading.value = true;
    try {
        const res = await api.get('/zones');
        zones.value = res.data;
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const createZone = async () => {
    if (!newZone.value.name) return;
    await api.post('/zones', newZone.value);
    showAddZone.value = false;
    newZone.value.name = '';
    fetchData();
};

const createTable = async () => {
    if (!newTable.value.number || !newTable.value.zoneId) {
        alert('กรุณากรอกหมายเลขโต๊ะและเลือกโซน');
        return;
    }
    try {
        await api.post('/tables', newTable.value);
        showAddTable.value = false;
        newTable.value.number = '';
        newTable.value.seats = 4;
        newTable.value.zoneId = ''; // Reset zoneId too
        await fetchData();
    } catch (e: any) {
        console.error(e);
        alert('ไม่สามารถสร้างโต๊ะได้: ' + (e.response?.data?.error || e.message));
    }
};

const openQRModal = (table: any) => {
    selectedTableForQR.value = table;
    showQRModal.value = true;
};


onMounted(fetchData);

</script>

<template>
  <div class="space-y-10 max-w-7xl mx-auto">
    <!-- Header Controls -->
    <div class="flex items-center justify-between border-b border-slate-100 pb-10">
      <div class="flex items-center space-x-4">
        <div class="p-3 bg-indigo-50 rounded-2xl">
          <MapPin class="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">ผังร้านอาหาร</h2>
          <p class="text-slate-500 font-bold text-sm tracking-wide mt-1 italic">จัดการโซนและผังโต๊ะภายในร้าน</p>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <button @click="showAddZone = true" class="btn-secondary h-14 px-8 border-slate-200 flex items-center space-x-2">
            <Layers class="w-4 h-4" />
            <span>สร้างโซน</span>
        </button>
        <button @click="showAddTable = true" class="btn-primary h-14 px-8 flex items-center space-x-2">
            <Plus class="w-5 h-5" />
            <span>เพิ่มโต๊ะใหม่</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-24 space-y-4 opacity-50">
        <Monitor class="w-12 h-12 animate-pulse text-indigo-600" />
        <span class="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">กำลังโหลดข้อมูล...</span>
    </div>

    <!-- Zones Grid -->
    <div v-else class="grid grid-cols-1 gap-12">
        <div v-for="zone in zones" :key="zone.id" class="card p-10 relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-8 transform translate-x-4 translate-y--4 opacity-0 group-hover:opacity-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700">
                <Layers class="w-48 h-48 text-indigo-600" />
            </div>

            <div class="flex items-center justify-between mb-10 relative z-10">
                <div class="flex items-center space-x-6">
                    <div class="w-16 h-16 bg-slate-900 rounded-[28px] flex items-center justify-center shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
                        <MapPin class="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h3 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">{{ zone.name }}</h3>
                        <span class="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-1 block px-2 py-0.5 bg-indigo-50 rounded-full w-fit">โซนรับประทานอาหาร</span>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <div class="h-10 px-4 bg-slate-100 rounded-xl flex items-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {{ zone.tables?.length || 0 }} โต๊ะ
                    </div>
                    <div class="h-10 px-4 bg-indigo-50 rounded-xl flex items-center text-[10px] font-black uppercase tracking-wider text-indigo-600">
                        {{ zone.tables?.reduce((sum: number, t: any) => sum + (t.seats || 4), 0) }} ที่นั่งรวม
                    </div>
                    <button class="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <Trash2 class="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 relative z-10">
                <div v-for="table in zone.tables" :key="table.id" class="relative group/table">
                    <div class="aspect-square bg-slate-50 border border-slate-200/40 rounded-[32px] flex flex-col items-center justify-center p-4 transition-all duration-300 group-hover/table:bg-indigo-600 group-hover/table:border-indigo-600 group-hover/table:shadow-xl group-hover/table:shadow-indigo-200 group-hover/table:-translate-y-2"
                        :class="table.sessions?.length > 0 ? 'bg-indigo-50/50 border-indigo-200' : ''">
                        <TableIcon class="w-6 h-6 text-slate-400 mb-2 group-hover/table:text-indigo-100 transition-colors"
                            :class="table.sessions?.length > 0 ? 'text-indigo-500' : ''" />
                        <span class="text-xl font-black text-slate-800 group-hover/table:text-white transition-colors tracking-tighter italic uppercase"
                            :class="table.sessions?.length > 0 ? 'text-indigo-900' : ''">{{ table.number }}</span>
                        
                        <!-- Occupancy: show pax/seats if occupied, just seats if free -->
                        <div class="flex items-center space-x-1 mt-2 group-hover/table:text-indigo-200 transition-colors"
                            :class="table.sessions?.length > 0 ? 'text-indigo-500' : 'text-slate-400'">
                            <Users class="w-3 h-3" />
                            <span v-if="table.sessions?.[0]" class="text-[11px] font-bold">
                                {{ table.sessions[0].customerCount }}<span class="opacity-40 mx-px">/</span>{{ table.seats || 4 }}
                            </span>
                            <span v-else class="text-[10px] font-bold">{{ table.seats || 4 }}</span>
                        </div>

                        <!-- QR Code Button (Only if occupied) -->
                        <button 
                            v-if="table.sessions?.length > 0"
                            @click.stop="openQRModal(table)"
                            class="mt-3 p-2 bg-indigo-100 text-indigo-600 rounded-xl opacity-0 group-hover/table:opacity-100 transition-all hover:bg-white hover:scale-110 active:scale-95 z-20"
                        >
                            <QrCode class="w-4 h-4" />
                        </button>
                    </div>
                    <!-- Status dot -->
                    <div v-if="table.sessions?.length > 0" class="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full shadow-lg group-hover/table:scale-125 transition-transform z-10 flex items-center justify-center">
                        <Zap class="w-2 h-2 text-white fill-current" />
                    </div>
                </div>

                <!-- Ghost Add Table Inside Zone -->
                <button @click="showAddTable = true; newTable.zoneId = zone.id" class="aspect-square border-4 border-dashed border-slate-100/50 rounded-[32px] flex flex-col items-center justify-center p-4 hover:border-indigo-200 hover:bg-white transition-all group/ghost shadow-inner">
                    <Plus class="w-8 h-8 text-slate-300 group-hover/ghost:text-indigo-400 group-hover/ghost:rotate-90 transition-all" />
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 opacity-0 group-hover/ghost:opacity-100 transition-opacity">เพิ่มโต๊ะ</span>
                </button>
            </div>
        </div>
        
        <!-- Empty State -->
        <div v-if="zones.length === 0" class="card border-dashed border-2 py-32 flex flex-col items-center justify-center text-slate-400">
             <Layers class="w-20 h-20 opacity-5 mb-6" />
             <p class="font-black uppercase tracking-widest text-sm italic opacity-40">ยังไม่มีโซนรับประทานอาหาร</p>
             <button @click="showAddZone = true" class="mt-8 btn-primary">เริ่มต้นตั้งค่าระบบ</button>
        </div>
    </div>

    <!-- Modals (Simple Overlay) -->
    <Teleport to="body">
        <div v-if="showAddZone" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500" @click="showAddZone = false"></div>
            <div class="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 p-12">
                <div class="flex items-center space-x-4 mb-10">
                    <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Layers class="w-6 h-6" />
                    </div>
                    <h3 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">สร้างโซนใหม่</h3>
                </div>
                <div class="space-y-4">
                    <label class="block text-xs font-black uppercase tracking-widest text-slate-400">ชื่อโซน</label>
                    <input v-model="newZone.name" class="input-field text-xl font-bold h-16" placeholder="เช่น VIP LOUNGE" />
                </div>
                <div class="mt-12 flex space-x-4">
                    <button @click="showAddZone = false" class="btn-secondary flex-1">ยกเลิก</button>
                    <button @click="createZone" class="btn-primary flex-1">บันทึกโซน</button>
                </div>
            </div>
        </div>

        <div v-if="showAddTable" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500" @click="showAddTable = false"></div>
            <div class="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 p-12">
                <div class="flex items-center space-x-4 mb-10">
                    <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <TableIcon class="w-6 h-6" />
                    </div>
                    <h3 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">เพิ่มโต๊ะใหม่</h3>
                </div>
                <div class="space-y-6">
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">หมายเลขโต๊ะ</label>
                        <input v-model="newTable.number" class="input-field text-xl font-bold h-16" placeholder="เช่น A-42" />
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">โซนที่ตั้ง</label>
                        <select v-model="newTable.zoneId" class="input-field text-lg font-bold h-16 appearance-none">
                            <option value="">เลือกโซน...</option>
                            <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">จำนวนที่นั่ง</label>
                        <input v-model.number="newTable.seats" type="number" min="1" class="input-field text-xl font-bold h-16" placeholder="e.g. 4" />
                    </div>
                </div>
                <div class="mt-12 flex space-x-4">
                    <button @click="showAddTable = false" class="btn-secondary flex-1">ยกเลิก</button>
                    <button @click="createTable" class="btn-primary flex-1">บันทึกโต๊ะ</button>
                </div>
            </div>
        </div>

        <!-- QR Code Modal -->
        <div v-if="showQRModal && selectedTableForQR" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500" @click="showQRModal = false"></div>
            <div class="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 p-10 text-center">
                <div class="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                    <QrCode class="w-8 h-8" />
                </div>
                <h3 class="text-2xl font-black text-slate-800 tracking-tighter uppercase italic mb-2">QR Code สำหรับโต๊ะ {{ selectedTableForQR.number }}</h3>
                <p class="text-slate-400 text-sm font-bold mb-8 uppercase tracking-widest">ให้ลูกค้าสแกนเพื่อสั่งอาหาร</p>
                
                <div class="bg-slate-50 p-8 rounded-[32px] border border-slate-100 mb-8 inline-block">
                    <img 
                        :src="`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(frontendCustomerUrl + '/table/' + selectedTableForQR.sessions[0].id)}`" 
                        class="w-full h-auto rounded-lg shadow-sm"
                        alt="QR Code"
                    />
                </div>
                
                <div class="space-y-3">
                    <a 
                        :href="`${frontendCustomerUrl}/table/${selectedTableForQR.sessions[0].id}`" 
                        target="_blank"
                        class="flex items-center justify-center w-full py-4 text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 rounded-2xl hover:bg-indigo-100 transition-all"
                    >
                        <ExternalLink class="w-4 h-4 mr-2" />
                        เปิดลิงก์สำหรับลูกค้า
                    </a>
                    <button @click="showQRModal = false" class="w-full py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
  </div>
</template>

<style scoped>
</style>
