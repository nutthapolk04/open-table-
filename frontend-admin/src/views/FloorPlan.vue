<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  Plus, 
  Trash2, 
  Pencil,
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
  ExternalLink,
  Check,
  Receipt,
  Sparkles,
  UserPlus
} from 'lucide-vue-next';
import api from '../api';

const zones = ref<any[]>([]);
const loading = ref(false);
const showAddZone = ref(false);
const showAddTable = ref(false);
const showEditTable = ref(false);

const newZone = ref({ name: '' });
const newTable = ref({ number: '', zoneId: '', seats: 4 });
const showQRModal = ref(false);
const selectedTableForQR = ref<any>(null);

const editingTable = ref<any>(null);
const editingZone = ref<any>(null);
const showEditZone = ref(false);

const zoneToDelete = ref<any>(null);
const showDeleteZoneConfirm = ref(false);
const deleteError = ref('');

const tiers = ref<any[]>([]);
const showOpenTableModal = ref(false);
const selectedTableToOpen = ref<any>(null);
const openTableForm = ref({ customerCount: 2, tierId: '' });

const frontendCustomerUrl = import.meta.env.VITE_CUSTOMER_FRONTEND_URL || "http://localhost:5174";

const fetchData = async () => {
    loading.value = true;
    try {
        const [zoneRes, tierRes] = await Promise.all([
            api.get('/zones'),
            api.get('/tiers')
        ]);
        zones.value = zoneRes.data;
        tiers.value = tierRes.data;
        if (tiers.value.length > 0) {
            openTableForm.value.tierId = tiers.value[0].id;
        }
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
        newTable.value.zoneId = '';
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

const translateError = (msg: string) => {
    if (!msg) return '';
    if (msg.includes('occupied or being cleaned')) return 'ไม่สามารถลบได้เนื่องจากมีคนนั่งอยู่หรือกำลังทำความสะอาด';
    if (msg.includes('Zone has tables')) return 'โซนนี้ยังมีโต๊ะอยู่';
    if (msg.includes('Table not found')) return 'ไม่พบข้อมูลโต๊ะ';
    if (msg.includes('Zone not found')) return 'ไม่พบข้อมูลโซน';
    return msg;
};

const deleteTable = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโต๊ะนี้?')) return;
    try {
        await api.delete(`/tables/${id}`);
        fetchData();
    } catch (e: any) {
        alert(translateError(e.response?.data?.error) || 'เกิดข้อผิดพลาดในการลบโต๊ะ');
    }
};

const handleEditTableClick = (table: any) => {
    editingTable.value = { ...table };
    showEditTable.value = true;
};

const updateTable = async () => {
    if (!editingTable.value || !editingTable.value.number) return;
    try {
        await api.patch(`/tables/${editingTable.value.id}`, {
            number: editingTable.value.number,
            seats: editingTable.value.seats
        });
        showEditTable.value = false;
        editingTable.value = null;
        fetchData();
    } catch (e: any) {
        alert(translateError(e.response?.data?.error) || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลโต๊ะ');
    }
};

const handleDeleteZoneClick = (zone: any) => {
    zoneToDelete.value = zone;
    showDeleteZoneConfirm.value = true;
    deleteError.value = '';
};

const handleEditZoneClick = (zone: any) => {
    editingZone.value = { ...zone };
    showEditZone.value = true;
};

const updateZone = async () => {
    if (!editingZone.value || !editingZone.value.name) return;
    try {
        await api.patch(`/zones/${editingZone.value.id}`, {
            name: editingZone.value.name
        });
        showEditZone.value = false;
        editingZone.value = null;
        fetchData();
    } catch (e: any) {
        alert(translateError(e.response?.data?.error) || 'เกิดข้อผิดพลาดในการแก้ไขชื่อโซน');
    }
};

const confirmDeleteZone = async (force: boolean = false) => {
    if (!zoneToDelete.value) return;
    try {
        await api.delete(`/zones/${zoneToDelete.value.id}${force ? '?force=true' : ''}`);
        showDeleteZoneConfirm.value = false;
        zoneToDelete.value = null;
        fetchData();
    } catch (e: any) {
        if (e.response?.data?.hasTables) {
            deleteError.value = 'โซนนี้ยังมีโต๊ะอยู่ คุณแน่ใจหรือไม่ว่าต้องการลบโต๊ะทั้งหมดและประวัติในโซนนี้?';
        } else {
            alert(translateError(e.response?.data?.error) || 'เกิดข้อผิดพลาดในการลบโซน');
        }
    }
};

const getTableStatusUI = (status: string) => {
    switch (status) {
        case 'OCCUPIED':
            return { color: 'bg-indigo-500', icon: Users, label: 'มีคนนั่ง' };
        case 'CHECKING_BILL':
            return { color: 'bg-amber-500', icon: Receipt, label: 'รอเช็คบิล' };
        case 'CLEANING':
            return { color: 'bg-rose-500', icon: Sparkles, label: 'ทำความสะอาด' };
        default:
            return { color: 'bg-emerald-500', icon: Check, label: 'ว่าง' };
    }
};

const handlePrint = () => {
    window.print();
};

const handlePrintAll = (zone: any) => {
    // We'll implement a simple print all by opening a new window or just triggering a full-zone print
    window.print();
};

const handleOpenTableClick = (table: any) => {
    selectedTableToOpen.value = table;
    showOpenTableModal.value = true;
};

const confirmOpenTable = async () => {
    if (!selectedTableToOpen.value || !openTableForm.value.tierId) return;
    try {
        await api.post('/sessions/open', {
            tableId: selectedTableToOpen.value.id,
            tierId: openTableForm.value.tierId,
            customerCount: openTableForm.value.customerCount
        });
        showOpenTableModal.value = false;
        fetchData();
    } catch (e: any) {
        alert('ไม่สามารถเปิดโต๊ะได้: ' + (e.response?.data?.error || e.message));
    }
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
          <h2 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">ผังโต๊ะ</h2>
          <p class="text-slate-500 font-bold text-sm tracking-wide mt-1 italic">จัดการโซนและตำแหน่งที่ตั้งของแต่ละโต๊ะ</p>
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

    <!-- Status Legend -->
    <div class="flex items-center space-x-8 px-6 py-4 bg-slate-50 rounded-3xl border border-slate-100 w-fit">
        <div v-for="s in ['FREE', 'OCCUPIED']" :key="s" class="flex items-center space-x-3">
            <div :class="['w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm', getTableStatusUI(s).color]">
                <component :is="getTableStatusUI(s).icon" class="w-4 h-4" />
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">{{ getTableStatusUI(s).label }}</span>
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
                        <div class="flex items-center space-x-2">
                           <h3 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">{{ zone.name }}</h3>
                           <button @click="handleEditZoneClick(zone)" class="p-1 text-slate-300 hover:text-indigo-600 transition-colors">
                               <Pencil class="w-4 h-4" />
                           </button>
                        </div>
                        <div class="flex items-center space-x-2 mt-1">
                            <span class="text-[10px] font-black uppercase tracking-widest text-indigo-400 block px-2 py-0.5 bg-indigo-50 rounded-full w-fit">โซนที่เปิดให้บริการปกติ</span>
                            <button @click="handlePrintAll(zone)" class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 flex items-center bg-slate-50 px-2 py-0.5 rounded-full transition-colors">
                                <Printer class="w-3 h-3 mr-1" />
                                ปริ้น QR ทั้งโซน
                            </button>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <div class="h-10 px-4 bg-slate-100 rounded-xl flex items-center text-xs font-bold text-slate-500">
                        {{ zone.tables?.length || 0 }} โต๊ะ
                    </div>
                    <button @click="handleDeleteZoneClick(zone)" class="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
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
                        
                        <div class="flex items-center space-x-1 mt-2 group-hover/table:text-indigo-200 transition-colors"
                            :class="table.sessions?.length > 0 ? 'text-indigo-500' : 'text-slate-400'">
                            <Users class="w-3 h-3" />
                            <span v-if="table.sessions?.[0]" class="text-[11px] font-bold">
                                {{ table.sessions[0].customerCount }}<span class="opacity-40 mx-px">/</span>{{ table.seats || 4 }}
                            </span>
                            <span v-else class="text-[10px] font-bold">{{ table.seats || 4 }}</span>
                        </div>

                        <!-- QR Code Button -->
                        <div class="flex items-center space-x-2 mt-3 opacity-0 group-hover/table:opacity-100 transition-all z-20">
                            <button 
                                v-if="!table.sessions?.length"
                                @click.stop="handleOpenTableClick(table)"
                                class="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-white hover:scale-110 active:scale-95"
                            >
                                <UserPlus class="w-4 h-4" />
                            </button>
                            <button 
                                @click.stop="openQRModal(table)"
                                class="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-white hover:scale-110 active:scale-95"
                            >
                                <QrCode class="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <!-- Dynamic Status Indicator -->
                    <div v-if="['FREE', 'OCCUPIED'].includes(table.status)" :class="['absolute -top-2 -right-2 w-8 h-8 border-4 border-white rounded-[14px] shadow-lg group-hover/table:scale-125 transition-all z-10 flex items-center justify-center text-white', getTableStatusUI(table.status).color]">
                        <component :is="getTableStatusUI(table.status).icon" class="w-3 h-3 fill-current" />
                    </div>
                    
                    <!-- Edit/Delete Table Buttons -->
                    <div class="absolute -bottom-2 -right-2 flex space-x-1 z-10 opacity-0 group-hover/table:opacity-100 transition-all">
                        <button 
                            @click="handleEditTableClick(table)"
                            class="w-8 h-8 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                        >
                            <Pencil class="w-3 h-3" />
                        </button>
                        <button 
                            @click="deleteTable(table.id)"
                            class="w-8 h-8 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center text-slate-700 hover:text-red-500 hover:border-red-100 transition-all"
                        >
                            <Trash2 class="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <!-- Ghost Add Table -->
                <button @click="showAddTable = true; newTable.zoneId = zone.id" class="aspect-square border-4 border-dashed border-slate-100/50 rounded-[32px] flex flex-col items-center justify-center p-4 hover:border-indigo-200 hover:bg-white transition-all group/ghost shadow-inner">
                    <Plus class="w-8 h-8 text-slate-300 group-hover/ghost:text-indigo-400 group-hover/ghost:rotate-90 transition-all" />
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 opacity-0 group-hover/ghost:opacity-100 transition-opacity">เพิ่มโต๊ะ</span>
                </button>
            </div>
        </div>
        
        <!-- Empty State -->
        <div v-if="zones.length === 0" class="card border-dashed border-2 py-32 flex flex-col items-center justify-center text-slate-400">
             <Layers class="w-20 h-20 opacity-5 mb-6" />
             <p class="font-black uppercase tracking-widest text-sm italic opacity-40">ยังไม่มีการตั้งค่าโซนที่นั่ง</p>
             <button @click="showAddZone = true" class="mt-8 btn-primary">เริ่มต้นตั้งค่าระบบหุ่นยนต์และโต๊ะ</button>
        </div>
    </div>

    <!-- Modals -->
    <Teleport to="body">
        <!-- Add Zone Modal -->
        <div v-if="showAddZone" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500" @click="showAddZone = false"></div>
            <div class="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 p-12">
                <div class="flex items-center space-x-4 mb-10">
                    <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Layers class="w-6 h-6" />
                    </div>
                    <h3 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">กำหนดโซนใหม่</h3>
                </div>
                <div class="space-y-4">
                    <label class="block text-xs font-black uppercase tracking-widest text-slate-400">หมายเลข / ชื่อโซน</label>
                    <input v-model="newZone.name" class="input-field text-xl font-bold h-16" placeholder="เช่น โซนวีไอพี" />
                </div>
                <div class="mt-12 flex space-x-4">
                    <button @click="showAddZone = false" class="btn-secondary flex-1">ยกเลิก</button>
                    <button @click="createZone" class="btn-primary flex-1">ยืนยันโซน</button>
                </div>
            </div>
        </div>

        <!-- Add Table Modal -->
        <div v-if="showAddTable" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500" @click="showAddTable = false"></div>
            <div class="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 p-12">
                <div class="flex items-center space-x-4 mb-10">
                    <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <TableIcon class="w-6 h-6" />
                    </div>
                    <h3 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">เพิ่มหมายเลขโต๊ะ</h3>
                </div>
                <div class="space-y-6">
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">ระบุชื่อ / หมายเลขโต๊ะ</label>
                        <input v-model="newTable.number" class="input-field text-xl font-bold h-16" placeholder="เช่น A-42" />
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">โซนที่ตั้ง</label>
                        <select v-model="newTable.zoneId" class="input-field text-lg font-bold h-16 appearance-none">
                            <option value="">เลือกโซนที่ต้องการ...</option>
                            <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">จำนวนผู้มานั่ง</label>
                        <input v-model.number="newTable.seats" type="number" min="1" class="input-field text-xl font-bold h-16" placeholder="เช่น 4" />
                    </div>
                </div>
                <div class="mt-12 flex space-x-4">
                    <button @click="showAddTable = false" class="btn-secondary flex-1">ยกเลิก</button>
                    <button @click="createTable" class="btn-primary flex-1">ยืนยันโต๊ะ</button>
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
                
                <div class="bg-slate-50 rounded-[32px] p-8 mb-10 border border-slate-100 flex flex-col items-center">
                    <div v-if="selectedTableForQR?.sessions?.[0]" class="space-y-6">
                        <img 
                            :src="`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(frontendCustomerUrl + '/table/' + selectedTableForQR.sessions[0].id)}`" 
                            class="w-48 h-48 rounded-lg shadow-sm mx-auto"
                            alt="QR Code"
                        />
                        <div class="text-center">
                            <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 font-mono">Session ID</p>
                            <p class="text-[10px] font-bold text-indigo-600 break-all opacity-60">{{ selectedTableForQR.sessions[0].id }}</p>
                        </div>
                    </div>
                    <div v-else class="py-12 text-center space-y-4">
                        <div class="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
                            <QrCode class="w-10 h-10 opacity-20" />
                        </div>
                        <h4 class="text-lg font-black text-slate-800 italic uppercase">ยังไม่มีเซสชั่นเปิดอยู่</h4>
                        <p class="text-xs text-slate-400 font-bold max-w-[240px] mx-auto">คุณต้องทำการ "เปิดโต๊ะ" ในระบบ POS ก่อนเพื่อสร้างคิวอาร์โค้ดสำหรับสั่งอาหาร</p>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <a 
                        v-if="selectedTableForQR?.sessions?.[0]"
                        :href="`${frontendCustomerUrl}/table/${selectedTableForQR.sessions[0].id}`" 
                        target="_blank"
                        class="flex items-center justify-center w-full py-4 text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 rounded-2xl hover:bg-indigo-100 transition-all"
                    >
                        <ExternalLink class="w-4 h-4 mr-2" />
                        เปิดลิงก์สำหรับลูกค้า
                    </a>
                    <button 
                        v-if="selectedTableForQR?.sessions?.[0]"
                        @click="handlePrint" 
                        class="flex items-center justify-center w-full py-4 text-xs font-black uppercase tracking-widest text-white bg-slate-900 rounded-2xl hover:bg-black transition-all shadow-lg"
                    >
                        <Printer class="w-4 h-4 mr-2" />
                        ปริ้น QR Code
                    </button>
                    <button @click="showQRModal = false" class="w-full py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>

        <!-- Delete Zone Confirmation Modal -->
        <div v-if="showDeleteZoneConfirm" class="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-300" @click="showDeleteZoneConfirm = false"></div>
            <div class="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 p-10">
                <div class="flex flex-col items-center text-center">
                    <div class="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center text-red-500 mb-6 shadow-xl shadow-red-100/50">
                        <Trash2 class="w-8 h-8" />
                    </div>
                    
                    <h3 class="text-2xl font-black text-slate-800 tracking-tighter uppercase italic mb-2">ยืนยันการลบโซน</h3>
                    <p class="text-slate-500 font-bold text-sm leading-relaxed mb-8">
                        {{ deleteError || `คุณแน่ใจหรือไม่ว่าต้องการลบโซน "${zoneToDelete?.name}"? ประวัติและข้อมูลทั้งหมดในโซนนี้จะหายไป` }}
                    </p>

                    <div class="grid grid-cols-2 gap-4 w-full">
                        <button @click="showDeleteZoneConfirm = false" class="btn-secondary h-16 rounded-3xl font-black uppercase tracking-widest text-xs">ยกเลิก</button>
                        <button 
                            @click="confirmDeleteZone(!!deleteError)" 
                            :class="[deleteError ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-black']"
                            class="text-white h-16 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl transition-all"
                        >
                            {{ deleteError ? 'ยืนยันลบทั้งหมด' : 'ใช่, ลบเลย' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Table Modal -->
        <div v-if="showEditTable" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500" @click="showEditTable = false"></div>
            <div class="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 p-12">
                <div class="flex items-center space-x-4 mb-10">
                    <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Pencil class="w-6 h-6" />
                    </div>
                    <h3 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">แก้ไขข้อมูลโต๊ะ</h3>
                </div>
                <div class="space-y-6">
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">ชื่อ/หมายเลขโต๊ะ</label>
                        <input v-model="editingTable.number" class="input-field text-xl font-bold h-16" placeholder="เช่น A-42" />
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">จำนวนที่นั่ง</label>
                        <input v-model.number="editingTable.seats" type="number" min="1" class="input-field text-xl font-bold h-16" placeholder="เช่น 4" />
                    </div>
                </div>
                <div class="mt-12 flex space-x-4">
                    <button @click="showEditTable = false" class="btn-secondary flex-1">ยกเลิก</button>
                    <button @click="updateTable" class="btn-primary flex-1">บันทึกข้อมูล</button>
                </div>
            </div>
        </div>

        <!-- Edit Zone Modal -->
        <div v-if="showEditZone" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500" @click="showEditZone = false"></div>
            <div class="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 p-12">
                <div class="flex items-center space-x-4 mb-10">
                    <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Layers class="w-6 h-6" />
                    </div>
                    <h3 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">แก้ไขชื่อโซน</h3>
                </div>
                <div class="space-y-6">
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">ชื่อโซน</label>
                        <input v-model="editingZone.name" class="input-field text-xl font-bold h-16" placeholder="เช่น โซนวีไอพี" />
                    </div>
                </div>
                <div class="mt-12 flex space-x-4">
                    <button @click="showEditZone = false" class="btn-secondary flex-1">ยกเลิก</button>
                    <button @click="updateZone" class="btn-primary flex-1">บันทึกข้อมูล</button>
                </div>
            </div>
        </div>
        <!-- Open Table Modal -->
        <div v-if="showOpenTableModal && selectedTableToOpen" class="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-300" @click="showOpenTableModal = false"></div>
            <div class="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 p-12">
                <div class="flex items-center space-x-4 mb-10">
                    <div class="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                        <UserPlus class="w-6 h-6" />
                    </div>
                    <h3 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">เปิดโต๊ะ {{ selectedTableToOpen.number }}</h3>
                </div>
                
                <div class="space-y-6">
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">จำนวนลูกค้า (ท่าน)</label>
                        <div class="flex items-center space-x-4">
                            <button @click="openTableForm.customerCount > 1 ? openTableForm.customerCount-- : null" class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200">-</button>
                            <span class="text-2xl font-black text-slate-800 w-12 text-center">{{ openTableForm.customerCount }}</span>
                            <button @click="openTableForm.customerCount++" class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200">+</button>
                        </div>
                    </div>
                    
                    <div v-if="tiers.length > 0">
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">แพ็กเกจบุฟเฟต์</label>
                        <select v-model="openTableForm.tierId" class="input-field text-xl font-bold h-16 w-full appearance-none">
                            <option v-for="tier in tiers" :key="tier.id" :value="tier.id">{{ tier.name }} - ฿{{ tier.price }}</option>
                        </select>
                    </div>
                    <div v-else class="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 text-sm font-bold">
                        กรุณาสร้างแพ็กเกจบุฟเฟต์ในหน้า "จัดการเมนู" ก่อนเปิดโต๊ะครับ
                    </div>
                </div>

                <div class="mt-12 flex space-x-4">
                    <button @click="showOpenTableModal = false" class="btn-secondary flex-1">ยกเลิก</button>
                    <button 
                        @click="confirmOpenTable" 
                        :disabled="tiers.length === 0"
                        class="btn-primary flex-1 bg-emerald-600 shadow-emerald-100 disabled:opacity-50"
                    >
                        ยืนยันการเปิดโต๊ะ
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
  </div>
</template>

<style scoped>
@media print {
  body * { visibility: hidden !important; }
  .fixed.inset-0.z-\[100\], .fixed.inset-0.z-\[100\] * { visibility: visible !important; }
  .fixed.inset-0.z-\[100\] { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: white !important; }
  button { display: none !important; }
}
</style>

<style scoped>
</style>
