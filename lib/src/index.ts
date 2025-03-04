import { exec } from 'child_process';
import fs from 'fs';

export interface Node {
  name: string;
  portJSON: number;
  portWS: number;
  portP2P: number;
  address?: string;
  dockerId?: string;
  dockerIP?: string;
  enode?: string;
}

export class BesuClique {
  private version: string;
  private networkName: string;
  private networkId: number = 123;
  private nodes: Node[];

  private genReplaceText = "<Node 1 Address>";
  private baseGenesis: string = `{
  \"config\": {
    \"chainId\": 3771,
    \"berlinBlock\": 0,
    \"clique\": {
      \"blockperiodseconds\": 15,
      \"epochlength\": 30000
    }
  },
  \"coinbase\": \"0x0000000000000000000000000000000000000000\",
  \"difficulty\": \"0x1\",
  \"extraData\": \"0x0000000000000000000000000000000000000000000000000000000000000000<Node 1 Address>0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000\",
  \"gasLimit\": \"0xa00000\",
  \"mixHash\": \"0x0000000000000000000000000000000000000000000000000000000000000000\",
  \"nonce\": \"0x0\",
  \"timestamp\": \"0x5c51a607\",
  \"alloc\": {
    \"fe3b557e8fb62b89f4916b721be55ceb828dbd73\": {
      \"privateKey\": \"8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63\",
      \"comment\": \"private key and this comment are ignored.  In a real chain, the private key should NOT be stored\",
      \"balance\": \"0xad78ebc5ac6200000\"
    },
    \"23997E1562faB0815C9Bb15f06D48fD7079273D0\": {
      \"privateKey\": \"c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3\",
      \"comment\": \"private key and this comment are ignored.  In a real chain, the private key should NOT be stored\",
      \"balance\": \"90000000000000000000000\"
    },
    \"f17f52151EbEF6C7334FAD080c5704D77216b732\": {
      \"privateKey\": \"ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f\",
      \"comment\": \"private key and this comment are ignored.  In a real chain, the private key should NOT be stored\",
      \"balance\": \"90000000000000000000000\"
    }
  }
}`;


  constructor(version: string = '1.0.0', networkName: string = 'besuClique') {
    this.version = version;
    this.networkName = networkName;
    this.nodes = [];
  }

  // Getters and Setters
  getVersion(): string {
    return this.version;
  }

  setNetworkName(networkName: string): void {
    this.networkName = networkName;
  }

  getNetworkName(): string {
    return this.networkName;
  }

  addNode(node: Node): string {
    if (this.nodes.find(n => n.name === node.name)) {
      // throw new Error('Node already exists');
      return 'Node already exists';
    }
    this.nodes.push(node);
    return 'Node added';
  }

  removeNode(nodeName: string): void {
    this.nodes = this.nodes.filter(node => node.name !== nodeName);
  }

  getNode(nodeName: string): Node | undefined {
    return this.nodes.find(node => node.name === nodeName);
  }

  getNodes(): Node[] {
    return this.nodes;
  }

  getNodesCount(): number {
    return this.nodes.length;
  }

