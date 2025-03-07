import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import axios from 'axios';
import { ethers } from 'ethers';
import { networkConfig } from './networkConfig';

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
export const createDockerNetwork = (): void => {
  const networkName = networkConfig.networkName; // Usar el nombre de red definido en networkConfig
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
export const createGenesisFile = (): void => {
  printMessage("Creating genesis.json file...");
  
  try {
    // Get the address of the first node for extradata and alloc
    const nodeAddress = fs.readFileSync('node1/address', 'utf8').trim();
    const nodeAddressStrip = nodeAddress.replace('0x', '');
    
    // Create the extradata with the address of the first node
    const extradata = `0x0000000000000000000000000000000000000000000000000000000000000000${nodeAddressStrip}0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`;
    
    // Create the genesis.json file
    const genesisFile = {
      config: {
        chainID: 4004,
        londonBlock: 0,
        clique: {
          blockperiodseconds: 4,
          epochlength: 30000,
          createemptyblocks: true
        }
      },
      extradata: extradata,
      gasLimit: "0x1fffffffffffff",
      difficulty: "0x1",
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
export const launchValidatorNode = (): void => {
  printMessage("Launching the validator node...");
  
  try {
    const workingDir = process.cwd();
    
    // Launch validator node using Docker CLI with execSync
    execSync(`
      docker run -d \
        --name node1 \
        --network ${networkConfig.networkName} \
        -p ${networkConfig.basePort}:8545 \
        -v "${workingDir}:/data" \
        ${networkConfig.dockerImage} \
        --config-file=/data/config.toml \
        --data-path=/data/node1/data \
        --node-private-key-file=/data/node1/key \
        --genesis-file=/data/genesis.json
    `);
    
    printMessage("Validator node container launched successfully.");
    printMessage(`Waiting for the validator node to start (15 seconds)...`);
    
    // Wait for the node to start
    execSync("sleep 15");
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
export const launchFullnodeContainers = (): void => {
  const fullnodeCount = networkConfig.fullnodes; 
  printMessage(`Launching ${fullnodeCount} fullnode containers...`);
  
  try {
    const workingDir = process.cwd();
    const basePort = networkConfig.basePort; // Puerto base de la configuración
    
    // Launch the fullnodes using Docker CLI with execSync
    for (let i = 0; i < fullnodeCount; i++) {
      const nodeNum = 2 + i; // Empezar desde node2 (después del validador)
      const nodeName = `node${nodeNum}`;
      const port = basePort + nodeNum - 1;
      
      printMessage(`Launching container for fullnode ${nodeName} on port ${port}...`);
      
      execSync(`
        docker run -d \
          --name ${nodeName} \
          --network ${networkConfig.networkName} \
          -p ${port}:8545 \
          -v "${workingDir}:/data" \
          ${networkConfig.dockerImage} \
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
export const showNetworkInfo = (): void => {
  printMessage("Hyperledger Besu network created successfully!");
  printMessage("Network information:");
  const totalNodes = 1 + networkConfig.fullnodes; // 1 validador + nodos completos
  printMessage(`- Total number of nodes: ${totalNodes}`);
  printMessage(`- Validator node: ${networkConfig.validators}`);
  printMessage(`- Fullnodes: ${networkConfig.fullnodes}`);

  printMessage("Node access:");
  printMessage(`- Validator node: http://localhost:${networkConfig.basePort}`);
  
  // Mostrar información de cada nodo completo
  for (let i = 0; i < networkConfig.fullnodes; i++) {
    const nodeNum = 2 + i;
    const port = networkConfig.basePort + nodeNum - 1;
    printMessage(`- Fullnode ${nodeNum}: http://localhost:${port}`);
  }
};

// Get balance of an address
export const getBalance = async (address: string): Promise<string> => {
  try {
    // Usar el puerto configurado en networkConfig en lugar de un valor hardcodeado
    const validatorPort = networkConfig.basePort;
    
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
    
    // Convert hex balance to decimal
    const weiBalance = ethers.BigNumber.from(balanceHex);
    // Convert wei to ETH with 2 decimal places
    const ethBalance = ethers.utils.formatEther(weiBalance);
    const formattedBalance = parseFloat(ethBalance).toFixed(2);
    
    return formattedBalance;
  } catch (error) {
    printError(`Error getting balance: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * Envía una transacción desde la cuenta del nodo validador a una dirección destino
 * @param customAmount Cantidad opcional de ETH a enviar (por defecto usa el valor de networkConfig)
 * @param customDestination Dirección opcional de destino (por defecto usa el valor de networkConfig)
 * @returns Promise con el hash de la transacción enviada
 */
export const sendTransaction = async (
  customAmount?: string,
  customDestination?: string
): Promise<string> => {
  const toAddress = customDestination || networkConfig.transactionTo;
  const amountEth = customAmount || networkConfig.transactionAmount;
  
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
const chainId = parseInt(process.argv[8]) || 4004;

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
    
    // Convert ETH to wei for the transaction
    const amountWei = ethers.utils.parseEther(amountEth).toHexString();
    
    // Get the nonce for the transaction - Usar puerto configurado
    const validatorPort = networkConfig.basePort;
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

// Verify network with transaction
export const verifyNetworkWithTransaction = async (): Promise<void> => {
  printMessage("Verifying network with a test transaction...");
  
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
const chainId = parseInt(process.argv[8]) || 4004;

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
    
    // Install necessary dependencies in the temporary directory
    printMessage("Installing necessary dependencies for transaction signing...");
    execSync('npm init -y', { stdio: 'ignore' });
    execSync('npm install --save-dev @ethereumjs/tx@^4.0.0 @ethereumjs/common@^3.0.0 ethereumjs-util@^7.1.5', { stdio: 'ignore' });
    
    // Define transaction parameters from networkConfig
    const toAddress = networkConfig.transactionTo;  // Usar la dirección de destino de la configuración
    const amountEth = networkConfig.transactionAmount;  // Usar la cantidad de la configuración
    
    // Get validator address and private key
    const validatorAddress = fs.readFileSync(path.join(workingDir, 'node1/address'), 'utf8').trim();
    const privateKey = fs.readFileSync(path.join(workingDir, 'node1/key'), 'utf8').trim().replace('0x', '');
    
    // Get validator balance
    const validatorBalance = await getBalance(validatorAddress);
    printMessage(`Current balance of validator account (${validatorAddress}): ${validatorBalance} ETH`);
    
    // Convert ETH to wei for the transaction
    const amountWei = ethers.utils.parseEther(amountEth).toHexString();
    
    printMessage(`Sending ${amountEth} ETH to ${toAddress}...`);
    
    // Get the nonce for the transaction - Usar puerto configurado
    const validatorPort = networkConfig.basePort;
    const nonceResponse = await axios.post(`http://localhost:${validatorPort}`, {
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: [validatorAddress, 'latest'],
      id: 1
    });
    
    const nonceHex = nonceResponse.data.result;
    
    // Sign the transaction using the Node.js script
    const signedTx = execSync(`node sign_tx.js "${privateKey}" "${nonceHex}" "${toAddress}" "${amountWei}"`, { cwd: tempDir }).toString().trim();
    
    // Send the signed transaction - Usar puerto configurado
    const txResponse = await axios.post(`http://localhost:${validatorPort}`, {
      jsonrpc: '2.0',
      method: 'eth_sendRawTransaction',
      params: [signedTx],
      id: 1
    });
    
    const txResult = txResponse.data;
    
    if (txResult.error) {
      printError(`Error sending transaction: ${txResult.error.message}`);
      process.chdir(workingDir); // Return to working directory
      fs.removeSync(tempDir); // Clean up temp directory
      return;
    }
    
    const txHash = txResult.result;
    printMessage(`Transaction sent. Hash: ${txHash}`);
    printMessage("Waiting for transaction to be processed (10 seconds)...");
    
    // Wait for transaction to be processed
    execSync("sleep 10");
    
    // Get updated balances
    const newFromBalance = await getBalance(validatorAddress);
    const newToBalance = await getBalance(toAddress);
    
    printMessage(`New balance of validator account (${validatorAddress}): ${newFromBalance} ETH`);
    printMessage(`Balance of destination account (${toAddress}): ${newToBalance} ETH`);
    
    // Clean up and return to original directory
    process.chdir(workingDir);
    fs.removeSync(tempDir);
    
    printMessage("Network verification completed successfully.");
  } catch (error) {
    printError(`Error verifying network with transaction: ${error instanceof Error ? error.message : String(error)}`);
    // Ensure we return to the working directory even if there's an error
    process.chdir(process.cwd());
    throw error;
  }
};

// Main function to set up the network
export const setupBesuNetwork = async (): Promise<void> => {
  printMessage("=== Hyperledger Besu network setup script with validators and fullnodes ===");
  
  try {
    // Clean existing files
    await cleanExistingFiles();
    
    // Create Docker network
    createDockerNetwork();
    
    // Create node directories - now using synchronous version
    for (let i = 1; i <= 3; i++) {
      createNodeDirectory(i);
    }
    
    // Create validator configuration
    createGenesisFile();
    createValidatorConfig();
    
    // Launch validator and get enode
    launchValidatorNode();
    const enode = getValidatorEnode();
    
    // Configure and launch full nodes
    createFullnodeConfig(enode);
    launchFullnodeContainers();
    
    // Show network information
    showNetworkInfo();
    
    printMessage("Besu network setup completed successfully!");
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
  setupBesuNetwork
};

// Ejecutar la función principal si este archivo se ejecuta directamente (no importado como módulo)
if (require.main === module) {
  setupBesuNetwork()
    .then(() => {
      printMessage('Script completed successfully');
    })
    .catch((error) => {
      printError(`Script failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    });
}
