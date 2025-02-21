#!/bin/bash

# Define the base directory
BASE_DIR=$(dirname "$0")/..  # Move up one level from the script folder
NODES_DIR="$BASE_DIR/nodes"

# Create the "nodes" folder if it doesn't exist
mkdir -p "$NODES_DIR"

# Change to the "nodes" directory
cd "$NODES_DIR" || exit 1

# Check if the Docker network besuNodes already exists
if ! docker network ls | grep -q "besuNodes"; then
    # Create the Docker network with the desired IP mask
    docker network create --subnet=176.45.10.0/24 besuNodes
fi

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

done

# Generate the genesis.json file
addressNode1=$(cat node1/address )
addressNode2=$(cat node2/address )
addressNode3=$(cat node3/address )
addressNode4=$(cat node4/address )
address=$(cat node1/address | cut -c3-)
extradata="0x"$(printf '0%.0s' {1..64})"$address"$(printf '0%.0s' {1..130})

##Debug##
echo $addressNode1
echo $addressNode2
echo $addressNode2
echo $addressNode4
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
  "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "alloc": {
    "0xC31d5ECdc839e1cd8A8489D8D78335a07Ad82425": { "balance": "0x20000000000000000000000000000000" },
    "0x3e3976a0d63A28c115037048A2Ae0FE9e456f474": { "balance": "0x10000000000000000000000000000000" },
    "0x613aaDB6D66bC91159fb07Faf6A6ABD95b3255E7": { "balance": "0x0" },
    "$addressNode2": { "balance": "0x02000000000000000000000000000000" },
    "$addressNode3": { "balance": "0x03000000000000000000000000000000" },
    "$addressNode4": { "balance": "0x04000000000000000000000000000000" }

    
  }
}
EOL

# Generate the config.toml file for the Besu Clique network
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
bootnodes = ["enode://$public@176.45.10.10:30303"]
EOL

# Start node1 using Docker
docker run -d \
  --name node1 \
  --network besuNodes \
  --ip 176.45.10.10 \
  -p 9999:8545 \
  -v $(pwd):/data \
  hyperledger/besu:latest \
  --config-file=/data/config.toml \
  --data-path=/data/node1/data \
  --node-private-key-file=/data/node1/key

# Start node2 using Docker
docker run -d \
  --name node2 \
  --network besuNodes \
  --ip 176.45.10.11 \
  -p 9998:8545 \
  -v $(pwd):/data \
  hyperledger/besu:latest \
  --config-file=/data/config.toml \
  --data-path=/data/node2/data \
  --node-private-key-file=/data/node2/key

  # Start node3 using Docker
docker run -d \
  --name node3 \
  --network besuNodes \
  --ip 176.45.10.12 \
  -p 9997:8545 \
  -v $(pwd):/data \
  hyperledger/besu:latest \
  --config-file=/data/config.toml \
  --data-path=/data/node3/data \
  --node-private-key-file=/data/node3/key

  # Start node4 using Docker
docker run -d \
  --name node4 \
  --network besuNodes \
  --ip 176.45.10.13 \
  -p 9996:8545 \
  -v $(pwd):/data \
  hyperledger/besu:latest \
  --config-file=/data/config.toml \
  --data-path=/data/node4/data \
  --node-private-key-file=/data/node4/key

