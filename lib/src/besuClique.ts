import { exec } from 'child_process';
import { ethers } from 'ethers';
import fs from 'fs';

/**
 * This is the interface for Node elements.
 */
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

/**
 * This is the BesuClique class.
 */
export class BesuClique {
  private version: string = '1.0.1';
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

  /**
   * Creates a _besuClique_ instance.
   * @param networkName - (Optional) The name of the network. Default is _besuClique_.
   */
  constructor(networkName: string = 'besuClique') {
    this.networkName = networkName;
    this.nodes = [];
  }

  // Getters and Setters

  /**
   * Returns the version number of the library.
   * @returns The number of the version
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Sets the network name.
   * @param networkName - The name to set.
   */
  setNetworkName(networkName: string): void {
    this.networkName = networkName;
  }

  /**
   * Gets the name of the network.
   * @returns The network name.
   */
  getNetworkName(): string {
    return this.networkName;
  }

  /**
   * Adds a node to the node array.
   * @param node - The node object to add.
   * @returns 'Node added' if the node was added, 'Node already exists' if the node already exists.
   */
  addNode(node: Node): string {
    if (this.nodes.find(n => n.name === node.name)) {
      // throw new Error('Node already exists');
      return 'Node already exists';
    }
    this.nodes.push(node);
    return 'Node added';
  }

  /**
   * Removes a node from the node array.
   * @param nodeName - The name of the node to remove.
   */
  removeNode(nodeName: string): void {
    this.nodes = this.nodes.filter(node => node.name !== nodeName);
  }

  /**
   * Gets a node object by it's name.
   * @param nodeName - The name of the node to get.
   * @returns The node object which name is the same as the nodeName parameter.
   */
  getNode(nodeName: string): Node | undefined {
    return this.nodes.find(node => node.name === nodeName);
  }

  /**
   * Gets all the node list.
   * @returns An array of node objects.
   */
  getNodes(): Node[] {
    return this.nodes;
  }

  /**
   * Gets the number of nodes in the node array.
   * @returns The number of nodes.
   */
  getNodesCount(): number {
    return this.nodes.length;
  }

  // Methods

  /**
   * Checks if Docker is installed and running.
   * @returns True of false.
   */
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

  /**
   * Creates a Docker network using the value of _networkName_, if it's empty, it will use _besuClique_ as default.
   * @returns True if network was created, false otherwise.
   */
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

  /**
   * Gets the IP of a node.
   * @param node - The node to get the IP.
   * @returns An updated copy of the _node_ given with the _dockerIP_ property updated.
   */
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

  /**
   * Gets the Docker container id of a node.
   * @param node - The node to get the Docker container id.
   * @returns An updated copy of the _node_ given with the _dockerId_ property updated.
   */
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

