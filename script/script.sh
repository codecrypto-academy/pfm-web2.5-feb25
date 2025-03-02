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

# Verify that Besu and Docker are installed
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

# Ask the user for the number of nodes
get_node_count() {
  read -p "Enter the total number of nodes you want to create (including the validator node): " node_count
  
  # Validate that it's a number
  if ! [[ "$node_count" =~ ^[0-9]+$ ]]; then
    print_error "Please enter a valid number."
    get_node_count
  fi
  
  # Validate that it's at least 1
  if [ "$node_count" -lt 1 ]; then
    print_error "The number of nodes must be at least 1."
    get_node_count
  fi
  
  print_message "Creating $node_count nodes (1 validator and $((node_count-1)) fullnodes)."
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

# Get the enode of the validator node
get_validator_enode() {
  print_message "Launching the validator node to obtain its enode..."
  
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
  
  # Get the IP of the validator node
  NODE1_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' node1)
  print_message "Validator node IP: $NODE1_IP"
  
  # Get the public key of the node directly from the key.pub file
  if [ -f "node1/key.pub" ]; then
    print_message "Getting the public key from the key.pub file..."
    NODE1_PUBKEY=$(cat node1/key.pub)
    
    # Make sure it doesn't have the 0x prefix
    NODE1_PUBKEY=$(echo "$NODE1_PUBKEY" | sed 's/^0x//')
    
    # Verify that the key has 128 characters
    if [ ${#NODE1_PUBKEY} -eq 128 ]; then
      ENODE_FINAL="enode://${NODE1_PUBKEY}@${NODE1_IP}:30303"
      print_message "Enode generated successfully: $ENODE_FINAL"
      return 0
    else
      print_warning "The public key doesn't have the correct format (128 characters). Current length: ${#NODE1_PUBKEY}"
    fi
  fi
  
  # If it couldn't be obtained from the key.pub file, try exporting it with besu
  print_message "Attempting to export the public key with besu..."
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

# Launch the fullnode containers
launch_fullnode_containers() {
  local total_nodes=$1
  
  # If there's only one node, exit (the validator has already been launched)
  if [ "$total_nodes" -eq 1 ]; then
    return 0
  fi
  
  # Launch the fullnodes (starting from the second node)
  for i in $(seq 2 $total_nodes); do
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

# Display network information
show_network_info() {
  local total_nodes=$1
  
  print_message "Hyperledger Besu network created successfully!"
  print_message "Network information:"
  print_message "- Total number of nodes: $total_nodes"
  print_message "- Validator node: 1"
  print_message "- Fullnodes: $((total_nodes-1))"

  print_message "Node access:"
  print_message "- Validator node: http://localhost:10001"
  
  for i in $(seq 2 $total_nodes); do
    local port=$((10000 + i))
    print_message "- Fullnode $i: http://localhost:$port"
  done
}

# Check additional dependencies
check_additional_dependencies() {
  if ! command -v jq &> /dev/null; then
    print_error "The 'jq' command is not installed. Please install it with 'sudo apt-get install jq' or the equivalent for your system."
    exit 1
  fi
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

handle_transactions() {
    print_message "Starting the transaction handler..."
    
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
    npm init -y > /dev/null 2>&1
    npm install --save-dev @ethereumjs/tx@^4.0.0 @ethereumjs/common@^3.0.0 ethereumjs-util@^7.1.5
    
    # Get the validator node address
    local validator_address=$(cat node1/address)
    local private_key=$(cat node1/key | sed 's/^0x//')  # Read the private key and remove the 0x prefix if it exists
    
    # Verify that the validator account has funds
    local validator_balance=$(get_balance $validator_address)
    print_message "Current balance of the validator account ($validator_address): $validator_balance ETH"
    
    while true; do
        read -p "Do you want to make a transaction? (y/n): " do_transaction
        if [[ $do_transaction != "y" ]]; then
            print_message "Exiting the transaction handler and closing the program"
            rm sign_tx.js # Clean up the temporary script
            return
        fi
        
        read -p "Enter the destination address: " to_address
        
        # Validate Ethereum address format
        while ! [[ "$to_address" =~ ^0x[a-fA-F0-9]{40}$ ]]; do
            print_error "The address must have the format 0x followed by 40 hexadecimal characters."
            read -p "Enter the destination address: " to_address
        done
        
        # Validate that the amount is a number
        while true; do
            read -p "Enter the amount to send (in ETH): " amount_eth
            
            # Validate that the amount is a positive number
            if [[ "$amount_eth" =~ ^[0-9]+(\.[0-9]+)?$ ]] && (( $(echo "$amount_eth > 0" | bc -l) )); then
                break
            else
                print_error "Please enter a positive number greater than zero."
            fi
        done
        
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
            print_error "Error sending the transaction: $error"
            continue
        fi
        
        print_message "Transaction sent. Hash: $tx_hash"
        print_message "Waiting for the transaction to be processed (10 seconds)..."
        sleep 10 # Wait for the transaction to be processed
        
        local new_from_balance=$(get_balance $validator_address)
        local new_to_balance=$(get_balance $to_address)
        print_message "New balance of the validator account ($validator_address): $new_from_balance ETH"
        print_message "New balance of the destination account ($to_address): $new_to_balance ETH"
    done
    
    # Clean up the temporary script
    rm sign_tx.js
}



# Main function
main() {
  print_message "=== Hyperledger Besu network setup script with validators and fullnodes ==="
  
  # Check dependencies
  check_dependencies
  check_additional_dependencies
  
  # Create Docker network
  create_docker_network
  
  # Get number of nodes
  get_node_count
  
  # Create directories and keys for each node
  for i in $(seq 1 $node_count); do
    create_node_directory $i
  done
  
  # Create configuration files for the validator node
  create_genesis_file
  create_validator_config
  
  # Launch the validator node and get its enode
  get_validator_enode
  
  # Create configuration file for fullnodes
  create_fullnode_config
  
  # Launch fullnode containers
  launch_fullnode_containers $node_count
  
  # Display network information
  show_network_info $node_count

  # Handle transactions
  handle_transactions
}

# Execute the main function
main