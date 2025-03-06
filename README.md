# Hyperledger Besu Automated Network Setup

This script automates the setup of a Hyperledger Besu blockchain network with 1 validator and 2 full nodes, running in Docker containers.

## Requirements

- **Docker**: For running the nodes
- **Hyperledger Besu**: For key generation and network configuration
- **jq**: For JSON processing
- **bc**: For mathematical calculations

## Quick Start

```bash
chmod +x script.sh
./script.sh
```

## What the Script Does

1. **Environment Setup**

   - Cleans existing files and containers
   - Checks for required dependencies
   - Creates a Docker network for node communication

2. **Node Configuration**

   - Creates 3 nodes: 1 validator and 2 full nodes
   - Generates keys for each node
   - Creates configuration files (genesis.json, config.toml, config-fullnode.toml)

3. **Network Launch**

   - Launches the validator node
   - Obtains the validator's enode information
   - Launches the 2 full nodes connected to the validator

4. **Network Verification**
   - Automatically sends a test transaction of 50 ETH to a predefined address
   - Shows transaction details and updated account balances
   - Confirms the network is operating correctly

## Node Access

- Validator Node: http://localhost:10001
- Full Node 1: http://localhost:10002
- Full Node 2: http://localhost:10003

## Files Generated

- `genesis.json`: Blockchain genesis configuration
- `config.toml`: Validator node configuration
- `config-fullnode.toml`: Full node configuration
- Node directories with keys and addresses

## Troubleshooting

- If dependencies are missing, the script will detect this and provide installation instructions
- For Docker permission issues, you may need to run with sudo or add your user to the docker group

---

For more information about Hyperledger Besu, visit the [official documentation](https://besu.hyperledger.org/).
