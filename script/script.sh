#!/bin/bash

# Script to create an automated Hyperledger Besu network with validators and fullnodes

# Colors for messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print messages
print_message() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to clean existing files and folders
clean_existing_files() {
  print_message "Cleaning existing files and folders..."
  
  # Stop and remove existing Docker containers related to Besu
  print_message "Stopping and removing existing Docker containers..."
  for container in $(docker ps -a --filter name=node* -q); do
    docker stop $container &>/dev/null
    docker rm $container &>/dev/null
  done
  print_message "Docker containers removed."
  
  # Remove configuration files
  print_message "Removing configuration files..."
  rm -f genesis.json config.toml config-fullnode.toml sign_tx.js package.json package-lock.json
  print_message "Configuration files removed."
  
  # Remove node directories
  print_message "Removing node directories..."
  rm -rf node*/
  print_message "Node directories removed"
  
  # Remove node_modules if it exists
  if [ -d "node_modules" ]; then
    print_message "Removing node_modules..."
    rm -rf node_modules
    print_message "node_modules removed."
  fi
  
  print_message "Cleanup completed. The environment is ready for a new installation."
}

# Verify that all required dependencies are installed
check_dependencies() {
  print_message "Checking dependencies..."
  
  if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install it before continuing."
    exit 1
  fi
  
  if ! command -v besu &> /dev/null; then
    print_error "Hyperledger Besu is not installed. Please install it before continuing."
    exit 1
  fi
  
  if ! command -v jq &> /dev/null; then
    print_error "The 'jq' command is not installed. Please install it with 'sudo apt-get install jq' or the equivalent for your system."
    exit 1
  fi
  
  if ! command -v bc &> /dev/null; then
    print_error "The 'bc' command is not installed. Please install it with 'sudo apt-get install bc' or the equivalent for your system."
    exit 1
  fi
  
  print_message "All dependencies are installed."
}

# Create the Docker network
create_docker_network() {
  print_message "Creating Docker network 'besu'..."
  
  # Check if the network already exists
  if docker network inspect besu &> /dev/null; then
    print_warning "The 'besu' network already exists. The existing one will be used."
  else
    docker network create besu
    print_message "Network 'besu' created successfully."
  fi
}

# Create directory for the node and generate its key
create_node_directory() {
  local node_num=$1
  local node_dir="node${node_num}"
  
  print_message "Creating directory for node $node_num..."
  
  # Create directory if it doesn't exist
  mkdir -p "$node_dir"
  
  # Generate key and address for the node
  print_message "Generating key and address for node $node_num..."
  besu --data-path="$node_dir" public-key export-address --to="$node_dir/address"
  
  print_message "Node $node_num configured correctly."
}

# Create the genesis.json file
create_genesis_file() {
  print_message "Creating genesis.json file..."
  
  # Get the address of the first node for extradata and alloc
  NODE1_ADDRESS=$(cat node1/address)
  NODE1_ADDRESS_STRIP=$(echo "$NODE1_ADDRESS" | tail -n 1 | sed 's/0x//')
  
  # Create the extradata with the address of the first node
  EXTRADATA="0x0000000000000000000000000000000000000000000000000000000000000000${NODE1_ADDRESS_STRIP}0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
  
  # Create the genesis.json file
  cat > genesis.json << EOL
{
  "config": {
    "chainID": 4004,
    "londonBlock": 0,
    "clique": {
      "blockperiodseconds": 4,
      "epochlength": 30000,
      "createemptyblocks": true
    }
  },
  "extradata": "${EXTRADATA}",
  "gasLimit": "0x1fffffffffffff",
  "difficulty": "0x1",
  "alloc": {
    "${NODE1_ADDRESS}": {
      "balance": "0x21e19e0c9bab2400000"
    }
  }
}
EOL
  
  print_message "genesis.json file created successfully."
}

# Create the config-validator.toml file
create_validator_config() {
  print_message "Creating config.toml file for the validator node..."
  
  cat > config.toml << EOL
genesis-file = "/data/genesis.json"
# Networking
p2p-host = "0.0.0.0"
p2p-port = 30303
p2p-enabled = true
# IPC configuration
# JSON-RPC
# Node discovery
discovery-enabled = true
rpc-http-enabled = true
rpc-http-host = "0.0.0.0"
rpc-http-port = 8545
rpc-http-cors-origins = ["*"]
rpc-http-api = [
  "ETH",
  "NET",
  "CLIQUE",
  "ADMIN",
  "TRACE",
  "DEBUG",
  "TXPOOL",
  "PERM",
]
host-allowlist = ["*"]
EOL
  
  print_message "config.toml file for the validator node created successfully."
}

# Launch the validator node
launch_validator_node() {
  print_message "Launching the validator node..."
  
  # Launch the validator node container
  docker run -d \
    --name node1 \
    --network besu \
    -p 10001:8545 \
    -v "${PWD}:/data" \
    hyperledger/besu:latest \
    --config-file=/data/config.toml \
    --data-path=/data/node1/data \
    --node-private-key-file=/data/node1/key \
    --genesis-file=/data/genesis.json
  
  print_message "Validator node container launched successfully."
  
  # Wait for the node to start
  print_message "Waiting for the validator node to start (15 seconds)..."
  sleep 15
}

