import { Buffer } from 'buffer';
import keccak256 from 'keccak256';
import fs from  'fs';
import pkg from 'elliptic';
const { ec: EC } = pkg;
import { ethers } from "ethers";
import { exec } from 'child_process';
import path from 'path';
import { randomBytes } from 'crypto';
import { execSync } from 'child_process';

async function callAPI(url, method, params) {
                
    const response = await fetch (url, {
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
    return json;    
}

function createKeys(ip,port){
    //curva, eth, btc
    const ec = new EC('secp256k1');
    // generate a key pair
    const keyPair = ec.genKeyPair();
    const privateKey = keyPair.getPrivate('hex')    
    const publicKey = keyPair.getPublic('hex');
    //remove 2 characters, compute hash with keccak257 (no sha3)
    const pubKeyBuffer = keccak256(Buffer.from(publicKey.slice(2), 'hex'));
    //get last 20 bytes or last 40 chars
    const address = pubKeyBuffer.toString("hex").slice(-40)
    //get enode
    const enode = `enode://${publicKey.slice(2)}@${ip}:${port}`

    return {
        privateKey,
        publicKey,
        address,
        enode
    }
}

async function getBalance(url, address) {
    //console.log("Entra en getBalance()")
    try{
        const data = await callAPI(url,"eth_getBalance", [address,"latest"]);
        return BigInt(data.result);
    } catch(error){
        console.error('Error getting balance method getBalance():', error);
        process.exit(1);
    }
}

async function transferFrom(url, fromPrivate, to, amount) {
    //Create a wallet from the private key
    const wallet = new ethers.Wallet(fromPrivate);
    //Connect wallet to the JSON-RPC provider.
    const provider = new ethers.JsonRpcProvider(url, {
        chainId: 13371337,
        name: "private"
    });
    const connectedWallet = wallet.connect(provider);
    //Create and send the transaction.
    const tx = await connectedWallet.sendTransaction({
        to: to,
        value: ethers.parseEther(amount.toString())
    });

    //Wait from transation to be mined.
    const receipt = await tx.wait();

    return receipt;
}

async function getNextworkInfo(url){
    const version = await callAPI(url,"net_version", [])
    const peerCount = await callAPI(url,"net_peerCount", [])
    return  {
        version,
        peerCount
    };
}

// Borro la carpeta de los nodos asociados a la red, cuando quiero borrar la red.
function deleteAllNodeFolders(networkName) {
    const networkPath = `./networks/${networkName}`;

    if (fs.existsSync(networkPath)) {
        console.log(`Buscando carpetas de nodos en la red '${networkName}'...`);

        // Leer las subcarpetas dentro de la carpeta de la red
        const nodeFolders = fs.readdirSync(networkPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory()) // Solo selecciona directorios
            .map(dirent => path.join(networkPath, dirent.name));

        if (nodeFolders.length > 0) {
            console.log(`Se encontraron carpetas de nodos:\n${nodeFolders.join('\n')}`);
            nodeFolders.forEach(folder => {
                console.log(`Eliminando la carpeta del nodo '${folder}'...`);
                fs.rmSync(folder, { recursive: true, force: true });
                console.log(`Carpeta '${folder}' eliminada exitosamente.`);
            });
        } else {
            console.log(`No se encontraron carpetas de nodos en la red '${networkName}'.`);
        }
    } else {
        console.log(`La ruta de la red '${networkName}' no existe. No se requiere eliminar carpetas.`);
    }
}

function generateNetworkName() {
    const randomHex = randomBytes(4).toString('hex');
    return `red-${randomHex}`;
}

async function executeCommand(command) {
    return new Promise((resolve, reject) => {
        console.log(`EJECUTANDO COMANDO: ${command}`);
        
        const process = exec(command, { 
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true 
        }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error ejecutando comando: ${command}`, error);
                console.error('STDERR:', stderr);
                reject(error);
            } else {
                console.log('STDOUT:', stdout);
                resolve(stdout);
            }
        });

        // Asegurar que se muestren todos los streams
        process.stdout.on('data', (data) => {
            console.log('STDOUT DATA:', data.toString().trim());
        });

        process.stderr.on('data', (data) => {
            console.error('STDERR DATA:', data.toString().trim());
        });
    });
}

async function createMultipleNodes(numNodes = 5) {
    //const networkName = generateNetworkName();
    const networkName = "besu-network"
    
    console.log(`Creando red: ${networkName}`);
    console.log(`Creando ${numNodes} nodos...`);

    try {
        for (let i = 1; i <= numNodes; i++) {
            const nodeName = `nodo${i}`;
            
            console.log(`Creando nodo ${nodeName} en la red ${networkName}`);
            
            // Usar execSync para ver la salida completa
            try {
                const scriptOutput = execSync(`./script.sh ${networkName} ${nodeName}`, { 
                    stdio: 'inherit',
                    cwd: process.cwd()
                });
                //console.log(`Salida del script para ${nodeName}:`, scriptOutput);
            } catch (error) {
                console.error(`Error ejecutando script.sh para ${nodeName}:`, error);
                throw error;
            }
            
            // Retardo para inicialización
            console.log(`Esperando unos segundos para que el nodo ${nodeName} se inicialice completamente...`);
            await new Promise(resolve => setTimeout(resolve, 15000));

            // ... resto del código anterior ...
        }
        
        console.log(`Red ${networkName} creada con ${numNodes} nodos`);
        return networkName;
    } catch (error) {
        console.error('Error al crear la red:', error);
        throw error;
    }
}

// Command line handling
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch(command){
        case 'create-keys':
            const ip = args[1];
            const port = args[2];
            //console.log("IP create-keys:", ip);
            //console.log("PORT create-keys:", port);
            if(!ip){
                console.error('IP address required for create-keys');
                process.exit(1);
            }

            const keys = createKeys(ip,port);
            fs.writeFileSync("./key.priv",keys.privateKey);
            fs.writeFileSync("./key.pub",keys.publicKey);
            fs.writeFileSync("./address",keys.address);
            fs.writeFileSync("./enode",keys.enode);
            console.log("Keys create successfully");
        break;

        case 'create-network':
            const numNodes = parseInt(args[1]) || 5;  // Por defecto 5 nodos

            try {
                const networkName = await createMultipleNodes(numNodes);
                console.log(`Red creada: ${networkName}`);
            } catch (error) {
                console.error('Error creating network:', error);
                process.exit(1);
            }
        break;

        case 'network-info':
            const url = args[1];
            const info = await getNextworkInfo(url);
            console.log('Network Info:', info);
            break;
        
        case 'balance':
            const balanceAddress = args[1];
            const urlBalance = args[2];
            //console.log('URL:', urlBalance); // Esto debería mostrar la URL recibida.

            if (!balanceAddress) {
                console.error('Usage: balance [url] <address>');
                process.exit(1);
            }
            try {
                //console.log(urlBalance)
                const balance = await getBalance(urlBalance, balanceAddress);
                console.log('Balance:', ethers.formatEther(balance), 'ETH');
            } catch(error){
                console.error('Error getting balance:', error);
                process.exit(1);
            }
            break;
        
        case 'transfer':
            const fromPrivateKey = args[1];
            const toAddress = args[2];
            const amount = args[3];
            const urlTransfer = args[4];    
            //console.log('URL transfer:', urlTransfer); // Esto debería mostrar la URL recibida. 
            if(!toAddress || !amount || !fromPrivateKey){
                console.error('Usage: transfer <to-address> <amount> <from-private-key>')
                process.exit(1);
            }
            try{
                const tx = await transferFrom(urlTransfer, fromPrivateKey, toAddress, amount);
                console.log('Transaction sent:', tx);                
            } catch(error){
                console.error('Error sending transaction', error);
                process.exit(1);
            }
            break;  
            
        case 'delete-node':
            const networkNameForNode = args[1];
            const nodeName = args[2];

            if (!networkNameForNode || !nodeName) {
                console.error('Usage: delete-node <network-name> <node-name>');
                process.exit(1);
            }

            console.log(`Eliminando el nodo '${nodeName}' de la red '${networkNameForNode}'...`);
            //const { exec } = require('child_process');
            //const fs = require('fs');
            //const path = require('path');

            // Nombre completo del contenedor
            const containerName = `${networkNameForNode}-${nodeName}`;

            // Eliminar el contenedor Docker
            exec(`docker ps -aq --filter "name=${containerName}"`, (err, containerId, stderr) => {
                if (err || !containerId.trim()) {
                    console.error(`El contenedor del nodo '${nodeName}' no existe o no pudo ser encontrado.`);
                } else {
                    console.log(`Se encontró el contenedor '${containerName}'. Eliminando...`);
                    exec(`docker rm -f ${containerId.trim()}`, (err, stdout, stderr) => {
                        if (err) {
                            console.error(`Error al eliminar el contenedor '${containerName}':`, stderr);
                        } else {
                            console.log(`Contenedor '${containerName}' eliminado exitosamente.`);
                        }
                    });
                }
            });

            // Eliminar la carpeta de configuración del nodo
            const folderPath = `./networks/${networkNameForNode}/${nodeName}`;
            if (fs.existsSync(folderPath)) {
                console.log(`Eliminando la carpeta del nodo '${folderPath}'...`);
                fs.rmSync(folderPath, { recursive: true, force: true });
                console.log(`Carpeta '${folderPath}' eliminada exitosamente.`);
            } else {
                console.log(`La carpeta del nodo '${folderPath}' no existe. No se requiere eliminar.`);
            }

            break;
    

        case 'delete-network':
            const networkName = args[1];
            if (!networkName) {
                console.error('Usage: delete-network <network-name>');
                process.exit(1);
            }
            
            console.log(`Verificando la existencia de la red '${networkName}'...`);            
            
            // Comprobar si la red existe
            exec(`sudo docker network inspect ${networkName}`, (err, stdout, stderr) => {
                if (err) {
                console.error(`La red '${networkName}' no existe o no pudo ser inspeccionada.`);
                process.exit(1);
                } else {
                console.log(`La red '${networkName}' fue encontrada. Buscando contenedores asociados...`);
                
                // Buscar contenedores asociados a la red
                exec(`sudo docker ps -aq --filter "network=${networkName}"`, (err, containerIds, stderr) => {
                    if (err) {
                    console.error(`Error al buscar contenedores asociados a la red '${networkName}':`, stderr);
                    process.exit(1);
                    }
                    
                    // Eliminar contenedores uno por uno
                    if (containerIds.trim() !== "") {
                    const containers = containerIds.trim().split(/\s+/);
                    console.log(`Se encontraron ${containers.length} contenedores asociados a la red '${networkName}'`);
                    
                    // Función para eliminar contenedores secuencialmente
                    const removeContainers = (index) => {
                        if (index >= containers.length) {
                        console.log(`Resumen: ${successCount} contenedores eliminados, ${failCount} fallidos.`);
                        
                        // Eliminar carpeta del nodo si todos fueron exitosos
                        if (failCount === 0) {
                            deleteAllNodeFolders(networkName);
                        } else {
                            console.log('No se eliminaron todas las carpetas de los nodos debido a errores.');
                        }
                        
                        // Continuar con la eliminación de la red después de procesar todos los contenedores
                        console.log('Esperando 5 segundos antes de eliminar la red...');
                        setTimeout(() => {
                            // Eliminar la red
                            exec(`sudo docker network rm ${networkName}`, (err, stdout, stderr) => {
                            if (err) {
                                console.error(`Error al eliminar la red '${networkName}':`, stderr);
                                process.exit(1);
                            } else {
                                console.log(`La red '${networkName}' se ha eliminado exitosamente.`);
                            }
                            });
                        }, 5000);
                        
                        return;
                        }
                        
                        const containerId = containers[index];
                        console.log(`Eliminando contenedor: ${containerId}`);
                        
                        exec(`sudo docker rm -f ${containerId}`, (err, stdout, stderr) => {
                        if (err) {
                            console.error(`Error al eliminar contenedor ${containerId}: ${err.message}`);
                            failCount++;
                        } else {
                            console.log(`Contenedor ${containerId} eliminado exitosamente.`);
                            successCount++;
                        }
                        
                        // Pequeña pausa antes de continuar con el siguiente contenedor
                        setTimeout(() => {
                            removeContainers(index + 1);
                        }, 1000);
                        });
                    };
                    
                    // Inicializar contadores
                    let successCount = 0;
                    let failCount = 0;
                    
                    // Comenzar el proceso de eliminación
                    removeContainers(0);
                    } else {
                    console.log(`No se encontraron contenedores asociados a la red '${networkName}'.`);
                    
                    // Si no hay contenedores, eliminar la red directamente
                    console.log('Esperando 5 segundos antes de eliminar la red...');
                    setTimeout(() => {
                        // Eliminar la red
                        exec(`sudo docker network rm ${networkName}`, (err, stdout, stderr) => {
                        if (err) {
                            console.error(`Error al eliminar la red '${networkName}':`, stderr);
                            process.exit(1);
                        } else {
                            console.log(`La red '${networkName}' se ha eliminado exitosamente.`);

                            // Ruta de la carpeta de la red
                            const networkFolderPath = path.join(process.cwd(), 'networks', networkName);
                            
                            // Eliminar la carpeta de la red
                            deleteDirectorySync(networkFolderPath);
                            
                            console.log(`Proceso de eliminación completado para la red '${networkName}'.`);
                        }
                        });
                    }, 5000);
                    }
                });
                }
            });
            break;
            
        default:
            console.log(`
                Available commands:
                create-network <nombre-red>
                create-keys <ip> - Create node keys for given IP address
                network-info [url] - Get network information (defualts to http://localhost:8888)
                transfer <fromPrivate> <to> <amount> - Transfer funds from one account to another
                delete-network <network-name>
                delete-node <node-name>
        `   )
        break;
            
    }
}

main();