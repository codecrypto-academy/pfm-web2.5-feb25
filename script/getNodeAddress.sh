#!/bin/bash

# Define the base directory
baseDir=$(dirname "$0")/..  # Move up one level from the script folder
nodesDir="$baseDir/nodes"

# Check if the node name is provided
if [ -z "$1" ]; then
    echo "Error: Node name is required. Usage: $0 <node_name>"
    exit 1
fi

nodeName=$1
nodeDir="$nodesDir/$nodeName"

# Check if the node directory exists
if [ ! -d "$nodeDir" ]; then
    echo "Error: Node directory '$nodeDir' does not exist."
    exit 1
fi

# Check if the address file exists
addressFile="$nodeDir/address"
if [ ! -f "$addressFile" ]; then
    echo "Error: Address file '$addressFile' does not exist."
    exit 1
fi

# Read and output the address
address=$(cat "$addressFile")
echo $address