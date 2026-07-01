<template>
  <div class="container">
    <header>
      <h1>🛒 Mini Order</h1>
      <div v-if="!authenticated">
        <button class="btn primary" @click="login">Se connecter</button>
      </div>
      <div v-else class="user-box">
        <span>Connecté en tant que <strong>{{ username }}</strong></span>
        <button class="btn secondary" @click="logout">Se déconnecter</button>
      </div>
    </header>

    <section v-if="authenticated">
      <h2>Produits</h2>
      <div class="products">
        <div class="card" v-for="p in products" :key="p.id">
          <h3>{{ p.name }}</h3>
          <p class="price">{{ p.price }} €</p>
          <div class="qty-controls">
            <button class="qty-btn" @click="decrement(p.id)">−</button>
            <span class="qty-value">{{ quantities[p.id] }}</span>
            <button class="qty-btn" @click="increment(p.id)">+</button>
          </div>
        </div>
      </div>

      <button class="btn order-btn" :disabled="totalItems === 0 || loading" @click="submitOrder">
        {{ loading ? 'Envoi en cours...' : `Commander (${totalItems} article${totalItems > 1 ? 's' : ''})` }}
      </button>

      <p v-if="message" :class="['message', messageType]">{{ message }}</p>

      <hr />

      <h2>Commandes passées</h2>
      <div v-if="orders.length === 0" class="empty">Aucune commande pour le moment.</div>
      <ul class="orders">
        <li v-for="o in orders" :key="o.id">
          <div class="order-header">
            <strong>Commande #{{ o.id }}</strong>
            <span class="date">{{ formatDate(o.createdAt) }}</span>
          </div>
          <ul class="order-items">
            <li v-for="(it, idx) in o.items" :key="idx">
              {{ it.productName }} × {{ it.quantity }}
            </li>
          </ul>
        </li>
      </ul>
    </section>

    <section v-else class="not-authenticated">
      <p>Veuillez vous connecter pour accéder à l'application.</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import keycloak from './auth/keycloak'
import { orderService } from "./services/OrderService.js"
const API_URL = 'http://localhost:8081/api/orders'

const authenticated = ref(false)
const username = ref('')
const orders = ref([])
const message = ref('')
const messageType = ref('success')
const loading = ref(false)

const products = ref([
  { id: 1, name: 'Clavier', price: 79 },
  { id: 2, name: 'Souris', price: 29 },
  { id: 3, name: 'Écran', price: 199 },
  { id: 4, name: 'Casque', price: 59 }
])

const quantities = ref({
  1: 0,
  2: 0,
  3: 0,
  4: 0
})

const totalItems = computed(() =>
    Object.values(quantities.value).reduce((a, b) => a + b, 0)
)

const authHeader = async () => {
  try {
    await keycloak.updateToken(30)
  } catch (e) {
    keycloak.login()
    throw e
  }

  return {
    Authorization: `Bearer ${keycloak.token}`
  }
}

// actions
const login = () => keycloak.login()

const logout = () =>
    keycloak.logout({ redirectUri: window.location.origin })

const increment = (id) => {
  quantities.value[id]++
}

const decrement = (id) => {
  if (quantities.value[id] > 0) quantities.value[id]--
}

// API calls
const fetchOrders = async () => {
  try {
    orders.value = await orderService.getOrders();
  } catch (e) {
    console.error(e)
  }
}

const submitOrder = async () => {
  const items = products.value
      .filter((p) => quantities.value[p.id] > 0)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        quantity: quantities.value[p.id]
      }))

  if (items.length === 0) return

  loading.value = true
  message.value = ''

  try {
    await orderService.createOrder(items)
    message.value = 'Commande envoyée avec succès.'
    messageType.value = 'success'

    products.value.forEach((p) => {
      quantities.value[p.id] = 0
    })

    await fetchOrders()
  } catch (e) {
    console.error(e)
    message.value = "Erreur lors de l'envoi de la commande."
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

const formatDate = (d) => {
  return new Date(d).toLocaleString('fr-FR')
}

// lifecycle
onMounted(async () => {
  authenticated.value = keycloak.authenticated || false

  if (authenticated.value) {
    username.value = keycloak.tokenParsed?.preferred_username || ''
    await fetchOrders()
  }
})
</script>
<style>
* { box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  margin: 0;
  background: #f2f4f7;
  color: #1a1a1a;
}

.container {
  max-width: 820px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

h1 { margin: 0; font-size: 1.6rem; }

.user-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn {
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn.primary { background: #2563eb; color: white; }
.btn.secondary { background: #e5e7eb; color: #1a1a1a; }

.products {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.card {
  background: white;
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  width: 170px;
  text-align: center;
}

.card h3 { margin: 0 0 6px; font-size: 1rem; }
.price { color: #555; margin: 0 0 12px; }

.qty-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.qty-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid #ccc;
  background: white;
  font-size: 1.1rem;
  cursor: pointer;
}

.qty-value { min-width: 20px; font-weight: 600; }

.order-btn {
  background: #16a34a;
  color: white;
  padding: 12px 22px;
  font-size: 1rem;
  margin-bottom: 8px;
}
.order-btn:disabled { background: #9ca3af; cursor: not-allowed; }

.message { font-weight: 600; }
.message.success { color: #16a34a; }
.message.error { color: #dc2626; }

hr { border: none; border-top: 1px solid #ddd; margin: 28px 0; }

.orders { list-style: none; padding: 0; }

.orders li {
  background: white;
  margin-bottom: 10px;
  padding: 14px 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  color: #333;
}

.date { color: #888; font-size: 0.85rem; }

.order-items { margin: 0; padding-left: 18px; color: #444; }

.empty { color: #777; }

.not-authenticated { text-align: center; padding: 60px 0; color: #555; }
</style>