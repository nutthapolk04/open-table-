import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    { path: '/', redirect: '/table/demo' },
    {
        path: '/table/:sessionId',
        name: 'order',
        component: () => import('./views/OrderView.vue')
    },
    // Catch-all to prevent blank screen
    { path: '/:pathMatch(.*)*', redirect: '/table/demo' }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
