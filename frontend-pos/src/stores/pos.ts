import { defineStore } from "pinia";
import api from "../api";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface Table {
  id: string;
  number: string;
  status: "FREE" | "OCCUPIED" | "CHECKING_BILL" | "CLEANING";
  zone: string;
  time?: string;
  pax?: number;
  orders: OrderItem[];
  timeSeated?: string;
  sessionId?: string;
  tierId?: string;
}

export interface Tier {
  id: string;
  name: string;
  price: number;
  timeLimit: number;
}

export interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  category: string;
  price: number;
  image: string;
}

export interface Session {
  id: string;
  tableId: string;
  tierId: string;
  customerCount: number;
  status: "ACTIVE" | "CLOSED";
  orders?: any[];
}

export const usePosStore = defineStore("pos", {
  state: () => ({
    tables: [] as Table[],
    tiers: [] as Tier[],
    categories: [] as { id: string, name: string }[],
    menuItems: [] as MenuItem[],
    activeTableId: null as string | null,
    loading: false,
    error: null as string | null,
  }),
  getters: {
    activeTable: (state) =>
      state.tables.find((t) => t.id === state.activeTableId) || null,
    getTableById: (state) => (id: string) =>
      state.tables.find((t) => t.id === id),
  },
  actions: {
    async fetchInitialData() {
      this.loading = true;
      try {
        const [tablesRes, tiersRes, categoriesRes] = await Promise.all([
          api.get("/tables"),
          api.get("/tiers"),
          api.get("/categories"),
        ]);

        this.tables = tablesRes.data.map((t: any) => {
          const activeSession = t.sessions && t.sessions[0];

          // Flatten orders from session
          const flattenedOrders: OrderItem[] = [];
          if (activeSession && activeSession.orders) {
            activeSession.orders.forEach((order: any) => {
              order.items.forEach((item: any) => {
                const existing = flattenedOrders.find(
                  (o) => o.id === item.menu.id,
                );
                if (existing) {
                  existing.qty += item.quantity;
                } else {
                  flattenedOrders.push({
                    id: item.menu.id,
                    name: item.menu.name,
                    price: item.menu.price || 0,
                    qty: item.quantity,
                  });
                }
              });
            });
          }

          return {
            id: t.id,
            number: t.number,
            status: t.status,
            zone: t.zone.name,
            pax: activeSession?.customerCount,
            sessionId: activeSession?.id,
            tierId: activeSession?.tierId,
            orders: flattenedOrders,
            timeSeated: activeSession?.startTime
              ? new Date(activeSession.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
              : undefined,
            time: activeSession?.startTime
              ? `${Math.floor((new Date().getTime() - new Date(activeSession.startTime).getTime()) / 60000)} min`
              : undefined,
          };
        });

        this.tiers = tiersRes.data;
        this.categories = categoriesRes.data.map((c: any) => ({ id: c.id, name: c.name }));

        // Flatten menus from categories for POS
        const allItems: MenuItem[] = [];
        categoriesRes.data.forEach((cat: any) => {
          cat.menus.forEach((m: any) => {
            allItems.push({
              id: m.id,
              name: m.name,
              price: m.price,
              categoryId: cat.id,
              category: cat.name,
              image: "🍽️", // Default fallback
            });
          });
        });
        this.menuItems = allItems;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    setActiveTable(id: string | null) {
      this.activeTableId = id;
    },
    async openTable(id: string, pax: number, tierId: string) {
      try {
        await api.post("/sessions/open", {
          tableId: id,
          tierId,
          customerCount: pax,
        });
        await this.fetchInitialData(); // Refresh state
      } catch (err: any) {
        this.error = err.message;
      }
    },
    async checkoutTable(sessionId: string) {
      try {
        await api.post("/sessions/close", { sessionId });
        await this.fetchInitialData(); // Refresh state
      } catch (err: any) {
        this.error = err.message;
      }
    },
    async placeOrder(
      sessionId: string,
      items: { menuId: string; quantity: number; note?: string }[],
    ) {
      try {
        await api.post("/orders", {
          sessionId,
          items,
        });
        await this.fetchInitialData(); // Refresh state to show newly ordered items
      } catch (err: any) {
        this.error = err.message;
      }
    },
  },
});
