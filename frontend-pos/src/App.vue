<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Monitor, CreditCard, RotateCw, UserPlus, LogOut } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const tables = ref([
    { id: '1', number: 'A1', status: 'FREE', zone: 'Hall' },
    { id: '2', number: 'A2', status: 'OCCUPIED', zone: 'Hall', time: '45 min' },
    { id: '3', number: 'A3', status: 'CHECKING_BILL', zone: 'Hall' },
    { id: '4', number: 'A4', status: 'CLEANING', zone: 'Hall' },
    { id: '5', number: 'V1', status: 'FREE', zone: 'VIP' },
])

const getStatusColor = (status: string) => {
    switch (status) {
        case 'FREE': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        case 'OCCUPIED': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
        case 'CHECKING_BILL': return 'bg-amber-50 text-amber-700 border-amber-200'
        case 'CLEANING': return 'bg-slate-50 text-slate-500 border-slate-200'
        default: return 'bg-slate-50 text-slate-500'
    }
}

const getStatusLabel = (status: string) => status.replace('_', ' ')
</script>

<template>
    <div class="flex flex-col h-screen bg-slate-100 font-sans">
        <!-- Header -->
        <header class="bg-indigo-700 text-white p-4 shadow-lg flex justify-between items-center">
            <div class="flex items-center space-x-3">
                <Monitor class="w-6 h-6" />
                <h1 class="text-xl font-bold tracking-tight">{{ route.path.slice(1).toUpperCase() || 'POS' }}</h1>
            </div>
            <div class="flex items-center space-x-4">
                <button class="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
                    <RotateCw class="w-4 h-4" />
                    <span class="text-sm font-medium">Sync</span>
                </button>
                <div class="h-8 w-px bg-white/20"></div>
                <button class="text-white/80 hover:text-white transition-colors">
                    <LogOut class="w-6 h-6" />
                </button>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 flex overflow-hidden">
            <!-- Table Map -->
            <div class="flex-1 p-8 overflow-y-auto">
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h2 class="text-2xl font-bold text-slate-800">/ Table Overview</h2>
                        <p class="text-sm text-slate-500 mt-1">Live status of all dining zones</p>
                    </div>
                    <div class="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                        <button class="px-4 py-2 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-lg">All Zones</button>
                        <button class="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-lg">Hall</button>
                        <button class="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-lg">VIP</button>
                    </div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    <div 
                        v-for="table in tables" 
                        :key="table.id"
                        class="card group cursor-pointer hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 relative border-2"
                        :class="activeTable?.id === table.id ? 'border-indigo-500' : 'border-slate-100'"
                        @click="activeTable = table"
                    >
                        <div class="p-6">
                            <div class="flex justify-between items-start mb-4">
                                <span class="text-2xl font-black text-slate-400 group-hover:text-indigo-600 transition-colors">
                                    {{ table.number }}
                                </span>
                                <span :class="['text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border', getStatusColor(table.status)]">
                                    {{ getStatusLabel(table.status) }}
                                </span>
                            </div>
                            
                            <div v-if="table.status === 'OCCUPIED'" class="space-y-2">
                                <p class="text-xs font-medium text-slate-400">Elapsed Time</p>
                                <p class="text-lg font-bold text-indigo-700 font-mono">{{ table.time }}</p>
                            </div>
                            <div v-else class="h-10 flex items-center justify-center opacity-10">
                                <UserPlus class="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Side Sidebar / Table Detail -->
            <aside class="w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl">
                <div v-if="!activeTable" class="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                    <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Monitor class="w-10 h-10 opacity-20" />
                    </div>
                    <h3 class="text-lg font-bold text-slate-800 mb-2">Select a Table</h3>
                    <p class="text-sm">Tap on any table to view details or start a new session</p>
                </div>

                <div v-else class="flex-1 flex flex-col">
                    <!-- Table Header -->
                    <div class="p-8 border-bottom border-slate-100 bg-slate-50/50">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-3xl font-black text-slate-800">TABLE {{ activeTable.number }}</h3>
                            <button @click="activeTable = null" class="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <p class="text-sm font-medium text-slate-500">{{ activeTable.zone }} Zone</p>
                    </div>

                    <!-- Actions -->
                    <div class="flex-1 p-8 space-y-6">
                        <div v-if="activeTable.status === 'FREE'" class="space-y-4">
                            <button class="w-full btn-primary h-14 flex items-center justify-center space-x-3 text-lg">
                                <UserPlus class="w-6 h-6" />
                                <span>Open Table</span>
                            </button>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <p class="text-xs text-slate-400 mb-1">Adults</p>
                                    <input type="number" value="2" class="bg-transparent text-xl font-bold w-full outline-none" />
                                </div>
                                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <p class="text-xs text-slate-400 mb-1">Buffer Tier</p>
                                    <select class="bg-transparent text-sm font-bold w-full outline-none appearance-none">
                                        <option>Standard</option>
                                        <option>Premium</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div v-else-if="activeTable.status === 'OCCUPIED'" class="space-y-4">
                            <div class="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <div class="flex justify-between items-center mb-4">
                                    <span class="text-sm font-medium text-indigo-700">Order Summary</span>
                                    <span class="text-lg font-bold text-indigo-800">฿890.00</span>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-xs text-indigo-600/60">
                                        <span>2x Standard Buffet</span>
                                        <span>฿598</span>
                                    </div>
                                    <div class="flex justify-between text-xs text-indigo-600/60">
                                        <span>3x Water</span>
                                        <span>฿60</span>
                                    </div>
                                </div>
                            </div>
                            <button class="w-full btn-primary h-14 bg-amber-600 hover:bg-amber-700">
                                Order List
                            </button>
                            <button class="w-full btn-primary h-14 bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center space-x-3">
                                <CreditCard class="w-6 h-6" />
                                <span>Checkout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </main>
    </div>
</template>

<style scoped>
.font-sans {
  font-family: 'Inter', sans-serif;
}
</style>
