import * as fs from "fs";
import { execSync } from "child_process";
import { ethers } from "ethers";

// Import libraries needed to gnerate key pairs
const EC = require('elliptic').ec;
import { Buffer } from "buffer";
import keccak256 = require("keccak256");


// Function to validate the format of a docker subnet
function isValidDockerSubnet(subnet: string): boolean {
  const regex = /^((25[0-5]|2[0-4][0-9]|1?[0-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]?[0-9])\/([0-9]|[12][0-9]|3[0-2])$/;
  return regex.test(subnet);
}

// Function to get the first three octets of a docker subnet
function getFirstThreeOctets(subnet: string): string | null {
  const match = subnet.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}\/\d{1,2}$/);
  return match ? match[1] : null;
}

// Define a BESU network class
class BesuNetwork {
  // Define attributes for the network
  private _name: string;
  private _subnet: string;
  private _chainID: number;
  private _directory: string;
  private _nodes: BesuNode[];
  private _validators: BesuValidator[];
  private _enodes: string[];

  constructor(
    name: string,
    subnet: string,
    chainID: number,
    baseDir: string,
    initialValidators: number = 1
  ) {
    // Set the attributes
    this._name = name;
    // Check if the subnet is valid
    if (!isValidDockerSubnet(subnet)) {
      throw new Error("Invalid subnet. Subnet must be in the format xxx.xxx.xxx.xxx/xx");
    }
    this._subnet = subnet;
    this._chainID = chainID;
    this._directory = `${baseDir}/${this._name}`;
    this._enodes = [];
    this._nodes = [];

    // 1. CREATE THE DIRECTORY FOR THE NETWORK
    // Check if base directory exists
    if (!fs.existsSync(baseDir)) {
      throw new Error(`Base directory ${baseDir} does not exist`);
    }

    // Create a directory for the network
    fs.mkdirSync(this.directory);

    // 2. CREATE KEYS FOR EACH OF THE INITAL VALIDATORS
    const validatorKeys = [];
    for (let i = 0; i < initialValidators; i++) {
      // Create a key pair
      validatorKeys.push(genKeyPair());
    }


    // 3. CREATE A GENESIS.JSON FILE WITH THE SPECIFIED VALIDATORS IN THE EXTRADATA FIELD
    // From the generated validator keys, we obtain the addresses
    const initialValidatorsAddress = validatorKeys.map((key) => key.address);
    // Concatenate the addresses into a single string with no separation
    // This string will go in the genesis extradata field.
    const initialValidatorsAddressString = initialValidatorsAddress.join("");

    // Create the alloc object with each of the initial validator addresses
    const alloc = initialValidatorsAddress.reduce((acc, address) => {
      acc[`0x${address}`] = {
        balance: "0x200000000000000000000000000000000000000000000000000000000000000"
      };
      return acc;
    }, {}); // Initialize with an empty object
    
    // Finally we turn tha alloc object into a string to add it to the genesis file
    const allocString = JSON.stringify(alloc, null, 2);

    // We create the content for the genesis.json file
    const genesisContent = `
{
  "config": {
      "chainId": ${this.chainID},
      "londonBlock": 0,
      "clique": {
          "blockperiodseconds": 4,
          "epochlenght": 30000,
          "createemptyblocks": true  
      }
  },
  "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000${initialValidatorsAddressString}0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "gasLimit": "0x1fffffffffffff",
  "difficulty": "0x1",
  "alloc": ${allocString}
}`;

    // Finally we create the genesis.json file
    fs.writeFileSync(`${this.directory}/genesis.json`, genesisContent);


    // 4. CREATE A DOCKER NETWORK
    // Check if the network already exists
    const output = execSync(`docker network ls`, { encoding: "utf-8" });
    const networkExists = output.split("\n").some((line) => {line.includes(this.name)})

    if (networkExists) {
      throw new Error(`Network "${this.name}" already exists.`);
    } else {
      // Create the network
      try {
        execSync(`docker network create ${this.name} --subnet ${this.subnet}`, { encoding: "utf-8" });
        console.log(`Network "${this.name}" created successfully.`);
      } catch (createError) {
        throw new Error(`Failed to create network: ${createError.message}`);
      }
    }
    
    // 5. CREATE THE INITAL NODES
    // Start the bootnode
    new BesuNode(
      this,
      "bootnode",
      2,
      true,
      false
    );

    // Start the rpc node
    new BesuNode(
      this,
      "rpc-node",
      3,
      false,
      true
    );

    // Start the inital validator nodes
    initialValidatorsAddress.forEach((address, index) => {
      new BesuNode(
        this,
        `initialValidator${index+1}`,
        index + 4,
        false,
        false,
        validatorKeys[index]
      );
    });   
    
  }

