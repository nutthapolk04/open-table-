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
  Users
} from 'lucide-vue-next';
import api from '../api';

const zones = ref<any[]>([]);
const loading = ref(false);
const showAddZone = ref(false);
const showAddTable = ref(false);

const newZone = ref({ name: '' });
const newTable = ref({ number: '', zoneId: '', seats: 4 });

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
    if (!newTable.value.number || !newTable.value.zoneId) return;
    await api.post('/tables', newTable.value);
    showAddTable.value = false;
    newTable.value.number = '';
    newTable.value.seats = 4;
    fetchData();
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
          <h2 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Restaurant Floor Plan</h2>
          <p class="text-slate-500 font-bold text-sm tracking-wide mt-1 italic">Configure zones and physical table layout.</p>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <button @click="showAddZone = true" class="btn-secondary h-14 px-8 border-slate-200 flex items-center space-x-2">
            <Layers class="w-4 h-4" />
            <span>Create Zone</span>
        </button>
        <button @click="showAddTable = true" class="btn-primary h-14 px-8 flex items-center space-x-2">
            <Plus class="w-5 h-5" />
            <span>Add New Table</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-24 space-y-4 opacity-50">
        <Monitor class="w-12 h-12 animate-pulse text-indigo-600" />
        <span class="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Syncing with server...</span>
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
                        <span class="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-1 block px-2 py-0.5 bg-indigo-50 rounded-full w-fit">Active Dining Zone</span>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <div class="h-10 px-4 bg-slate-100 rounded-xl flex items-center text-xs font-bold text-slate-500">
                        {{ zone.tables?.length || 0 }} Table Units
                    </div>
                    <button class="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <Trash2 class="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 relative z-10">
                <div v-for="table in zone.tables" :key="table.id" class="relative group/table">
                    <div class="aspect-square bg-slate-50 border border-slate-200/40 rounded-[32px] flex flex-col items-center justify-center p-4 transition-all duration-300 group-hover/table:bg-indigo-600 group-hover/table:border-indigo-600 group-hover/table:shadow-xl group-hover/table:shadow-indigo-200 group-hover/table:-translate-y-2">
                        <TableIcon class="w-6 h-6 text-slate-400 mb-2 group-hover/table:text-indigo-100 transition-colors" />
                        <span class="text-xl font-black text-slate-800 group-hover/table:text-white transition-colors tracking-tighter italic uppercase">{{ table.number }}</span>
                        <div class="flex items-center space-x-1 mt-2 text-slate-400 group-hover/table:text-indigo-200">
                            <Users class="w-3 h-3" />
                            <span class="text-[10px] font-bold">{{ table.seats }}</span>
                        </div>
                    </div>
                    <!-- Tooltip Style Status -->
                    <div class="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full shadow-lg group-hover/table:scale-125 transition-transform z-10 flex items-center justify-center">
                        <Zap class="w-2 h-2 text-white fill-current" />
                    </div>
                </div>

                <!-- Ghost Add Table Inside Zone -->
                <button @click="showAddTable = true; newTable.zoneId = zone.id" class="aspect-square border-4 border-dashed border-slate-100/50 rounded-[32px] flex flex-col items-center justify-center p-4 hover:border-indigo-200 hover:bg-white transition-all group/ghost shadow-inner">
                    <Plus class="w-8 h-8 text-slate-300 group-hover/ghost:text-indigo-400 group-hover/ghost:rotate-90 transition-all" />
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 opacity-0 group-hover/ghost:opacity-100 transition-opacity">Add Unit</span>
                </button>
            </div>
        </div>
        
        <!-- Empty State -->
        <div v-if="zones.length === 0" class="card border-dashed border-2 py-32 flex flex-col items-center justify-center text-slate-400">
             <Layers class="w-20 h-20 opacity-5 mb-6" />
             <p class="font-black uppercase tracking-widest text-sm italic opacity-40">No Dining Zones Configured</p>
             <button @click="showAddZone = true" class="mt-8 btn-primary">Initial Hardware Setup</button>
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
                    <h3 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Define New Zone</h3>
                </div>
                <div class="space-y-4">
                    <label class="block text-xs font-black uppercase tracking-widest text-slate-400">Hardware ID / Zone Name</label>
                    <input v-model="newZone.name" class="input-field text-xl font-bold h-16" placeholder="e.g. VIP LOUNGE" />
                </div>
                <div class="mt-12 flex space-x-4">
                    <button @click="showAddZone = false" class="btn-secondary flex-1">Abort</button>
                    <button @click="createZone" class="btn-primary flex-1">Deploy Zone</button>
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
                    <h3 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Assign Desk Unit</h3>
                </div>
                <div class="space-y-6">
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Unit Identifier / Number</label>
                        <input v-model="newTable.number" class="input-field text-xl font-bold h-16" placeholder="e.g. A-42" />
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Target Zone</label>
                        <select v-model="newTable.zoneId" class="input-field text-lg font-bold h-16 appearance-none">
                            <option value="">Select Target Floor...</option>
                            <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Seating Capacity</label>
                        <input v-model.number="newTable.seats" type="number" min="1" class="input-field text-xl font-bold h-16" placeholder="e.g. 4" />
                    </div>
                </div>
                <div class="mt-12 flex space-x-4">
                    <button @click="showAddTable = false" class="btn-secondary flex-1">Cancel</button>
                    <button @click="createTable" class="btn-primary flex-1">Provision Table</button>
                </div>
            </div>
        </div>
    </Teleport>
  </div>
</template>

<style scoped>
</style>
