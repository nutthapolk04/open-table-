import { createRouter, createWebHistory } from "vue-router";

const routes = [
    {
        path: "/",
        name: "Dashboard",
        component: () => import("./views/Dashboard.vue")
    },
    {
        path: "/floor-plan",
        name: "Floor Plan",
        component: () => import("./views/FloorPlan.vue")
    },
    {
        path: "/menu",
        name: "Menu & Buffet",
        component: () => import("./views/MenuManagement.vue")
    },
    {
        path: "/settings",
        name: "Settings",
        component: () => import("./views/Dashboard.vue") // Temporary reuse
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
