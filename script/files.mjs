import { keccak256 } from 'ethers';
import elliptic from 'elliptic';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para generar claves con curva elíptica secp256k1
async function createKeys(ip) {
    const ec = new elliptic.ec('secp256k1');
    const keyPair = ec.genKeyPair();  // Generar un par de claves
    const privateKey = keyPair.getPrivate('hex');
    const publicKey = keyPair.getPublic('hex');

    // Convertir el publicKey a Buffer y luego pasar a keccak256
    const publicKeyBuffer = keccak256(Buffer.from(publicKey.slice(2), 'hex'));
    const address = publicKeyBuffer.toString("hex").slice(-40);

    // Construir el enode (Ethereum Node Identifier)
    const enode = `enode://${publicKey.slice(2)}@${ip}:30303`;

    console.log("Generando claves con curva elíptica secp256k1...");
    console.log("Claves generadas correctamente.");

    // Crear el directorio 'network/bootnode' en la raíz del proyecto
    const outputDir = path.resolve(__dirname, '..', 'network', 'bootnode');  // Carpeta donde se guardarán los archivos
    console.log(`Creando archivos en el directorio: ${outputDir}`);

    try {
        await fs.mkdir(outputDir, { recursive: true });  // Crear directorio si no existe

        // Escribir los archivos
        await fs.writeFile(path.join(outputDir, "key.priv"), privateKey);
        await fs.writeFile(path.join(outputDir, "key.pub"), publicKey);
        await fs.writeFile(path.join(outputDir, "address"), address);
        await fs.writeFile(path.join(outputDir, "enode"), enode);

        console.log("Archivos creados correctamente.");
    } catch (err) {
        console.error("Error al crear los archivos:", err);
    }
}

// Obtener los parámetros pasados desde el script
const [,, ip] = process.argv;

if (ip) {
    createKeys(ip);  // Ejecutar la creación de claves
} else {
    console.log("Uso incorrecto. Usa:");
    console.log("node files.mjs <IP>");
}
