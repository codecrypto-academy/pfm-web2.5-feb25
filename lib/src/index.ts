import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import axios from 'axios';
import { ethers } from 'ethers';
import { NetworkConfigInterface } from './types';
import { defaultNetworkConfig } from './defaultConfig';

export { defaultNetworkConfig };

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
    // Stop and remove existing Docker containers 
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
          }
        }
      }
    } catch (error) {
      printWarning("No containers to remove or error listing containers");
    }
    
    printMessage("Docker containers removed.");
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
    // Check if network exists 
    try {
      const networkList = execSync("docker network ls --format '{{.Name}}'").toString();
      
      if (networkList.includes(networkName)) {
        printWarning(`The '${networkName}' network already exists. The existing one will be used.`);
        return;
      }
    } catch (error) {
      printWarning("Could not check existing networks, attempting to create new one");
    }
    
    // Create network with the name from config
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
    
    // Generate key and address for the node using Besu
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
    
    // Launch validator node
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
    // Get the IP of the validator node
    const nodeIP = execSync(`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' node1`)
      .toString().trim();
    
    if (!nodeIP) {
      throw new Error("Could not find IP address for validator node");
    }
    
    printMessage(`Validator node IP: ${nodeIP}`);
    
    printMessage("Exporting the public key with besu...");
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
    
    // Launch the fullnodes 
    for (let i = 0; i < fullnodeCount; i++) {
      const nodeNum = 2 + i;
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
    
    // Method 1: Manual conversion (more efficient)
    try {
      const balanceWei = parseInt(balanceHex, 16).toString();
      
      // parseInt for small amounts
      if (balanceWei.length <= 30) {
        const paddedBalanceWei = balanceWei.padStart(19, '0');
        const integerPart = paddedBalanceWei.slice(0, -18) || '0';
        const decimalPart = paddedBalanceWei.slice(-18).substring(0, 2).padEnd(2, '0');
        return `${integerPart}.${decimalPart}`;
      }
      
      // If we reach here, the number is too large for parseInt
      // Let it fail and go to the fallback method
      throw new Error("Number too large for manual conversion");
    } catch (conversionError) {
      // Method 2: Use ethers (more robust, especially for large numbers)
      try {
        const weiBalance = ethers.BigNumber.from(balanceHex);
        const ethBalance = ethers.utils.formatEther(weiBalance);
        return parseFloat(ethBalance).toFixed(2);
      } catch (ethersError) {
        printError(`Error converting balance with ethers: ${ethersError instanceof Error ? ethersError.message : String(ethersError)}`);
        
        // Method 3: Last resort - return 0 if everything else fails
        return '0.00';
      }
    }
  } catch (error) {
    // This catch handles errors in the API call
    printError(`Error getting balance from node: ${error instanceof Error ? error.message : String(error)}`);
    throw error; // Propagate the error for the caller to handle
  }
};

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
    
    // Convert ETH to wei without depending on ethers
    let amountWei: string;
    try {
      // Try to use ethers if available
      try {
        amountWei = ethers.utils.parseEther(amountEth).toHexString();
      } catch (ethersError) {
        // Manual implementation if ethers fails
        printWarning(`Using manual ETH to wei conversion: ${ethersError}`);
        
        // Parse the value as a floating-point number
        const ethValue = parseFloat(amountEth);
        
        // Calculate the value in wei (1 ETH = 10^18 wei)
        const weiValue = Math.floor(ethValue * 1e18);
        
        // Convert to hexadecimal with '0x' prefix
        amountWei = `0x${weiValue.toString(16)}`;
      }
    } catch (error) {
      printError(`Error converting ETH to wei: ${error}`);
      // Use a default value in case of error (0.1 ETH)
      amountWei = '0x16345785d8a0000';
    }
    
    // Get the nonce for the transaction
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

export const addNode = async (
  config: NetworkConfigInterface = defaultNetworkConfig
): Promise<{nodeId: string, nodeUrl: string}> => {
  try {
    // Find the current highest node number
    const dirs = fs.readdirSync('.')
      .filter(file => file.startsWith('node') && fs.statSync(file).isDirectory() && !file.includes('node_modules'));
    
    const existingNumbers = dirs.map(dir => {
      const match = dir.match(/node(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    // Determine the next node number
    const nextNodeNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const nodeName = `node${nextNodeNumber}`;
    const nodePort = config.network.basePort + nextNodeNumber - 1;
    
    printMessage(`Adding new fullnode: ${nodeName}...`);
    
    // Create directory and generate keys for the new node
    createNodeDirectory(nextNodeNumber);
    
    // Make sure the configuration file for fullnodes has been created
    if (!fs.existsSync('config-fullnode.toml')) {
      // Get the enode of an existing validator node for the connection
      try {
        const validatorEnode = getValidatorEnode();
        createFullnodeConfig(validatorEnode);
      } catch (error) {
        printError("Failed to get validator enode or create fullnode config");
      }
    }
    
    // Launch the container for the new fullnode
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

export const removeNode = async (nodeNumber: number): Promise<void> => {
  try {
    const nodeName = `node${nodeNumber}`;
    
    printMessage(`Removing node ${nodeName}...`);
    
    // Verify we're not trying to remove the main validator node (node1)
    if (nodeNumber === 1) {
      printError("Cannot remove validator node (node1). This would break the network.");
      throw new Error("Cannot remove validator node");
    }
    
    // Verify the node exists
    try {
      execSync(`docker inspect ${nodeName} > /dev/null 2>&1`);
    } catch (error) {
      printError(`Node ${nodeName} does not exist or is not running.`);
      throw new Error(`Node ${nodeName} not found`);
    }
    
    // Stop and remove the container
    printMessage(`Stopping container ${nodeName}...`);
    execSync(`docker stop ${nodeName}`);
    
    printMessage(`Removing container ${nodeName}...`);
    execSync(`docker rm ${nodeName}`);
    
    // Remove the node directory
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

export const setupBesuNetwork = async (
  config?: NetworkConfigInterface
): Promise<void> => {
  // Use the provided configuration or the default one
  const activeConfig = config || defaultNetworkConfig;
  
  printMessage("=== Setting up Hyperledger Besu network ===");
  
  try {
    // Clean existing files
    await cleanExistingFiles();
    
    // Create Docker network
    createDockerNetwork(activeConfig);
    
    // Create directories for all nodes
    const totalNodes = activeConfig.nodes.validators + activeConfig.nodes.fullnodes;
    for (let i = 1; i <= totalNodes; i++) {
      createNodeDirectory(i);
    }
    
    // Create validator configuration
    createGenesisFile(activeConfig);
    createValidatorConfig();
    
    // Launch the validator node
    launchValidatorNode(activeConfig);
    
    // Get the validator enode
    const enode = getValidatorEnode();
    
    // Configure the full nodes
    createFullnodeConfig(enode);
    
    // Launch the full nodes
    launchFullnodeContainers(activeConfig);
    
    // Show network information
    showNetworkInfo(activeConfig);
    
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
  addNode,        
  removeNode,     
  setupBesuNetwork
};

if (require.main === module) {
  setupBesuNetwork()
    .then((networkInfo) => {
      printMessage('Script completed successfully');
    })
    .catch((error) => {
      printError(`Script failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    });
}
