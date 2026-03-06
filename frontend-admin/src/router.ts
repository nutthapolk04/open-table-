import { createRouter, createWebHistory } from "vue-router";

const routes = [
    {
        path: "/",
        name: "แดชบอร์ด",
        component: () => import("./views/Dashboard.vue")
    },
    {
        path: "/floor-plan",
        name: "ผังร้านอาหาร",
        component: () => import("./views/FloorPlan.vue")
    },
    {
        path: "/menu",
        name: "เมนูและบุฟเฟ่ต์",
        component: () => import("./views/MenuManagement.vue")
    },
    {
        path: "/settings",
        name: "ตั้งค่า",
        component: () => import("./views/Dashboard.vue") // Temporary reuse
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
