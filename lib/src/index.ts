import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import axios from 'axios';
import { ethers } from 'ethers';
import { NetworkConfigInterface } from './types';
import { defaultNetworkConfig } from './defaultConfig';

// Exportar la configuración predeterminada para que el usuario pueda usarla
export { defaultNetworkConfig };

// Helper: Print messages
export const printMessage = (message: string): void => {
  console.log(`\x1b[32m[INFO]\x1b[0m ${message}`);
};

export const printError = (message: string): void => {
  console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
};

export const printWarning = (message: string): void => {
  console.warn(`\x1b[33m[WARNING]\x1b[0m ${message}`);
};

// Create a temporary directory for transaction-related files
const createTempDir = (): string => {
  const tempDir = path.join(process.cwd(), 'temp_tx');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  return tempDir;
};

// Clean existing files and containers
export const cleanExistingFiles = async (): Promise<void> => {
  printMessage("Cleaning existing files and folders...");
  
  try {
    // Stop and remove existing Docker containers using Docker CLI
    printMessage("Stopping and removing existing Docker containers...");
    
    // Get container IDs and handle empty result
    try {
      const containerIds = execSync("docker ps -a --filter name=node* -q").toString().trim();
      
      if (containerIds) {
        const containerList = containerIds.split('\n');
        for (const containerId of containerList) {
          try {
            execSync(`docker stop ${containerId}`);
            execSync(`docker rm ${containerId}`);
          } catch (err) {
            printWarning(`Error stopping/removing container ${containerId}: ${err}`);
            // Continue with other containers
          }
        }
      }
    } catch (error) {
      printWarning("No containers to remove or error listing containers");
    }
    
    printMessage("Docker containers removed.");
    
    // Remove configuration files in current directory (NOT package.json of our project)
    printMessage("Removing configuration files...");
    const filesToRemove = [
      'genesis.json', 
      'config.toml', 
      'config-fullnode.toml', 
      'sign_tx.js'
    ];
    
    for (const file of filesToRemove) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
    
    // Clean temp directory if it exists
    const tempDir = path.join(process.cwd(), 'temp_tx');
    if (fs.existsSync(tempDir)) {
      fs.removeSync(tempDir);
    }
    
    printMessage("Configuration files removed.");
    
    // Remove node directories
    printMessage("Removing node directories...");
    const dirs = fs.readdirSync('.').filter(file => 
      file.startsWith('node') && fs.statSync(file).isDirectory() && !file.includes('node_modules')
    );
    
    for (const dir of dirs) {
      fs.removeSync(dir);
    }
    printMessage("Node directories removed");
    
    printMessage("Cleanup completed. The environment is ready for a new installation.");
  } catch (error) {
    printError(`Error cleaning environment: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Create Docker network
export const createDockerNetwork = (config: NetworkConfigInterface = defaultNetworkConfig): void => {
  const networkName = config.network.networkName;
  printMessage(`Creating Docker network '${networkName}'...`);
  
  try {
    // Check if network exists using Docker CLI
    try {
      const networkList = execSync("docker network ls --format '{{.Name}}'").toString();
      
      if (networkList.includes(networkName)) {
        printWarning(`The '${networkName}' network already exists. The existing one will be used.`);
        return;
      }
    } catch (error) {
      // Continue if we can't list networks
      printWarning("Could not check existing networks, attempting to create new one");
    }
    
    // Create network using Docker CLI with the name from config
    execSync(`docker network create ${networkName}`);
    printMessage(`Network '${networkName}' created successfully.`);
  } catch (error) {
    printError(`Error creating Docker network: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Create directory for the node and generate its key
export const createNodeDirectory = (nodeNum: number): void => {
  const nodeDir = `node${nodeNum}`;
  
  printMessage(`Creating directory for node ${nodeNum}...`);
  
  try {
    // Create directory if it doesn't exist
    fs.mkdirpSync(nodeDir);
    
    // Generate key and address for the node (using Besu via execSync)
    printMessage(`Generating key and address for node ${nodeNum}...`);
    execSync(`besu --data-path=${nodeDir} public-key export-address --to=${nodeDir}/address`);
    
    printMessage(`Node ${nodeNum} configured correctly.`);
  } catch (error) {
    printError(`Error creating node directory: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Create genesis.json file
export const createGenesisFile = (config: NetworkConfigInterface = defaultNetworkConfig): void => {
  printMessage("Creating genesis.json file...");
  
  try {
    // Get the address of the first node for extradata and alloc
    const nodeAddress = fs.readFileSync('node1/address', 'utf8').trim();
    const nodeAddressStrip = nodeAddress.replace('0x', '');
    
    // Create the genesis.json file using the configuration
    const genesisFile = {
      config: {
        chainID: config.chain.chainId,
        londonBlock: config.chain.londonBlock,
        clique: {
          blockperiodseconds: config.chain.clique.blockPeriodSeconds,
          epochlength: config.chain.clique.epochLength,
          createemptyblocks: config.chain.clique.createEmptyBlocks
        }
      },
      extradata: `0x0000000000000000000000000000000000000000000000000000000000000000${nodeAddressStrip}0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`,
      gasLimit: config.chain.gasLimit,
      difficulty: config.chain.difficulty,
      alloc: {
        [nodeAddress]: {
          balance: "0x200000000000000000000000000000000000000000000000000000000000000"
        }
      }
    };
    
    fs.writeFileSync('genesis.json', JSON.stringify(genesisFile, null, 2));
    printMessage("genesis.json file created successfully.");
  } catch (error) {
    printError(`Error creating genesis file: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Create validator config file
export const createValidatorConfig = (): void => {
  printMessage("Creating config.toml file for the validator node...");
  
  const configContent = `genesis-file = "/data/genesis.json"
# Networking
p2p-host = "0.0.0.0"
p2p-port = 30303
p2p-enabled = true
# IPC configuration
# JSON-RPC
# Node discovery
discovery-enabled = true
rpc-http-enabled = true
rpc-http-host = "0.0.0.0"
rpc-http-port = 8545
rpc-http-cors-origins = ["*"]
rpc-http-api = [
  "ETH",
  "NET",
  "CLIQUE",
  "ADMIN",
  "TRACE",
  "DEBUG",
  "TXPOOL",
  "PERM",
]
host-allowlist = ["*"]`;
  
  try {
    fs.writeFileSync('config.toml', configContent);
    printMessage("config.toml file for the validator node created successfully.");
  } catch (error) {
    printError(`Error creating validator config: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Launch validator node
export const launchValidatorNode = (config: NetworkConfigInterface = defaultNetworkConfig): void => {
  printMessage("Launching the validator node...");
  
  try {
    const workingDir = process.cwd();
    const basePort = config.network.basePort;
    const dockerImage = config.tech.dockerImage;
    const networkName = config.network.networkName;
    
    // Launch validator node using Docker CLI with execSync
    execSync(`
      docker run -d \
        --name node1 \
        --network ${networkName} \
        -p ${basePort}:8545 \
        -v "${workingDir}:/data" \
        ${dockerImage} \
        --config-file=/data/config.toml \
        --data-path=/data/node1/data \
        --node-private-key-file=/data/node1/key \
        --genesis-file=/data/genesis.json
    `);
    
    printMessage("Validator node container launched successfully.");
    printMessage(`Waiting for the validator node to start (${config.tech.validatorStartupTime} seconds)...`);
    
    // Wait for the node to start
    execSync(`sleep ${config.tech.validatorStartupTime}`);
  } catch (error) {
    printError(`Error launching validator node: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Get validator enode
export const getValidatorEnode = (): string => {
  printMessage("Getting the enode of the validator node...");
  
  try {
    // Get the IP of the validator node using Docker CLI
    const nodeIP = execSync(`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' node1`)
      .toString().trim();
    
    if (!nodeIP) {
      throw new Error("Could not find IP address for validator node");
    }
    
    printMessage(`Validator node IP: ${nodeIP}`);
    
    // Export the public key using the corrected approach
    printMessage("Exporting the public key with besu...");
    // Using the solution that works as suggested in the prompt
    const nodePubKey = execSync(`besu --data-path=node1 public-key export 2>/dev/null | tail -1`)
      .toString().trim().replace(/^0x/, '');
    
    // Verify that the key has 128 characters
    if (nodePubKey && nodePubKey.length === 128) {
      const enodeFinal = `enode://${nodePubKey}@${nodeIP}:30303`;
      printMessage(`Enode generated successfully: ${enodeFinal}`);
      return enodeFinal;
    } else {
      throw new Error(`Invalid public key format: "${nodePubKey}" (length: ${nodePubKey.length})`);
    }
  } catch (error) {
    printError(`Error getting validator enode: ${error instanceof Error ? error.message : String(error)}`);
    printError("Make sure the node has been initialized correctly and that the public key is available.");
    throw error;
  }
};

// Create fullnode config
export const createFullnodeConfig = (enodeFinal: string): void => {
  printMessage("Creating config-fullnode.toml file for the full nodes...");
  
  const configContent = `genesis-file = "/data/genesis.json"
# Networking
p2p-host = "0.0.0.0"
p2p-port = 30303
p2p-enabled = true
# Bootstrap node connection
bootnodes = [
  "${enodeFinal}",
]
# JSON-RPC
rpc-http-enabled = true
rpc-http-host = "0.0.0.0"
rpc-http-port = 8545
rpc-http-cors-origins = ["*"]
rpc-http-api = ["ETH", "NET", "CLIQUE", "ADMIN", "DEBUG", "TXPOOL"]
host-allowlist = ["*"]
# Disable mining for non-validator nodes
miner-enabled = false
# Sync mode (full sync for non-validators)
sync-mode = "FULL"`;

  try {
    fs.writeFileSync('config-fullnode.toml', configContent);
    printMessage("config-fullnode.toml file created successfully.");
  } catch (error) {
    printError(`Error creating fullnode config: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Launch fullnode containers
export const launchFullnodeContainers = (config: NetworkConfigInterface = defaultNetworkConfig): void => {
  const fullnodeCount = config.nodes.fullnodes;
  printMessage(`Launching ${fullnodeCount} fullnode containers...`);
  
  try {
    const workingDir = process.cwd();
    const basePort = config.network.basePort;
    const dockerImage = config.tech.dockerImage;
    const networkName = config.network.networkName;
    
    // Launch the fullnodes using Docker CLI with execSync
    for (let i = 0; i < fullnodeCount; i++) {
      const nodeNum = 2 + i; // Empezar desde node2 (después del validador)
      const nodeName = `node${nodeNum}`;
      const port = basePort + nodeNum - 1;
      
      printMessage(`Launching container for fullnode ${nodeName} on port ${port}...`);
      
      execSync(`
        docker run -d \
          --name ${nodeName} \
          --network ${networkName} \
          -p ${port}:8545 \
          -v "${workingDir}:/data" \
          ${dockerImage} \
          --config-file=/data/config-fullnode.toml \
          --data-path=/data/${nodeName}/data
      `);
      
      printMessage(`Fullnode ${nodeName} container launched successfully.`);
    }
  } catch (error) {
    printError(`Error launching fullnode containers: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Show network information
export const showNetworkInfo = (config: NetworkConfigInterface = defaultNetworkConfig): void => {
  printMessage("Hyperledger Besu network created successfully!");
  printMessage("Network information:");
  const totalNodes = 1 + config.nodes.fullnodes; // 1 validador + nodos completos
  printMessage(`- Total number of nodes: ${totalNodes}`);
  printMessage(`- Validator node: ${config.nodes.validators}`);
  printMessage(`- Fullnodes: ${config.nodes.fullnodes}`);

  printMessage("Node access:");
  printMessage(`- Validator node: http://localhost:${config.network.basePort}`);
  
  // Mostrar información de cada nodo completo
  for (let i = 0; i < config.nodes.fullnodes; i++) {
    const nodeNum = 2 + i;
    const port = config.network.basePort + nodeNum - 1;
    printMessage(`- Fullnode ${nodeNum}: http://localhost:${port}`);
  }
};

// Get balance of an address
export const getBalance = async (address: string, config: NetworkConfigInterface = defaultNetworkConfig): Promise<string> => {
  try {
    const validatorPort = config.network.basePort;
    
    const response = await axios.post(`http://localhost:${validatorPort}`, {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1
    });
    
    const balanceHex = response.data.result;
    
    if (!balanceHex || balanceHex === '0x0') {
      return '0.00';
    }
    
    // Implementación más robusta para convertir el balance de wei a ETH
    try {
      // Convertir el balance hexadecimal a decimal
      const balanceWei = parseInt(balanceHex, 16).toString();
      
      // Convertir wei a ETH (1 ETH = 10^18 wei)
      // Si el balance tiene menos de 18 dígitos, añadir ceros a la izquierda
      const paddedBalanceWei = balanceWei.padStart(19, '0');
      
      // Dividir en parte entera y decimal
      const integerPart = paddedBalanceWei.slice(0, -18) || '0';
      const decimalPart = paddedBalanceWei.slice(-18).substring(0, 2).padEnd(2, '0');
      
      // Formatear el resultado con 2 decimales
      return `${integerPart}.${decimalPart}`;
    } catch (conversionError) {
      // Fallback: intentar usar ethers si está disponible
      try {
        const weiBalance = ethers.BigNumber.from(balanceHex);
        const ethBalance = ethers.utils.formatEther(weiBalance);
        return parseFloat(ethBalance).toFixed(2);
      } catch (ethersError) {
        printError(`Error converting balance with ethers: ${ethersError}`);
        return '0.00'; // Valor predeterminado en caso de error
      }
    }
  } catch (error) {
    printError(`Error getting balance: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * Envía una transacción desde la cuenta del nodo validador a una dirección destino
 * @param customAmount Cantidad opcional de ETH a enviar (por defecto usa el valor de config)
 * @param customDestination Dirección opcional de destino (por defecto usa el valor de config)
 * @param config Configuración personalizada de la red
 * @returns Promise con el hash de la transacción enviada
 */
export const sendTransaction = async (
  customAmount?: string,
  customDestination?: string,
  config: NetworkConfigInterface = defaultNetworkConfig
): Promise<string> => {
  const toAddress = customDestination || config.transaction.to;
  const amountEth = customAmount || config.transaction.amount;
  
  printMessage(`Sending transaction: ${amountEth} ETH to ${toAddress}`);
  
  try {
    // Create a temporary directory for transaction files
    const tempDir = createTempDir();
    const workingDir = process.cwd();
    process.chdir(tempDir); // Change to temp directory for npm operations
    
    // Create a temporary script to sign transactions
    const signTxScript = `const { Transaction } = require('@ethereumjs/tx');
const { Common } = require('@ethereumjs/common');
const { bufferToHex, toBuffer } = require('ethereumjs-util');

// Get arguments from command line
const privateKey = process.argv[2];
const nonce = process.argv[3];
const to = process.argv[4];
const value = process.argv[5];
const gasPrice = process.argv[6] || '0x3B9ACA00';
const gasLimit = process.argv[7] || '0x5208';
const chainId = parseInt(process.argv[8]) || ${config.chain.chainId}; // Usar el chainId de la configuración

// Create a Common object for the custom chain
const common = Common.custom({ chainId: chainId });

// Create the transaction
const txData = {
  nonce: nonce,
  gasPrice: gasPrice,
  gasLimit: gasLimit,
  to: to,
  value: value,
  data: '0x',
};

// Create and sign the transaction
const tx = Transaction.fromTxData(txData, { common });
const privateKeyBuffer = toBuffer(privateKey.startsWith('0x') ? privateKey : '0x' + privateKey);
const signedTx = tx.sign(privateKeyBuffer);

// Get the serialized transaction
const serializedTx = bufferToHex(signedTx.serialize());
console.log(serializedTx);`;

    fs.writeFileSync(path.join(tempDir, 'sign_tx.js'), signTxScript);
        
    // Get validator address and private key
    const validatorAddress = fs.readFileSync(path.join(workingDir, 'node1/address'), 'utf8').trim();
    const privateKey = fs.readFileSync(path.join(workingDir, 'node1/key'), 'utf8').trim().replace('0x', '');
    
    // Convertir ETH a wei sin depender de ethers
    let amountWei: string;
    try {
      // Intentar usar ethers si está disponible
      try {
        amountWei = ethers.utils.parseEther(amountEth).toHexString();
      } catch (ethersError) {
        // Implementación manual si ethers falla
        printWarning(`Using manual ETH to wei conversion: ${ethersError}`);
        
        // Parsear el valor como número de punto flotante
        const ethValue = parseFloat(amountEth);
        
        // Calcular el valor en wei (1 ETH = 10^18 wei)
        const weiValue = Math.floor(ethValue * 1e18);
        
        // Convertir a hexadecimal con prefijo '0x'
        amountWei = `0x${weiValue.toString(16)}`;
      }
    } catch (error) {
      printError(`Error converting ETH to wei: ${error}`);
      // Usar un valor predeterminado en caso de error (0.1 ETH)
      amountWei = '0x16345785d8a0000';
    }
    
    // Get the nonce for the transaction - Usar puerto configurado
    const validatorPort = config.network.basePort;
    const nonceResponse = await axios.post(`http://localhost:${validatorPort}`, {
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: [validatorAddress, 'latest'],
      id: 1
    });
    
    const nonceHex = nonceResponse.data.result;
    
    // Sign the transaction using the Node.js script
    const signedTx = execSync(`node sign_tx.js "${privateKey}" "${nonceHex}" "${toAddress}" "${amountWei}"`, { cwd: tempDir }).toString().trim();
    
    // Send the signed transaction
    const txResponse = await axios.post(`http://localhost:${validatorPort}`, {
      jsonrpc: '2.0',
      method: 'eth_sendRawTransaction',
      params: [signedTx],
      id: 1
    });
    
    // Clean up and return to original directory
    process.chdir(workingDir);
    fs.removeSync(tempDir);
    
    // Check for errors in the response
    if (txResponse.data.error) {
      throw new Error(`Error sending transaction: ${txResponse.data.error.message}`);
    }
    
    const txHash = txResponse.data.result;
    printMessage(`Transaction sent successfully. Hash: ${txHash}`);
    
    return txHash;
  } catch (error) {
    // Ensure we return to the working directory even if there's an error
    if (process.cwd().includes('temp_tx')) {
      process.chdir(process.cwd().replace(/\/temp_tx.*$/, ''));
    }
    
    // Clean up temp directory if it exists
    const tempDir = path.join(process.cwd(), 'temp_tx');
    if (fs.existsSync(tempDir)) {
      fs.removeSync(tempDir);
    }
    
    printError(`Error sending transaction: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * Añade un nuevo nodo completo a la red existente
 * @param config Configuración de la red
 * @returns Información sobre el nodo añadido
 */
export const addNode = async (
  config: NetworkConfigInterface = defaultNetworkConfig
): Promise<{nodeId: string, nodeUrl: string}> => {
  try {
    // Encontrar el número más alto actual de nodos
    const dirs = fs.readdirSync('.')
      .filter(file => file.startsWith('node') && fs.statSync(file).isDirectory() && !file.includes('node_modules'));
    
    const existingNumbers = dirs.map(dir => {
      const match = dir.match(/node(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    // Determinar el siguiente número de nodo
    const nextNodeNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const nodeName = `node${nextNodeNumber}`;
    const nodePort = config.network.basePort + nextNodeNumber - 1;
    
    printMessage(`Adding new fullnode: ${nodeName}...`);
    
    // Crear directorio y generar claves para el nuevo nodo
    createNodeDirectory(nextNodeNumber);
    
    // Asegurarse de que se ha creado el archivo de configuración para fullnodes
    if (!fs.existsSync('config-fullnode.toml')) {
      // Obtener el enode de un nodo validador existente para la conexión
      try {
        const validatorEnode = getValidatorEnode();
        createFullnodeConfig(validatorEnode);
      } catch (error) {
        printError("Failed to get validator enode or create fullnode config");
      }
    }
    
    // Lanzar el contenedor para el nuevo nodo completo
    const workingDir = process.cwd();
    execSync(`
      docker run -d \
        --name ${nodeName} \
        --network ${config.network.networkName} \
        -p ${nodePort}:8545 \
        -v "${workingDir}:/data" \
        ${config.tech.dockerImage} \
        --config-file=/data/config-fullnode.toml \
        --data-path=/data/${nodeName}/data
    `);
    
    printMessage(`Fullnode ${nodeName} added successfully. Access at http://localhost:${nodePort}`);
    
    return {
      nodeId: nodeName,
      nodeUrl: `http://localhost:${nodePort}`
    };
    
  } catch (error) {
    printError(`Error adding node: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * Elimina un nodo existente de la red
 * @param nodeNumber Número del nodo a eliminar
 * @returns Promise<void>
 */
export const removeNode = async (nodeNumber: number): Promise<void> => {
  try {
    const nodeName = `node${nodeNumber}`;
    
    printMessage(`Removing node ${nodeName}...`);
    
    // Verificar que no estamos intentando eliminar el validador principal (node1)
    if (nodeNumber === 1) {
      printError("Cannot remove validator node (node1). This would break the network.");
      throw new Error("Cannot remove validator node");
    }
    
    // Verificar que el nodo existe
    try {
      execSync(`docker inspect ${nodeName} > /dev/null 2>&1`);
    } catch (error) {
      printError(`Node ${nodeName} does not exist or is not running.`);
      throw new Error(`Node ${nodeName} not found`);
    }
    
    // Parar y eliminar el contenedor
    printMessage(`Stopping container ${nodeName}...`);
    execSync(`docker stop ${nodeName}`);
    
    printMessage(`Removing container ${nodeName}...`);
    execSync(`docker rm ${nodeName}`);
    
    // Eliminar el directorio del nodo
    if (fs.existsSync(nodeName)) {
      printMessage(`Removing node directory ${nodeName}...`);
      fs.removeSync(nodeName);
    }
    
    printMessage(`Node ${nodeName} removed successfully.`);
  } catch (error) {
    printError(`Error removing node: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * Configura una red Hyperledger Besu con los parámetros especificados
 * @param config Configuración para la red (opcional, usa defaultNetworkConfig por defecto)
 * @returns Promise con información sobre la red creada
 */
export const setupBesuNetwork = async (
  config?: NetworkConfigInterface
): Promise<{ 
  validatorUrl: string, 
  nodeUrls: string[],
  totalNodes: number,
  validators: number,
  fullNodes: number
}> => {
  // Usar la configuración proporcionada o la predeterminada
  const activeConfig = config || defaultNetworkConfig;
  
  printMessage("=== Setting up Hyperledger Besu network ===");
  
  try {
    // Clean existing files
    await cleanExistingFiles();
    
    // Create Docker network
    createDockerNetwork(activeConfig);
    
    // 3. Crear directorios para todos los nodos
    const totalNodes = activeConfig.nodes.validators + activeConfig.nodes.fullnodes;
    for (let i = 1; i <= totalNodes; i++) {
      createNodeDirectory(i);
    }
    
    // 4. Crear configuración del validador
    createGenesisFile(activeConfig);
    createValidatorConfig();
    
    // 5. Lanzar el nodo validador
    launchValidatorNode(activeConfig);
    
    // 6. Obtener el enode del validador
    const enode = getValidatorEnode();
    
    // 7. Configurar los nodos completos
    createFullnodeConfig(enode);
    
    // 8. Lanzar los nodos completos
    launchFullnodeContainers(activeConfig);
    
    // 9. Mostrar información de la red
    showNetworkInfo(activeConfig);
    
    // 10. Si está habilitado, realizar una transacción de prueba y comprobar balances
    if (activeConfig.transaction.perform) {
      printMessage("=== Realizando prueba de funcionalidad ===");
      
      // Leer la dirección del validador
      const validatorAddress = fs.readFileSync('node1/address', 'utf8').trim();
      
      // Comprobar el balance del validador
      printMessage(`Comprobando balance del validador (${validatorAddress})...`);
      const validatorBalance = await getBalance(validatorAddress, activeConfig);
      printMessage(`Balance del validador: ${validatorBalance} ETH`);
      
      // Enviar una transacción
      printMessage(`Enviando transacción de prueba a ${activeConfig.transaction.to}...`);
      const txHash = await sendTransaction(undefined, undefined, activeConfig);
      printMessage(`Transacción enviada con éxito: ${txHash}`);
      
      // Esperar a que la transacción sea minada
      printMessage("Esperando a que la transacción sea minada (10 segundos)...");
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Comprobar el balance del destinatario después de esperar
      printMessage(`Comprobando balance del destinatario (${activeConfig.transaction.to})...`);
      const recipientBalance = await getBalance(activeConfig.transaction.to, activeConfig);
      printMessage(`Balance del destinatario: ${recipientBalance} ETH`);
    }
    
    // 11. Retornar información estructurada sobre la red creada
    const nodeUrls = [];
    // URL para el validador
    nodeUrls.push(`http://localhost:${activeConfig.network.basePort}`);
    
    // URLs para los nodos completos
    for (let i = 0; i < activeConfig.nodes.fullnodes; i++) {
      const nodeNum = 2 + i;
      const port = activeConfig.network.basePort + nodeNum - 1;
      nodeUrls.push(`http://localhost:${port}`);
    }
    
    printMessage("Besu network setup completed successfully!");
    
    return {
      validatorUrl: `http://localhost:${activeConfig.network.basePort}`,
      nodeUrls: nodeUrls,
      totalNodes: totalNodes,
      validators: activeConfig.nodes.validators,
      fullNodes: activeConfig.nodes.fullnodes
    };
  } catch (error) {
    printError(`Error in network setup: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Export all functions for modular usage
export default {
  cleanExistingFiles,
  createDockerNetwork,
  createNodeDirectory,
  createGenesisFile,
  createValidatorConfig,
  launchValidatorNode,
  getValidatorEnode,
  createFullnodeConfig,
  launchFullnodeContainers,
  showNetworkInfo,
  getBalance,
  sendTransaction,
  addNode,        
  removeNode,     
  setupBesuNetwork
};

// Ejecutar la función principal si este archivo se ejecuta directamente (no importado como módulo)
if (require.main === module) {
  setupBesuNetwork()
    .then((networkInfo) => {
      printMessage('Script completed successfully');
      printMessage(`Created network with ${networkInfo.totalNodes} nodes (${networkInfo.validators} validators, ${networkInfo.fullNodes} fullnodes)`);
      printMessage(`Validator node available at: ${networkInfo.validatorUrl}`);
      printMessage('Node URLs:');
      networkInfo.nodeUrls.forEach((url, i) => {
        printMessage(`- Node ${i+1}: ${url}`);
      });
    })
    .catch((error) => {
      printError(`Script failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    });
}
