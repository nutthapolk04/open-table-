<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  Settings, 
  Layers, 
  Table as TableIcon, 
  Menu as MenuIcon, 
  Clock, 
  Trash2, 
  Plus, 
  ChevronRight,
  TrendingUp
} from 'lucide-vue-next';
import api from '../api';
import { usePosStore } from '../stores/pos';

const { t } = useI18n();
const store = usePosStore();
const activeTab = ref<'zones' | 'tiers' | 'menu'>('zones');

// Form States
const showAddModal = ref(false);
const loading = ref(false);

const fetchData = async () => {
    loading.value = true;
    try {
        await store.fetchInitialData();
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchData();
});

// Zone & Table Forms
const zoneName = ref('');
const addZone = async () => {
    if (!zoneName.value) {
        alert('กรุณาใส่ชื่อโซน');
        return;
    }
    try {
        console.log('Creating zone:', zoneName.value);
        const res = await api.post('/zones', { name: zoneName.value });
        console.log('Zone created:', res.data);
        zoneName.value = '';
        await fetchData();
    } catch (err: any) {
        console.error('Failed to create zone:', err);
        alert('ไม่สามารถสร้างโซนได้: ' + (err?.response?.data?.error || err.message));
    }
};

const tableName = ref('');
const tableZoneId = ref('');
const addTable = async () => {
    if (!tableName.value || !tableZoneId.value) {
        alert('กรุณาใส่หมายเลขโต๊ะและเลือกโซน');
        return;
    }
    try {
        console.log('Creating table:', tableName.value, 'in zone:', tableZoneId.value);
        const res = await api.post('/tables', { number: tableName.value, zoneId: tableZoneId.value });
        console.log('Table created:', res.data);
        tableName.value = '';
        await fetchData();
    } catch (err: any) {
        console.error('Failed to create table:', err);
        alert('ไม่สามารถสร้างโต๊ะได้: ' + (err?.response?.data?.error || err.message));
    }
};

// Tier Forms
const tierForm = ref({ name: '', price: 399, duration: 90 });
const addTier = async () => {
    await api.post('/tiers', tierForm.value);
    tierForm.value = { name: '', price: 399, duration: 90 };
    fetchData();
};

// Menu Forms
const menuForm = ref({ name: '', categoryId: '', price: 0, buffetTierIds: [] as string[] });
const addMenu = async () => {
    await api.post('/menus', menuForm.value);
    menuForm.value = { name: '', categoryId: '', price: 0, buffetTierIds: [] };
    fetchData();
};

const selectTab = (tab: any) => activeTab.value = tab;