  // Define getter methods for the BesuNetwork class attributes
  get name() {
    return this._name;
  }

  get subnet() {
    return this._subnet;
  }

  get chainID() {
    return this._chainID;
  }

  get directory() {
    return this._directory;
  }

  get nodes() {
    return this._nodes;
  }

  get validators() {
    return this._validators;
  }

  get enodes() {
    return this._enodes;
  }

  // Method for adding a node to the network
  addNode(
    name: string,
    ip: number,
    is_bootnode: boolean,
    rpc_enabled: boolean,
    rpc_port: number = 8545
  ) {
    // Create the node
    const node = new BesuNode(
      this,
      name,
      ip,
      is_bootnode,
      rpc_enabled,
      null, 
      rpc_port
    );
    // Push the node into the nodes array
    this._nodes.push(node);
  }

  // Method for deleting a node from the network
  deleteNode(name: string) {
    // Find the node
    const node = this._nodes.find((node) => node.name === name);
    // Delete the node container
    execSync(`docker rm ${node.name}`, { encoding: "utf-8" });
    // Delete the node directory
    fs.rmdirSync(`${node.network.directory}/${node.name}`, { recursive: true });
    // Remove the node from the nodes array
    this._nodes = this._nodes.filter((n) => n.name !== name);
    // If the node is a bootnode remove the enode from the network and restart the network
    if (node.is_bootnode) {
      this._enodes = this._enodes.filter((enode) => enode !== node.enode);
      this.restartNetwork();
    }
  }

  // Method for stoping all the nodes in a network
  stopNetwork() {
    // Stop all nodes
    this._nodes.forEach((node) => {
      node.stop();
    });
  }

  // Method for starting all the nodes that belong to the network
  startNetwork() {
    // Start all nodes
    this._nodes.forEach((node) => {
      node.start();
    });
  }

  // Method for restarting all the nodes that belong to the network 
  restartNetwork() {
    // Restart all nodes
    this._nodes.forEach((node) => {
      node.restart();
    });
  }

  // Method for obtaining a node by name
  getNode(name: string) {
    // Find the node
    return this.nodes.find((node) => node.name === name);
  }

  // Method for deleting the network
  deleteNetwork() {
    this.stopNetwork;
    execSync(`docker rm -f $(docker ps -a -q --filter "label=${this.name}")`, { encoding: "utf-8" });
    execSync(`docker network rm ${this.name}`, { encoding: "utf-8" });
    fs.rmdirSync(this.directory, { recursive: true });
  }

  // Method to add an enode
  addEnode(newEnode:string) {
    this._enodes.push(newEnode)
  }

}

// Interface for a key object that has a private key, a public key and an address
interface Keys {
  privateKey: string;
  publicKey: string;
  address: string;
}

class BesuNode {
  private _name: string;
  private _network: BesuNetwork;
  private _address: string;
  private _ip: number;
  private _rpc_enabled: boolean;
  private _rpc_port: number;
  private _is_bootnode: boolean;
  private _enode: string;

