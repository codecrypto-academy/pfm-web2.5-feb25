import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import { ethers } from 'ethers';
import axios from 'axios';

export class BesuNetworkManager {
  private networkBasePath: string;
  
  constructor(basePath: string = './networks') {
    this.networkBasePath = basePath;
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }
  }

  /**
   * Creates a new Besu node in the specified network
   * @param networkName Name of the network (e.g., red1, red2)
   * @param nodeName Name of the node (e.g., nodo1, nodo2)
   * @returns Object containing node information
   */
  public async createNode(networkName: string, nodeName: string): Promise<{
    networkName: string;
    nodeName: string;
    nodeIp: string;
    httpPort: number;
    p2pPort: number;
    machinePort: number;
    containerName: string;
  }> {
    // Validate inputs
    if (!networkName) {
      throw new Error("Please provide a network name (e.g., red1, red2)");
    }
    
    if (!nodeName) {
      throw new Error("Please provide a node name (e.g., nodo1, nodo2)");
    }

    // Check if container already exists
    try {
      const containerCheck = execSync(`docker ps -a --filter "name=${networkName}-${nodeName}" --format '{{.Names}}'`).toString().trim();
      if (containerCheck === `${networkName}-${nodeName}`) {
        throw new Error(`Container '${networkName}-${nodeName}' already exists.`);
      }
    } catch (error) {
      if (!(error instanceof Error && error.message.includes("already exists"))) {
        console.log(`Container '${networkName}-${nodeName}' does not exist. Proceeding to create it...`);
      } else {
        throw error;
      }
    }
    
    // Generate random IP and ports
    const nodeIp = `172.24.0.${Math.floor(Math.random() * 254) + 1}`;
    const httpPort = 8545 + Math.floor(Math.random() * 1000);
    const p2pPort = "30303"; // Fixed as per the bash script
    const machinePort = 8888 + Math.floor(Math.random() * 1000);
    
    // Create network if it doesn't exist
    try {
      execSync(`docker network inspect ${networkName}`);
      console.log(`Network '${networkName}' already exists.`);
    } catch (error) {
      console.log(`Network '${networkName}' does not exist. Creating it...`);
      
      // Create network directory
      const networkDir = path.join(this.networkBasePath, networkName);
      if (!fs.existsSync(networkDir)) {
        fs.mkdirSync(networkDir, { recursive: true });
      }
      
      // Create Docker network
      execSync(`docker network create ${networkName} \
        --subnet 172.24.0.0/16 \
        --label network=${networkName} \
        --label type=besu`);
    }
    
    // Create node directory
    const nodeDir = path.join(this.networkBasePath, networkName, nodeName);
    if (!fs.existsSync(nodeDir)) {
      fs.mkdirSync(nodeDir, { recursive: true });
    }
    
    // Create keys
    await this.createKeys(networkName, nodeName, nodeIp, p2pPort);
    
    // Get node address
    const nodeAddress = this.readFile(path.join(this.networkBasePath, networkName, nodeName, 'address')).trim();
    
    // Create genesis.json
    const genesisContent = `{
            "config": {
                "chainId": 13371337,
                "londonBlock": 0,
                "clique": {
                    "blockperiodseconds": 4,
                    "epochlength": 30000,
                    "createemptyblocks": true
                }
            },
            "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000${nodeAddress}0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "gasLimit": "0x1fffffffffffff",
            "difficulty": "0x1",
            "alloc": {
                "${nodeAddress}": {
                "balance": "0x200000000000000000000000"
            }
        }
    }`;
    
    fs.writeFileSync(path.join(this.networkBasePath, networkName, 'genesis.json'), genesisContent);
    
    // Create config.toml
    const configContent = `genesis-file="/data/genesis.json"
        # Networking
        p2p-host="0.0.0.0"
        p2p-port=${p2pPort}
        p2p-enabled=true
        # JSON-RPC
        rpc-http-enabled=true
        rpc-http-host="0.0.0.0"
        rpc-http-port=${httpPort}
        rpc-http-cors-origins=["*"]
        rpc-http-api=["ETH","NET","CLIQUE","ADMIN","TRACE","DEBUG","TXPOOL","PERM","WEB3"]
        host-allowlist=["*"]`;
                
    fs.writeFileSync(path.join(this.networkBasePath, networkName, 'config.toml'), configContent);
    
    // Create data directory
    const dataDir = path.join(this.networkBasePath, networkName, nodeName, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Start Besu node
    const containerName = `${networkName}-${nodeName}`;
    execSync(`docker run -d \
      --name ${containerName} \
      --label nodo=${nodeName} \
      --label network=${networkName} \
      --ip ${nodeIp} \
      --network ${networkName} \
      -p ${machinePort}:${httpPort} \
      -v ${path.resolve(this.networkBasePath, networkName)}:/data \
      hyperledger/besu:latest \
      --config-file=/data/config.toml \
      --data-path=/data/${nodeName}/data \
      --node-private-key-file=/data/${nodeName}/key.priv \
      --genesis-file=/data/genesis.json`);
    
    // Create test key and perform transactions
    await this.createTestKeys();
    
    // Wait for node to start
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check balance
    await this.checkBalance(nodeAddress, `http://localhost:${machinePort}`);
    
    // Transfer funds
    const privateKey = this.readFile(path.join(this.networkBasePath, networkName, nodeName, 'key.priv')).trim();
    const testAddress = '0x' + this.readFile('address').trim();
    await this.transferFunds(privateKey, testAddress, 10000, `http://localhost:${machinePort}`);
    
    // Check balance again
    await this.checkBalance('0x' + nodeAddress, `http://localhost:${machinePort}`);
    
    // Get network info
    await this.getNetworkInfo(`http://localhost:${machinePort}`);
    
    return {
      networkName,
      nodeName,
      nodeIp,
      httpPort,
      p2pPort: parseInt(p2pPort),
      machinePort,
      containerName
    };
  }
  
  /**
   * Creates cryptographic keys for a node
   * @param networkName Name of the network
   * @param nodeName Name of the node
   * @param ip IP address of the node
   * @param port P2P port of the node
   */
  private async createKeys(networkName: string, nodeName: string, ip: string, port: string): Promise<void> {
    // In a real implementation, you'd use ethers.js to create the keys
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey.slice(2); // Remove 0x prefix
    const publicKey = wallet.publicKey.slice(4); // Remove 0x04 prefix
    const address = wallet.address.slice(2); // Remove 0x prefix
    
    const nodeDir = path.join(this.networkBasePath, networkName, nodeName);
    
    fs.writeFileSync(path.join(nodeDir, 'key.priv'), privateKey);
    fs.writeFileSync(path.join(nodeDir, 'key.pub'), publicKey);
    fs.writeFileSync(path.join(nodeDir, 'address'), address);
    
    // Create enode
    const enode = `enode://${publicKey}@${ip}:${port}`;
    fs.writeFileSync(path.join(nodeDir, 'enode'), enode);
    
    console.log(`Created keys for node ${nodeName} in network ${networkName}`);
    console.log(`Node address: 0x${address}`);
    console.log(`Node enode: ${enode}`);
  }
  
  /**
   * Creates test keys for transactions
   */
  private async createTestKeys(): Promise<void> {
    const wallet = ethers.Wallet.createRandom();
    fs.writeFileSync('address', wallet.address.slice(2)); // Remove 0x prefix
    fs.writeFileSync('key.priv', wallet.privateKey.slice(2)); // Remove 0x prefix
    console.log(`Created test wallet with address: ${wallet.address}`);
  }
  
  /**
   * Checks the balance of an address
   * @param address Ethereum address
   * @param rpcUrl JSON-RPC URL
   */
  private async checkBalance(address: string, rpcUrl: string): Promise<string> {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance);
    console.log(`Balance of ${address}: ${balanceInEth} ETH`);
    return balanceInEth;
  }
  
  /**
   * Transfers funds from one account to another
   * @param privateKey Private key of the sender
   * @param toAddress Recipient address
   * @param amount Amount to transfer (in ETH)
   * @param rpcUrl JSON-RPC URL
   */
  private async transferFunds(privateKey: string, toAddress: string, amount: number, rpcUrl: string): Promise<string> {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(`0x${privateKey}`, provider);
    
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(amount.toString())
    });
    
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log(`Transaction confirmed: ${tx.hash}`);
    return tx.hash;
  }
  
  /**
   * Gets network information from a node
   * @param rpcUrl JSON-RPC URL
   */
  private async getNetworkInfo(rpcUrl: string): Promise<any> {
    try {
      const response = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        method: 'admin_nodeInfo',
        params: [],
        id: 1
      });
      
      console.log('Network information:');
      console.log(JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('Error getting network info:', error);
      throw error;
    }
  }
  
  /**
   * Helper to read file contents
   * @param filePath Path to the file
   */
  private readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
  }
  
  /**
   * Removes a node from the network
   * @param networkName Name of the network
   * @param nodeName Name of the node
   */
  public removeNode(networkName: string, nodeName: string): void {
    const containerName = `${networkName}-${nodeName}`;
    
    try {
      // Stop and remove container
      execSync(`docker stop ${containerName}`);
      execSync(`docker rm ${containerName}`);
      console.log(`Removed container ${containerName}`);
    } catch (error) {
      console.error(`Error removing container ${containerName}:`, error);
    }
  }
  
  /**
   * Removes an entire network and all its nodes
   * @param networkName Name of the network
   */
  public removeNetwork(networkName: string): void {
    try {
      // Remove all containers in the network
      execSync(`docker rm -f $(docker ps -aq --filter "label=network=${networkName}") 2>/dev/null || true`);
      
      //Aquí habría que ver si hay que ponerle un retardo.IMPORTANTE
      // Remove network
      execSync(`docker network rm ${networkName} 2>/dev/null || true`);
      
      // Remove network directory
      fs.rmdirSync(path.join(this.networkBasePath, networkName), { recursive: true });
      
      console.log(`Removed network ${networkName} and all its nodes`);
    } catch (error) {
      console.error(`Error removing network ${networkName}:`, error);
    }
  }
}

// Example usage:
// import { BesuNetworkManager } from './besu-network-manager';
// 
// async function main() {
//   const manager = new BesuNetworkManager();
//   try {
//     const nodeInfo = await manager.createNode('red1', 'nodo1');
//     console.log('Node created:', nodeInfo);
//   } catch (error) {
//     console.error('Error:', error);
//   }
// }
// 
// main();