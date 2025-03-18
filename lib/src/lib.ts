// Import the libraries needed to create a network
// Import the fs library to interact with the file system
import * as fs from "fs";
// Import the execSync function from the child_process library to run shell commands like docker
import { execSync } from "child_process";
// Import the ethers library to make transactions and obtain balances
import { ethers } from "ethers";

// Import libraries needed to gnerate key pairs
const EC = require('elliptic').ec;
import { Buffer } from "buffer";
import keccak256 = require("keccak256");


// Note this library is only valid for /24 ip networks
// Future work could include adding support for other subnet masks
// Function to validate the format of a docker subnet: xxx.xxx.xxx.xxx/xx where xxx is a number between 0 and 255
function isValidDockerSubnet(subnet: string): boolean {
  // Needed update: Validate the subnet mask is /24
  const regex = /^((25[0-5]|2[0-4][0-9]|1?[0-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]?[0-9])\/([0-9]|[12][0-9]|3[0-2])$/;
  return regex.test(subnet);
}

// Function to get the first three octets of a docker subnet
// This function is used to cuntruct the ip of the nodes in the network
// Example: fisrt three octets of the network subnet + node host ip
function getFirstThreeOctets(subnet: string): string | null {
  const match = subnet.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}\/\d{1,2}$/);
  return match ? match[1] : null;
}

// Define a BESU network class
export class BesuNetwork {
  // Define attributes for the network
  private _name: string;
  private _subnet: string;
  private _chainID: number;
  private _directory: string;
  private _nodes: BesuNode[];
  private _enodes: string[];

