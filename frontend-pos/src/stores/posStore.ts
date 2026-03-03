import { defineStore } from 'pinia'
import axios from 'axios'
import { io } from 'socket.io-client'

const API_BASE_URL = 'http://localhost:3000/api'
const SOCKET_URL = 'http://localhost:3000'

export const usePosStore = defineStore('pos', {
    state: () => ({
        zones: [],
        tables: [],
        loading: false,
        error: null,
        socket: null
    }),

    actions: {
        async fetchZones() {
            this.loading = true
            try {
                const response = await axios.get(`${API_BASE_URL}/zones`)
                this.zones = response.data
            } catch (err) {
                this.error = 'Failed to fetch zones'
            } finally {
                this.loading = false
            }
        },

        async fetchTables() {
            this.loading = true
            try {
                const response = await axios.get(`${API_BASE_URL}/tables`)
                this.tables = response.data
            } catch (err) {
                this.error = 'Failed to fetch tables'
            } finally {
                this.loading = false
            }
        },

        initSocket() {
            this.socket = io(SOCKET_URL)

            this.socket.on('table-status-updated', (data) => {
                const table = this.tables.find(t => t.id === data.tableId)
                if (table) {
                    table.status = data.status
                }
            })

            this.socket.on('new-order', (order) => {
                console.log('New order received:', order)
                // Handle notification/UI update
            })
        },

        async openTable(tableId, tierId, customerCount) {
            try {
                const response = await axios.post(`${API_BASE_URL}/sessions/open`, {
                    tableId,
                    tierId,
                    customerCount
                })
                await this.fetchTables() // Refresh state
                return response.data
            } catch (err) {
                this.error = 'Failed to open table'
                throw err
            }
        }
    }
})
