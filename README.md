# Hyperledger Besu Network Setup Script

This Bash script automates the setup of a blockchain network using Hyperledger Besu. It creates a custom network with validators and full nodes, configuring necessary files, running Docker containers, and generating node keys.

## Requirements

### Dependencies

1. **Docker**: Ensure Docker is installed and configured.
2. **Hyperledger Besu**: Download it from the [official Hyperledger Besu website](https://besu.hyperledger.org/).
3. **jq**: A command-line tool for processing JSON.
4. **bc**: Arbitrary-precision calculator for mathematical operations.
5. **Metamask Account**: Provide a valid address in the`0x...` format.

### Permissions

This script may require administrator privileges to execute Docker-related commands.

## Installation

1. **Clone the repository or download the script.**.
2. Ensure the file has execution permissions:

   ```bash
   chmod +x script.sh
   ```

3. Run the script:
   ```bash
   ./script.sh
   ```

## Main Features

### Dependency Verification

The script checks for the installation of Docker, Hyperledger Besu, and jq before proceeding.

### Docker Network Creation

Creates a Docker network named besu for communication between nodes.

### Node Configuration

- Prompts for the number of nodes to create, ensuring at least one validator node is created.
- Generates keys and addresses for each node.

### `genesis.json` File

Creates a custom `genesis.json` file with:

- A unique `chainID`.
- Clique consensus configuration.
- Predefined fund allocation to the validator node's account.

### Validator and Full Node Configuration

- Generates `config.toml` and `config-fullnode.toml` files for nodes.
- Configures validator and full nodes with necessary ports and parameters.

### Node Launching

- Starts Docker containers for all nodes.
- Retrieves the `enode` information of the validator node.

### Network Information

Upon completion, displays:

- The total number of nodes.
- URLs to access the nodes
- The `enode` of the validator node.

## Output

After executing the script, you will have:

- A functional Hyperledger Besu network with validators and full nodes.
- Configuration files (`genesis.json`, `config.toml`, `config-fullnode.toml`).
- Running Docker containers.
- Access information for nodes and network configuration details.

## Transaction Handler

Once the network is launched:

- Install Node.js.
- Generate the `sign_tx.js` file to sign transactions.

## Interactive Usage

The script is interactive and prompts for the following information:

- **Number of Nodes**: Including validators and full nodes.
- **Initial Balance**: Displays the initial balance loaded into the validator node's account from `genesis.json`.
- **Perform a Transaction**: Allows sending a transaction from the validator node's account, acting as a faucet.
- **Metamask Account**: Address to send funds to.
- **Transaction Hash**: Once completed.
- **Updated Balances**: Displays updated balances for both the origin (validator node) and destination addresses after the transaction.

## Project Structure

- `script.sh`: The main script.
- Directories created for each node, containing keys and configuration data.
- Generated configuration files:
  - `genesis.json`
  - `config.toml` (for validators)
  - `config-fullnode.toml` (for full nodes)
- Transaction handler:
  - `package.json` y `package-lock.json` with EthereumJS dependencies
  - `node_modules`
  - `sign_tx.js` to sign transactions

## Common Issues

- **Docker Not Installed**: Ensure Docker is installed on your system.
- **Hyperledger Besu Not Found**: Add Besu to your PATH environment variable.

## License

This project is open-source. Feel free to adapt and improve it according to your needs.

---

For more information about Hyperledger Besu, visit the [official documentation](https://besu.hyperledger.org/).
