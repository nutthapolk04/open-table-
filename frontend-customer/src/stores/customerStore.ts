import { defineStore } from 'pinia'
import axios from 'axios'
import { io } from 'socket.io-client'

const API_BASE_URL = 'http://localhost:3000/api'
const SOCKET_URL = 'http://localhost:3000'

export const useCustomerStore = defineStore('customer', {
    state: () => ({
        session: null,
        categories: [],
        tiers: [],
        loading: false,
        error: null,
        socket: null,
        cart: []
    }),

    actions: {
        async fetchCategories() {
            const response = await axios.get(`${API_BASE_URL}/categories`)
            this.categories = response.data
        },

        async fetchTiers() {
            const response = await axios.get(`${API_BASE_URL}/tiers`)
            this.tiers = response.data
        },

        addToCart(menuItem) {
            const existing = this.cart.find(i => i.menuId === menuItem.id)
            if (existing) {
                existing.quantity++
            } else {
                this.cart.push({
                    menuId: menuItem.id,
                    name: menuItem.name,
                    price: menuItem.price,
                    quantity: 1
                })
            }
        },

        async placeOrder() {
            if (!this.session) return
            try {
                const response = await axios.post(`${API_BASE_URL}/orders`, {
                    sessionId: this.session.id,
                    items: this.cart
                })
                this.cart = [] // Clear cart
                return response.data
            } catch (err) {
                this.error = 'Failed to place order'
            }
        }
    }
})
