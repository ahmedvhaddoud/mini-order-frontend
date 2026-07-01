import axios from "axios"
import keycloak from "../auth/keycloak"

const API_URL = "http://localhost:8081/api/orders"

const getAuthHeader = async () => {
    await keycloak.updateToken(30)

    return {
        Authorization: `Bearer ${keycloak.token}`
    }
}

export const orderService = {

    async getOrders() {
        const headers = await getAuthHeader()
        const res = await axios.get(API_URL, { headers })
        return res.data
    },

    async createOrder(items) {
        const headers = await getAuthHeader()
        const res = await axios.post(API_URL, { items }, { headers })
        return res.data
    }

}