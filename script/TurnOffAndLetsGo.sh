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
