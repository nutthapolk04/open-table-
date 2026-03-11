<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ShoppingCart, Clock, UtensilsCrossed, Bell, ChevronRight, Loader2, Languages, CheckCircle2, Minus, Plus, Trash2, Search, X, Info, ArrowLeft } from 'lucide-vue-next'
import { useCustomerStore } from '../stores/customer'

const route = useRoute()
const store = useCustomerStore()
const { t, locale } = useI18n()

const activeCategory = ref('All')
const searchQuery = ref('')
const selectedItem = ref<any>(null)
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
    let items = store.menuItems
    if (activeCategory.value !== 'All') {
        items = items.filter(item => item.category.name === activeCategory.value)
    }
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        items = items.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(query) || (item.nameTh && item.nameTh.toLowerCase().includes(query))
            const descMatch = (item.description && item.description.toLowerCase().includes(query)) || (item.descriptionTh && item.descriptionTh.toLowerCase().includes(query))
            return nameMatch || descMatch
        })
    }
    return items
})

const handleOrder = async () => {
    if (store.cart.length === 0) return
    const success = await store.placeOrder()
    if (success) {
        showCart.value = false
        notify(t('customerApp.orderSuccess'), 'success')
    }
}

const openItemDetails = (item: any) => {
    selectedItem.value = item
}

</script>

