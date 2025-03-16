import { execSync } from 'child_process';
import { ethers } from "ethers";
import { JsonRpcProvider } from "ethers";
import * as fs from 'fs';

export class BesuNetwork {
    private networks: {
        [networkName: string]: {
            chainId: any;
            subnet: any; nodes: { name: string, port: string }[], activeNode: string | null
        }
    } = {};
    private provider: JsonRpcProvider | null = null;

    constructor() {
        // Initialize networks from a persistent storage if needed
        if (typeof window !== 'undefined') {
            this.listenForMetaMaskNetworkChange();
        }
    }
    

    // Set active node for interactions (RPC calls)
    setActiveNode(networkName: string, rpcUrl?: string): void {
        if (!this.networks[networkName]) {
            throw new Error(`Network ${networkName} does not exist.`);
        }

        let activeNodeUrl: string;
        if (rpcUrl) {
            activeNodeUrl = rpcUrl;
        } else {
            const activeNode = this.networks[networkName].nodes[0]; // Assuming the first node is the bootnode
            if (!activeNode) {
                throw new Error(`Active node not found in network ${networkName}.`);
            }
            activeNodeUrl = `http://localhost:${activeNode.port}`;
        }

        this.networks[networkName].activeNode = activeNodeUrl;
        this.provider = new JsonRpcProvider(activeNodeUrl);
        console.log(`Active node for ${networkName} set to ${activeNodeUrl}`);
    }

