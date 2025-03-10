#!/bin/bash

# Define the base directory
baseDir=$(dirname "$0")/..  # Move up one level from the script folder
nodesDir="$baseDir/nodes"

######################################################
# Clean up previous setup (nodes folder, Docker network, and containers)
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

######################################################
# Create the "nodes" folder 
mkdir -p "$nodesDir"

# Change to the "nodes" directory
cd "$nodesDir" || exit 1

######################################################
# Create the Docker network with the desired IP mask
echo "Creating new 'besuNodes' network..."
docker network create --subnet=176.45.10.0/24 besuNodes
if [ $? -ne 0 ]; then
    echo "Failed to create the 'besuNodes' network. Exiting..."
    exit 1
fi
echo "Network 'besuNodes' created successfully."

######################################################
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

######################################################
# Generate the genesis.json file
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
    "$addressNode1": { "balance": "0x99000000000000000000000000000000000000000000000000000000000000" }
    
    
  }
}
EOL

######################################################
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


######################################################
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


######################################################
# Wait for the nodes to be fully up and running
# Function to check if a node is up and running
check_node_ready() {
    local rpc_url=$1
    local max_attempts=5
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
check_node_ready "http://localhost:9999" || exit 1  # Node 1


######################################################
echo "Balances before transaccion:"
node2BalanceBefore=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$addressNode2'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9998/ | jq -r '.result')
node1BalanceBefore=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$addressNode1'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9999/ | jq -r '.result')
echo "Node2 balance before: $node2BalanceBefore Wei"
echo "Node4 balance before: $node1BalanceBefore Wei"
######################################################
# Function to send a raw signed transaction
send_raw_transaction() {
    local rpc_url=$1
    local signed_tx=$2

    local json_rpc_request=$(jq -n \
        --arg st "$signed_tx" \
        '{jsonrpc: "2.0", method: "eth_sendRawTransaction", params: [$st], id: 1}')


    echo "Sending raw transaction to $rpc_url..." >&2
    local response=$(curl -s -X POST --data "$json_rpc_request" -H "Content-Type: application/json" "$rpc_url")
    local tx_hash=$(echo "$response" | jq -r '.result')

    if [ "$tx_hash" != "null" ]; then
        echo "Transaction sent successfully! Transaction hash: $tx_hash" >&2
        echo "$tx_hash"  
    else
        echo "Failed to send transaction. Error: $(echo "$response" | jq -r '.error.message')" >&2
        return 1
    fi
}

# Get the private key of node 1 (this should be done securely)
# NOTE: In a real environment, never expose the private key in a script.
node1PrivKey=$(cat node1/key | tr -d '\n' | sed 's/^0x//') #| head -c 64

# Get the nonce for node1
nonce=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getTransactionCount","params":["'$addressNode1'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9999 | jq -r '.result')

# Define the amount to send (in Wei)
amountToSend="0x16345785d8a0000"  # 0.1 Ether in Wei

# Create the unsigned transaction 
unsignedTx=$(jq -n \
    --arg from "$addressNode1" \
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
    const privateKey = '$node1PrivKey';
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
    
    #echo "transactionReceipt: $transactionReceipt"
    if [ -n "$transactionReceipt" ] && [ "$transactionReceipt" != "null" ]; then
        echo "Transaction mined successfully!"
        break
    else
        echo "Transaction not mined yet. Retrying in 5 seconds..."
        sleep 5
    fi
done


# Get the balances of node2 and node1 after the transaction
node2Balance=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$addressNode2'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9998 | jq -r '.result')
node1Balance=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$addressNode1'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9999 | jq -r '.result')

#########################################################
echo "Balances after the transaction:"
node2BalanceAfter=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$addressNode2'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9998/ | jq -r '.result')
node1BalanceAfter=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$addressNode1'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9999/ | jq -r '.result')
echo "Node2 balance after: $node2BalanceAfter Wei"
echo "Node1 balance after: $node1BalanceAfter Wei"
#########################################################
echo "Diferencia en balances:"
echo "Node2: $((16#${node2BalanceAfter#0x} - 16#${node2BalanceBefore#0x})) Wei"
echo "Node1: $((16#${node1BalanceAfter#0x} - 16#${node1BalanceBefore#0x})) Wei"