  // Define the constructor for the BesuNetwork class
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
      throw new Error("Invalid subnet. Subnet must be in the format xxx.xxx.xxx.xxx/24");
    }
    this._subnet = subnet;
    this._chainID = chainID;
    this._directory = `${baseDir}/${this._name}`;
    this._enodes = [];
    this._nodes = [];

    // 1. CREATE THE DIRECTORY FOR THE NETWORK
    // Check if base directory exists
    if (!fs.existsSync(baseDir)) {
      // If the base directory doesn't exist, throw an error
      throw new Error(`Base directory ${baseDir} does not exist`);
    }
    // Create a directory for the network
    fs.mkdirSync(this.directory);

    // 2. CREATE KEYS FOR EACH OF THE INITAL VALIDATORS
    const validatorKeys:Keys[] = [];
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
    // For the moment only each validator will start with some balance
    const alloc = initialValidatorsAddress.reduce((acc: { [key: string]: { balance: string } }, address) => {
      acc[`0x${address}`] = {
        balance: "0x200000000000000000000000000000000000000000000000000000000000000"
      };
      return acc;
    }, {}); // Initialize with an empty object
    
    // Finally we turn tha alloc object into a string to add it to the genesis file
    const allocString = JSON.stringify(alloc, null, 2);

    // We create the content for the genesis.json file with the specified validators and chainID
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
    // Finally we save the genesis.json file
    fs.writeFileSync(`${this.directory}/genesis.json`, genesisContent);

    // 4. CREATE A DOCKER NETWORK
    // Check if the network already exists
    // List all the networks
    const output = execSync(`docker network ls`, { encoding: "utf-8" });
    // Check if the network name is in the output
    const networkExists = output.split("\n").some((line) => {line.includes(this.name)})

    // If the network already exists, throw an error
    if (networkExists) {
      throw new Error(`Network "${this.name}" already exists.`);
    } else {
      // If it doesn't exist create the network
      try {
        // Create the docker network
        execSync(`docker network create ${this.name} --subnet ${this.subnet}`, { encoding: "utf-8" });
        console.log(`Network "${this.name}" created successfully.`);
      } catch (createError:any) {
        // If there is an error creating the network, throw an error
        throw new Error(`Failed to create network: ${createError.message}`);
      }
    }
    
    // 5. CREATE THE INITAL NODES
    // Start the bootnode
    this.addNode(
      "bootnode",
      2,
      true,
      false
    );

    // Start the rpc node
    this.addNode(
      "rpc-node",
      3,
      false,
      true
    );

    // Start the inital validator nodes with the keys generated before (Aka the ones in the genesis file)
    // For that i loop through the address of the valitors and add a node for each one
    // Note: I should find another way to do this since the address are not being used
    initialValidatorsAddress.forEach((address, index) => {
      this.addNode(
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
  get enodes() {
    return this._enodes;
  }

  // Method for adding a node to the network
  addNode(
    name: string,
    host_ip: number,
    is_bootnode: boolean,
    rpc_enabled: boolean,
    keys: Keys|null = null,
    rpc_port: number = 8545

  ) {
    // Create the node using the BesuNode class
    // Pass the the current network as the network for the node
    const node = new BesuNode(
      this,
      name,
      host_ip,
      is_bootnode,
      rpc_enabled,
      keys, 
      rpc_port
    );
    // Push the node into the nodes array of the network
    this._nodes.push(node);
  }

  // Method for deleting a node from the network
  deleteNode(name: string) {
    // Find the node by name in the nodes list of the network
    const node = this._nodes.find((node) => node.name === name);

    // If the node exists
    if (node) {
      // Delete the node container
      execSync(`docker rm ${node.name}`, { encoding: "utf-8" });
      // Delete the node directory
      fs.rmSync(`${node.network.directory}/${node.name}`, { recursive: true });
      // Remove the node from the nodes array
      this._nodes = this._nodes.filter((n) => n.name !== name);
      // If the node is a bootnode remove the enode from the enodes list of the network and restart the network
      // We restart the network because other nodes that specify the bootnodes in their config file need to know that the bootnode doesn't exist anymore
      if (node.is_bootnode) {
        // Remove the enode from the enodes list
        this._enodes = this._enodes.filter((enode) => enode !== node.enode);
        // Restart the network
        this.restartNetwork();
      }
    } else {
      // If the node doesn't exist, throw an error
      throw new Error("Node doesn't exist")
    }
  }

  // Method for stoping all the nodes in a network
  stopNetwork() {
    // Loop through all the nodes and stop them
    this._nodes.forEach((node) => {
      node.stop();
    });
  }

  // Method for starting all the nodes that belong to the network
  startNetwork() {
    // Loop through all the nodes and start them
    this._nodes.forEach((node) => {
      node.start();
    });
  }

  // Method for restarting all the nodes that belong to the network 
  restartNetwork() {
    // Loop through all the nodes and restart them
    this._nodes.forEach((node) => {
      node.restart();
    });
  }

  // Method for obtaining a node by name
  getNode(name: string) {
    // Find the node by name in the nodes list of the network and return it
    return this._nodes.find((node) => node.name === name);
  }

  // Method for deleting the network
  deleteNetwork() {
    // Stop the network
    this.stopNetwork;
    // Delete all containers with the network label
    execSync(`docker rm -f $(docker ps -a -q --filter "label=${this.name}")`, { encoding: "utf-8" });
    // Delete the docker network
    execSync(`docker network rm ${this.name}`, { encoding: "utf-8" });
    // Delete the network directory
    fs.rmSync(this.directory, { recursive: true });
  }

  // Method to add an enode to the network enode list
  // This method exists because the enodes property is private
  addEnode(newEnode:string) {
    // Push the new enode into the enodes array
    this._enodes.push(newEnode)
  }

}

// Interface for a key object that has a private key, a public key and an address
interface Keys {
  privateKey: string;
  publicKey: string;
  address: string;
}

export class BesuNode {
  private _name: string;
  private _network: BesuNetwork;
  private _address: string;
  private _host_ip: number;
  private _rpc_enabled: boolean;
  private _rpc_port: number;
  private _is_bootnode: boolean;
  private _enode: string|null;

  // Define the constructor for the BesuNode class
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
    this._host_ip = ip;
    this._rpc_enabled = rpc_enabled;
    this._rpc_port = rpc_port;
    this._is_bootnode = is_bootnode;
    this._enode = null;

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
      this._enode = `enode://${keyPair.publicKey.slice(2)}@${getFirstThreeOctets(this._network.subnet)}.${this._host_ip}:30303`
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
    docker run -d --name ${this._name} --label ${this._network.name} --network ${this._network.name} --ip ${getFirstThreeOctets(this._network.subnet)}.${this._host_ip} \
    ${(this._rpc_enabled ? `-p ${this._rpc_port}:${this._rpc_port}` : "")} \
    -v ${networkDir}/:/data hyperledger/besu:latest \
    --config-file=/data/${this._name}/config.toml \
    --data-path=/data/${this._name}/data \
    --node-private-key-file=/data/${this._name}/key
    `, { encoding: "utf-8" });

  }

  // Method to create the config file for the node dinamically
  createConfigFile() {
    // Define the base configuration file
    const base_config_file = `
genesis-file="/data/genesis.json"
node-private-key-file="/data/${this._name}/key"
data-path="/data/${this._name}/data"

p2p-host="0.0.0.0"
p2p-port="30303"
p2p-enabled=true

    `;

    // Define the rpc configurations
    const rpc_config = `
    
rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=8545
rpc-http-cors-origins=["*"]
rpc-http-api=["ADMIN","ETH", "CLIQUE", "NET", "TRACE", "DEBUG", "TXPOOL", "PERM"]
host-allowlist=["*"]

    `;

    // Define the discovery configurations
    const discovery_config = `

discovery-enabled=true

`
    // Define the bootnode configurations (This should only be included if the node is not a bootnode)
    const bootnode_config = `

bootnodes=[
  ${this._network.enodes.join(",")}
]

    `;

    // Write the configuration file according to the node attributes
    const config = base_config_file + (this._is_bootnode ? "" : bootnode_config) + discovery_config + (this._rpc_enabled ? rpc_config : "");
    // Save the configuration file
    fs.writeFileSync(`${this._network.directory}/${this._name}/config.toml`, config);
  }

  // Method to start the node
  start() {
    // Start the node container
    execSync(`docker start ${this._name}`, { encoding: "utf-8" });
  }

  // Method to stop the node
  stop() {
    // Stop the node container
    execSync(`docker stop ${this._name}`, { encoding: "utf-8" });
  }

  // Method to restart the node
  // This method
  // 1. Stops the node container
  // 2. Deletes the node config file
  // 3. Creates the config file again with the new configurations
  // 4. Deletes the node container
  // 5. Starts the node container again
  restart() {
    // 1. Stop the node container
    this.stop();
    // 2. Delete the node config file
    fs.rmSync(`${this._network.directory}/${this._name}/config.toml`);
    // 3. Create the confing file again 
    this.createConfigFile();
    // 4. Delete the node container
    execSync(`docker rm ${this._name}`, { encoding: "utf-8" });
    // 5. Start the node container again
    execSync(
      `
      docker run -d --name ${this._name} --label ${this._network.name} --network ${this._network.name} --ip ${this._network.subnet.slice(0, -3)}${this._host_ip} \
      ${this._rpc_enabled ? `-p ${this._rpc_port}:${this._rpc_port}` : ""} \
      -v ${this._network.directory}/:/data hyperledger/besu:latest \
      --config-file=/data/${this._name}/config.toml \
      `,
      { encoding: "utf-8" }
    );
  }

  // Method to enable the RPC
  enableRPC() {
    // Enable the RPC
    this._rpc_enabled = true;
    // Restart the node to apply the change
    this.restart();
  }

  // * Method to disable the RPC
  disableRPC() {
    // Disable the RPC
    this._rpc_enabled = false;
    // Restart the node to apply the change
    this.restart();
  }

  // * Method to change the RPC port of the node
  changeRPCPort(port: number) {
    // Change the RPC port
    this._rpc_port = port;
    // Restart the node to apply the change 
    this.restart();
  }

  // * Method to send a transaction with the rpc of the current node for the Json RPC provider
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

    // Get the balance of the reciver before the transaction
    const balanceReciverBefore = await provider.getBalance(reciverAddress);
    // Get the balance of the sender before the transaction
    const balanceSenderBefore = await provider.getBalance(senderWallet.address);

    // Send the transaction
    const tx = await senderWalletConnected.sendTransaction({
      to: reciverAddress,
      value: ethers.parseEther(amount), 
      gasLimit: 21000,
      gasPrice: (await provider.getFeeData()).gasPrice,
    });

    // Get the reciept of the transaction
    const reciept = await tx.wait();

    // Get the balance of the reciver after the transaction
    const balanceReciverAfter = await provider.getBalance(reciverAddress);
    // Get the balance of the sender after the transaction
    const balanceSenderAfter = await provider.getBalance(senderWallet.address);

    return {
      reciverAddress,
      balanceReciverBefore,
      balanceSenderBefore,
      balanceReciverAfter,
      balanceSenderAfter,
      amount,
      reciept,
    };
  }

  // * Method to get the balance of an address
  async getBalance(address: string = this._address) {
    // Create a Json RPC provider with the rpc of the current node
    const provider = new ethers.JsonRpcProvider(
      `http://localhost:${this._rpc_port}/`,
      {
        chainId: this._network.chainID,
        name: "private",
      }
    );
    // Get the balance of the address
    const balance = await provider.getBalance(address);
    return balance;
  }

  // * Method to get the current block number
  async getBlockNumber() {
    // Create a Json RPC provider with the rpc of the current node  
    const provider = new ethers.JsonRpcProvider(
      `http://localhost:${this._rpc_port}/`,
      {
        chainId: this._network.chainID,
        name: "private",
      }
    );
    // Get the current block number
    const blockNumber = await provider.getBlockNumber();
    return blockNumber;
  }

  // Define getter methods for the BesuNode class attributes
  get name(): string {
    return this._name;
  }
  get network(): BesuNetwork {
    return this._network;
  }
  get address(): string {
    return this._address;
  }
  get host_ip(): number {
    return this._host_ip;
  }
  get rpc_enabled(): boolean {
    return this._rpc_enabled;
  }
  get rpc_port(): number {
    return this._rpc_port
  }
  get is_bootnode(): boolean {
    return this._is_bootnode;
  }
  get enode(): string|null {
    return this._enode
  }
}