  // Methods
  async checkDocker(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        exec('docker -v', (error, stdout, stderr) => {
          if (error) {
            reject(new Error('Docker not found'));
          }
          if (stderr) {
            // reject(new Error('Docker not found'));
            resolve(true);
          }

          exec('docker info', (error, stdout, stderr) => {
            if (error) {
              resolve(false)
            }
            if (stderr) {
              resolve(true)
            }

            resolve(true);
          })
        })
      } catch (error) {
        reject(error);
      }
    });
  }

  async createNetwork(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        exec(`docker network create ${this.networkName}`, (error, stdout, stderr) => {
          if (error) {
            if (error.message.includes('already exists')) {
              resolve(true);
            } else {
              reject(new Error('Error creating network'));
            }
          }
          if (stderr) {
            if (stderr.includes('already exists')) {
              resolve(true);
            } else {
              reject(new Error('Error creating network'));
            }
          }

          resolve(true);
        })
      } catch (error) {
        reject(error);
      }
    });
  }

  getNodeDockerIP(node: Node): Promise<Node> {
    return new Promise(async (resolve, reject) => {
      try {
        exec(`docker inspect '${this.networkName}-${node.name}'`, (error, stdout, stderr) => {
          if (error) {
            resolve(node);
          } if (stderr) {
            resolve(node);
          }

          const nodeInfo = JSON.parse(stdout);
          if (typeof nodeInfo[0]?.NetworkSettings?.Networks?.[this.networkName]?.IPAddress == 'string') {
            let updatedNode = node;
            updatedNode.dockerIP = nodeInfo[0]?.NetworkSettings?.Networks?.[this.networkName]?.IPAddress;
            resolve(updatedNode);
          } else {
            resolve(node);
          }
        })
      } catch (error) {
        resolve(node)
      }
    });
  }

  getNodeDockerId(node: Node): Promise<Node> {
    return new Promise(async (resolve, reject) => {
      try {
        exec(`docker inspect '${this.networkName}-${node.name}'`, (error, stdout, stderr) => {
          if (error) {
            resolve(node);
          } if (stderr) {
            resolve(node);
          }

          const nodeInfo = JSON.parse(stdout);
          if (typeof nodeInfo[0]?.Id == 'string') {
            let updatedNode = node;
            updatedNode.dockerId = nodeInfo[0]?.Id;
            resolve(updatedNode);
          } else {
            resolve(node);
          }
        })
      } catch (error) {
        resolve(node)
      }
    });
  }

  setNodeEnode(node: Node): Promise<Node> {
    return new Promise(async (resolve, reject) => {
      try {
        exec(`docker logs '${this.networkName}-${node.name}' | grep "enode" | grep -o 'enode://[^ ]*@'`, async(error, stdout, stderr) => {
          if (error) {
            resolve(node);
          } if (stderr) {
            resolve(node);
          }

          let updatedNode = node;
          if (stdout.includes('\n')) {
            stdout = stdout.replace('\n', '');
          }
          updatedNode = await this.getNodeDockerIP(node);
          updatedNode.enode = stdout + updatedNode.dockerIP + ':' + updatedNode.portP2P;
          resolve(updatedNode);
        })
      } catch (error) {
        resolve(node)
      }
    });
  }

  async createNodeMaster(node: Node): Promise<Node> {
    return new Promise(async (resolve, reject) => {
      try {
        let updatedNode = node;

        exec(`docker run -d --name ${this.networkName}-${node.name} --network ${this.networkName} -v ./${this.networkName}/${node.name}/data:/data -v ./${this.networkName}:/config -p ${node.portJSON}:8545 -p ${node.portWS}:8546 -p ${node.portP2P}:30303 hyperledger/besu:latest --data-path=/data --genesis-file=/config/cliqueGenesis.json --network-id ${this.networkId} --rpc-http-enabled --rpc-http-api=ETH,NET,CLIQUE,WEB3,ADMIN --host-allowlist="*" --rpc-http-cors-origins="all" --profile=ENTERPRISE`, async (error, stdout, stderr) => {
          if (error) {
            if (error.message.includes('already in use')) {
              updatedNode = await this.getNodeDockerId(node);
              resolve(updatedNode);
            } else {
              reject(new Error('Error creating node'));
            }
          }
          if (stderr) {
            if (stderr.includes('already in use')) {
              updatedNode = await this.getNodeDockerId(node);
              resolve(updatedNode);
            } else {
              reject(new Error('Error creating node'));
            }
          }

          updatedNode.dockerId = stdout;
          resolve(updatedNode);
        })
      } catch (error) {
        reject(error);
      }
    });
  }

  async createNodeSlave(node: Node, enode: string): Promise<Node> {
    return new Promise(async (resolve, reject) => {
      try {
        let updatedNode = node;

        exec(`docker run -d --name ${this.networkName}-${node.name} --network ${this.networkName} -v ./${this.networkName}/${node.name}/data:/data -v ./${this.networkName}:/config -p ${node.portJSON}:8545 -p ${node.portWS}:8546 -p ${node.portP2P}:30303 hyperledger/besu:latest --data-path=/data --genesis-file=/config/cliqueGenesis.json --bootnodes=${enode} --network-id ${this.networkId} --rpc-http-enabled --rpc-http-api=ETH,NET,CLIQUE,WEB3,ADMIN --host-allowlist="*" --rpc-http-cors-origins="all" --profile=ENTERPRISE`, async (error, stdout, stderr) => {
          if (error) {
            if (error.message.includes('already in use')) {
              updatedNode = await this.getNodeDockerId(node);
              resolve(updatedNode);
            } else {
              reject(new Error('Error creating node'));
            }
          }
          if (stderr) {
            if (stderr.includes('already in use')) {
              updatedNode = await this.getNodeDockerId(node);
              resolve(updatedNode);
            } else {
              reject(new Error('Error creating node'));
            }
          }

          updatedNode.dockerId = stdout;
          resolve(updatedNode);
        })
      } catch (error) {
        reject(error);
      }
    });
  }

  async startNode(node: Node): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const updatedNode = node;

        exec(`docker start ${this.networkName}-${node.name}`, async (error, stdout, stderr) => {
          if (error) {
            resolve(error.message);
          }
          if (stderr) {
            resolve(stderr);
          }

          resolve('Node stopped');
        })
      } catch (error) {
        reject(error);
      }
    });
  }

  async stopNode(node: Node): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const updatedNode = node;

        exec(`docker stop ${this.networkName}-${node.name}`, async (error, stdout, stderr) => {
          if (error) {
            reject(error);
          }
          if (stderr) {
            resolve(stderr);
          }

          resolve('Node stopped');
        })
      } catch (error) {
        reject(error);
      }
    });
  }

  async deleteNode(node: Node): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const updatedNode = node;

        exec(`docker rm ${this.networkName}-${node.name}`, async (error, stdout, stderr) => {
          if (error) {
            reject(error);
          }
          if (stderr) {
            resolve(stderr);
          }

          resolve('Node deleted');
        })
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateAddress(node: Node): Promise<string> {
    return new Promise(async (resolve, reject) => {
      exec(`docker run --rm -v ./${this.networkName}/${node.name}/data:/data hyperledger/besu:latest --data-path=/data public-key export-address --to=/data/node1Address`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error('Error creating address'));
        }
        if (stderr) {
          reject(new Error('Error creating address'));
        }
        if (fs.existsSync(`./${this.networkName}/${node.name}/data/node1Address`)) {
          resolve(fs.readFileSync(`./${this.networkName}/${node.name}/data/node1Address`, 'utf8').split('0x')[1]);
        }
        resolve('');
      })
    });
  }

  createGenesis(address: string): boolean {
    let genesis = this.baseGenesis;
    genesis = genesis.replace(this.genReplaceText, address);
    try {
      fs.writeFileSync(`./${this.networkName}/cliqueGenesis.json`, genesis);
      return true;
    } catch (error) {
      return false;
    }
  }

  getPrivateKey(walletId: string): string {
    const genesis = require(`../${this.networkName}/cliqueGenesis.json`);
    return genesis.alloc[walletId].privateKey;
  }

  clearLocalData(): void {
    exec(`rm -rf ./${this.networkName}`);
  }

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}