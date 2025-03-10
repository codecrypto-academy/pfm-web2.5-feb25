#!/bin/bash

# Set the base directory explicitly
baseDir=$(dirname "$0")/.. 
echo "Base directory is: $baseDir"

# Verify that the base directory exists
if [ ! -d "$baseDir" ]; then
    echo "Base directory does not exist. Exiting..."
    exit 1
fi

# Verify that the nodes directory exists
if [ ! -d "$baseDir/nodes" ]; then
    echo "Nodes directory does not exist. Exiting..."
    exit 1
fi

# Get the private key of node1
if [ ! -f "${baseDir}/nodes/node1/key" ]; then
    echo "Error: Private key file not found at ${baseDir}/nodes/node1/key"
    exit 1
fi
node1PrivKey=$(cat "${baseDir}/nodes/node1/key" | tr -d '\n' | sed 's/^0x//')

# Get the address of node1
addressnode1=$(cat "${baseDir}/nodes/node1/address")
addressnode1=$(echo "$addressnode1" | sed 's/^0x\|^/0x/')

# Get the address of node2
addressNode2=$(cat "${baseDir}/nodes/node2/address")
addressNode2=$(echo "$addressNode2" | sed 's/^0x\|^/0x/')

# Get the balances of node2 and node1 before the transaction
node2BalanceWeiBefore=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$addressNode2'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9998 | jq -r '.result')
node1BalanceWeiBefore=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$addressnode1'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9999 | jq -r '.result')

# Convert Wei balances to Ether before the transaction
node2BalanceEtherBefore=$(echo "scale=18; $(echo "ibase=16; ${node2BalanceWeiBefore^^}" | bc) / 10^18" | bc -l)
node1BalanceEtherBefore=$(echo "scale=18; $(echo "ibase=16; ${node1BalanceWeiBefore^^}" | bc) / 10^18" | bc -l)

# Print balances before the transaction
echo "Node2 balance before transaction: $node2BalanceWeiBefore Wei ($node2BalanceEtherBefore Ether)"
echo "node1 balance before transaction: $node1BalanceWeiBefore Wei ($node1BalanceEtherBefore Ether)"

# Get the correct nonce for node1
nonce=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getTransactionCount","params":["'$addressnode1'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9999 | jq -r '.result')
echo "Nonce for address $addressnode1: $nonce"

# Define the amount to send (in Wei)
amountToSend="0x16345785d8a0000"  # 0.1 Ether in Wei

# Create the unsigned transaction with the correct nonce
unsignedTx=$(jq -n \
    --arg from "$addressnode1" \
    --arg to "$addressNode2" \
    --arg nonce "$nonce" \
    --arg value "$amountToSend" \
    '{from: $from, 
    nonce: $nonce, 
    gasPrice: "0x3b9aca00",  # 1 Gwei
    gas: "0x5208",           # 21000 gas limit for simple Ether transfers
    to: $to, 
    value: $value, 
    chainId: 123999}')

# Sign the transaction using Node.js
echo "Signing the transaction..."
signedTx=$(NODE_PATH="${baseDir}/node_modules" node -e "
    const {Web3} = require('web3');
    const web3 = new Web3();
    const unsignedTx = $unsignedTx;
    const privateKey = '$node1PrivKey';
    web3.eth.accounts.signTransaction(unsignedTx, privateKey)
        .then(signed => {
            if (signed.rawTransaction) {
                console.log(signed.rawTransaction);
            } else {
                console.error('Signing failed: No raw transaction returned.');
                process.exit(1);
            }
        })
        .catch(err => {
            console.error('Signing error:', err);
            process.exit(1);
        });
")

if [ $? -ne 0 ]; then
    echo "Error: Failed to sign the transaction. Exiting..."
    exit 1
fi

echo "Signed Transaction: $signedTx"

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

# Send the signed transaction
hashTx=$(send_raw_transaction "http://localhost:9998" "$signedTx")

if [ $? -ne 0 ]; then
    echo "Error: Failed to send the transaction. Exiting..."
    exit 1
fi

echo "Transaction hash received: $hashTx"

# Wait for the transaction receipt
echo "Waiting for the transaction to be mined..."
maxAttempts=30
attempt=0
while [ $attempt -lt $maxAttempts ]; do
    transactionReceipt=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["'$hashTx'"],"id":1}' -H "Content-Type: application/json" http://localhost:9998 | jq -r '.result')
    if [ -n "$transactionReceipt" ] && [ "$transactionReceipt" != "null" ]; then
        echo "Transaction mined successfully!"
        break
    else
        echo "Transaction not mined yet. Retrying in 5 seconds..."
        sleep 5
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -eq $maxAttempts ]; then
    echo "Error: Transaction not mined within the expected time. Exiting..."
    exit 1
fi

# Get the balances of node2 and node1 after the transaction
node2BalanceWei=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$addressNode2'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9998 | jq -r '.result')
node1BalanceWei=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$addressnode1'","latest"],"id":1}' -H "Content-Type: application/json" http://localhost:9999 | jq -r '.result')

# Convert Wei balances to Ether after the transaction
node2BalanceEther=$(echo "scale=18; $(echo "ibase=16; ${node2BalanceWei^^}" | bc) / 10^18" | bc -l)
node1BalanceEther=$(echo "scale=18; $(echo "ibase=16; ${node1BalanceWei^^}" | bc) / 10^18" | bc -l)

# Print balances after the transaction
echo "Node2 balance after transaction: $node2BalanceWei Wei ($node2BalanceEther Ether)"
echo "node1 balance after transaction: $node1BalanceWei Wei ($node1BalanceEther Ether)"