  constructor(
    network: BesuNetwork,
    name: string,
    ip: number,
    is_bootnode: boolean,
    rpc_enabled: boolean,
    keys: Keys|null = null,
    rpc_port: number = 8545
  ) {

    // Set the attributes
    this._network = network;
    this._name = name;
    this._ip = ip;
    this._rpc_enabled = rpc_enabled;
    this._rpc_port = rpc_port;
    this._is_bootnode = is_bootnode;

    // 1. CREATE A DIRECTORY FOR THE NODE INSIDE THE NETWORK DIRECTORY
    // Check if another directory with the same name already exists
    if (fs.existsSync(`${this._network.directory}/${this._name}`)) {
      throw new Error(`The directory for the node already exists, please dont duplicate node names.`);
    } else {
      // If the directory doesn't exist, create the directory
      fs.mkdirSync(`${this._network.directory}/${this._name}`);
    }

    // 2. CREATE THE KEYS, ADDRESS AND ENODE FOR THE NODE
    // Create a variable to store keys of the node
    let keyPair:Keys
    
    // If some keys were passed in the parameters, use those keys, else create them.
    if (keys !== null) {
      keyPair = keys;
    } else {
      keyPair = genKeyPair();
    }
    // Save the private key in a key file inside the node directory
    fs.writeFileSync(
      `${this._network.directory}/${this._name}/key`,
      keyPair.privateKey
    );
    // Save the public key in a pub file inside the node directory
    fs.writeFileSync(
      `${this._network.directory}/${this._name}/pub`,
      keyPair.publicKey
    );
    // Save the address in a address file inside the node directory
    fs.writeFileSync(
      `${this._network.directory}/${this._name}/address`,
      keyPair.address
    );
    // Set the address property
    this._address = keyPair.address;

    // If the node is a bootnode add the enode to the network
    if (this._is_bootnode) {
      this._enode = `enode://${keyPair.publicKey.slice(2)}@${getFirstThreeOctets(this._network.subnet)}.${this._ip}:30303`
      this._network.addEnode(
        `"${this._enode}"`
      );
      // Save the enode to a file
      fs.writeFileSync(
        `${this._network.directory}/${this._name}/enode`,
        this._enode
      );
    }

    // 3. CREATE THE CONFIGURATION FILE FOR THE NODE
    this.createConfigFile();

    // 4. START THE DOCKER CONTAINER

    // Get absolute path to the network directory
    const networkDir = fs.realpathSync(this._network.directory, { encoding: "utf-8" });
    // Start the container
    execSync(
    `
    docker run -d --name ${this._name} --label ${this._network.name} --network ${this._network.name} --ip ${getFirstThreeOctets(this._network.subnet)}.${this._ip} \
    ${(this._rpc_enabled ? `-p ${this._rpc_port}:${this._rpc_port}` : "")} \
    -v ${networkDir}/:/data hyperledger/besu:latest \
    --config-file=/data/${this._name}/config.toml \
    --data-path=/data/${this._name}/data \
    --node-private-key-file=/data/${this._name}/key
    `, { encoding: "utf-8" });

    // ❔// Add the node to the network
    // this._network.nodes.push(this);
  }

  createConfigFile() {
    const base_config_file = `
genesis-file="/data/genesis.json"
node-private-key-file="/data/${this._name}/key"
data-path="/data/${this._name}/data"

p2p-host="0.0.0.0"
p2p-port="30303"
p2p-enabled=true

    `;
    const rpc_config = `
    
rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=8545
rpc-http-cors-origins=["*"]
rpc-http-api=["ADMIN","ETH", "CLIQUE", "NET", "TRACE", "DEBUG", "TXPOOL", "PERM"]
host-allowlist=["*"]

    `;

    const discovery_config = `

discovery-enabled=true

`

    const bootnode_config = `

bootnodes=[
  ${this._network.enodes.join(",")}
]

    `;

    const config = base_config_file + (this._is_bootnode ? "" : bootnode_config) + discovery_config + (this._rpc_enabled ? rpc_config : "");
    fs.writeFileSync(`${this._network.directory}/${this._name}/config.toml`, config);
  }

  start() {
    // Start the node container
    execSync(`docker start ${this._name}`, { encoding: "utf-8" });
  }

  stop() {
    // Stop the node container
    execSync(`docker stop ${this._name}`, { encoding: "utf-8" });
  }

  restart() {
    // Restart the node container
    this.stop();
    fs.rmSync(`${this._network.directory}/${this._name}/config.toml`);
    this.createConfigFile();
    execSync(`docker rm ${this._name}`, { encoding: "utf-8" });
    execSync(
      `
      docker run -d --name ${this._name} --label ${this._network.name} --network ${this._network.name} --ip ${this._network.subnet.slice(0, -3)}${this._ip} \
      ${this._rpc_enabled ? `-p ${this._rpc_port}:${this._rpc_port}` : ""} \
      -v ${this._network.directory}/:/data hyperledger/besu:latest \
      --config-file=/data/${this._name}/config.toml \
      `,
      { encoding: "utf-8" }
    );
  }

