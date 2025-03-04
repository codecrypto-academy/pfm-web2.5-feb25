#!/bin/bash

# Define the base directory
baseDir=$(dirname "$0")/..
nodesDir="$baseDir/nodes"

# Iterate over the available nodes
i=1
while [ -d "$nodesDir/node$i" ]; do
    address=$(cat "$nodesDir/node$i/address")
    
    # Get the node's balance
    port=$((10000-i))  
    balance=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$address'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:$port | jq -r '.result')
    
    # Display the balance in Wei
    echo "Node$i ($address) balance: $balance Wei"
    
    i=$((i + 1))
done
