# 🔗 Besu Network

This repository contains tools for creating and managing private Ethereum networks based on Hyperledger Besu, using the Clique consensus protocol.

## 📋 Contents

- [Prerequisites](#prerequisites)
- [Part 1: Besu Network Script](#part-1-besu-network-script)
  - [Script Structure](#script-structure)
  - [Installing Dependencies](#installing-dependencies)
  - [Using the Script](#using-the-script)
  - [Available Commands](#available-commands)
  - [Important Considerations](#important-considerations)
  - [Troubleshooting](#troubleshooting)
- [Part 2: BesuNetwork Library](#part-2-besunetwork-library)
  - [Features](#features)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
  - [Main Interfaces](#main-interfaces)
  - [Usage Examples](#usage-examples)
  - [Deployment Considerations](#deployment-considerations)

## 🔧 Prerequisites

To use both the script and the library, you need to have installed:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [TypeScript](https://www.typescriptlang.org/) (only for the library)

---

# 📜 Part 1: Besu Network Script

This part of the repository contains Bash and JavaScript scripts to create and manage Hyperledger Besu nodes quickly and easily.

## 📁 Script Structure

- `script.sh`: Main script for creating and configuring Besu nodes
- `index.mjs`: JavaScript utilities for managing keys, transactions, and network queries
- `networks/`: Directory where network configurations are stored

## 📦 Installing Dependencies

The script uses the following JavaScript dependencies:
- `buffer`
- `keccak256`
- `elliptic`
- `ethers`
- `crypto`
- `fs`
- `child_process`
- `path`

Install dependencies with:

```bash
npm install
# or
yarn install
```

## 🚀 Using the Script

### Creating a new node

```bash
./script.sh <network-name> <node-name>
```

Example:
```bash
./script.sh net1 node1
```

## ⌨️ Available Commands

```bash
# Create keys for a node
node ./index.mjs create-keys <ip> <port>

# Create a network with multiple nodes
node ./index.mjs create-network <number-of-nodes>

# Get network information
node ./index.mjs network-info <url>

# Check balance of an address
node ./index.mjs balance <address> <url>

# Transfer funds
node ./index.mjs transfer <source-private-key> <destination-address> <amount> <url>

# Delete a specific node
node ./index.mjs delete-node <network-name> <node-name>

# Delete an entire network
node ./index.mjs delete-network <network-name>
```

## ⚠️ Important Considerations

1. **Random ports**: The script generates random HTTP and local machine ports to avoid conflicts.

2. **IP addresses**: A random IP is generated within the 172.24.0.0/16 range for each node.

3. **Key security**: Private keys are stored in plain text inside the `networks/<network>/<node>/` directory. Make sure to protect these directories properly in production environments.

4. **genesis.json file**: It is automatically created based on the first generated address. All nodes in the same network share the same genesis.

5. **ChainID**: The script configures a specific chainId (13371337) that must be consistent in all operations with the network.

## 🔍 Troubleshooting

### Nodes don't communicate with each other
- Verify that P2P ports are correctly mapped
- Check that the Docker network configuration allows inter-container communication
- Review container logs to identify possible errors

### Errors when executing transactions
- Check that the node is synchronized and working correctly
- Verify that the account has sufficient funds
- Make sure you are using the correct HTTP port

### Script fails when creating a node
- Check that Docker is running
- Verify that a container with the same name doesn't already exist
- Make sure the directories have write permissions

---

# 📚 Part 2: BesuNetwork Library

A TypeScript library for creating and managing private Ethereum networks using Hyperledger Besu with greater flexibility and programmatic control.

## ✨ Features

- Creation and management of Besu nodes
- Automated configuration of private networks with Clique consensus
- Generation of genesis files, keys, and configurations
- Network deployment using Docker
- APIs for sending transactions and querying network information
- Support for multiple signer and non-signer nodes

## 📥 Installation

The library is available on npm and can be installed with:

```bash
npm install @cjmontca/libcrypto-ts
# or
yarn add @cjmontca/libcrypto-ts
```

The library requires the following dependencies:
- `crypto`
- `js-sha3`
- `secp256k1`
- `ethers`
- Node.js standard libraries (fs, path, http, child_process, util)

## 🏁 Basic Usage

### Importing the library

```typescript
import BesuNetwork from '@cjmontca/libcrypto-ts';
```

### Creating a Besu network

```typescript
async function main() {
  // Create a new network instance
  const network = new BesuNetwork('my-private-network');
  
  // Create nodes (by default they are signers in Clique)
  network.createNode({ name: 'node1' });
  network.createNode({ name: 'node2' });
  network.createNode({ name: 'node3' });
  
  // Generate complete configuration
  const outputDir = './besu-data';
  network.generateFullNetworkConfig(outputDir);
  
  // Start the network
  await network.startNetwork(outputDir);
  
  console.log('Besu network successfully deployed');
}

main().catch(console.error);
```

### Deploying a network with a single command

```typescript
async function deploySimpleNetwork() {
  const network = new BesuNetwork('clique-network');
  
  // Deploy network with 4 nodes (3 signers)
  await network.deployNetwork(4, 3, './my-besu-network');
  
  console.log('Network deployed with 4 nodes (3 signers)');
}
```

## 📝 Main Interfaces

### NodeOptions
Options for creating a node:
```typescript
interface NodeOptions {
  name?: string;       // Node name
  port?: number;       // P2P port
  rpcPort?: number;    // RPC port
  host?: string;       // Host/IP
  isSigner?: boolean;  // Whether it's a signer node
}
```

### BesuNode
Representation of a node in the network:
```typescript
interface BesuNode {
  name: string;
  privateKey: string;   // Private key
  publicKey: string;    // Public key
  address: string;      // Ethereum address
  enode: string;        // enode identifier
  port: number;         // P2P port
  rpcPort: number;      // RPC port
  host: string;         // Host/IP
  isSigner: boolean;    // Whether it's a signer
  containerId?: string; // Docker container ID
  running?: boolean;    // Whether the node is running
}
```

### GenesisOptions
Options for genesis configuration:
```typescript
interface GenesisOptions {
  chainId?: number;
  constantinopleForkBlock?: number;
  clique?: {
    blockperiodseconds?: number;
    epochlength?: number;
  };
  alloc?: {
    [address: string]: {
      balance: string;
    };
  };
}
```

## 🔄 Usage Examples

### Complete Usage Example

```typescript
import { BesuNetwork } from '@cjmontca/libcrypto-ts';
import * as path from 'path';

// Basic configuration
const DATA_DIR = path.join(__dirname, 'besu-test');
const NETWORK_NAME = 'test-simple';

/**
 * Main function to test specific functionalities
 */
async function main() {
  try {
    // Create BesuNetwork instance
    const network = new BesuNetwork(NETWORK_NAME, {
      dataDir: DATA_DIR,
      enableLogging: true
    });

    // Create nodes (2 signers and 1 non-signer)
    const signer1 = network.createNode({ name: 'signer-1', isSigner: true });
    const signer2 = network.createNode({ name: 'signer-2', isSigner: true });
    const validator = network.createNode({ name: 'validator-1', isSigner: false });
    
    console.log('Created nodes:');
    console.log(`- ${signer1.name}: ${signer1.address}`);
    console.log(`- ${signer2.name}: ${signer2.address}`);
    console.log(`- ${validator.name}: ${validator.address}`);

    // Generate configuration
    network.generateFullNetworkConfig(DATA_DIR);
    console.log(`Configuration generated at: ${DATA_DIR}`);

    // Start the network
    console.log('Starting the network...');
    await network.startNetwork();

    // Wait for the network to fully initialize
    console.log('Waiting 10 seconds for the network to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Query network status
    const status = await network.getNetworkStatus();
    console.log('Network status:');
    console.log(`- Running: ${status.running}`);
    if (status.metrics) {
      console.log(`- Blocks: ${status.metrics.totalBlocks}`);
      console.log(`- Average peers: ${status.metrics.averagePeers}`);
    }

    // Query initial balances
    const balance1 = await network.getBalance('signer-1', signer1.address);
    console.log(`Balance of ${signer1.name}: ${BesuNetwork.weiToEther(balance1)} ETH`);

    // Send a transaction
    console.log('Sending transaction...');
    const tx = {
      from: signer1.address,
      to: signer2.address,
      value: '0x2540BE400' // 10000000000 (0.00000001 ETH)
    };
    
    const txResult = await network.sendTransaction('signer-1', tx);
    console.log(`Transaction sent: ${txResult.transactionHash}`);

    // Wait for confirmation
    if (txResult.status !== 'failed') {
      console.log('Waiting for confirmation...');
      const confirmed = await network.waitForTransaction('signer-1', txResult.transactionHash);
      console.log(`Final status: ${confirmed.status}`);
      
      // Verify new balances
      const newBalance1 = await network.getBalance('signer-1', signer1.address);
      const newBalance2 = await network.getBalance('signer-1', signer2.address);
      console.log(`New balance of ${signer1.name}: ${BesuNetwork.weiToEther(newBalance1)} ETH`);
      console.log(`New balance of ${signer2.name}: ${BesuNetwork.weiToEther(newBalance2)} ETH`);
    }

    // Uncomment to stop and remove the network
    // console.log('Stopping the network...');
    // await network.stopNetwork();
    // console.log('Network stopped successfully');
    
    // Uncomment to completely delete the network
    // console.log('Deleting the network...');
    // await network.destroyNetwork();
    // console.log('Network deleted successfully');
    
  } catch (error) {
    console.error('Error during execution:', error);
  }
}

// Execute the script
main().catch(console.error);
```

### Sending a transaction

```typescript
async function sendTx(network: BesuNetwork) {
  const txResponse = await network.sendTransaction('node1', {
    from: network.getNodes()[0].address, // node1 address
    to: '0x1234567890123456789012345678901234567890',
    value: '0x1000000000000000' // 0.001125 ETH in hex
  });
  
  console.log('Transaction sent:', txResponse);
}
```

### Checking balance

```typescript
async function checkBalance(network: BesuNetwork, address: string) {
  const balance = await network.getBalance('node1', address);
  console.log('Balance in wei:', balance);
  console.log('Balance in ETH:', BesuNetwork.weiToEther(balance));
}
```

## 🚢 Deployment Considerations

1. **Security**: This library is primarily intended for development and testing environments. For production, it is recommended to implement additional security measures, especially for key management.

2. **Docker configuration**: The library uses Docker to deploy nodes. Make sure Docker is properly configured and has permissions to create networks and containers.

3. **Ports**: P2P and RPC ports must be available on the host. By default, ports 30303+ are used for P2P and 8545+ for RPC.

4. **Persistence**: Network data and keys are stored in the specified directory. Make sure this directory is backed up if the data is important.

---
