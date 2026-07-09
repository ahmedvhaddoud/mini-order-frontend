import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
    url: 'https://mini-order-keycloak-production.up.railway.app:9000',
    realm: 'mini-order',
    clientId: 'mini-order-frontend'
})

export default keycloak