<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  Plus, 
  Trash2, 
  ChefHat, 
  Tag, 
  Clock, 
  Search,
  ChevronRight,
  TrendingUp,
  XCircle,
  Package
} from 'lucide-vue-next';
import api from '../api';

const categories = ref<any[]>([]);
const tiers = ref<any[]>([]);
const menus = ref<any[]>([]);
const loading = ref(false);

const fetchData = async () => {
    loading.value = true;
    try {
        const [catRes, tierRes] = await Promise.all([
            api.get('/categories'),
            api.get('/tiers')
        ]);
        categories.value = catRes.data;
        tiers.value = tierRes.data;
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const showAddCategory = ref(false);
const showAddTier = ref(false);
const newCategory = ref({ name: '' });
const newTier = ref({ name: '', price: 399, duration: 90 });

const createCategory = async () => {
    await api.post('/categories', newCategory.value);
    showAddCategory.value = false;
    newCategory.value.name = '';
    fetchData();
};

const createTier = async () => {
    await api.post('/tiers', newTier.value);
    showAddTier.value = false;
    newTier.value = { name: '', price: 399, duration: 90 };
    fetchData();
};

onMounted(fetchData);

</script>

<template>
  <div class="space-y-12 max-w-7xl mx-auto">
    <!-- Section: Buffet Tiers -->
    <section class="space-y-10">
      <div class="flex items-center justify-between border-b border-slate-100 pb-10">
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-amber-50 rounded-2xl">
            <Package class="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Buffet Packages</h2>
            <p class="text-slate-500 font-bold text-sm tracking-wide mt-1 italic">Define your pricing tiers and session time limits.</p>
          </div>
        </div>
        <button @click="showAddTier = true" class="btn-primary h-14 px-8 flex items-center space-x-2 bg-amber-600 shadow-amber-100 hover:bg-amber-700">
            <Plus class="w-5 h-5" />
            <span>Create New Package</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="tier in tiers" :key="tier.id" class="card p-10 group relative transition-all hover:border-amber-200">
            <div class="h-1 w-20 bg-amber-400 mb-6 group-hover:w-full transition-all duration-700"></div>
            <h3 class="text-2xl font-black text-slate-800 uppercase italic mb-8">{{ tier.name }}</h3>
            <div class="flex items-end mb-8">
                <span class="text-5xl font-black text-indigo-600 tracking-tighter italic">฿{{ tier.price }}</span>
                <span class="text-slate-400 font-bold text-sm ml-2 mb-1">/ PAX</span>
            </div>
            <div class="flex items-center space-x-6 text-slate-500 font-bold text-xs uppercase tracking-widest bg-slate-50 p-4 rounded-2xl">
                <div class="flex items-center">
                    <Clock class="w-4 h-4 mr-2" />
                    {{ tier.duration || 90 }} Minutes Limit
                </div>
            </div>
        </div>
      </div>
    </section>

    <!-- Section: Menu Categories -->
    <section class="space-y-10 pt-10 border-t border-slate-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-indigo-50 rounded-2xl">
            <Tag class="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Menu Inventory</h2>
            <p class="text-slate-500 font-bold text-sm tracking-wide mt-1 italic">Organize items into categories for customers.</p>
          </div>
        </div>
        <button @click="showAddCategory = true" class="btn-secondary h-14 px-8 flex items-center space-x-2">
            <Plus class="w-5 h-5" />
            <span>Add Category</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div v-for="cat in categories" :key="cat.id" class="p-8 bg-white border border-slate-200/60 rounded-3xl hover:shadow-xl hover:-translate-y-2 transition-all group flex flex-col cursor-pointer">
              <div class="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
                  <ChefHat class="w-6 h-6 text-indigo-600 group-hover:text-white" />
              </div>
              <h4 class="text-xl font-black text-slate-800 uppercase italic mb-2 tracking-tighter">{{ cat.name }}</h4>
              <p class="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-8">{{ cat.menus?.length || 0 }} Items Indexed</p>
              
              <div class="mt-auto flex items-center text-indigo-600 font-black text-xs uppercase tracking-widest pt-6 border-t border-slate-50">
                  <span>Manage Items</span>
                  <ChevronRight class="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
          </div>
      </div>
    </section>

    <!-- Modals -->
    <Teleport to="body">
        <div v-if="showAddCategory" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" @click="showAddCategory = false"></div>
            <div class="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative p-12 animate-in zoom-in-95 duration-500">
                <h3 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic mb-10">New Category Unit</h3>
                <input v-model="newCategory.name" class="input-field text-xl font-bold h-16" placeholder="e.g. PREMIUM BEEF" />
                <div class="mt-12 flex space-x-4">
                    <button @click="showAddCategory = false" class="btn-secondary flex-1">Abort</button>
                    <button @click="createCategory" class="btn-primary flex-1">Deploy Category</button>
                </div>
            </div>
        </div>

        <div v-if="showAddTier" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" @click="showAddTier = false"></div>
            <div class="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative p-12 animate-in zoom-in-95 duration-500">
                <h3 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic mb-10">Create Buffet Package</h3>
                <div class="space-y-6">
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Package Name</label>
                        <input v-model="newTier.name" class="input-field text-xl font-bold h-16" placeholder="e.g. GOLD WAGYU" />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Price (฿)</label>
                            <input v-model="newTier.price" type="number" class="input-field text-xl font-bold h-16" />
                        </div>
                        <div>
                            <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Time (Min)</label>
                            <input v-model="newTier.duration" type="number" class="input-field text-xl font-bold h-16" />
                        </div>
                    </div>
                </div>
                <div class="mt-12 flex space-x-4">
                    <button @click="showAddTier = false" class="btn-secondary flex-1">Cancel</button>
                    <button @click="createTier" class="btn-primary flex-1 bg-amber-600 shadow-amber-100 uppercase">Authorize Package</button>
                </div>
            </div>
        </div>
    </Teleport>
  </div>
</template>
