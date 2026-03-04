import { createRouter, createWebHistory } from "vue-router";

const routes = [
  { path: "/", redirect: "/tables" },
  {
    path: "/tables",
    name: "tables",
    component: () => import("./views/TablesView.vue"),
  },
  {
    path: "/order/:id",
    name: "order",
    component: () => import("./views/OrderView.vue"),
  },
  {
    path: "/kitchen",
    name: "kitchen",
    component: () => import("./views/KitchenView.vue"),
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("./views/SettingsView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
