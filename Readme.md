# README: Explanation of the Bash Script for Managing a Besu Node with Docker

This document describes the operation of a bash script that configures and manages an Ethereum node network using **Hyperledger Besu** and **Docker**. Throughout this file, the different sections of the script and their purpose are detailed.

## Index

1. [General Description](#general-description)
2. [Cleaning Previous Configuration](#cleaning-previous-configuration)
3. [Creating Directory and Docker Network](#creating-directory-and-docker-network)
4. [Generating Keys and Addresses](#generating-keys-and-addresses)
5. [Creating the Genesis File](#creating-the-genesis-file)
6. [Generating the `config.toml` File](#generating-the-configtoml-file)
7. [Starting Docker Nodes](#starting-docker-nodes)
8. [Checking Node Availability](#checking-node-availability)
9. [Transactions Between Nodes](#transactions-between-nodes)
10. [Balance Before and After the Transaction](#balance-before-and-after-the-transaction)
---

## General Description

This script automates the process of configuring multiple **Hyperledger Besu** nodes in a Docker network. It creates a custom Docker network, generates public keys and addresses for each node, and configures the necessary files to start the nodes. Additionally, it performs transactions between nodes and monitors their status.

---

## Cleaning Previous Configuration

In this section, the script cleans any previous configuration to ensure that nodes do not start with old settings.

```bash
 Clean up previous setup (nodes folder, Docker network, and containers)
echo "Cleaning up previous setup..."

# Stop and remove any existing containers
for container in $(docker ps -a --filter "name=node" --format "{{.Names}}"); do
    echo "Stopping and removing container $container..."
    docker stop "$container" > /dev/null 2>&1
    docker rm "$container" > /dev/null 2>&1
done

# Remove the Docker network if it exists
if docker network ls | grep -q "besuNodes"; then
    echo "Removing existing Docker network 'besuNodes'..."
    docker network rm besuNodes > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "Failed to remove the existing 'besuNodes' network. Exiting..."
        exit 1
    fi
    echo "Docker network 'besuNodes' removed successfully."
fi

# Remove the nodes directory if it exists
if [ -d "$nodesDir" ]; then
    echo "Removing existing nodes directory..."
    rm -rf "$nodesDir"
    if [ $? -ne 0 ]; then
        echo "Failed to remove the nodes directory. Exiting..."
        exit 1
    fi
    echo "Nodes directory removed successfully."
fi
```


---

## Creating Directory and Docker Network

A new directory named `nodes` is created and set as the working directory. Then, a new Docker network called `besuNodes` is created with a specific subnet.

```bash
# Create the "nodes" folder 
mkdir -p "$nodesDir"

# Change to the "nodes" directory
cd "$nodesDir" || exit 1

# Create the Docker network with the desired IP mask
echo "Creating new 'besuNodes' network..."
docker network create --subnet=176.45.10.0/24 besuNodes
if [ $? -ne 0 ]; then
    echo "Failed to create the 'besuNodes' network. Exiting..."
    exit 1
fi
echo "Network 'besuNodes' created successfully."
```



---

## Generating Keys and Addresses

For each node, the script generates public keys and addresses using the Besu command.


```bash
# Loop to generate keys and addresses for nodes 1 to 4
for i in {1..4}; do
    # Create the necessary directory structure
    mkdir -p node$i
    
    # Execute the Besu command to generate the key and capture the output
    output=$(besu --data-path=node$i public-key export-address --to=node$i/address)
    
    # Extract the public key from the output using a regex pattern
    public_key=$(echo "$output" | grep -oP 'Generated new secp256k1 public key \K0x[0-9a-fA-F]{128}')
    
    # Save the public key to the node's public file
    echo "$public_key" > node$i/public
    sleep 2 #trust me
done
```

Each node gets a public key and an associated address, which are stored in separate files.

---

## Creating the Genesis File

Here, the `genesis.json` file is generated, containing the network configuration, including node addresses and their initial balances.

```bash
## Generate the genesis.json file
addressNode1=$(cat node1/address )
addressNode2=$(cat node2/address )
addressNode3=$(cat node3/address )
addressNode4=$(cat node4/address )
address=$(cat node1/address | cut -c3-)
extradata="0x"$(printf '0%.0s' {1..64})"$address"$(printf '0%.0s' {1..130})

##Debug##
#echo $addressNode1
#echo $addressNode2
#echo $addressNode3
#echo $addressNode4
##Debug##

cat > genesis.json <<EOL
{
  "config": {
    "chainId": 123999,
    "berlinBlock": 0,
    "londonBlock": 0,
    "clique": {
      "blockPeriodSeconds": 5,
      "epochLength": 30000
    }
  },
  "nonce": "0x0",
  "timestamp": "0x0",
  "extraData": "$extradata",
  "gasLimit": "0x1fffffffffffff",
  "difficulty": "0x1",
  "alloc": {
    "0xC31d5ECdc839e1cd8A8489D8D78335a07Ad82425": { "balance": "0x90000000000000000000000000000000000000000000000000000000000000" },
    "0x3e3976a0d63A28c115037048A2Ae0FE9e456f474": { "balance": "0x80000000000000000000000000000000000000000000000000000000000000" },
    "0x613aaDB6D66bC91159fb07Faf6A6ABD95b3255E7": { "balance": "0x0" },
    "$addressNode2": { "balance": "0x20000000000000000000000000000000000000000000000000000000000000" },
    "$addressNode3": { "balance": "0x30000000000000000000000000000000000000000000000000000000000000" },
    "$addressNode4": { "balance": "0x40000000000000000000000000000000000000000000000000000000000000" }

    
  }
}
EOL

```
The `genesis.json` file is created with the network configuration, including the `chainId`, account balances, and block structure.

---

## Generating the `config.toml` File

The script generates the `config.toml` file, necessary to configure the execution of each Besu node.

```bash
# Generate the config.toml file 
public=$(cat node1/public | cut -c3-)
cat > config.toml <<EOL

genesis-file = "/data/genesis.json"

min-gas-price = 0
nat-method = "NONE"
rpc-http-enabled = true
rpc-http-api = ["ETH", "NET", "WEB3", "ADMIN","CLIQUE","TRACE","DEBUG","TXPOOL","PERM"]
rpc-http-cors-origins = ["*"]
rpc-http-host = "0.0.0.0"
rpc-http-port = 8545

p2p-port = 30303
bootnodes = ["enode://$public@176.45.10.11:30303"]
EOL
```
This file configures communication ports, enabled APIs, and the bootnode address so nodes can connect to each other.

---

## Starting Docker Nodes

The script creates and runs four nodes using Docker. Each node runs in a container with a specific IP and port.

```bash
# Start nodes using Docker
for i in {1..4}; do
    ip="176.45.10.1$i"
    echo "Starting node$i with IP $ip..."
    docker run -d \
      --name node$i \
      --network besuNodes \
      --ip $ip \
      -p $((10000-i)):8545 \
      -v $(pwd):/data \
      hyperledger/besu:latest \
      --config-file=/data/config.toml \
      --data-path=/data/node$i/data \
      --node-private-key-file=/data/node$i/key
    sleep 2
done

```
Each node starts with its own configuration and network. The HTTP ports of the nodes are mapped to incremental local ports.


---

## Checking Node Availability

Before proceeding with transactions, the script verifies that the nodes are fully ready.

```bash
# Wait for the nodes to be fully up and running
# Function to check if a node is up and running
check_node_ready() {
    local rpc_url=$1
    local max_attempts=3
    local attempt=0

    echo "Checking if node at $rpc_url is ready..."

    while [ $attempt -lt $max_attempts ]; do
        if curl -s -X POST --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}' -H "Content-Type: application/json" "$rpc_url" > /dev/null; then
            echo "Node at $rpc_url is ready!"
            return 0
        else
            echo "Node at $rpc_url not ready yet. Attempt $((attempt + 1))/$max_attempts..."
            sleep 5
            attempt=$((attempt + 1))
        fi
    done

    echo "Node at $rpc_url did not start within the expected time."
    return 1
}

# Check if nodes are ready
check_node_ready "http://localhost:9998" || exit 1  # Node 2
check_node_ready "http://localhost:9996" || exit 1  # Node 4
```
The `check_node_ready` function uses Besu's RPC API to confirm that the nodes are responding correctly.

---

## Transactions Between Nodes

In this section, the script performs a transaction between two nodes, verifying their balances before and after the operation.

```bash
 # Function to send a raw signed transaction
send_raw_transaction() {
    local rpc_url=$1
    local signed_tx=$2

    local json_rpc_request=$(jq -n \
        --arg st "$signed_tx" \
        '{jsonrpc: "2.0", method: "eth_sendRawTransaction", params: [$st], id: 1}')


    echo "Sending raw transaction to $rpc_url..."
    local response=$(curl -s -X POST --data "$json_rpc_request" -H "Content-Type: application/json" "$rpc_url")
    local tx_hash=$(echo "$response" | jq -r '.result')

    if [ "$tx_hash" != "null" ]; then
        echo "Transaction sent successfully! Transaction hash: $tx_hash"
        echo "$tx_hash"
    else
        echo "Failed to send transaction. Error: $(echo "$response" | jq -r '.error.message')"
        return 1
    fi
}

# Get the private key of node 1 (this should be done securely)
# NOTE: In a real environment, never expose the private key in a script.
node4PrivKey=$(cat node4/key | tr -d '\n' | sed 's/^0x//') #| head -c 64

# Get the nonce for node4
nonce=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getTransactionCount","params":["'$addressNode4'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9996 | jq -r '.result')

# Define the amount to send (in Wei)
amountToSend="0x16345785d8a0000"  # 0.1 Ether in Wei

# Create the unsigned transaction 
unsignedTx=$(jq -n \
    --arg from "$addressNode4" \
    --arg to "$addressNode2" \
    --arg nonce "$nonce" \
    --arg value "$amountToSend" \
    '{from: $from, 
    nonce: $nonce, 
    gasPrice: "0x3b9aca00",
    gas: "0xCF08",  # Aumentado a 53000 (0xCF08)
    to: $to, 
    value: $value, 
    chainId: 123999}')
#echo "DEBUG: Unsigned transaction: $unsignedTx"

# Sign the transaction using the Node.js script
echo "Signing the transaction..."
signedTx=$(node -e "
    const {Web3} = require('web3');
    const web3 = new Web3();
    const unsignedTx = $unsignedTx;
    const privateKey = '$node4PrivKey';
    web3.eth.accounts.signTransaction(unsignedTx, privateKey)
        .then(signed => console.log(signed.rawTransaction))
        .catch(err => console.error('Signing error:', err));
")
echo "Signed Transaction: $signedTx"

# Send the signed transaction
echo "Sending the signed transaction..."
hashTx=$(send_raw_transaction "http://localhost:9998" "$signedTx")

echo "Transaction hash received: $hashTx"

# Wait for the transaction receipt
echo "Waiting for the transaction to be mined..."

while true; do
    transactionReceipt=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["'$hashTx'"],"id":1}' -H "Content-Type: application/json" http://localhost:9998 | jq -r '.result')
    echo $transactionReceipt
    if [ "$transactionReceipt" != "null" ]; then
        echo "Transaction mined successfully!"
        break
    else
        echo "Transaction not mined yet. Retrying in 5 seconds..."
        sleep 5
    fi
done

```

---

## Balance Before and After the Transaction

Finally, the script checks the balances of the nodes before and after the transaction.

```bash

# Balance antes de la transacción

echo "Balances before transaccion:"
node2BalanceBefore=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$addressNode2'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9998/ | jq -r '.result')
node4BalanceBefore=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$addressNode4'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9996/ | jq -r '.result')

# Get the balances of node2 and node4 after the transaction
node2Balance=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$addressNode2'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9998 | jq -r '.result')
node4Balance=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$addressNode4'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9996 | jq -r '.result')


echo "Diferencia en balances:"
echo "Node2: $((16#${node2BalanceAfter#0x} - 16#${node2BalanceBefore#0x})) Wei"
echo "Node4: $((16#${node4BalanceAfter#0x} - 16#${node4BalanceBefore#0x})) Wei"

```

---

