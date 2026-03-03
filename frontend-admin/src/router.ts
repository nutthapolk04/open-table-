import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    { path: '/', redirect: '/dashboard' },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('./App.vue') // Temporarily using App.vue as a layout or view
    },
    {
        path: '/menu',
        name: 'menu',
        component: () => import('./App.vue')
    },
    {
        path: '/zones',
        name: 'zones',
        component: () => import('./App.vue')
    },
    {
        path: '/settings',
        name: 'settings',
        component: () => import('./App.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