  /**
   * Sets a _node.enode_ value taking it from the Docker container log.
   * @param node - The node to get the _enode_ value.
   * @returns An updated copy of the _node_ given with the _enode_ property updated..
   */
  setNodeEnode(node: Node): Promise<Node> {
    return new Promise(async (resolve, reject) => {
      try {
        exec(`docker logs '${this.networkName}-${node.name}' | grep "enode" | grep -o 'enode://[^ ]*@'`, async (error, stdout, stderr) => {
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

  /**
   * Creates a Docker container using the _node_ properties. This method is used to create the master node.
   * @param node - The _node_ to get the properties to create the container.
   * @returns An updated copy of the _node_ given with the _dockerId_ property updated.
   */
  async createNodeMaster(node: Node): Promise<Node> {
    return new Promise(async (resolve, reject) => {
      try {
        let updatedNode = node;

        exec(`docker run -d --name ${this.networkName}-${node.name} --network ${this.networkName} -v ./${this.networkName}/${node.name}/data:/data -v ./${this.networkName}:/config -p ${node.portJSON}:8545 -p ${node.portWS}:8546 -p ${node.portP2P}:30303 hyperledger/besu:latest --data-path=/data --genesis-file=/config/cliqueGenesis.json --network-id ${this.networkId} --rpc-http-enabled --rpc-http-api=ETH,NET,CLIQUE,WEB3,ADMIN --host-allowlist="*" --rpc-http-cors-origins="all" --profile=ENTERPRISE`, async (error, stdout, stderr) => {
          if (error) {
            if (error.message.includes('already in use')) {
              updatedNode = await this.getNodeDockerId(node);
              await this.sleep(5000);
              resolve(updatedNode);
            } else {
              reject(new Error('Error creating node'));
            }
          }
          if (stderr) {
            if (stderr.includes('already in use')) {
              updatedNode = await this.getNodeDockerId(node);
              await this.sleep(5000);
              resolve(updatedNode);
            } else {
              reject(new Error('Error creating node'));
            }
          }

          updatedNode.dockerId = stdout;
          await this.sleep(5000);
          resolve(updatedNode);
        })
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Creates a Docker container using the _node_ properties. This method is used to create a slave node. It needs the _enode_ of the master node.
   * @param node - The _node_ to get the properties to create the container.
   * @returns An updated copy of the _node_ given with the _dockerId_ property updated.
   */
  async createNodeSlave(node: Node, enode: string): Promise<Node> {
    return new Promise(async (resolve, reject) => {
      try {
        let updatedNode = node;

        exec(`docker run -d --name ${this.networkName}-${node.name} --network ${this.networkName} -v ./${this.networkName}/${node.name}/data:/data -v ./${this.networkName}:/config -p ${node.portJSON}:8545 -p ${node.portWS}:8546 -p ${node.portP2P}:30303 hyperledger/besu:latest --data-path=/data --genesis-file=/config/cliqueGenesis.json --bootnodes=${enode} --network-id ${this.networkId} --rpc-http-enabled --rpc-http-api=ETH,NET,CLIQUE,WEB3,ADMIN --host-allowlist="*" --rpc-http-cors-origins="all" --profile=ENTERPRISE`, async (error, stdout, stderr) => {
          if (error) {
            if (error.message.includes('already in use')) {
              updatedNode = await this.getNodeDockerId(node);
              await this.sleep(5000);
              resolve(updatedNode);
            } else {
              reject(new Error('Error creating node'));
            }
          }
          if (stderr) {
            if (stderr.includes('already in use')) {
              updatedNode = await this.getNodeDockerId(node);
              await this.sleep(5000);
              resolve(updatedNode);
            } else {
              reject(new Error('Error creating node'));
            }
          }

          updatedNode.dockerId = stdout;
          await this.sleep(5000);
          resolve(updatedNode);
        })
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Starts a previously created Docker container of the given _node_.
   * @param node - The _node_ to start.
   * @returns 'Node started' or _error_.
   */
  async startNode(node: Node): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        exec(`docker start ${this.networkName}-${node.name}`, async (error, stdout, stderr) => {
          if (error) {
            resolve(error.message);
          }
          if (stderr) {
            resolve(stderr);
          }

          resolve('Node started');
        })
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stops a previously created and running Docker container of the given _node_.
   * @param node - The _node_ to stop.
   * @returns 'Node stopped' or _error_.
   */
  async stopNode(node: Node): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
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

  /**
   * Gets the status of a Docker container of the given _node_.
   * @param node - The _node_ to get the status.
   * @returns The status of the container.
   */
  async getNodeStatus(node: Node): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        exec(`docker inspect -f '{{.State.Status}}' ${this.networkName}-${node.name}`, async (error, stdout, stderr) => {
          if (error) {
            reject(error);
          }
          if (stderr) {
            resolve(stderr);
          }

          resolve(stdout);
        })
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Deletes a previously stoped Docker container of the given _node_.
   * @param node - The _node_ to delete.
   * @returns 'Node deleted' or _error_.
   */
  async deleteNode(node: Node): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
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

  /**
   * Creates a Docker container and generates a _node address_ in the _networkName_/_node_/_data_ folder.
   * @param node - The _node_ to get the properties to create the container.
   * @returns 'Created' if address was created, _error_ otherwise.
   */
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
        resolve('Created');
      })
    });
  }

  /**
   * Creates a _genesis_ file inside the _networkName_/_node_ folder.
   * @param address - The address of the master node.
   * @returns True or false.
   */
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

  // /**
  //  * Gets the _privateKey_ for the _walletId_ given looking inside the _genesis_ file.
  //  * @param walletId - The _walletId_ to get the _privateKey_.
  //  * @returns The '0x...' formated _privateKey_.
  //  */
  // getPrivateKey(walletId: string): string {
  //   const genesis = require(`../${this.networkName}/cliqueGenesis.json`);
  //   return `0x${genesis.alloc[walletId].privateKey}`;
  // }

  /**
 * Sends the _amountETH_ from the _privateKey_ account to the _destWallet_.
 * @param destWallet - The wallet address to send the _amountETH_ (Format is 'Ox...').
 * @param privateKey - The private key of the wallet which will send the _amountETH_ to the _destWallet_.
 * @param amountETH - The amount of ETH to send. 
 * @returns The block hash of the transaction.
 */
  sendTransaction = async (destWallet: string, privateKey: string, amountETH: number): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const provider = new ethers.JsonRpcProvider(`http://localhost:${this.nodes[0].portJSON}`);

        const wallet = new ethers.Wallet(privateKey, provider);

        const tx = {
          to: destWallet,
          value: ethers.parseEther(amountETH.toString()),
          gasLimit: 21000,
          gasPrice: (await provider.getFeeData()).gasPrice
        };

        try {
          const txResponse = await wallet.sendTransaction(tx);

          const receipt = await txResponse.wait();
          resolve(receipt!.blockHash.toString());

        } catch (error) {
          reject(error);
        }
      }
      catch (error) {
        reject(error);
      }
    })
  };

  /**
   * Gets the balance of the _walletId_.
   * @param walletId - The wallet address to get the balance.
   * @returns The balance in ETH.
   */
  getBalance = async (walletId: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const provider = new ethers.JsonRpcProvider(`http://localhost:${this.nodes[0].portJSON}`);
        const balance = await provider.getBalance(walletId);
        resolve(ethers.formatEther(balance));
      } catch (error) {
        reject(error);
      }
    })
  };

  /**
   * Removes all the local data of the network.
   */
  clearLocalData(): void {
    exec(`rm -rf ./${this.networkName}`);
  }

  /**
   * Sleeps the process for _ms_ milliseconds.
   * @param ms - The amount of milliseconds to sleep
   * @returns A promise that resolves after _ms_ milliseconds.
   */
  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ToDo: Erase before release

// (async () => {
//   try {
//     console.log('Starting...');

//     const besuClique = new BesuClique();
//     besuClique.addNode({ name: 'Node-1', portJSON: 8545, portWS: 8546, portP2P: 30303 });
//     besuClique.addNode({ name: 'Node-2', portJSON: 8555, portWS: 8556, portP2P: 30304 });
//     besuClique.addNode({ name: 'Node-3', portJSON: 8565, portWS: 8566, portP2P: 30305 });

//     // console.log(await besuClique.sendTransaction( "0x789b1182f498Be80c0d7D36E395c2CBC53b44B0C", besuClique.getPrivateKey('f17f52151EbEF6C7334FAD080c5704D77216b732'), 100));
//     // console.log(await besuClique.getBalance('0x789b1182f498Be80c0d7D36E395c2CBC53b44B0C'));

//     besuClique.getNodes()[0].address = await besuClique.generateAddress(besuClique.getNodes()[0]);
//     besuClique.createGenesis(besuClique.getNodes()[0].address!);
//     await besuClique.createNetwork();

//     try {
//       const status = await besuClique.getNodeStatus(besuClique.getNodes()[0]);
//       if (status === 'running') {
//         const result = await besuClique.stopNode(besuClique.getNodes()[0])
//         if (result === 'Node stopped') {
//           const result = await besuClique.deleteNode(besuClique.getNodes()[0]);
//           if (result === 'Node deleted') {
//             besuClique.getNodes()[0] = await besuClique.createNodeMaster(besuClique.getNodes()[0]);
//           }
//         }
//       }
//     } catch (error) {
//       besuClique.getNodes()[0] = await besuClique.createNodeMaster(besuClique.getNodes()[0]);
//     }

//     besuClique.getNodes()[0] = await besuClique.setNodeEnode(besuClique.getNodes()[0]);

//     if (besuClique.getNodes()[0].enode != '') {
//       besuClique.getNodes()[0] = await besuClique.getNodeDockerIP(besuClique.getNodes()[0]);
//       if (besuClique.getNodes()[0].dockerIP != '') {
//         besuClique.getNodes()[1] = await besuClique.createNodeSlave(besuClique.getNodes()[1], besuClique.getNodes()[0].enode!);
//       }
//     }

//     // console.log(await besuClique.getNodeStatus(besuClique.getNodes()[2]));

//     // do
//     //   for (let i = 0; i < besuClique.getNodesCount(); i++) {
//     //     console.log(`Status ${i}: `, await besuClique.getNodeStatus(besuClique.getNodes()[i]));
//     //     besuClique.sleep(2500);
//     //   }
//     // while (await besuClique.getNodeStatus(besuClique.getNodes()[0]) !== 'running' && await besuClique.getNodeStatus(besuClique.getNodes()[1]) !== 'running');

//     console.log('Done');
//   } catch (error) {
//     console.log(error);
//   }
// })();