<template>
    <div class="min-h-screen bg-[#F8FAFC] font-sans pb-32">
        <!-- Premium Loading State -->
        <div v-if="store.loading" class="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center">
            <div class="relative w-24 h-24 mb-6">
                <div class="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <div class="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                    <UtensilsCrossed class="w-8 h-8 text-slate-800" />
                </div>
            </div>
            <p class="text-slate-900 font-serif text-xl italic tracking-wide animate-pulse">{{ t('customerApp.loading') }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="store.error" class="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center">
            <div class="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-red-50">
                <Bell class="w-12 h-12" />
            </div>
            <h2 class="text-3xl font-serif text-slate-800 mb-3 tracking-tight">{{ t('customerApp.error') }}</h2>
            <p class="text-slate-500 mb-8 max-w-xs leading-relaxed font-sans">{{ store.error }}</p>
            <button @click="reload" class="px-10 py-5 navy-gradient text-white rounded-[2rem] font-bold shadow-2xl active:scale-95 transition-all w-full max-w-xs uppercase tracking-widest text-xs">Retry Connection</button>
        </div>

        <template v-else-if="store.session">
            <!-- Premium Header -->
            <header class="sticky top-0 z-50 glass px-6 py-6 pb-8">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 mb-1 opacity-80">{{ store.session.tier?.name || 'Standard' }} Experience</p>
                        <h1 class="text-3xl font-serif text-slate-900 italic leading-none">Table {{ store.session.table?.number }}</h1>
                    </div>
                    <div class="flex items-center space-x-3">
                        <button @click="toggleLocale" class="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-lg shadow-slate-200/50 border border-slate-100 text-slate-800 transition-transform active:scale-95">
                            <Languages class="w-5 h-5" />
                        </button>
                        <div class="bg-white/90 backdrop-blur-md px-4 py-3 rounded-full flex items-center space-x-2 shadow-sm border border-slate-100">
                            <Clock class="w-4 h-4 text-amber-500" />
                            <span class="text-xs font-black text-slate-900 tracking-widest">{{ store.timeLeft }}</span>
                        </div>
                    </div>
                </div>

                <!-- Search Bar -->
                <div class="relative group">
                    <Search class="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    <input 
                        v-model="searchQuery"
                        type="text" 
                        placeholder="Search our selection..." 
                        class="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-[1.2rem] text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:bg-white transition-all font-medium"
                    >
                </div>
            </header>

            <!-- Category Section -->
            <div class="px-6 py-8 overflow-x-auto whitespace-nowrap hidden-scrollbar flex space-x-4 snap-x relative">
                <button 
                    v-for="cat in store.categories" 
                    :key="cat"
                    @click="activeCategory = cat"
                    class="px-8 py-4 rounded-[1.5rem] text-xs font-black transition-all duration-500 border-2 snap-center relative overflow-hidden group uppercase tracking-widest"
                    :class="activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-2xl shadow-slate-900/30 scale-105' : 'bg-white text-slate-900 border-slate-100 hover:border-slate-200'"
                >
                    {{ cat === 'All' ? t('customerApp.allSelection') : t(`customerApp.${cat.toLowerCase()}`) }}
                </button>
            </div>

            <!-- Menu Grid -->
            <div class="px-6 space-y-10 mb-12">
                <div class="flex items-center justify-between">
                    <h2 class="text-2xl font-serif italic text-slate-900 leading-none capitalize">{{ activeCategory === 'All' ? t('customerApp.hotPotSelection') : t(`customerApp.${activeCategory.toLowerCase()}`) }}</h2>
                    <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">{{ filteredMenu.length }} Items</span>
                </div>

                <div class="grid grid-cols-2 gap-6">
                    <div 
                        v-for="item in filteredMenu" 
                        :key="item.id"
                        class="card group relative"
                        @click="openItemDetails(item)"
                    >
                        <div class="relative aspect-[16/10] overflow-hidden">
                            <img 
                                :src="item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'" 
                                :alt="locale === 'th' ? (item.nameTh || item.name) : item.name"
                                class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            >
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <!-- Sold Out Overlay -->
                            <div v-if="item.status === 'SOLD_OUT'" class="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4">
                                <div class="px-6 py-2 border-2 border-white/30 rounded-full text-white font-black text-[10px] uppercase tracking-[0.2em] backdrop-blur-md">
                                    {{ t('customerApp.soldOut') }}
                                </div>
                            </div>
                        </div>

                        <div class="p-5">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-serif text-xl text-slate-900 italic tracking-tight" :class="{'opacity-50 line-through': item.status === 'SOLD_OUT'}">
                                    {{ locale === 'th' ? (item.nameTh || item.name) : item.name }}
                                </h3>
                            </div>
                            <p class="text-slate-600 text-[10px] leading-relaxed line-clamp-2 mb-4 font-medium tracking-wide">
                                {{ locale === 'th' ? (item.descriptionTh || item.description) : item.description || 'Delicately prepared seasonal ingredient, served fresh.' }}
                            </p>
                            
                            <div class="pt-4 border-t border-slate-50 space-y-4">
                                <div class="flex items-center space-x-1 text-amber-600">
                                    <UtensilsCrossed class="w-3 h-3" />
                                    <span class="text-[11px] font-black uppercase tracking-widest">Included</span>
                                </div>

                                <!-- Premium Controls -->
                                <div v-if="item.status !== 'SOLD_OUT'" @click.stop>
                                    <div v-if="store.cart.find(i => i.id === item.id)" class="flex items-center justify-between bg-slate-50 rounded-full p-1.5 border border-slate-100">
                                        <button @click="store.decreaseQty(item.id)" class="w-10 h-10 flex items-center justify-center bg-white text-slate-900 rounded-full shadow-sm hover:text-amber-500 transition-colors">
                                            <Minus class="w-4 h-4 stroke-[3]" />
                                        </button>
                                        <span class="font-black text-slate-900 text-sm">{{ store.cart.find(i => i.id === item.id)?.qty }}</span>
                                        <button @click="store.increaseQty(item.id)" class="w-10 h-10 flex items-center justify-center bg-slate-900 text-white rounded-full shadow-lg">
                                            <Plus class="w-4 h-4 stroke-[3]" />
                                        </button>
                                    </div>
                                    <button 
                                        v-else
                                        @click="store.addToCart(item)"
                                        class="w-full py-3.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-slate-800 transition-all duration-500 shadow-xl"
                                    >
                                        {{ t('customerApp.addToCart') }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Floating Action Button -->
            <div class="px-6 mb-12">
                <button 
                    @click="showHistory = true"
                    class="w-full p-6 bg-white rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-center transition-all active:scale-95 shadow-[0_15px_35px_rgba(0,0,0,0.05)] hover:shadow-xl group"
                >
                    <UtensilsCrossed class="w-8 h-8 text-slate-400 mb-3 group-hover:text-slate-800 transition-colors" />
                    <p class="text-[10px] font-black text-slate-400 group-hover:text-slate-800 uppercase tracking-widest transition-colors">{{ t('customerApp.orderDetails') }}</p>
                </button>
            </div>

            <!-- Premium Floating Cart Bar -->
            <div class="fixed bottom-8 left-6 right-6 z-40 transition-all duration-500" :class="showCart ? 'translate-y-40 opacity-0' : 'translate-y-0 opacity-100'">
                <button v-if="store.cart.length > 0" @click="showCart = true" class="w-full bg-slate-50 p-2 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.15)] flex items-center justify-between group relative active:scale-95 transition-all overflow-hidden border border-slate-100">
                    <div class="relative z-10 flex items-center space-x-4 pl-4">
                        <div class="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center shadow-lg">
                            <div class="relative">
                                <ShoppingCart class="w-6 h-6 text-white" />
                                <div class="absolute -top-3 -right-3 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg ring-4 ring-white">
                                    {{ store.cart.reduce((sum, item) => sum + item.qty, 0) }}
                                </div>
                            </div>
                        </div>
                        <div class="text-left">
                            <p class="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">{{ t('customerApp.yourSelection') }}</p>
                            <p class="text-sm font-serif italic text-slate-900">{{ store.cart.length }} Items Added</p>
                        </div>
                    </div>

                    <div class="relative z-10 flex items-center space-x-3 pr-6 bg-slate-900 py-4 px-6 rounded-full transition-colors duration-500 shadow-lg">
                        <span class="text-[11px] font-black uppercase tracking-widest text-white">{{ t('customerApp.reviewOrder') }}</span>
                        <ChevronRight class="w-4 h-4 text-white" />
                    </div>
                </button>
            </div>

            <!-- Item Details Modal -->
            <Transition enter-active-class="duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
                <div v-if="selectedItem" class="fixed inset-0 z-[150] flex items-center justify-center p-6">
                    <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-md" @click="selectedItem = null"></div>
                    <div class="relative bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <button @click="selectedItem = null" class="absolute top-6 right-6 z-10 w-10 h-10 bg-black/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors">
                            <X class="w-5 h-5" />
                        </button>
                        
                        <div class="aspect-[16/10] w-full overflow-hidden">
                            <img :src="selectedItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'" class="w-full h-full object-cover">
                        </div>
                        
                        <div class="p-10 text-slate-900">
                            <div class="flex items-center space-x-2 text-amber-600 mb-4">
                                <span class="text-[11px] font-black uppercase tracking-[0.3em]">{{ selectedItem.category.name }}</span>
                                <div class="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                                <span class="text-[11px] font-black uppercase tracking-[0.3em]">{{ t('customerApp.signature') }}</span>
                            </div>
                            <h3 class="text-4xl font-serif italic mb-6">
                                {{ locale === 'th' ? (selectedItem.nameTh || selectedItem.name) : selectedItem.name }}
                            </h3>
                            <p class="text-slate-600 leading-relaxed font-medium mb-10 text-lg tracking-wide">
                                {{ locale === 'th' ? (selectedItem.descriptionTh || selectedItem.description) : selectedItem.description || 'A masterpiece of culinary art, meticulously prepared with the finest seasonal ingredients.' }}
                            </p>
                            
                            <div class="flex items-center justify-between pt-8 border-t border-slate-100">
                                <div>
                                    <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ t('customerApp.status') }}</p>
                                    <p class="text-base font-black text-emerald-600 uppercase tracking-widest">{{ t('customerApp.available') }}</p>
                                </div>
                                <button 
                                    v-if="selectedItem.status !== 'SOLD_OUT'"
                                    @click="store.addToCart(selectedItem); selectedItem = null"
                                    class="px-10 py-5 bg-slate-900 text-white text-[12px] font-black uppercase tracking-widest rounded-full shadow-2xl shadow-slate-900/30 active:scale-95 transition-all"
                                >
                                    {{ t('customerApp.addToCart') }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>

            <!-- Cart Review Modal -->
            <Transition enter-active-class="duration-500 ease-out" enter-from-class="translate-y-full" enter-to-class="translate-y-0" leave-active-class="duration-400 ease-in" leave-from-class="translate-y-0" leave-to-class="translate-y-full">
                <div v-if="showCart" class="fixed inset-0 z-[200] flex flex-col justify-end">
                    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" @click="showCart = false"></div>
                    <div class="relative bg-white w-full rounded-t-[4rem] shadow-2xl flex flex-col max-h-[92vh]">
                        <!-- Drag/Close Handle -->
                        <div class="w-full flex justify-center py-6" @click="showCart = false">
                            <div class="w-16 h-1.5 bg-slate-100 rounded-full"></div>
                        </div>
                        
                        <div class="px-10 pb-8 flex justify-between items-end border-b border-slate-50">
                            <div class="text-slate-900">
                                <h3 class="text-4xl font-serif italic tracking-tight">{{ t('customerApp.reviewOrder') }}</h3>
                                <p class="text-[12px] font-black text-amber-600 uppercase tracking-[0.3em] mt-3">{{ store.cart.reduce((sum, item) => sum + item.qty, 0) }} {{ t('customerApp.totalItems') }}</p>
                            </div>
                            <button @click="showCart = false" class="text-slate-400 bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm">
                                <X class="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto px-10 py-10 hidden-scrollbar space-y-6">
                            <div v-for="item in store.cart" :key="item.id" class="flex gap-6 items-center p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-50 relative group">
                                <div class="w-24 h-24 rounded-[1.5rem] overflow-hidden shadow-md flex-shrink-0">
                                    <img :src="item.image" class="w-full h-full object-cover">
                                </div>
                                <div class="flex-1 text-slate-900">
                                    <h4 class="font-serif text-xl italic mb-4">
                                        {{ locale === 'th' ? ((item as any).nameTh || item.name) : item.name }}
                                    </h4>
                                    <!-- Premium Nested Quantity Controls -->
                                    <div class="flex items-center space-x-4 bg-white w-fit rounded-full p-1.5 border border-slate-100 shadow-sm">
                                        <button @click="store.decreaseQty(item.id)" class="w-10 h-10 rounded-full flex items-center justify-center text-slate-900 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-50">
                                            <Minus v-if="item.qty > 1" class="w-4 h-4 stroke-[3]" />
                                            <Trash2 v-else class="w-4 h-4" />
                                        </button>
                                        <span class="w-6 text-center font-black text-slate-900 text-sm">{{ item.qty }}</span>
                                        <button @click="store.increaseQty(item.id)" class="w-10 h-10 rounded-full flex items-center justify-center text-slate-900 hover:text-amber-600 hover:bg-amber-50 transition-all border border-slate-50">
                                            <Plus class="w-4 h-4 stroke-[3]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="p-10 pb-safe pb-10 bg-white border-t border-slate-50">
                            <button 
                                @click="handleOrder"
                                :disabled="store.cart.length === 0"
                                class="w-full py-6 bg-slate-900 disabled:opacity-30 text-white font-black text-[14px] uppercase tracking-[0.3em] rounded-[2rem] shadow-[0_20px_50px_rgba(15,23,42,0.3)] flex items-center justify-center active:scale-[0.98] transition-all"
                            >
                                <span class="mr-3">{{ t('customerApp.sendOrderToKitchen') }}</span>
                                <CheckCircle2 class="w-6 h-6 text-amber-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
            
            <!-- Order History Modal -->
            <Transition enter-active-class="duration-500 ease-out" enter-from-class="translate-y-full" enter-to-class="translate-y-0" leave-active-class="duration-400 ease-in" leave-from-class="translate-y-0" leave-to-class="translate-y-full">
                <div v-if="showHistory" class="fixed inset-0 z-[200] flex flex-col justify-end">
                    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" @click="showHistory = false"></div>
                    <div class="relative bg-white w-full rounded-t-[4rem] shadow-2xl flex flex-col max-h-[92vh]">
                        <!-- Drag/Close Handle -->
                        <div class="w-full flex justify-center py-6" @click="showHistory = false">
                            <div class="w-16 h-1.5 bg-slate-100 rounded-full"></div>
                        </div>
                        
                        <div class="px-10 pb-8 flex justify-between items-end border-b border-slate-50">
                            <div class="text-slate-900">
                                <h3 class="text-4xl font-serif italic tracking-tight">{{ t('customerApp.orderDetails') }}</h3>
                                <p class="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">{{ store.session?.orders?.length || 0 }} Orders</p>
                            </div>
                            <button @click="showHistory = false" class="text-slate-400 bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm">
                                <X class="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto px-10 py-10 hidden-scrollbar space-y-6">
                            <div v-if="!store.session?.orders || store.session.orders.length === 0" class="text-center py-10 text-slate-400 font-medium tracking-wide">
                                ไม่มีประวัติการสั่งอาหาร
                            </div>
                            <div v-else class="space-y-8">
                                <div v-for="(order, index) in store.session.orders" :key="order.id" class="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                    <div class="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                                        <span class="text-sm font-black text-slate-900 uppercase tracking-widest">Order #{{ (store.session.orders.length as number) - index }}</span>
                                        <span class="text-xs font-bold px-3 py-1 rounded-full" 
                                            :class="{
                                                'bg-amber-100 text-amber-700': order.status === 'PENDING',
                                                'bg-blue-100 text-blue-700': order.status === 'PREPARING',
                                                'bg-emerald-100 text-emerald-700': order.status === 'SERVED',
                                                'bg-red-100 text-red-700': order.status === 'CANCELLED'
                                            }">
                                            {{ order.status }}
                                        </span>
                                    </div>
                                    <div class="space-y-4">
                                        <div v-for="item in order.items" :key="item.id" class="flex justify-between items-center">
                                            <div class="flex items-center space-x-4">
                                                <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center font-black text-slate-900 shadow-sm text-xs border border-slate-100">
                                                    {{ item.quantity }}x
                                                </div>
                                                <div>
                                                    <p class="font-serif italic text-slate-900">{{ locale === 'th' ? (item.menu.nameTh || item.menu.name) : item.menu.name }}</p>
                                                    <p v-if="item.note" class="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Note: {{ item.note }}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </template>
        
        <!-- Welcome/Invalid State -->
        <div v-else class="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-12 text-center">
            <div class="w-32 h-32 bg-amber-50 rounded-full flex items-center justify-center mb-10 shadow-inner ring-8 ring-amber-50/50">
                <UtensilsCrossed class="w-14 h-14 text-amber-500" />
            </div>
            <h2 class="text-5xl font-serif italic text-slate-900 mb-6 tracking-tight leading-none">{{ t('customerApp.invalidSession') }}</h2>
            <p class="text-slate-400 mb-12 max-w-xs leading-relaxed font-medium tracking-wide">{{ t('customerApp.pleaseScanQR') }}</p>
            <button @click="reload" class="px-12 py-6 navy-gradient text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-slate-900/30 active:scale-95 transition-all w-full max-w-xs">Start Experience</button>
        </div>

        <!-- Notification -->
        <Transition enter-active-class="translate-y-20 opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="translate-y-0 opacity-100" leave-to-class="translate-y-20 opacity-0">
            <div v-if="showNotification.show" class="fixed bottom-32 left-6 right-6 z-[250] flex justify-center pointer-events-none transition-all duration-700">
                <div class="bg-slate-900 px-10 py-5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center space-x-4 border border-white/10 active:scale-95 transition-all">
                    <CheckCircle2 v-if="showNotification.type === 'success'" class="w-6 h-6 text-emerald-400" />
                    <Bell v-else class="w-6 h-6 text-amber-400" />
                    <span class="font-black text-xs uppercase tracking-widest text-white">{{ showNotification.message }}</span>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
}
</style>
