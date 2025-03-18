import { deployNetwork, stopNetwork, startNetwork, deleteNetwork } from "../src/BesuManager";
import { CONFIG } from "../src/config";
import shell from "shelljs";

describe("🧪 BesuManager Library Tests", () => {

    beforeEach(async () => {
        console.log("🛑 Eliminando cualquier red previa antes de ejecutar el test...");
        await deleteNetwork();
    });

    afterAll(async () => {
        console.log("🧹 Limpiando la red después de todas las pruebas...");
        await deleteNetwork();
    });

    test("🚀 Desplegar la red Besu", async () => {
        await expect(deployNetwork(CONFIG.DEFAULT_NUM_NODES, CONFIG.DEFAULT_CHAIN_ID, CONFIG.DEFAULT_METAMASK_ACCOUNT)).resolves.not.toThrow();

        // Verificar que los nodos se están ejecutando
        const runningContainers = shell.exec("docker ps --filter name=nodo -q", { silent: true }).stdout.trim();
        expect(runningContainers).not.toBe("");
    });

    test("🛑 Detener la red Besu", async () => {
        await deployNetwork(CONFIG.DEFAULT_NUM_NODES, CONFIG.DEFAULT_CHAIN_ID, CONFIG.DEFAULT_METAMASK_ACCOUNT);
        await expect(stopNetwork()).resolves.not.toThrow();

        // Verificar que los nodos están detenidos
        const runningContainers = shell.exec("docker ps --filter name=nodo -q", { silent: true }).stdout.trim();
        expect(runningContainers).toBe(""); // Esperamos que no haya nodos corriendo
    });

    test("▶️ Arrancar la red Besu", async () => {
        await deployNetwork(CONFIG.DEFAULT_NUM_NODES, CONFIG.DEFAULT_CHAIN_ID, CONFIG.DEFAULT_METAMASK_ACCOUNT);
        await stopNetwork();
        await expect(startNetwork()).resolves.not.toThrow();

        // Verificar que los nodos se están ejecutando después de arrancarlos
        const runningContainers = shell.exec("docker ps --filter name=nodo -q", { silent: true }).stdout.trim();
        expect(runningContainers).not.toBe("");
    });

    test("🗑️ Eliminar la red Besu", async () => {
        await deployNetwork(CONFIG.DEFAULT_NUM_NODES, CONFIG.DEFAULT_CHAIN_ID, CONFIG.DEFAULT_METAMASK_ACCOUNT);
        await expect(deleteNetwork()).resolves.not.toThrow();

        // Verificar que la red ha sido eliminada
        const networkExists = shell.exec("docker network ls --filter name=redBesu -q", { silent: true }).stdout.trim();
        expect(networkExists).toBe(""); // Esperamos que la red ya no exista
    });

});