  enableRPC() {
    // Enable the RPC server
    this._rpc_enabled = true;
    this.restart();
  }

  disableRPC() {
    // Disable the RPC server
    this._rpc_enabled = false;
    this.restart();
  }

  changeRPCPort(port: number) {
    // Change the RPC port
    this._rpc_port = port;
    this.restart();
  }

  async sendTransaction(
    senderPriv: string,
    reciverAddress: string,
    amount: string
  ) {

    // Create a Json RPC provider, with the rpc of the current node
    const provider = new ethers.JsonRpcProvider(`http://localhost:${this._rpc_port}/`, {
      chainId: this._network.chainID,
      name: "private",
    });

    // Create a wallet for the sender
    const senderWallet = new ethers.Wallet(senderPriv);
    // Connect the wallet to the provider
    const senderWalletConnected = senderWallet.connect(provider);

    const balanceReciverBefore = await provider.getBalance(reciverAddress);

    const tx = await senderWalletConnected.sendTransaction({
      to: reciverAddress,
      value: ethers.parseEther(amount), 
      gasLimit: 21000,
      gasPrice: (await provider.getFeeData()).gasPrice,
    });

    const reciept = await tx.wait();

    const balanceReciverAfter = await provider.getBalance(reciverAddress);
    console.log("💗GOD IS GOOD", reciept)
    return {
      reciverAddress,
      balanceReciverBefore,
      balanceReciverAfter,
      amount,
      reciept,
    };
  }

  async getBalance(address: string = this._address) {
    const provider = new ethers.JsonRpcProvider(
      `http://localhost:${this._rpc_port}/`,
      {
        chainId: this._network.chainID,
        name: "private",
      }
    );
    const balance = await provider.getBalance(address);
    return balance;
  }

  async getBlockNumber() {
    const provider = new ethers.JsonRpcProvider(
      `http://localhost:${this._rpc_port}/`,
      {
        chainId: this._network.chainID,
        name: "private",
      }
    );
    const blockNumber = await provider.getBlockNumber();
    return blockNumber;
  }

  get name() {
    return this._name;
  }

  get network() {
    return this._network;
  }

  get address() {
    return this._address;
  }

  get ip() {
    return this._ip;
  }

  get rpc_enabled() {
    return this._rpc_enabled;
  }

  get rpc_port() {
    return this._rpc_port
  }

  get is_bootnode() {
    return this.is_bootnode
  }

  get enode () {
    return this._enode
  }

}

class BesuValidator {

}

// Function to generate a key pair
function genKeyPair() {
  // Crear curva elíptica sep256k1 (la que usa Ethereum y por lo tanto también la que usa Besu por que Besu se construye sobre Ethereum)
  const ec = new EC("secp256k1");
  // Crear par de llaves
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
  };
}

function deleteNetwork (networkName: string, networkDir: string) {
  execSync(`docker rm -f $(docker ps -a -q --filter "label=${networkName}")`, { encoding: "utf-8" });
  execSync(`docker network rm ${networkName}`, { encoding: "utf-8" });
  fs.rmdirSync(networkDir, { recursive: true });
}

async function transaction(rpc_port: number, senderPriv: string, reciverAddress: string, amount: string) {
  const provider = new ethers.JsonRpcProvider(`http://localhost:${rpc_port}/`, {
    chainId: 246800,
    name: "private"
  });
  const validator = new ethers.Wallet(senderPriv);
  const validatorConnected = validator.connect(provider);

  const balanceReciverBefore = await provider.getBalance(reciverAddress);

  const tx = await validatorConnected.sendTransaction({
    to: reciverAddress,
    value: ethers.parseEther(amount), // 0.1 ETH
    gasLimit: 21000,
    gasPrice: (await provider.getFeeData()).gasPrice
  });

  console.log(tx);
  const reciept = await tx.wait();

  const balanceReciverAfter = await provider.getBalance(reciverAddress);
  console.log({
    reciverAddress,
    balanceReciverBefore,
    balanceReciverAfter,
    amount,
    reciept,
  });
}

export { BesuNetwork, BesuNode, BesuValidator, deleteNetwork, transaction };