// Function to generate a key pair
export function genKeyPair() {
  // Create an eliptic curve secp256k1(The one used by Ethereum and therefore also the one used by Besu since Besu is built on Ethereum)
  const ec = new EC("secp256k1");
  // Create key pair
  const keyPair = ec.genKeyPair();
  // Get private key
  const privateKey:string = keyPair.getPrivate("hex");
  // Get public key
  const publicKey:string = keyPair.getPublic("hex");

  // Get the address from the public key
  // 1. Get the keccak256 hash of the public key
  const publicKeyBuffer = keccak256(Buffer.from(publicKey.slice(2), "hex"));
  // 2. Get the last 20 bytes of the hash
  // The last 20 bytes are equivalent to the last 40 hexadecimal characters
  // When we use a negative number in slice, it means that we are taking the last n characters
  const address:string = publicKeyBuffer.toString("hex").slice(-40);

  // Return the key pair and the address
  return {
    privateKey,
    publicKey,
    address,
  };
}

// Function to delete a network
export function deleteNetwork (networkName: string, networkDir: string) {
  // Stop and delete all containers with the network label
  execSync(`docker rm -f $(docker ps -a -q --filter "label=${networkName}")`, { encoding: "utf-8" });
  // Delete the docker network
  execSync(`docker network rm ${networkName}`, { encoding: "utf-8" });
  // Delete the network directory
  fs.rmSync(networkDir, { recursive: true });
}