# Get the enode of the validator node
get_validator_enode() {
  print_message "Getting the enode of the validator node..."
  
  # Get the IP of the validator node
  NODE1_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' node1)
  print_message "Validator node IP: $NODE1_IP"
  
  # Exporting the public key with besu
  print_message "Exporting the public key with besu..."
  NODE1_PUBKEY=$(besu --data-path=node1 public-key export 2>/dev/null | tail -1)
  
  # Make sure it doesn't have the 0x prefix
  NODE1_PUBKEY=$(echo "$NODE1_PUBKEY" | sed 's/^0x//')
  
  # Verify that the key has 128 characters
  if [ ! -z "$NODE1_PUBKEY" ] && [ ${#NODE1_PUBKEY} -eq 128 ]; then
    ENODE_FINAL="enode://${NODE1_PUBKEY}@${NODE1_IP}:30303"
    print_message "Enode generated successfully: $ENODE_FINAL"
    return 0
  fi
  
  # If we get here, we couldn't obtain the public key correctly
  print_error "Couldn't obtain a valid public key for the validator node."
  print_error "Make sure the node has been initialized correctly and that the public key is available."
  exit 1
}

# Create the config-fullnode.toml file
create_fullnode_config() {
  print_message "Creating config-fullnode.toml file for the full nodes..."
  
  cat > config-fullnode.toml << EOL
genesis-file = "/data/genesis.json"
# Networking
p2p-host = "0.0.0.0"
p2p-port = 30303
p2p-enabled = true
# Bootstrap node connection
bootnodes = [
  "${ENODE_FINAL}",
]
# JSON-RPC
rpc-http-enabled = true
rpc-http-host = "0.0.0.0"
rpc-http-port = 8545
rpc-http-cors-origins = ["*"]
rpc-http-api = ["ETH", "NET", "CLIQUE", "ADMIN", "DEBUG", "TXPOOL"]
host-allowlist = ["*"]
# Disable mining for non-validator nodes
miner-enabled = false
# Sync mode (full sync for non-validators)
sync-mode = "FULL"
EOL
  
  print_message "config-fullnode.toml file created successfully."
}

# Launch the fullnode containers (fixed at 2 fullnodes)
launch_fullnode_containers() {
  print_message "Launching 2 fullnode containers..."
  
  # Launch the two fullnodes (nodes 2 and 3)
  for i in $(seq 2 3); do
    local node_name="node$i"
    local port=$((10000 + i))
    
    print_message "Launching container for fullnode $node_name on port $port..."
    
    docker run -d \
      --name "$node_name" \
      --network besu \
      -p "$port:8545" \
      -v "${PWD}:/data" \
      hyperledger/besu:latest \
      --config-file=/data/config-fullnode.toml \
      --data-path=/data/"$node_name"/data
    
    print_message "Fullnode $node_name container launched successfully."
  done
}

# Display network information (fixed configuration)
show_network_info() {
  print_message "Hyperledger Besu network created successfully!"
  print_message "Network information:"
  print_message "- Total number of nodes: 3"
  print_message "- Validator node: 1"
  print_message "- Fullnodes: 2"

  print_message "Node access:"
  print_message "- Validator node: http://localhost:10001"
  print_message "- Fullnode 2: http://localhost:10002"
  print_message "- Fullnode 3: http://localhost:10003"
}

wei_to_eth() {
    local wei_hex=$1
    # Convert from hex to decimal
    local wei_dec=$((wei_hex))
    # Convert from wei to ETH (1 ETH = 10^18 wei)
    printf "%.18f" $(echo "$wei_dec/1000000000000000000" | bc -l)
}

get_balance() {
    local address=$1
    local balance_hex=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'"$address"'", "latest"],"id":1}' http://localhost:10001 | jq -r '.result')
    
    if [[ $balance_hex == null || $balance_hex == "0x0" ]]; then
        echo "0.00"
    else
        # Remove the '0x' prefix if present
        balance_hex=${balance_hex#0x}
        
        # Convert from hex to decimal using bc with appropriate precision
        # Important: use uppercase for hexadecimal digits
        local wei_dec=$(echo "ibase=16; ${balance_hex^^}" | bc)
        
        # Save the current locale configuration
        local old_lc_numeric=$LC_NUMERIC
        
        # Set the locale to C to ensure the decimal point is used as separator
        export LC_NUMERIC=C
        
        # Convert from wei to ETH (1 ETH = 10^18 wei) and limit to 2 decimal places
        local result=$(printf "%.2f" $(echo "scale=18; ${wei_dec} / 1000000000000000000" | bc))
        
        # Restore the locale configuratio
        export LC_NUMERIC=$old_lc_numeric
        
        echo $result
    fi
}

verify_network_with_transaction() {
    print_message "Verifying network with a test transaction..."
    
    # Create a temporary Node.js script to sign transactions
    cat > sign_tx.js << 'EOL'
const { Transaction } = require('@ethereumjs/tx');
const { Common } = require('@ethereumjs/common');
const { bufferToHex, toBuffer } = require('ethereumjs-util');

// Get arguments from command line
const privateKey = process.argv[2];
const nonce = process.argv[3];
const to = process.argv[4];
const value = process.argv[5];
const gasPrice = process.argv[6] || '0x3B9ACA00'; // 1 Gwei por defecto
const gasLimit = process.argv[7] || '0x5208';     // 21000 por defecto
const chainId = parseInt(process.argv[8]) || 4004; // ChainID por defecto

// Create a Common object for the custom chain
const common = Common.custom({ chainId: chainId });

// Create the transaction
const txData = {
  nonce: nonce,
  gasPrice: gasPrice,
  gasLimit: gasLimit,
  to: to,
  value: value,
  data: '0x',
};

// Create and sign the transaction
const tx = Transaction.fromTxData(txData, { common });
const privateKeyBuffer = toBuffer(privateKey.startsWith('0x') ? privateKey : '0x' + privateKey);
const signedTx = tx.sign(privateKeyBuffer);

// Get the serialized transaction
const serializedTx = bufferToHex(signedTx.serialize());
console.log(serializedTx);
EOL

    # Install necessary dependencies for the script
    print_message "Installing necessary dependencies for transaction signing..."
    npm init -y > /dev/null 2>&1
    npm install --save-dev @ethereumjs/tx@^4.0.0 @ethereumjs/common@^3.0.0 ethereumjs-util@^7.1.5

    # Dirección de destino fija
    local to_address="0x125f85D02912c62E7E63FFdc12F1f4511B14c3DC"
    # Cantidad fija de ETH a enviar
    local amount_eth="50"
    
    # Get the validator node address
    local validator_address=$(cat node1/address)
    local private_key=$(cat node1/key | sed 's/^0x//')  # Read the private key and remove the 0x prefix if it exists
    
    # Verify that the validator account has funds
    local validator_balance=$(get_balance $validator_address)
    print_message "Current balance of validator account ($validator_address): $validator_balance ETH"
    
    # Convert ETH to wei (hex) for the transaction
    local amount_wei_dec=$(echo "$amount_eth * 1000000000000000000" | bc | sed 's/\..*$//')
    local amount_wei_hex=$(echo "obase=16; $amount_wei_dec" | bc)
    amount_wei_hex="0x${amount_wei_hex}"
    
    print_message "Sending $amount_eth ETH ($amount_wei_dec wei) to $to_address..."
    
    # Get the nonce for the transaction
    local nonce_hex=$(curl -s -X POST --data '{
        "jsonrpc":"2.0",
        "method":"eth_getTransactionCount",
        "params":["'$validator_address'", "latest"],
        "id":1
    }' http://localhost:10001 | jq -r '.result')
    
    # Sign the transaction using the Node.js script
    local signed_tx=$(node sign_tx.js "$private_key" "$nonce_hex" "$to_address" "$amount_wei_hex")
    
    # Send the signed transaction
    local tx_result=$(curl -s -X POST --data '{
        "jsonrpc":"2.0",
        "method":"eth_sendRawTransaction",
        "params":["'$signed_tx'"],
        "id":1
    }' http://localhost:10001)
    
    local tx_hash=$(echo $tx_result | jq -r '.result')
    local error=$(echo $tx_result | jq -r '.error.message')
    
    if [[ "$tx_hash" == "null" && "$error" != "null" ]]; then
        print_error "Error sending transaction: $error"
        rm sign_tx.js  # Clean up
        return 1
    fi
    
    print_message "Transaction sent. Hash: $tx_hash"
    print_message "Waiting for transaction to be processed (10 seconds)..."
    sleep 10  # Wait for the transaction to be processed
    
    local new_from_balance=$(get_balance $validator_address)
    local new_to_balance=$(get_balance $to_address)
    print_message "New balance of validator account ($validator_address): $new_from_balance ETH"
    print_message "Balance of destination account ($to_address): $new_to_balance ETH"
    
    # Clean up the temporary script
    rm sign_tx.js
    
    print_message "Network verification completed successfully."
}

# Main function
main() {
  print_message "=== Hyperledger Besu network setup script with validators and fullnodes ==="
  
  # Clean existing files and folders
  clean_existing_files
  
  # Check all dependencies
  check_dependencies
  
  # Create Docker network
  create_docker_network
  
  # Create directories and keys for each node (1 validator + 2 fullnodes)
  for i in $(seq 1 3); do
    create_node_directory $i
  done
  
  # Create configuration files for the validator node
  create_genesis_file
  create_validator_config
  
  # Launch the validator node and get its enode
  launch_validator_node
  get_validator_enode
  
  # Create configuration file for fullnodes
  create_fullnode_config
  
  # Launch fullnode containers (fixed at 2 fullnodes)
  launch_fullnode_containers
  
  # Display network information
  show_network_info

  # Verify network with a test transaction (replaced handle_transactions)
  verify_network_with_transaction
}

# Execute the main function
main