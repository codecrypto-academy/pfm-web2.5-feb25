#!/bin/bash

# Define the base directory
baseDir=$(dirname "$0")/..  # Move up one level from the script folder
nodesDir="$baseDir/nodes"

# Create the "nodes" folder 
mkdir -p "$nodesDir"

# Change to the nodes directory
cd "$nodesDir" || exit 1

######################################################
# Find the next available node directory
nodeNumber=1
while [ -d "node$nodeNumber" ]; do
    nodeNumber=$((nodeNumber + 1))
done

nodeDir="node$nodeNumber"
echo "Creating node directory: $nodeDir"
mkdir -p "$nodeDir"

######################################################
# Generate keys and addresses for the new node
echo "Generating keys and addresses for $nodeDir..."
output=$(besu --data-path="$nodeDir" public-key export-address --to="$nodeDir/address")
public_key=$(echo "$output" | grep -oP 'Generated new secp256k1 public key \K0x[0-9a-fA-F]{128}')
echo "$public_key" > "$nodeDir/public"

# Get the address of the new node
address=$(cat "$nodeDir/address")
echo "Node address: $address"
sleep 2 #trust me

######################################################
# Generate the genesis.json file with only the new node's address in alloc
addressNode1=$(cat node1/address | cut -c3-)
addressNode2=$(cat node2/address )
addressNode3=$(cat node3/address )
addressNode4=$(cat node4/address )
extradata="0x"$(printf '0%.0s' {1..64})"$addressNode1"$(printf '0%.0s' {1..130})

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
# Start the node using Docker
ip="176.45.10.1$nodeNumber"
rpcPort=$((10000 - nodeNumber))

echo "Starting node$nodeNumber with IP $ip and RPC port $rpcPort..."
docker run -d \
  --name "node$nodeNumber" \
  --network besuNodes \
  --ip "$ip" \
  -p "$rpcPort":8545 \
  -v "$(pwd)":/data \
  hyperledger/besu:latest \
  --config-file=/data/config.toml \
  --data-path="/data/$nodeDir/data" \
  --node-private-key-file="/data/$nodeDir/key"
  sleep 2

######################################################
# Wait for the node to be fully up and running
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

# Check if the node is ready
check_node_ready "http://localhost:$rpcPort" || exit 1

######################################################
echo "Node$nodeNumber created and started successfully!"
echo "RPC endpoint: http://localhost:$rpcPort"