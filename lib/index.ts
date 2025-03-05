import { execSync } from 'child_process';
import { ethers } from 'ethers';
import fs from 'fs';

export class BesuNetwork {
    private provider: ethers.JsonRpcApiProvider;

    constructor(private config: { rpcUrl: string }) {
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    }

    async reset(networkName: string): Promise<void> {
        try {
            execSync(`docker rm -f $(docker ps -a --format "{{.Names}}" --filter "label=network=${networkName}") 2>/dev/null`);
            execSync(`docker network rm $NETWORK_NAME 2>/dev/null`);
            execSync(`rm -rf networks/${networkName}`)
            console.log(`Net ${networkName} reset successfully`);
        } catch (error) {

        }
    }
    async createNetwork(networkName: string, subnet: string) {
        try {
            this.reset(networkName);
            execSync(`mkdir -p networks/${networkName}`);
            execSync(`docker network create ${networkName} --subnet ${subnet} --label network=${networkName}`);
            console.log(`Net ${networkName} created successfully`);
        } catch (error) {
            console.error("Error in network creation:", error);
        }
    }
    async deleteNetwork(networkName: string) {
        try {
            execSync(`docker network rm ${networkName}`);
            console.log(`Network ${networkName} deleted.`);
        } catch (error) {
            console.error("Error in network deletion:", error);
        }
    }

    // Function to generate bootnode keys using Besu
    private generateBootnodeKeys(nodePath: string): { address: string; publicKey: string; } {
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
    async addBootnode(containerName: string, networkName: string, nodeport: string, networkPath: string): Promise<void> {
        try {
            const bootnodeNodePath = `${networkPath}/${containerName}`;
            const { address: bootnodeAddress, publicKey: bootnodePublicKey } = this.generateBootnodeKeys(bootnodeNodePath);

            this.createGenesisFile(networkPath, 180395, bootnodeAddress);
            this.createConfigFile(networkPath, "172.20.0.2", bootnodePublicKey.slice(2));

            execSync(`
                docker run -d --name ${containerName} \
                --network ${networkName} --label network=${networkName} \
                -p ${nodeport}:8545 -v $(pwd)/${networkPath}:/data \
                hyperledger/besu:latest \
                --config-file=/data/config.toml --data-path=/data/${containerName}/data \
                --node-private-key-file=/data/${containerName}/key
            `);

            console.log(`${containerName} added to network ${networkName} `);
        } catch (error) {
            console.error(`Error adding ${containerName}: `, error);
        }
    }

// Add other nodes to the network
async addNode(containerName: string, networkName: string, nodeport: string, networkPath: string) {
    try {
        execSync(`docker run -d --name ${containerName} \
        --network ${networkName} --label network=${networkName} \
        -p ${nodeport}:8545 -v $(pwd)/${networkPath}:/data \
        hyperledger/besu:latest \
        --config-file=/data/config.toml --data-path=/data/${containerName}/data`);
        console.log(`${containerName} added to network ${networkName} `);

    } catch (error) {
        console.error(`Error adding ${containerName}: `, error);
    }
}

async removeNode(containerName: string) {
    try {
        execSync(`docker rm -f ${containerName} `);
        console.log(`${containerName} deleted.`);
    } catch (error) {
        console.error(`Error deleting ${containerName}: `, error);
    }
}



async  getBalance(address: string): Promise<string> {
    try {
        const balance = await this.provider.getBalance(address);
        return ethers.formatEther(balance);
    } catch (error) {
        console.error("Error getting balance:", error);
        throw new Error("Unable to get balance.");
    }
}
}

//For Transaction test
async function transfer(from: string, to: string, amount: string, urlhost: string): Promise<void> {
    try {
    console.log(`Sending: ${amount} ETH`);
    const provider = new ethers.JsonRpcProvider(urlhost, { chainId: 170194, name: "private" });
    const wallet = new ethers.Wallet(from, provider);
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
//Arguments for script.sh
/*const args = process.argv.slice(3)
const [from, to, amount, urlhost] = args
if (args.length < 4) {
    console.error("Error: Faltan parametros. yarn tsx ./lib/index.ts transfer <from> <to> <amount> <url>")
    process.exit(1);
}

transfer(from, to, amount, urlhost);*/