</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden bg-slate-50 font-sans">
    <!-- Navbar -->
    <div class="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-20">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
          <Settings class="w-5 h-5 text-white" />
        </div>
        <h2 class="text-xl font-black text-slate-800 tracking-tight uppercase">System Settings</h2>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar Tabs -->
      <aside class="w-72 bg-white border-r border-slate-200 p-6 flex flex-col space-y-2 shrink-0">
        <button 
          @click="selectTab('zones')"
          :class="activeTab === 'zones' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'"
          class="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold text-sm tracking-wide"
        >
          <TableIcon class="w-5 h-5" />
          <span>Zones & Tables</span>
          <ChevronRight v-if="activeTab === 'zones'" class="ml-auto w-4 h-4" />
        </button>
        <button 
          @click="selectTab('tiers')"
          :class="activeTab === 'tiers' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'"
          class="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold text-sm tracking-wide"
        >
          <Clock class="w-5 h-5" />
          <span>Buffet Tiers</span>
          <ChevronRight v-if="activeTab === 'tiers'" class="ml-auto w-4 h-4" />
        </button>
        <button 
          @click="selectTab('menu')"
          :class="activeTab === 'menu' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'"
          class="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold text-sm tracking-wide"
        >
          <MenuIcon class="w-5 h-5" />
          <span>Menu & Categories</span>
          <ChevronRight v-if="activeTab === 'menu'" class="ml-auto w-4 h-4" />
        </button>
      </aside>

      <!-- Main Config Area -->
      <main class="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <!-- Zones & Tables Content -->
        <div v-if="activeTab === 'zones'" class="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <section>
            <div class="flex justify-between items-center mb-8">
              <div>
                <h3 class="text-2xl font-black text-slate-800 italic">Zones</h3>
                <p class="text-sm text-slate-500 mt-1 font-medium italic">Create and manage your dining floor zones.</p>
              </div>
            </div>
            <div class="flex flex-col space-y-4">
              <div class="flex space-x-3 bg-white p-4 rounded-2xl border border-slate-200">
                <input v-model="zoneName" placeholder="New Zone Name..." class="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700" />
                <button @click="addZone" class="bg-indigo-600 text-white h-14 px-8 rounded-xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center">
                  <Plus class="w-5 h-5 mr-2" />
                  <span>Create Zone</span>
                </button>
              </div>
            </div>
            <!-- Zones Table -->
            <div class="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="zone in store.zones" :key="zone.id" class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                 <div class="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg"><Trash2 class="w-4 h-4" /></button>
                 </div>
                 <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                       <Layers class="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h4 class="font-black text-slate-800 text-lg uppercase">{{ zone.name }}</h4>
                    </div>
                 </div>
              </div>
            </div>
          </section>

          <section>
            <div class="flex justify-between items-center mb-8">
              <div>
                <h3 class="text-2xl font-black text-slate-800 italic">Tables</h3>
                <p class="text-sm text-slate-500 mt-1 font-medium italic">Assign tables to your dining zones.</p>
              </div>
            </div>
            <div class="flex flex-col space-y-4">
              <div class="flex space-x-3 bg-white p-4 rounded-2xl border border-slate-200">
                <input v-model="tableName" placeholder="Table Number (e.g. A25)..." class="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700" />
                <select v-model="tableZoneId" class="w-64 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:bg-white font-bold text-slate-700">
                   <option value="" disabled>Select Zone</option>
                   <option v-for="z in store.zones" :key="z.id" :value="z.id">{{ z.name }}</option>
                </select>
                <button @click="addTable" class="bg-indigo-600 text-white h-14 px-8 rounded-xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center">
                  <Plus class="w-5 h-5 mr-2" />
                  <span>Add Table</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        <!-- Buffet Tiers Content -->
        <div v-if="activeTab === 'tiers'" class="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <section>
            <div class="flex justify-between items-center mb-8 border-b border-slate-200 pb-8">
              <div>
                <h3 class="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Buffet Tiers</h3>
                <p class="text-sm text-slate-500 mt-1 font-medium italic italic">Configure pricing packages and time limits.</p>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
               <div v-for="tier in store.tiers" :key="tier.id" class="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl relative overflow-hidden group">
                  <div class="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-3 text-slate-400 hover:text-red-500 bg-slate-50 rounded-2xl"><Trash2 class="w-5 h-5" /></button>
                 </div>
                 <h4 class="text-2xl font-black text-slate-800 uppercase">{{ tier.name }}</h4>
                 <div class="mt-6 flex items-baseline">
                    <span class="text-4xl font-black text-indigo-600">฿{{ tier.price }}</span>
                    <span class="text-slate-400 font-bold ml-2 text-sm italic">per pax</span>
                 </div>
                 <div class="mt-8 flex items-center space-x-6">
                    <div class="flex items-center text-slate-600 font-bold text-sm">
                       <Clock class="w-4 h-4 mr-2 opacity-50" />
                       {{ tier.timeLimit }} min
                    </div>
                 </div>
               </div>
               
               <div class="bg-slate-100/50 border-4 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center p-12 hover:bg-slate-100/80 transition-all cursor-pointer group active:scale-95 shadow-inner">
                  <div class="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg mb-4 transform group-hover:rotate-12 transition-transform">
                     <Plus class="w-8 h-8 text-indigo-600" />
                  </div>
                  <span class="font-black text-slate-400 uppercase tracking-widest text-xs">Create New Tier</span>
               </div>
            </div>
          </section>
        </div>

        <div v-if="activeTab === 'menu'" class="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 class="text-4xl font-black text-slate-800 opacity-20 uppercase tracking-[0.2em] py-24 text-center">Menu Editor Under Construction</h2>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
