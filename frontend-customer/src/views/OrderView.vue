<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ShoppingCart, Clock, UtensilsCrossed, Bell, ChevronRight, Loader2, Languages, CheckCircle2, Minus, Plus, Trash2 } from 'lucide-vue-next'
import { useCustomerStore } from '../stores/customer'

const route = useRoute()
const store = useCustomerStore()
const { t, locale } = useI18n()

const activeCategory = ref('All')
const showHistory = ref(false)
const showCart = ref(false)
const showNotification = ref({ show: false, message: '', type: 'success' })

const toggleLocale = () => {
    locale.value = locale.value === 'en' ? 'th' : 'en'
}

const notify = (message: string, type: 'success' | 'amber' = 'success') => {
    showNotification.value = { show: true, message, type }
    setTimeout(() => { showNotification.value.show = false }, 3000)
}

const reload = () => window.location.reload()

const callStaff = () => {
    notify(t('customerApp.staffNotified'), 'amber')
    if (store.socket) {
        store.socket.emit('call-staff', { sessionId: store.session.id, tableNumber: store.session.table.number })
    }
}

watch(
  () => route.params.sessionId,
  (newId) => {
    if (newId) {
      store.fetchSessionData(newId as string)
    }
  },
  { immediate: true }
)

const filteredMenu = computed(() => {
    if (activeCategory.value === 'All') return store.menuItems
    return store.menuItems.filter(item => item.category.name === activeCategory.value)
})

const handleOrder = async () => {
    if (store.cart.length === 0) return
    const success = await store.placeOrder()
    if (success) {
        showCart.value = false
        notify(t('customerApp.orderSuccess'), 'success')
    }
}

</script>

