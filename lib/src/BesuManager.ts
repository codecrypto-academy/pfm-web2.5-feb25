import shell from "shelljs";
import path from "path";
import fs from "fs-extra";
import { CONFIG } from "./config";

const SCRIPT_PATH = path.join(__dirname, "../../script/deployBesuNet.sh");

export const deployNetwork = async (numNodes: number, chainId: number, extraAccount: string) => {
    console.log("🔄 Desplegando la red Besu...");

    if (!fs.existsSync(SCRIPT_PATH)) {
        console.error(`❌ Error: No se encuentra el script ${SCRIPT_PATH}`);
        throw new Error("No se pudo encontrar el script de despliegue.");
    }

    try {
        shell.chmod("+x", SCRIPT_PATH);
    } catch (error) {
        console.error("❌ Error al dar permisos al script:", error);
    }

    console.log("🚀 Ejecutando el script de despliegue...");
    const result = shell.exec(`bash ${SCRIPT_PATH} ${numNodes} ${extraAccount} ${chainId}`, { silent: false });

    if (result.code !== 0) {
        console.error("❌ Error al desplegar la red:", result.stderr);
        throw new Error("No se pudo desplegar la red Besu.");
    }

    console.log("✅ Red Besu desplegada correctamente.");
};



export const stopNetwork = async () => {
    console.log("🛑 Deteniendo la red Besu...");

    const runningContainers = shell.exec("docker ps -q --filter name=nodo", { silent: true }).stdout.trim();
    if (!runningContainers) {
        console.log("⚠️ No hay nodos en ejecución para detener.");
        return;
    }

    const result = shell.exec("docker stop $(docker ps -aq --filter name=nodo)", { silent: false });

    if (result.code !== 0) {
        console.error("❌ Error al detener la red:", result.stderr);
        throw new Error("No se pudo detener la red Besu.");
    }

    console.log("✅ Red Besu detenida correctamente.");
};



export const startNetwork = async () => {
    console.log("▶️ Arrancando la red Besu...");

    const stoppedContainers = shell.exec("docker ps -aq --filter status=exited --filter name=nodo", { silent: true }).stdout.trim();
    if (!stoppedContainers) {
        console.log("⚠️ No hay nodos detenidos para arrancar.");
        return;
    }

    const result = shell.exec("docker start $(docker ps -aq --filter name=nodo)", { silent: false });

    if (result.code !== 0) {
        console.error("❌ Error al arrancar la red:", result.stderr);
        throw new Error("No se pudo arrancar la red Besu.");
    }

    console.log("✅ Red Besu arrancada correctamente.");
};

export const deleteNetwork = async () => {
    console.log("🗑️ Borrando la red Besu...");

    const containers = shell.exec("docker ps -aq --filter name=nodo", { silent: true }).stdout.trim();
    if (containers) {
        shell.exec("docker stop $(docker ps -aq --filter name=nodo)");
        shell.exec("docker rm $(docker ps -aq --filter name=nodo)");
    } else {
        console.log("⚠️ No hay contenedores para eliminar.");
    }

    const networkExists = shell.exec("docker network ls --filter name=redBesu -q", { silent: true }).stdout.trim();
    if (networkExists) {
        shell.exec("docker network rm redBesu");
    } else {
        console.log("⚠️ La red redBesu no existe.");
    }

    shell.exec("docker volume prune -f");

    console.log("✅ Red Besu eliminada completamente.");
};

