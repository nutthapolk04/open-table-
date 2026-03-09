import { createRouter, createWebHistory } from "vue-router";

const routes = [
    {
        path: "/",
        name: "FloorPlan",
        component: () => import("./views/FloorPlan.vue")
    },
    {
        path: "/menu",
        name: "MenuManagement",
        component: () => import("./views/MenuManagement.vue")
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
