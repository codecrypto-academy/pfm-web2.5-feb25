set -e
#Testing parameters
NETWORK_NAME="besu-nodes"
NETWORK_IP="172.19.0.0/16"
BOOTNODE_IP="172.19.0.2"
GENESIS_FILE="genesis.json"
CONFIG_FILE="config.toml"
NODE_PORT=9999
DOCKER_PORT=8545


#Remove previous nodes & network
docker rm -f $(docker ps -a --format "{{.Names}}" --filter "label=network=$NETWORK_NAME") 2>/dev/null || true
docker network rm $NETWORK_NAME 2>/dev/null && echo "Red $NETWORK_NAME reset."

  #Remove network&nodes files
  rm -rf networks

#make directory
mkdir -p networks/$NETWORK_NAME

#Network creation
docker network create $NETWORK_NAME --subnet $NETWORK_IP --label network=$NETWORK_NAME --label type=besu

#Bootnode creation in besu
besu --data-path=networks/$NETWORK_NAME/bootnode public-key export-address --to=networks/$NETWORK_NAME/bootnode/address
besu --data-path=networks/$NETWORK_NAME/bootnode public-key export --to=networks/$NETWORK_NAME/bootnode/publickey

#Genesis file generation
cat > networks/$NETWORK_NAME/$GENESIS_FILE <<EOF
{
  "config": {
    "chainId": 170194,
    "londonBlock": 0,
    "clique": {
      "blockperiodseconds": 4,
      "epochlength": 30000,
      "createemptyblocks": true
    }
  },
  "difficulty": "0x1",
  "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000$(cat networks/$NETWORK_NAME/bootnode/address | sed 's/0x//')0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "gasLimit": "0x1fffffffffffff",
  "alloc": {
    "$(cat networks/$NETWORK_NAME/bootnode/address | sed 's/0x//')": {
     "balance": "0x200000000000000000000000000000000000000000000000000000000000000" 
     }
  }
}
EOF

#Config file generation
cat > networks/$NETWORK_NAME/$CONFIG_FILE <<EOF
genesis-file="/data/genesis.json"

p2p-host="0.0.0.0"
p2p-port=30303
p2p-enabled=true

rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=$DOCKER_PORT
rpc-http-cors-origins=["*"]
rpc-http-api=["ETH","NET","CLIQUE","ADMIN","TRACE","DEBUG","TXPOOL","PERM"]
host-allowlist=["*"]

discovery-enabled=true
bootnodes=["enode://$(cat networks/$NETWORK_NAME/bootnode/publickey | sed 's/0x//')@$BOOTNODE_IP:30303"]

EOF

#Bootnode launched in Docker
docker run -d --name bootnode --label network=$NETWORK_NAME --ip $BOOTNODE_IP --network $NETWORK_NAME \
 -p $NODE_PORT:$DOCKER_PORT -v $(pwd)/networks/$NETWORK_NAME:/data hyperledger/besu:latest \
 --config-file=/data/config.toml --data-path=/data/bootnode/data \
 --node-private-key-file=/data/bootnode/key

#lapse time before function test
sleep 5

WALLET_ADDRESS="$(cat networks/$NETWORK_NAME/bootnode/address)"

#Network function test
echo $((16#$(curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H "Content-Type: application/json" http://localhost:$NODE_PORT | jq -r '.result' | sed 's/0x//')))
echo "Balance: $(curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'"$WALLET_ADDRESS"'","latest"],"id":1}' -H "Content-Type:application/json" http://localhost:$NODE_PORT | jq -r '.result' | xargs -I {} node -e "console.log(require('ethers').formatEther('{}'))") ETH"

#Other nodes creation
OTHNODES_PORT=$NODE_PORT
for NODE_ID in {1..3}; do
    NODE_DIR="node$NODE_ID"
    OTHNODES_PORT=$((OTHNODES_PORT - 1))

    #Remove previous data if exist
    rm -rf networks/$NETWORK_NAME/$NODE_DIR
  
    #Nodes launched in Docker
    docker run -d --name $NODE_DIR --network $NETWORK_NAME --label network=$NETWORK_NAME \
    -p $OTHNODES_PORT:$DOCKER_PORT -v $(pwd)/networks/$NETWORK_NAME:/data hyperledger/besu:latest \
    --config-file=/data/$CONFIG_FILE --data-path=/data/$NODE_DIR/data

    #lapse time before function test
    sleep 5

    #Other nodes function test. If Balance is the same in every node, that means all of them are well-connected to the network.
    echo "Balance: $(curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'"$WALLET_ADDRESS"'","latest"],"id":1}' -H "Content-Type:application/json" http://localhost:$NODE_PORT | jq -r '.result' | xargs -I {} node -e "console.log(require('ethers').formatEther('{}'))") ETH"
    done
#Creation of new address for testing
besu --data-path=networks/testnode public-key export-address --to=networks/testnode/address
besu --data-path=networks/testnode public-key export --to=networks/testnode/publickey

#Transfer test from bootnode/key to testnode/address
FROM_ADDRESS="$(cat networks/$NETWORK_NAME/bootnode/key)"
TO_ADDRESS="$(cat networks/testnode/address)"
AMOUNT=1000

yarn tsx ./lib/index.ts transfer $FROM_ADDRESS $TO_ADDRESS $AMOUNT http://localhost:$NODE_PORT
echo "Testnode Balance: $(curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'"$TO_ADDRESS"'","latest"],"id":1}' -H "Content-Type:application/json" http://localhost:$NODE_PORT | jq -r '.result' | xargs -I {} node -e "console.log(require('ethers').formatEther('{}'))") ETH"
