import pkg from "elliptic";
// 
const { ec: EC } = pkg;

import { Buffer } from "buffer";
import keccak256 from "keccak256";
import fs from "fs";

function createKeysAndEnode(ip, port) {
  // Crear llaves
  // Crear curva elíptica sep256k1 (la que usa Ethereum y por lo tanto también la que usa Besu por que Besu se construye sobre Ethereum)
  const ec = new EC("secp256k1");
  // Crear pares de llaves
  const keyPair = ec.genKeyPair();
  // Obtener llave privada
  const privateKey = keyPair.getPrivate("hex");
  // Obtener llave pública
  const publicKey = keyPair.getPublic("hex");

  // Otener address
  const publicKeyBuffer = keccak256(Buffer.from(publicKey.slice(2), "hex"));
  // Obtener los últimos 20 bytes
  // 40 caracteres hexadecimales son equibalentes a 20 bytes
  // Cuando utilizamos slice con un start negativo se comienza a contar de derecha a izquierda y el finl default es el último caracter de la cadena
  const address = publicKeyBuffer.toString("hex").slice(-40);

  // Contruimos el enode
  const enode = `enode://${publicKey.slice(2)}@${ip}:${port}`;

  return {
    privateKey,
    publicKey,
    address,
    enode,
  }
}

function createKeys() {
    // Crear llaves
    // Crear curva elíptica sep256k1 (la que usa Ethereum y por lo tanto también la que usa Besu por que Besu se construye sobre Ethereum)
    const ec = new EC("secp256k1");
    // Crear pares de llaves
    const keyPair = ec.genKeyPair();
    // Obtener llave privada
    const privateKey = keyPair.getPrivate("hex");
    // Obtener llave pública
    const publicKey = keyPair.getPublic("hex");
  
    // Otener address
    const publicKeyBuffer = keccak256(Buffer.from(publicKey.slice(2), "hex"));
    // Obtener los últimos 20 bytes
    // 40 caracteres hexadecimales son equibalentes a 20 bytes
    // Cuando utilizamos slice con un start negativo se comienza a contar de derecha a izquierda y el finl default es el último caracter de la cadena
    const address = publicKeyBuffer.toString("hex").slice(-40);
  
    return {
      privateKey,
      publicKey,
      address,
    }
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'createKeysAndEnode':
            let enodeIP = args[1];
            let enodePort = args[2];
            var directory = args[3];

            if (!enodeIP) {
                console.error("IP is required for creating the enode");
                process.exit(1);
            } else if (!directory) {
                console.error("Directory is required for saving the keys and enode");
                process.exit(1);
            } else if (!enodePort) {
                console.error("Port is required for creating the enode");
                process.exit(1);
            }
            var keys = createKeysAndEnode(enodeIP, enodePort);
            fs.writeFileSync(`${directory}/key`, keys.privateKey);
            fs.writeFileSync(`${directory}/pub`, keys.publicKey);
            fs.writeFileSync(`${directory}/address`, keys.address);
            fs.writeFileSync(`${directory}/enode`, keys.enode);
            console.log("Keys and enode created successfully");
            break;
        case 'createKeys':
            var directory = args[1];
            if (!directory) {
                console.error("Directory is required for saving the keys and enode");
                process.exit(1);
            }
            var keys = createKeys();
            fs.writeFileSync(`${directory}/key`, keys.privateKey);
            fs.writeFileSync(`${directory}/pub`, keys.publicKey);
            fs.writeFileSync(`${directory}/address`, keys.address);
            console.log("Keys created successfully");
            break;
        default:
            console.log("Please provide a valid command");
            console.log("Valid commands are:");
            console.log("createKeysAndEnode <enodeIP> <enodePort> <directory>");
            console.log("createKeys <directory>");
            process.exit(0);
    }
}

main();