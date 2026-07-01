import { createApp } from 'vue'
import App from './App.vue'
import keycloak from './auth/keycloak'

keycloak
    .init({ onLoad: 'check-sso', pkceMethod: 'S256', silentCheckSsoRedirectUri: undefined })
    .then(() => {
        const app = createApp(App)
        app.mount('#app')
    })
    .catch((err) => {
        console.error('Erreur d\'initialisation de Keycloak', err)
    })