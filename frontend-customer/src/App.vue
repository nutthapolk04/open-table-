<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ShoppingCart, Clock, UtensilsCrossed, Bell, ChevronRight } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const categories = ref(['All', 'Meats', 'Vegetables', 'Drinks', 'Appetizers'])
const activeCategory = ref('All')

const menuItems = ref([
    { id: '1', name: 'Wagyu Beef A5', category: 'Meats', price: 'Premium', image: '🥩' },
    { id: '2', name: 'Pork Belly', category: 'Meats', price: 'Standard', image: '🥓' },
    { id: '3', name: 'Organic Bok Choy', category: 'Vegetables', price: 'Standard', image: '🥬' },
    { id: '4', name: 'Premium Salmon', category: 'Meats', price: 'Premium', image: '🐟' },
])

const cartCount = ref(0)
const timeLeft = ref('01:24:45')
</script>

<template>
    <div class="min-h-screen bg-slate-50 font-sans pb-32">
        <!-- Sticky Header -->
        <header class="sticky top-0 z-50 glass px-6 py-4 flex justify-between items-center shadow-sm">
            <div>
                <h1 class="text-xl font-black text-slate-800 tracking-tight">{{ route.path.slice(1).toUpperCase() || 'TABLE' }}</h1>
                <div class="flex items-center space-x-2 text-indigo-600">
                    <Clock class="w-3 h-3" />
                    <span class="text-[10px] font-bold uppercase tracking-widest">{{ timeLeft }}</span>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <button class="p-2 bg-white rounded-full border border-slate-200 shadow-sm text-slate-600">
                    <Bell class="w-5 h-5" />
                </button>
                <div class="h-8 w-px bg-slate-200"></div>
                <div class="flex flex-col items-end">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Tier</span>
                    <span class="text-sm font-black text-indigo-600">PREMIUM</span>
                </div>
            </div>
        </header>

        <!-- Category Scroll -->
        <div class="px-6 py-6 overflow-x-auto whitespace-nowrap scrollbar-hide flex space-x-4">
            <button 
                v-for="cat in categories" 
                :key="cat"
                @click="activeCategory = cat"
                class="px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 border-2"
                :class="activeCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 scale-105' : 'bg-white text-slate-400 border-transparent'"
            >
                {{ cat }}
            </button>
        </div>

        <!-- Menu Section -->
        <div class="px-6 space-y-8">
            <h2 class="text-2xl font-black text-slate-800">/ Hot Pot Selection</h2>
            <div class="grid grid-cols-2 gap-4">
                <div 
                    v-for="item in menuItems" 
                    :key="item.id"
                    class="card group relative"
                >
                    <div class="aspect-square bg-slate-50 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-500">
                        {{ item.image }}
                    </div>
                    <div class="p-4">
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="font-bold text-slate-800 text-sm leading-tight">{{ item.name }}</h3>
                        </div>
                        <p class="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">{{ item.price }}</p>
                        
                        <button 
                            @click="cartCount++"
                            class="mt-4 w-full py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-colors"
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Floating Cart Bar -->
        <div class="fixed bottom-6 left-6 right-6 z-50">
            <button class="w-full bg-slate-900 text-white p-2 rounded-3xl shadow-2xl flex items-center justify-between group overflow-hidden relative">
                <div class="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                
                <div class="relative z-10 flex items-center space-x-4 pl-4">
                    <div class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <ShoppingCart class="w-6 h-6" />
                    </div>
                    <div class="text-left">
                        <p class="text-[10px] font-bold text-white/50 uppercase tracking-widest">Your Order</p>
                        <p class="text-sm font-black">{{ cartCount }} Items Added</p>
                    </div>
                </div>

                <div class="relative z-10 flex items-center space-x-2 pr-4">
                    <span class="text-xs font-bold uppercase tracking-widest">View Cart</span>
                    <ChevronRight class="w-5 h-5 animate-pulse" />
                </div>
            </button>
        </div>

        <!-- Service Menu -->
        <div class="px-6 mt-12 mb-8">
            <div class="grid grid-cols-2 gap-4">
                <div class="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                    <UtensilsCrossed class="w-8 h-8 text-emerald-600 mb-2" />
                    <p class="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-none">Order Details</p>
                </div>
                <div class="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col items-center justify-center text-center">
                    <Bell class="w-8 h-8 text-amber-600 mb-2" />
                    <p class="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-none">Call Staff</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
