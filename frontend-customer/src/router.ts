import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    { path: '/', redirect: '/order' },
    {
        path: '/order',
        name: 'order',
        component: () => import('./App.vue')
    },
    {
        path: '/history',
        name: 'history',
        component: () => import('./App.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
