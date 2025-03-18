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
    const result = shell.exec(`bash ${SCRIPT_PATH} ${numNodes} ${chainId} ${extraAccount}`, { silent: false });

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

// const ADD_NODE_SCRIPT = path.join(__dirname, "../../script/addNode.sh");

// export const addNode = async () => {
//     console.log("➕ Agregando un nuevo nodo a la red Besu...");

//     if (!fs.existsSync(ADD_NODE_SCRIPT)) {
//         console.error(`❌ Error: No se encuentra el script ${ADD_NODE_SCRIPT}`);
//         throw new Error("No se pudo encontrar el script para agregar nodos.");
//     }

//     try {
//         shell.chmod("+x", ADD_NODE_SCRIPT);
//     } catch (error) {
//         console.error("❌ Error al dar permisos al script:", error);
//     }

//     console.log("🚀 Ejecutando el script para agregar un nodo...");
//     const result = shell.exec(`bash ${ADD_NODE_SCRIPT}`, { silent: false });

//     if (result.code !== 0) {
//         console.error("❌ Error al agregar nodo:", result.stderr);
//         throw new Error("No se pudo agregar el nodo a la red Besu.");
//     }

//     console.log("✅ Nodo agregado correctamente.");
// };

const ADD_NODE_SCRIPT = path.join(__dirname, "../../script/add_node.sh");
const NODE_DIR = path.join(__dirname, "../../besu");

export const addNode = async () => {
    console.log("➕ Agregando un nuevo nodo a la red Besu...");

    if (!fs.existsSync(ADD_NODE_SCRIPT)) {
        console.error(`❌ Error: No se encuentra el script en la ruta: ${ADD_NODE_SCRIPT}`);
        throw new Error("No se pudo encontrar el script para agregar nodos.");
    }

    try {
        shell.chmod("+x", ADD_NODE_SCRIPT);
    } catch (error) {
        console.error("❌ Error al dar permisos al script:", error);
    }

    // 📌 Obtener el número del nuevo nodo
    let nodeNumber = await getNextNodeNumber();

    if (!nodeNumber || isNaN(nodeNumber)) {
        console.error("⚠️ Error al obtener el número del nuevo nodo. Se asignará 1 por defecto.");
        nodeNumber = 1;
    }

    console.log(`🚀 Ejecutando el script para agregar nodo número: ${nodeNumber}`);

    const result = shell.exec(`bash ${ADD_NODE_SCRIPT} ${nodeNumber}`, { silent: false });

    if (result.code !== 0) {
        console.error("❌ Error al agregar nodo:", result.stderr);
        throw new Error("No se pudo agregar el nodo a la red Besu.");
    }

    console.log("✅ Nodo agregado correctamente.");
};

// 📌 Función para obtener el siguiente número de nodo
const getNextNodeNumber = async (): Promise<number> => {
    if (!fs.existsSync(NODE_DIR)) {
        console.log("⚠️ No existe la carpeta de nodos. Se asignará el nodo 1.");
        return 1;
    }

    const existingNodes = fs.readdirSync(NODE_DIR)
        .filter(folder => folder.startsWith("nodo"))
        .map(folder => parseInt(folder.replace("nodo", ""), 10))
        .filter(num => !isNaN(num));

    const nextNode = existingNodes.length > 0 ? Math.max(...existingNodes) + 1 : 1;

    console.log(`🔍 Último nodo detectado: ${Math.max(...existingNodes, 0)}, siguiente nodo: ${nextNode}`);

    return nextNode;
};