     // Listen for network changes in MetaMask
     private listenForMetaMaskNetworkChange(): void {
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('chainChanged', (chainId: string) => {
                console.log(`MetaMask network changed to chainId: ${chainId}`);
                const networkName = Object.keys(this.networks).find(network => 
                    this.networks[network].chainId === chainId);
                
                if (networkName) {
                    
                    const currentRpcUrl = window.ethereum.rpcUrls?.[0] || window.ethereum.providerConfig?.rpcUrl;
                    this.setActiveNode(networkName, currentRpcUrl);
                    console.log(`Updated RPC URL to MetaMask's current RPC: ${currentRpcUrl}`);
                }
            });
        }
    }

    private updateProviderFromMetaMask(chainId: string): void {
        console.log(`Updating provider for chainId: ${chainId}`);
        const networkName = Object.keys(this.networks).find(network => 
            this.networks[network].chainId === chainId);
        
        if (networkName) {
            try {
                 // Intentar obtener la URL RPC directamente desde el proveedor
                 let rpcUrl;
                
                 // Método 1: intentar obtener mediante solicitud al proveedor
                 if (window.ethereum.request) {
                     try {
                         // Esta es una operación asíncrona, pero la ejecutamos inmediatamente
                         window.ethereum.request({ method: 'eth_getProviderConfig' })
                             .then((config: any) => {
                                 if (config && config.rpcUrl) {
                                     console.log(`Got RPC URL from provider: ${config.rpcUrl}`);
                                     this.setActiveNode(networkName, config.rpcUrl);
                                 }
                             })
                             .catch((err: any) => {
                                 console.error("Failed to get provider config:", err);
                             });
                     } catch (e) {
                         console.log("eth_getProviderConfig not supported, trying alternative methods");
                     }
                 }               
            } catch (error) {
                console.log(error);
            }     
        }
    }

    async reset(networkName: string): Promise<void> {
        try {
            execSync(`docker rm -f $(docker ps -a --format "{{.Names}}" --filter "label=network=${networkName}") || true`);
            execSync(`docker network rm ${networkName} || true`);
            execSync(`rm -rf networks/${networkName}`);
            delete this.networks[networkName];

            console.log(`Net ${networkName} reset successfully`);
        } catch (error) {
            console.error("Error resetting network:", error)
        }
    }
    async createNetwork(networkName: string, chainId:string, subnet: string) {
        try {
            await this.reset(networkName);
            execSync(`mkdir -p networks/${networkName}`);
            execSync(`docker network create ${networkName} --subnet ${subnet} --label network=${networkName}`);

            if (!this.networks) {
                this.networks = {};
            }

            this.networks[networkName] = { chainId, subnet, nodes: [], activeNode: null }

            console.log(`Net ${networkName} created successfully`);
            console.log("Current networks:", this.networks);
        } catch (error) {
            console.error("Error in network creation:", error);
        }
    }
    async deleteNetwork(networkName: string) {
        try {
            //Verify if exits the network provided
            if (this.networks[networkName]) {
                execSync(`docker rm -f $(docker ps -a --format "{{.Names}}" --filter "label=network=${networkName}") || true`);
                execSync(`docker network rm ${networkName}`);
                execSync(`rm -rf networks/${networkName}`);
                delete this.networks[networkName];

                console.log(`Network ${networkName} its nodes deleted successfully.`);
            } else {
                console.log(`Network ${networkName} does not exist.`);
            }
        } catch (error) {
            console.error(`Failed to delete network ${networkName}:`, error);
        }
    }

    // Function to generate node keys using Besu
    private generateNodeKeys(nodePath: string): { address: string; publicKey: string; } {
        try {
            execSync(`besu --data-path=${nodePath} public-key export-address --to=${nodePath}/address`);
            execSync(`besu --data-path=${nodePath} public-key export --to=${nodePath}/publickey`);

            const address = fs.readFileSync(`${nodePath}/address`, "utf8").trim();
            const publicKey = fs.readFileSync(`${nodePath}/publickey`, "utf8").trim();

            return { address, publicKey };
        } catch (error) {
            console.error("Error in node keys generation:", error);
            throw new Error("Node keys generation failed.");
        }
    }

    // Function to create a genesis file for the network
    private createGenesisFile(networkPath: string, chainId: number, bootnodeAddress: string): void {
        const genesisContent = {
            config: {
                chainId: chainId,
                londonBlock: 0,
                clique: {
                    blockperiodseconds: 4,
                    epochlength: 30000,
                    createemptyblocks: true
                }
            },
            difficulty: "0x1",
            extraData: `0x0000000000000000000000000000000000000000000000000000000000000000${bootnodeAddress.replace("0x", "")}0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`,
            gasLimit: "0x1fffffffffffff",
            alloc: {
                [bootnodeAddress.replace("0x", "")]: {
                    balance: "0x200000000000000000000000000000000000000000000000000000000000000"
                }
            }
        };

        fs.writeFileSync(`${networkPath}/genesis.json`, JSON.stringify(genesisContent, null, 2));
        console.log("File genesis.json created successfully.");
    }

    // Function to create a config file for the node
    private createConfigFile(networkPath: string, bootnodeIp: string, bootnodePublicKey: string): void {
        const configContent = `genesis-file="/data/genesis.json"
    
    p2p-host="0.0.0.0"
    p2p-port=30303
    p2p-enabled=true
    
    rpc-http-enabled=true
    rpc-http-host="0.0.0.0"
    rpc-http-port=8545
    rpc-http-cors-origins=["*"]
    rpc-http-api=["ETH","NET","CLIQUE","ADMIN","TRACE","DEBUG","TXPOOL","PERM"]
    host-allowlist=["*"]
    
    discovery-enabled=true
    bootnodes=["enode://${bootnodePublicKey}@${bootnodeIp}:30303"]`;

        fs.writeFileSync(`${networkPath}/config.toml`, configContent);
        console.log("File config.toml created successfully.");
    }

    // Add bootnode to the network
    async addBootnode(containerName: string, networkName: string, subnet:string, nodeport: string, networkPath: string): Promise<void> {
        try {
            if (!this.networks[networkName]) {
                throw new Error(`Network ${networkName} does not exist. Create it first.`);
            }

            const bootnodeNodePath = `${networkPath}/${containerName}`;
            const { address: bootnodeAddress, publicKey: bootnodePublicKey } = this.generateNodeKeys(bootnodeNodePath);

            this.createGenesisFile(networkPath, this.networks[networkName].chainId, bootnodeAddress);
            const subnetIp = subnet.split('/')[0];//Extract IP from subnet
            this.createConfigFile(networkPath, subnetIp, bootnodePublicKey.slice(2));

            execSync(`
                docker run -d --name ${containerName} \
                --network ${networkName} --label network=${networkName} \
                -p ${nodeport}:8545 -v $(pwd)/${networkPath}:/data \
                hyperledger/besu:latest \
                --config-file=/data/config.toml --data-path=/data/${containerName}/data \
                --node-private-key-file=/data/${containerName}/key
            `);
            this.networks[networkName].nodes.push({ name: containerName, port: nodeport });

            console.log(`${containerName} added to network ${networkName} `);
        } catch (error) {
            console.error(`Error adding ${containerName}: `, error);
        }
    }

    // Add other nodes to the network
    async addNode(containerName: string, networkName: string, nodeport: string, networkPath: string) {
        try {
            const nodePath = `${networkPath}/${containerName}`;
            this.generateNodeKeys(nodePath);

            execSync(`docker run -d --name ${containerName} \
            --network ${networkName} --label network=${networkName} \
            -p ${nodeport}:8545 -v $(pwd)/${networkPath}:/data \
            hyperledger/besu:latest \
            --config-file=/data/config.toml --data-path=/data/${containerName}/data
            `);
            this.networks[networkName].nodes.push({ name: containerName, port: nodeport });

            console.log(`${containerName} added to network ${networkName} `);
        } catch (error) {
            console.error(`Error adding ${containerName}: `, error);
        }
    }

    //Remove any nodes from the network
    async removeNode(containerName: string, networkName: string) {
        try {
            execSync(`docker rm -f ${containerName} `);
            execSync(`rm -rf networks/${networkName}/${containerName}`)
            const nodeIndex = this.networks[networkName].nodes.findIndex((node: { name: string; port: string; }) => node.name === containerName);
            if (nodeIndex !== -1) {
                this.networks[networkName].nodes.splice(nodeIndex, 1);
            }

            console.log(`${containerName} deleted.`);
        } catch (error) {
            console.error(`Error deleting ${containerName}: `, error);
        }
    }
    async getNetworks() {
        try {
            console.log("Networks:", this.networks)
            return this.networks
        } catch (error) {
            console.error('Error getting networks:', error)
        }

    }

    async getNodes(networkName: string) {
        try {
            const nodes = this.networks[networkName].nodes;
            if (!this.networks[networkName]) {
                throw new Error(`Network ${networkName} does not exist.`);
            }
            console.log(`Nodes in ${networkName}:`, nodes);
            return nodes;
        } catch (error) {
            console.error('Error getting nodes:', error)
        }
    }

    async getBalance(address: string): Promise<string> {
        try {
            if (!this.provider) {
                throw new Error("Provider is not set.");
            }
            const balance = await this.provider.getBalance(address);
            return ethers.formatEther(balance);

        } catch (error) {
            console.error("Error getting balance:", error);
            throw new Error("Unable to get balance.");
        }
    }

    async transfer(from: string, to: string, amount: string): Promise<void> {
        try {
            console.log(`Sending: ${amount} ETH`);
            // Find the node directory that contains the private key for the given address
            const networkName = Object.keys(this.networks).find(network => 
                this.networks[network].nodes.some(node => {
                    const addressPath = `networks/${network}/${node.name}/address`;
                    return fs.existsSync(addressPath) && fs.readFileSync(addressPath, "utf8").trim() === from;
                })
            );

            if (!networkName) {
                throw new Error(`Node with address ${from} not found in any network.`);
            }

            const node = this.networks[networkName].nodes.find(node => {
                const addressPath = `networks/${networkName}/${node.name}/address`;
                return fs.existsSync(addressPath) && fs.readFileSync(addressPath, "utf8").trim() === from;
            });

            if (!node) {
                throw new Error(`Node with address ${from} not found in network ${networkName}.`);
            }

            const keyPath = `networks/${networkName}/${node.name}/key`;
            const fromPrivateKey = fs.readFileSync(keyPath, "utf8").trim();
            const wallet = new ethers.Wallet(fromPrivateKey, this.provider);
            const tx = await wallet.sendTransaction({
                to: to,
                value: ethers.parseEther(amount.toString())
            });

            console.log(`Transaction send: ${tx.hash} `);
            const result = await tx.wait();
            console.log("Transaction result: ", result)

        } catch (error) {
            console.error("Error en la transacción:", error);
        }
    }
    //Request tokens from the provider (bootnode)
    async requestTokens(networkName: string, to: string, amount: string): Promise<void> {
        try {
            if (!this.networks[networkName]) {
                throw new Error(`Network ${networkName} does not exist.`);
            }

            const bootnode = this.networks[networkName].nodes[0]; // Assuming the first node is the bootnode
            if (!bootnode) {
                throw new Error(`Bootnode not found in network ${networkName}.`);
            }

            const bootnodeUrl = `http://localhost:${bootnode.port}`;
            const provider = new JsonRpcProvider(bootnodeUrl);
            const bootnodePrivateKey = fs.readFileSync(`networks/${networkName}/${bootnode.name}/key`, "utf8").trim();
            const wallet = new ethers.Wallet(bootnodePrivateKey, provider);

            console.log(`Requesting ${amount} ETH from bootnode to ${to}`);
            const tx = await wallet.sendTransaction({
                to: to,
                value: ethers.parseEther(amount.toString())
            });

            console.log(`Transaction send: ${tx.hash}`);
            const result = await tx.wait();
            console.log("Transaction result:", result);
        } catch (error) {
            console.error("Error requesting tokens:", error);
        }
    }
}