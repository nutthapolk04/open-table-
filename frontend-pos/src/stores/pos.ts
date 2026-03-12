/// <reference types="vite/client" />
import { defineStore } from "pinia";
import api from "../api";
import { io, Socket } from "socket.io-client";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
}

export interface Table {
  id: string;
  number: string;
  status: "FREE" | "OCCUPIED" | "CHECKING_BILL" | "CLEANING";
  zone: string;
  time?: string;
  pax?: number;
  seats?: number;
  orders: OrderItem[];
  rawOrders?: any[];
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
  nameTh?: string;
  categoryId: string;
  category: string;
  price: number;
  image: string;
  status?: "AVAILABLE" | "SOLD_OUT";
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
    zones: [] as { id: string, name: string }[],
    categories: [] as { id: string, name: string }[],
    menuItems: [] as MenuItem[],
    activeTableId: null as string | null,
    loading: false,
    error: null as string | null,
    socket: null as Socket | null,
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
      this.error = null;
      try {
        // Individual fetches to be resilient
        const fetchRes = async (url: string) => {
          try { return await api.get(url); }
          catch (e) { console.warn(`Failed to fetch ${url}`, e); return { data: [] }; }
        };

        const [tablesRes, tiersRes, categoriesRes, zonesRes] = await Promise.all([
          fetchRes("/tables"),
          fetchRes("/tiers"),
          fetchRes("/categories"),
          fetchRes("/zones"),
        ]);

        this.initSocket();

        this.tables = (tablesRes.data || []).map((t: any) => {
          const activeSession = t.sessions && t.sessions[0];
          const flattenedOrders: OrderItem[] = [];
          if (activeSession && activeSession.orders) {
            activeSession.orders.forEach((order: any) => {
              order.items.forEach((item: any) => {
                const existing = flattenedOrders.find((o) => o.id === item.menu.id);
                if (existing) { existing.qty += item.quantity; }
                else {
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
            zone: t.zone?.name || "No Zone",
            seats: t.seats || 4,
            pax: activeSession?.customerCount,
            sessionId: activeSession?.id,
            tierId: activeSession?.tierId,
            orders: flattenedOrders,
            rawOrders: activeSession?.orders || [],
            timeSeated: activeSession?.startTime ? new Date(activeSession.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
            time: activeSession?.startTime ? `${Math.floor((new Date().getTime() - new Date(activeSession.startTime).getTime()) / 60000)} min` : undefined,
          };
        });

        this.tiers = tiersRes.data || [];
        
        // Use unique categories by name to avoid duplications in UI
        const categoriesMap = new Map();
        (categoriesRes.data || []).forEach((c: any) => {
          if (!categoriesMap.has(c.name)) {
            categoriesMap.set(c.name, { id: c.id, name: c.name });
          }
        });
        this.categories = Array.from(categoriesMap.values());

        this.zones = (zonesRes.data || []).map((z: any) => ({ id: z.id, name: z.name }));

        const allItems: MenuItem[] = [];
        (categoriesRes.data || []).forEach((cat: any) => {
          cat.menus.forEach((m: any) => {
            allItems.push({
              id: m.id,
              name: m.name,
              nameTh: m.nameTh,
              price: m.price || 0,
              categoryId: cat.id,
              category: cat.name,
              image: m.image || "🍽️",
              status: m.status || "AVAILABLE",
            });
          });
        });
        this.menuItems = allItems;
      } catch (err: any) {
        console.error("Critical Fetch Error:", err);
        this.error = "Technical error while loading data.";
      } finally {
        this.loading = false;
      }
    },
    initSocket() {
      if (this.socket) return;

      const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
      this.socket = io(socketUrl);

      this.socket.on("table-moved", () => this.fetchInitialData());
      this.socket.on("table-merged", () => this.fetchInitialData());
      this.socket.on("new-order", () => this.fetchInitialData());
      this.socket.on("order-status-updated", () => this.fetchInitialData());
      this.socket.on("order-voided", () => this.fetchInitialData());
      this.socket.on("session-opened", () => this.fetchInitialData());
      this.socket.on("session-closed", () => this.fetchInitialData());
      this.socket.on("table-status-updated", () => this.fetchInitialData());
    },
    setActiveTable(id: string | null) {
      this.activeTableId = id;
    },
    async openTable(id: string, pax: number, tierId?: string) {
      try {
        await api.post("/sessions/open", {
          tableId: id,
          tierId,
          customerCount: pax,
        });
        await this.fetchInitialData(); // Refresh state
      } catch (err: any) {
        this.error = err.message;
        throw err;
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
    async updateOrderStatus(orderId: string, status: string) {
      try {
        await api.patch("/orders/status", {
          orderId,
          status,
        });
        await this.fetchInitialData();
      } catch (err: any) {
        this.error = err.message;
      }
    },
    async voidOrderItem(sessionId: string, menuId: string, quantity: number = 1) {
      try {
        await api.post("/orders/void", {
          sessionId,
          menuId,
          quantity,
        });
        await this.fetchInitialData();
      } catch (err: any) {
        this.error = err.message;
      }
    },
    async toggleMenuStatus(menuId: string, currentStatus: string) {
      const newStatus = currentStatus === "AVAILABLE" ? "SOLD_OUT" : "AVAILABLE";
      try {
        await api.patch(`/menus/${menuId}/status`, { status: newStatus });
        await this.fetchInitialData();
      } catch (err: any) {
        this.error = err.message;
      }
    },
    async moveTable(sessionId: string, newTableId: string) {
      try {
        await api.post("/sessions/move", { sessionId, newTableId });
        await this.fetchInitialData();
      } catch (err: any) {
        this.error = err.message;
        throw err;
      }
    },
    async mergeTables(sourceSessionId: string, targetSessionId: string) {
      try {
        await api.post("/sessions/merge", { sourceSessionId, targetSessionId });
        await this.fetchInitialData();
      } catch (err: any) {
        this.error = err.message;
        throw err;
      }
    },
    async markTableCleaned(tableId: string) {
      try {
        await api.patch(`/tables/${tableId}`, { status: "FREE" });
        await this.fetchInitialData();
      } catch (err: any) {
        this.error = err.message;
        throw err;
      }
    },
  },
});