// Function for a transaction
export async function transaction(chainID: number, rpc_port: number, senderPriv: string, reciverAddress: string, amount: string) {
  // Create a Json RPC provider with the specified chainID and rpc port
  const provider = new ethers.JsonRpcProvider(`http://localhost:${rpc_port}/`, {
    chainId: chainID,
    name: "private"
  });
  // Create a wallet for the sender
  const signer = new ethers.Wallet(senderPriv);
  // Connect the wallet to the provider
  const signerConnected = signer.connect(provider);

  // Get the balance of the reciver before the transaction
  const balanceReciverBefore = await provider.getBalance(reciverAddress);

  // Get the balance of the sender before the transaction
  const balanceSenderBefore = await provider.getBalance(signer.address);

  // Send the transaction
  const tx = await signerConnected.sendTransaction({
    to: reciverAddress,
    value: ethers.parseEther(amount),
    gasLimit: 21000,
    gasPrice: (await provider.getFeeData()).gasPrice
  });

  // Get the reciept of the transaction
  const reciept = await tx.wait();

  // Get the balance of the reciver after the transaction
  const balanceReciverAfter = await provider.getBalance(reciverAddress);

  // Get the balance of the sender after the transaction
  const balanceSenderAfter = await provider.getBalance(signer.address);

  return{
    reciverAddress,
    balanceReciverBefore,
    balanceSenderBefore,
    balanceReciverAfter,
    balanceSenderAfter,
    amount,
    reciept,
  };
}
