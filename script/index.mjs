import { keccak256 } from 'ethers';
import elliptic from 'elliptic';  
import fs from 'fs/promises';
import fetch from 'node-fetch';  
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para generar claves con curva elíptica secp256k1
function createKeys(ip, folder) {
    const ec = new elliptic.ec('secp256k1');
    const keyPair = ec.genKeyPair();  // Generar un par de claves
    const privateKey = keyPair.getPrivate('hex');
    const publicKey = keyPair.getPublic('hex');

    // Convertir el publicKey a Buffer y luego pasar a keccak256
    const publicKeyBuffer = keccak256(Buffer.from(publicKey.slice(2), 'hex'));
    const address = publicKeyBuffer.toString("hex").slice(-40);

    // Construir el enode (Ethereum Node Identifier)
    const enode = `enode://${publicKey.slice(2)}@${ip}:30303`;

    // Imprimir resultados
    console.log("🔑 Generando claves con curva elíptica secp256k1...");
    console.log("✅ Claves generadas correctamente.");

    // Crear la carpeta especificada si no existe
    const outputDir = path.resolve(folder);  // Carpeta donde se guardarán los archivos
    fs.mkdir(outputDir, { recursive: true }).then(() => {
        fs.writeFile(path.join(outputDir, "key.priv"), privateKey);
        fs.writeFile(path.join(outputDir, "key.pub"), publicKey);
        fs.writeFile(path.join(outputDir, "address"), address);
        fs.writeFile(path.join(outputDir, "enode"), enode);
    }).catch((err) => {
        console.error("❌ Error al crear los archivos en la carpeta", outputDir, err);
    });
}

// Función para obtener el balance de una dirección Ethereum
async function getBalance(url, address) {
    const data = await callApi(url, "eth_getbalance", [address, "latest"]);
    return BigInt(data.result);  // Retorna el balance en formato BigInt
}

// Función para hacer llamadas a la API JSON-RPC de Ethereum
async function callApi(url, method, params) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: 1
        })
    });
    const json = await response.json();
    return json;  // Retorna la respuesta de la API en formato JSON
}

// Ejecutar según argumentos de CLI
const [,, command, arg1, arg2] = process.argv;

switch (command) {
    case "createKeys":
        if (arg1 && arg2) {
            createKeys(arg1, arg2);  // Pasamos tanto la IP como la carpeta
        } else {
            console.log("❌ Uso incorrecto. Usa:");
            console.log("   node index.mjs createKeys <IP> <Carpeta>");
        }
        break;
    case "getBalance":
        if (arg1 && process.argv[3]) {
            const url = arg1; // La URL del nodo Ethereum (por ejemplo, 'http://localhost:8545')
            const address = process.argv[3]; // La dirección Ethereum a consultar
            getBalance(url, address).then(balance => {
                console.log("🔹 Balance de la dirección", address, ": ", balance.toString());
            }).catch(err => {
                console.error("❌ Error al obtener el balance:", err);
            });
        } else {
            console.log("❌ Uso incorrecto. Usa:");
            console.log("   node index.mjs getBalance <URL> <Dirección Ethereum>");
        }
        break;
    default:
        console.log("❌ Comando no reconocido. Usa:");
        console.log("   node index.mjs createKeys <IP> <Carpeta>");
        console.log("   node index.mjs getBalance <URL> <Dirección Ethereum>");
}
