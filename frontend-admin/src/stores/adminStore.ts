import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

export const useAdminStore = defineStore('admin', {
    state: () => ({
        zones: [],
        categories: [],
        tiers: [],
        menus: [],
        loading: false,
        error: null
    }),

    actions: {
        async fetchData() {
            this.loading = true
            try {
                const [zones, cats, tiers] = await Promise.all([
                    axios.get(`${API_BASE_URL}/zones`),
                    axios.get(`${API_BASE_URL}/categories`),
                    axios.get(`${API_BASE_URL}/tiers`)
                ])
                this.zones = zones.data
                this.categories = cats.data
                this.tiers = tiers.data
            } catch (err) {
                this.error = 'Failed to fetch admin data'
            } finally {
                this.loading = false
            }
        },

        async createMenu(menuData) {
            const response = await axios.post(`${API_BASE_URL}/menus`, menuData)
            await this.fetchData()
            return response.data
        }
    }
})
