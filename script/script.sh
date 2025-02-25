set -e
#Testing parameters
NETWORK_NAME="besu-nodes"
GENESIS_FILE="genesis.json"
CONFIG_FILE="config.toml"
NODE_PORT=9999
DOCKER_PORT=8545
WALLET_ADDRESS="0xf58b782F9082ea5D39099774af497CC41849e148"

#Remove previous nodes & network
for NODE_ID in {1..4}; do
    NODE_NAME="node$NODE_ID"
    if docker ps -a --format '{{.Names}}' | grep -q "^$NODE_NAME$"; then
        docker rm -f $NODE_NAME
      fi
  done
  
docker network rm $NETWORK_NAME 2>/dev/null && echo "Red $NETWORK_NAME eliminada."

  #nodes files
for NODE_ID in {1..4}; do
    NODE_DIR="node$NODE_ID"
    if [ -d "$NODE_DIR" ]; then
        rm -rf "$NODE_DIR"
      fi
  done

#Network creation
docker network create $NETWORK_NAME

#Node1 creation in besu
besu --data-path=node1 public-key export-address --to=node1/address
besu --data-path=node1 public-key export --to=node1/publickey

#Genesis file generation
cat > $GENESIS_FILE <<EOF
{
  "config": {
    "chainId": 170194,
    "berlinBlock": 0,
    "clique": {
      "blockperiodseconds": 4,
      "epochlength": 30000,
      "createemptyblocks": true
    }
  },
  "difficulty": "0x1",
  "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000$(cat node1/address | sed 's/0x//')0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "gasLimit": "0xa00000",
  "alloc": {
    "$(echo $WALLET_ADDRESS | sed 's/0x//')": {
     "balance": "0x200000000000000000000000000000000000000000000000000000000000000" 
     }
  }
}
EOF

#Config file generation
cat > $CONFIG_FILE <<EOF
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
bootnodes=["enode://$(cat node1/publickey | sed 's/0x//')@172.19.0.2:30303"]

EOF

#Node1 launched in Docker
docker run -d --name node1 --network $NETWORK_NAME \
 -p $NODE_PORT:$DOCKER_PORT -v $(pwd):/data hyperledger/besu:latest \
 --config-file=/data/config.toml --data-path=/data/node1/data \
 --node-private-key-file=/data/node1/key

#lapse time before function test
sleep 5

#Network function test
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H "Content-Type: application/json" http://localhost:$NODE_PORT
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'"$WALLET_ADDRESS"'","latest"],"id":1}' -H "Content-Type:application/json" http://localhost:$NODE_PORT

#Other nodes creation
for NODE_ID in {2..4}; do
    NODE_DIR="node$NODE_ID"
    NODE_PORT=$((NODE_PORT - 1))

    #Remove previous data if exist
    rm -rf $NODE_DIR
    mkdir -p $NODE_DIR/data

    #Nodes launched in Docker
    docker run -d --name $NODE_DIR --network $NETWORK_NAME \
    -p $NODE_PORT:$DOCKER_PORT -v $(pwd):/data hyperledger/besu:latest \
    --config-file=/data/$CONFIG_FILE --data-path=/data/$NODE_DIR/data

    #lapse time before function test
    sleep 5

    #Other nodes function test. If Balance is the same in every node, that means all of them are well-connected to the network.
    curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'"$WALLET_ADDRESS"'","latest"],"id":1}' -H "Content-Type:application/json" http://localhost:$NODE_PORT
    done
  
