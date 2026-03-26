import { defineStore } from 'pinia';
import api from '../api';
import { io, Socket } from 'socket.io-client';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    qty: number;
    image?: string;
}

export const useCustomerStore = defineStore('customer', {
    state: () => ({
        session: null as any,
        menuItems: [] as any[],
        categories: [] as string[],
        cart: [] as CartItem[],
        loading: false,
        error: null as string | null,
        socket: null as Socket | null,
        timeLeft: '00:00:00'
    }),

    actions: {
        async fetchSessionData(sessionId: string) {
            this.loading = true;
            try {
                // Fetch session info
                const sessionRes = await api.get(`/sessions/${sessionId}`);
                this.session = sessionRes.data;

                // Fetch menu - use tier-specific if available, otherwise all menus
                let menuRes;
                if (this.session.tierId) {
                    menuRes = await api.get(`/tiers/${this.session.tierId}/menu`);
                } else {
                    menuRes = await api.get(`/menus`);
                }
                this.menuItems = menuRes.data;

                // Extract unique categories
                this.categories = ['All', ...new Set(this.menuItems.map((item: any) => item.category.name))];

                this.initSocket(sessionId);
            } catch (err: any) {
                this.error = err.response?.data?.error || 'Failed to load session';
            } finally {
                this.loading = false;
            }
        },

        initSocket(sessionId: string) {
            const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
            this.socket = io(socketUrl);

            this.socket.emit('join-session', sessionId);

            this.socket.on('session-updated', (data) => {
                if (data.id === sessionId) {
                    this.session = { ...this.session, ...data };
                }
            });

            this.socket.on('time-update', (data) => {
                if (data.sessionId === sessionId) {
                    this.timeLeft = data.timeLeft;
                }
            });
        },

        addToCart(item: any) {
            const existing = this.cart.find(i => i.id === item.id);
            if (existing) {
                existing.qty++;
            } else {
                this.cart.push({
                    id: item.id,
                    name: item.name,
                    price: 0, // In buffet, it's usually 0
                    qty: 1,
                    image: item.image || '🍽️'
                });
            }
        },

        increaseQty(id: string) {
            const item = this.cart.find(i => i.id === id);
            if (item) item.qty++;
        },

        decreaseQty(id: string) {
            const item = this.cart.find(i => i.id === id);
            if (item) {
                if (item.qty > 1) {
                    item.qty--;
                } else {
                    this.removeFromCart(id);
                }
            }
        },

        removeFromCart(id: string) {
            this.cart = this.cart.filter(i => i.id !== id);
        },

        async placeOrder() {
            if (!this.session || this.cart.length === 0) return;

            try {
                await api.post('/orders', {
                    sessionId: this.session.id,
                    items: this.cart.map(i => ({
                        menuId: i.id,
                        quantity: i.qty
                    }))
                });
                this.cart = [];
                return true;
            } catch (err) {
                console.error('Order failed', err);
                return false;
            }
        }
    }
});
