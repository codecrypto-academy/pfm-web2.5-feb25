#Script Overview: Besu Network Setup and Transaction Execution
This script automates the setup of a private Ethereum network using Hyperledger Besu and executes a transaction between nodes. Below is a step-by-step explanation of what the script does:

##1. Directory Setup
The script defines a base directory and creates a nodes folder if it doesn't already exist. This folder will store the data for each node in the network.

#2. Docker Network Configuration
The script checks if a Docker network named besuNodes already exists. If it does, the network is removed to ensure a clean setup.

A new Docker network is created with the subnet 176.45.10.0/24. This network will be used to connect the Besu nodes.

##3. Node Key Generation
The script generates cryptographic keys and addresses for four nodes (node1 to node4) using the besu command.

Each node's public key and address are saved in their respective directories (node1, node2, etc.).

##4. Genesis File Creation
A genesis.json file is generated, which defines the initial state of the blockchain. This file includes:

A unique chainId for the network.

Predefined balances for each node's address.

Configuration for the Clique consensus algorithm, which is used for Proof of Authority (PoA) consensus.

##5. Configuration File Creation
A config.toml file is created for the Besu nodes. This file includes:

The path to the genesis.json file.

RPC (Remote Procedure Call) settings for interacting with the nodes.

Bootnode configuration to allow nodes to discover each other.

##6. Docker Container Deployment
The script starts four Docker containers, each representing a Besu node. Each node is assigned a unique IP address within the besuNodes network.

The nodes are configured to use the previously generated keys and the genesis.json file.

##7. Node Readiness Check
The script waits for the nodes to be fully up and running by checking their RPC endpoints. It ensures that nodes 2 and 4 are ready before proceeding.

##8. Transaction Execution
The script retrieves the private key of node 4 (in a real-world scenario, this should be done securely and not exposed in the script).

A transaction is created to send 0.1 Ether from node 4 to node 2.

The transaction is signed using node 4's private key and sent to the network via node 2's RPC endpoint.

The script waits for the transaction to be mined and confirmed on the blockchain.

##9. Balance Verification
After the transaction is mined, the script checks the balances of node 2 and node 4 to verify that the transaction was successful.

The script calculates and displays the difference in balances before and after the transaction.

##10. Conclusion
The script outputs the final balances of node 2 and node 4, showing the change in their balances after the transaction.

###Notes:
**Security Warning:** The script exposes the private key of node 4 in plain text. In a production environment, private keys should be handled securely and never exposed in scripts.

Dependencies: The script assumes that Docker, Besu, jq and Node.js are installed and properly configured on the system.

This script is useful for setting up a local Ethereum network for testing or development purposes, allowing users to simulate transactions and interactions between nodes.