<script setup lang="ts">
import { ref } from 'vue';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Star,
  Activity
} from 'lucide-vue-next';

const stats = [
  { label: 'Daily Revenue', value: '฿124,500', trend: '+12.5%', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { label: 'Total Guests', value: '342', trend: '+8.2%', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { label: 'Avg. Session', value: '84 min', trend: '-2.1%', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  { label: 'Occupancy', value: '78%', trend: '+5.0%', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
];

</script>

<template>
  <div class="space-y-12 max-w-7xl mx-auto pb-24">
    <!-- Hero Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div v-for="stat in stats" :key="stat.label" class="card p-8 group hover:-translate-y-2 transition-all relative overflow-hidden bg-white shadow-sm border-slate-200">
        <div class="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-150 transition-all duration-700">
            <component :is="stat.icon" class="w-24 h-24" />
        </div>
        <div class="flex items-start justify-between mb-8">
          <div :class="['p-4 rounded-2xl', stat.bg]">
            <component :is="stat.icon" :class="['w-6 h-6', stat.color]" />
          </div>
          <div :class="['flex items-center text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg', stat.trend.startsWith('+') ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50']">
            <component :is="stat.trend.startsWith('+') ? ArrowUpRight : ArrowDownRight" class="w-3 h-3 mr-1" />
            {{ stat.trend }}
          </div>
        </div>
        <div class="space-y-1">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{{ stat.label }}</p>
          <div class="flex items-baseline space-x-1">
            <h3 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">{{ stat.value }}</h3>
            <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <!-- Top Peak Hours -->
        <div class="lg:col-span-2 card p-10 bg-slate-900 border-none shadow-2xl relative overflow-hidden">
             <div class="absolute top-0 right-0 p-10 opacity-20 transform translate-x-10 translate-y--10">
                 <Zap class="w-64 h-64 text-indigo-500 rotate-12" />
             </div>
             <div class="relative z-10">
                 <div class="flex items-center space-x-4 mb-10">
                     <div class="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                         <Star class="w-5 h-5 fill-current" />
                     </div>
                     <div>
                        <h4 class="text-2xl font-black text-white uppercase italic tracking-tighter">Peak Analytics</h4>
                        <p class="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Real-time Traffic Monitor</p>
                     </div>
                 </div>
                 
                 <div class="h-64 flex items-end space-x-4 py-6 border-b border-slate-800">
                      <div v-for="i in 12" :key="i" class="flex-1 bg-indigo-600/20 rounded-t-xl group relative cursor-pointer hover:bg-indigo-600 transition-all" :style="{ height: (20 + Math.random() * 80) + '%' }">
                           <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] px-2 py-1 rounded-md font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap lg:block hidden">
                                42 Guest Units
                           </div>
                      </div>
                 </div>
                 <div class="mt-8 flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest uppercase italic px-2">
                      <span>11:00 AM</span>
                      <span>03:00 PM</span>
                      <span>07:00 PM</span>
                      <span>11:00 PM</span>
                 </div>
             </div>
        </div>

        <div class="card p-10 bg-white border-slate-200">
             <h4 class="text-xl font-black text-slate-800 uppercase italic tracking-tighter mb-8 bg-indigo-50 p-4 rounded-2xl text-center border-l-4 border-indigo-600">Premium Trends</h4>
             <div class="space-y-6">
                 <div v-for="m in ['Wagyu A5', 'Pork Belly XL', 'Truffle Soup', 'Salmon Sashimi']" :key="m" class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all">
                      <div class="flex items-center">
                          <div class="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-lg mr-4">🍽️</div>
                          <div>
                              <p class="text-sm font-black text-slate-800 uppercase">{{ m }}</p>
                              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Popular Today</p>
                          </div>
                      </div>
                      <ChevronRight class="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                 </div>
             </div>
             
             <button class="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all active:scale-95">
                 View Full Report
             </button>
        </div>
    </div>
  </div>
</template>
