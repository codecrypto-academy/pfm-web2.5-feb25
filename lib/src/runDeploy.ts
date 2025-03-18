import { deployNetwork } from "./BesuManager";
import { CONFIG } from "./config";

(async () => {
    try {
        console.log("🚀 Iniciando despliegue de la red...");
        await deployNetwork(CONFIG.DEFAULT_NUM_NODES, CONFIG.DEFAULT_CHAIN_ID, CONFIG.DEFAULT_METAMASK_ACCOUNT);
        console.log("✅ Red Besu desplegada correctamente.");
    } catch (error) {
        console.error("❌ Error al desplegar la red:", error);
    }
})();
