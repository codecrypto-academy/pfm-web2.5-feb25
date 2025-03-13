# besu-network-lib

Library for automated deployment and management of blockchain networks with Hyperledger Besu.

## Installation

```bash
npm i besu-network-lib
```

## Requirements

- **Docker**: To run nodes
- **Hyperledger Besu**: For key generation and network configuration
- **Node.js**: v14 or higher

## Library Usage

This library provides modular functions to configure and manage a Hyperledger Besu network.

### Import

```typescript
import {
  setupBesuNetwork,
  getBalance,
  sendTransaction,
  addNode,
  removeNode,
} from "besu-network-lib";
```

### Configure a network

```typescript
// Use default configuration
await setupBesuNetwork();

// Or use a custom configuration
import { NetworkConfigInterface } from "besu-network-lib/types";

const myConfig: NetworkConfigInterface = {
  network: {
    networkName: "my-besu-network",
    basePort: 8545,
  },
  chain: {
    chainId: 1337,
    londonBlock: 0,
    clique: {
      blockPeriodSeconds: 5,
      epochLength: 30000,
      createEmptyBlocks: true,
    },
    gasLimit: "0x47b760",
    difficulty: "0x1",
  },
  nodes: {
    validators: 1,
    fullnodes: 3,
  },
  transaction: {
    to: "0x123...",
    amount: "0.5",
  },
  tech: {
    dockerImage: "hyperledger/besu:latest",
    validatorStartupTime: 5,
  },
};

await setupBesuNetwork(myConfig);
```

### Query balance

```typescript
const address = "0x123...";
const balance = await getBalance(address);
console.log(`Balance: ${balance} ETH`);
```

### Send transaction

```typescript
// Using default values
const txHash = await sendTransaction();

// Or with specific parameters
const txHash = await sendTransaction("1.5", "0xDestination...");
```

### Manage nodes

```typescript
// Add a new node
const newNode = await addNode();
console.log(`Node added: ${newNode.nodeId}, URL: ${newNode.nodeUrl}`);

// Remove a node (except validator)
await removeNode(3); // Removes node3
```

### Other available functions

- `cleanExistingFiles()`: Cleans existing files and Docker containers
- `createDockerNetwork()`: Creates a Docker network for the nodes
- `showNetworkInfo()`: Displays information about the configured network

## Network Structure

By default, the library configures:

- 1 validator node (accessible on port 10001)
- 2 full nodes (accessible on ports 10002 and 10003)
- Private Ethereum network based on the Clique consensus algorithm (PoA)

## Advanced Functions

The library also provides individual functions that can be used to build custom workflows:

```typescript
import {
  cleanExistingFiles,
  createDockerNetwork,
  createNodeDirectory,
  createGenesisFile,
  createValidatorConfig,
  launchValidatorNode,
  getValidatorEnode,
  createFullnodeConfig,
  launchFullnodeContainers,
} from "besu-network-lib";
```

## Troubleshooting

- For Docker permission issues, you may need to run with sudo or add your user to the docker group
- Make sure Hyperledger Besu is properly installed and accessible from the command line

---

For more information about Hyperledger Besu, visit the [official documentation](https://besu.hyperledger.org/).