<template>
    <div class="min-h-screen bg-slate-50 font-sans pb-32">
        <div v-if="store.loading" class="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <Loader2 class="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p class="text-slate-600 font-bold">{{ t('customerApp.loading') }}</p>
        </div>

        <div v-else-if="store.error" class="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div class="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-red-50">
                <Bell class="w-12 h-12" />
            </div>
            <h2 class="text-3xl font-black text-slate-800 mb-3 tracking-tight">{{ t('customerApp.error') }}</h2>
            <p class="text-slate-500 mb-8 max-w-xs leading-relaxed">{{ store.error }}</p>
            <button @click="reload" class="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-2xl active:scale-95 transition-all w-full max-w-xs uppercase tracking-widest text-sm">Retry Connection</button>
        </div>

        <template v-else-if="store.session">
            <!-- Sticky Header -->
            <header class="sticky top-0 z-50 glass px-6 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h1 class="text-xl font-black text-slate-800 tracking-tight">{{ t('customerApp.table') }} {{ store.session.table?.number }}</h1>
                    <div class="flex items-center space-x-2 text-indigo-600">
                        <Clock class="w-3 h-3" />
                        <span class="text-[10px] font-bold uppercase tracking-widest">{{ store.timeLeft }}</span>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <button @click="toggleLocale" class="p-2 bg-indigo-50 rounded-full border border-indigo-100 shadow-sm text-indigo-600 transition-transform active:scale-95">
                        <Languages class="w-5 h-5" />
                    </button>
                    <div class="h-8 w-px bg-slate-200"></div>
                    <div class="flex flex-col items-end">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{{ t('customerApp.tier') }}</span>
                        <span class="text-sm font-black text-indigo-600 uppercase">{{ store.session.tier?.name || 'Standard' }}</span>
                    </div>
                </div>
            </header>

            <!-- Category Scroll -->
            <div class="px-6 py-6 overflow-x-auto whitespace-nowrap scrollbar-hide flex space-x-3 snap-x">
                <button 
                    v-for="cat in store.categories" 
                    :key="cat"
                    @click="activeCategory = cat"
                    class="px-6 py-3 rounded-2xl text-sm font-black transition-all duration-300 border-2 snap-center"
                    :class="activeCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-[0_10px_20px_-10px_rgba(79,70,229,0.5)] scale-105' : 'bg-white text-slate-400 border-slate-100 uppercase tracking-widest text-xs hover:border-slate-200'"
                >
                    {{ cat === 'All' ? t('customerApp.all') : cat }}
                </button>
            </div>

            <!-- Menu Section -->
            <div class="px-6 space-y-8">
                <h2 class="text-2xl font-black text-slate-800">/ {{ t('customerApp.hotPotSelection') }}</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div 
                        v-for="item in filteredMenu" 
                        :key="item.id"
                        class="card group relative overflow-hidden"
                    >
                        <div 
                            class="aspect-square bg-slate-50 flex items-center justify-center text-5xl transition-transform duration-500"
                            :class="item.status === 'SOLD_OUT' ? 'grayscale opacity-40' : 'group-hover:scale-110'"
                        >
                            {{ item.image || '🍽️' }}
                        </div>

                        <!-- Sold Out Overlay Tag -->
                        <div v-if="item.status === 'SOLD_OUT'" class="absolute inset-x-0 top-1/3 flex justify-center pointer-events-none z-10">
                            <div class="bg-red-600 text-white font-black text-xs px-4 py-1 rounded-full uppercase tracking-widest shadow-xl -rotate-6 border border-red-500/20">
                                {{ t('customerApp.soldOut') }}
                            </div>
                        </div>

                        <div class="p-4 relative z-20">
                            <div class="flex justify-between items-start mb-1">
                                <h3 class="font-bold text-slate-800 text-sm leading-tight" :class="{'opacity-50 line-through': item.status === 'SOLD_OUT'}">{{ item.name }}</h3>
                            </div>
                            <p class="text-[10px] font-bold uppercase tracking-tighter" :class="item.status === 'SOLD_OUT' ? 'text-slate-400' : 'text-indigo-500'">Included</p>
                            
                            <!-- Quantity controls or Add button -->
                            <div v-if="item.status !== 'SOLD_OUT'" class="mt-4">
                                <div v-if="store.cart.find(i => i.id === item.id)" class="flex items-center justify-between bg-indigo-50 rounded-xl p-1">
                                    <button @click="store.decreaseQty(item.id)" class="w-8 h-8 flex items-center justify-center bg-white text-indigo-600 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                                        <Minus class="w-4 h-4" />
                                    </button>
                                    <span class="font-black text-indigo-700 w-8 text-center">{{ store.cart.find(i => i.id === item.id)?.qty }}</span>
                                    <button @click="store.increaseQty(item.id)" class="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
                                        <Plus class="w-4 h-4" />
                                    </button>
                                </div>
                                <button 
                                    v-else
                                    @click="store.addToCart(item)"
                                    class="w-full py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-colors active:scale-95 shadow-lg shadow-slate-900/20"
                                >
                                    {{ t('customerApp.addToCart') || 'ADD' }}
                                </button>
                            </div>
                            <div v-else class="mt-4 w-full py-2 bg-slate-100 text-slate-400 text-center text-[10px] font-bold uppercase tracking-widest rounded-xl cursor-not-allowed">
                                {{ t('customerApp.outOfStock') }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Floating Cart Bar -->
            <div class="fixed bottom-6 left-6 right-6 z-40 transition-transform duration-500" :class="showCart ? 'translate-y-40' : 'translate-y-0'">
                <button v-if="store.cart.length > 0" @click="showCart = true" class="w-full bg-slate-900 text-white p-2 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] flex items-center justify-between group overflow-hidden relative active:scale-95 transition-all">
                    <div class="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    
                    <div class="relative z-10 flex items-center space-x-4 pl-4">
                        <div class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <div class="relative">
                                <ShoppingCart class="w-6 h-6" />
                                <div class="absolute -top-2 -right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg border-2 border-slate-900">
                                    {{ store.cart.reduce((sum, item) => sum + item.qty, 0) }}
                                </div>
                            </div>
                        </div>
                        <div class="text-left">
                            <p class="text-[10px] font-bold text-white/60 uppercase tracking-widest">{{ t('customerApp.yourOrder') }}</p>
                            <p class="text-sm font-black">{{ store.cart.length }} {{ t('customerApp.itemsAdded') }}</p>
                        </div>
                    </div>

                    <div class="relative z-10 flex items-center space-x-2 pr-4 bg-white/10 py-3 px-4 rounded-2xl">
                        <span class="text-xs font-black uppercase tracking-widest">{{ t('customerApp.reviewOrder') }}</span>
                        <ChevronRight class="w-4 h-4" />
                    </div>
                </button>
            </div>

            <!-- Service Menu -->
            <div class="px-6 mt-12 mb-8">
                <div class="grid grid-cols-2 gap-4">
                    <button 
                        @click="showHistory = true"
                        class="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col items-center justify-center text-center transition-transform active:scale-95 shadow-sm"
                    >
                        <UtensilsCrossed class="w-8 h-8 text-emerald-600 mb-2" />
                        <p class="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-none">{{ t('customerApp.orderDetails') }}</p>
                    </button>
                    <button 
                        @click="callStaff"
                        class="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col items-center justify-center text-center transition-transform active:scale-95 shadow-sm"
                    >
                        <Bell class="w-8 h-8 text-amber-600 mb-2" />
                        <p class="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-none">{{ t('customerApp.callStaff') }}</p>
                    </button>
                </div>
            </div>

            <!-- Cart Review Modal -->
            <Transition enter-active-class="duration-300 ease-out" enter-from-class="translate-y-full opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="duration-200 ease-in" leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-full opacity-0">
                <div v-if="showCart" class="fixed inset-0 z-[100] flex flex-col justify-end">
                    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="showCart = false"></div>
                    <div class="relative bg-white w-full rounded-t-[40px] shadow-2xl flex flex-col max-h-[90vh]">
                        <!-- Drag Handle -->
                        <div class="w-full flex justify-center pt-4 pb-2" @click="showCart = false">
                            <div class="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                        </div>
                        
                        <!-- Header -->
                        <div class="px-8 pb-4 border-b border-slate-100 flex justify-between items-end">
                            <div>
                                <h3 class="text-2xl font-black text-slate-800 tracking-tight">{{ t('customerApp.reviewOrder') }}</h3>
                                <p class="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">{{ store.cart.reduce((sum, item) => sum + item.qty, 0) }} {{ t('customerApp.totalItems') }}</p>
                            </div>
                            <button @click="showCart = false" class="text-slate-400 font-bold bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center active:bg-slate-200">×</button>
                        </div>
                        
                        <!-- Items List -->
                        <div class="flex-1 overflow-y-auto p-6 hidden-scrollbar space-y-4">
                            <div v-for="item in store.cart" :key="item.id" class="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">{{ item.image }}</div>
                                <div class="flex-1">
                                    <h4 class="font-bold text-slate-800 text-sm leading-tight mb-2">{{ item.name }}</h4>
                                    <!-- Quantity Controls -->
                                    <div class="flex items-center space-x-3 bg-white w-fit rounded-xl border border-slate-200 p-1">
                                        <button @click="store.decreaseQty(item.id)" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors">
                                            <Minus v-if="item.qty > 1" class="w-4 h-4" />
                                            <Trash2 v-else class="w-4 h-4 text-red-500" />
                                        </button>
                                        <span class="w-6 text-center font-black text-slate-800">{{ item.qty }}</span>
                                        <button @click="store.increaseQty(item.id)" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors">
                                            <Plus class="w-4 h-4 text-indigo-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="p-6 bg-white border-t border-slate-100 pb-safe">
                            <button 
                                @click="handleOrder"
                                :disabled="store.cart.length === 0"
                                class="w-full py-4 bg-indigo-600 disabled:bg-slate-300 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center active:scale-[0.98] transition-all"
                            >
                                <span class="mr-2">{{ t('customerApp.sendOrderToKitchen') }}</span>
                                <CheckCircle2 class="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>


            <!-- Order History Modal -->
            <div v-if="showHistory" class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center">
                <div class="bg-white w-full max-w-lg rounded-t-[40px] p-8 max-h-[80vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-8">
                        <h3 class="text-2xl font-black text-slate-800">{{ t('customerApp.orderDetails') }}</h3>
                        <button @click="showHistory = false" class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold">×</button>
                    </div>

                    <div v-if="store.session.orders?.length > 0" class="space-y-4">
                        <div v-for="order in store.session.orders" :key="order.id" class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <div class="flex justify-between items-start">
                                <div>
                                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{{ new Date(order.createdAt).toLocaleTimeString() }}</p>
                                    <div v-for="item in order.items" :key="item.id" class="text-slate-800 font-bold">
                                        {{ item.quantity }}x {{ item.menu.name }}
                                    </div>
                                </div>
                                <span class="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black uppercase">{{ order.status }}</span>
                             </div>
                        </div>
                    </div>
                    <div v-else class="py-12 text-center text-slate-400 italic">
                        No orders yet.
                    </div>
                </div>
            </div>
        </template>
        
        <div v-else class="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div class="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-amber-50">
                <UtensilsCrossed class="w-12 h-12" />
            </div>
            <h2 class="text-3xl font-black text-slate-800 mb-3 tracking-tight">{{ t('customerApp.invalidSession') }}</h2>
            <p class="text-slate-500 mb-8 max-w-xs leading-relaxed">{{ t('customerApp.pleaseScanQR') }}</p>
            <button @click="reload" class="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-2xl active:scale-95 transition-all w-full max-w-xs uppercase tracking-widest text-sm">Rescan QR Code</button>
        </div>

        <!-- Global Notification -->
        <Transition enter-active-class="translate-y-20 opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="translate-y-0 opacity-100" leave-to-class="translate-y-20 opacity-0">
            <div v-if="showNotification.show" class="fixed bottom-32 left-6 right-6 z-[200] flex justify-center pointer-events-none transition-all duration-500">
                <div 
                    class="px-6 py-4 rounded-3xl shadow-2xl flex items-center space-x-3 backdrop-blur-md"
                    :class="showNotification.type === 'success' ? 'bg-indigo-600/90 text-white' : 'bg-amber-600/90 text-white'"
                >
                    <CheckCircle2 v-if="showNotification.type === 'success'" class="w-5 h-5" />
                    <Bell v-else class="w-5 h-5" />
                    <span class="font-bold text-sm">{{ showNotification.message }}</span>
                </div>
            </div>
        </Transition>
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
