#!/bin/bash

# Define the base directory
baseDir=$(dirname "$0")/..
nodesDir="$baseDir/nodes"

# Iterate over all directories that match the pattern "node*"
for nodeDir in "$nodesDir"/node*; do
    if [ -d "$nodeDir" ]; then
        # Extract the node number from the directory name
        nodeNumber=$(basename "$nodeDir" | sed 's/node//')
        
        # Get the node's address
        address=$(cat "$nodeDir/address")
        
        # Get the node's balance
        port=$((10000 - nodeNumber))
        balance=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$address'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:$port | jq -r '.result')
        
        # Display the balance in Wei
        echo "Node$nodeNumber ($address) balance: $balance Wei"
    fi
done