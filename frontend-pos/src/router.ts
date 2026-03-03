import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    { path: '/', redirect: '/tables' },
    {
        path: '/tables',
        name: 'tables',
        component: () => import('./App.vue')
    },
    {
        path: '/billing',
        name: 'billing',
        component: () => import('./App.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
