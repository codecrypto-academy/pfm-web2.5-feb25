#!/bin/bash

# Variables initialization 
NETWORKNAME="besuClique"
NODE1="Node1"
NODE2="Node2"
NODE3="Node3"

PORTS_JSON=(8545 8555 8565)
PORTS_WS=(8546 8556 8566)
PORTS_P2P=(30303 30304 30305)

NETWORKNUMBER="123"

GENREPTEXT="<Node 1 Address>"
GENESIS="{
  \"config\": {
    \"chainId\": 1337,
    \"berlinBlock\": 0,
    \"clique\": {
      \"blockperiodseconds\": 15,
      \"epochlength\": 30000
    }
  },
  \"coinbase\": \"0x0000000000000000000000000000000000000000\",
  \"difficulty\": \"0x1\",
  \"extraData\": \"0x0000000000000000000000000000000000000000000000000000000000000000<Node 1 Address>0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000\",
  \"gasLimit\": \"0xa00000\",
  \"mixHash\": \"0x0000000000000000000000000000000000000000000000000000000000000000\",
  \"nonce\": \"0x0\",
  \"timestamp\": \"0x5c51a607\",
  \"alloc\": {
    \"fe3b557e8fb62b89f4916b721be55ceb828dbd73\": {
      \"privateKey\": \"8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63\",
      \"comment\": \"private key and this comment are ignored.  In a real chain, the private key should NOT be stored\",
      \"balance\": \"0xad78ebc5ac6200000\"
    },
    \"23997E1562faB0815C9Bb15f06D48fD7079273D0\": {
      \"privateKey\": \"c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3\",
      \"comment\": \"private key and this comment are ignored.  In a real chain, the private key should NOT be stored\",
      \"balance\": \"90000000000000000000000\"
    },
    \"f17f52151EbEF6C7334FAD080c5704D77216b732\": {
      \"privateKey\": \"ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f\",
      \"comment\": \"private key and this comment are ignored.  In a real chain, the private key should NOT be stored\",
      \"balance\": \"90000000000000000000000\"
    }
  }
}"

echo ""
echo "Hyperledger Besu Network script v.0.0.1 started"
echo ""
echo "-------------------------------------------"
echo "General information:"
echo "-------------------------------------------"
for i in {0..2}; do
  echo "    Node$((i+1)) Port JSON-RPC = ${PORTS_JSON[i]}"
  echo "    Node$((i+1)) Port WS       = ${PORTS_WS[i]}"
  echo "    Node$((i+1)) Port P2P      = ${PORTS_P2P[i]}"
done
echo "-------------------------------------------"

# Delete all previous network data and containers
echo ""
echo "Deleting previous network data and containers"
if [ -d ./$NETWORKNAME ]; then
  echo "  Deleting $NETWORKNAME folder"
  rm -rf ./$NETWORKNAME
fi
wait
RESP=$(docker stop $NETWORKNAME-$NODE1 $NETWORKNAME-$NODE2 $NETWORKNAME-$NODE3)
wait
sleep 3
RESP=$(docker rm $NETWORKNAME-$NODE1 $NETWORKNAME-$NODE2 $NETWORKNAME-$NODE3)
wait
sleep 3
RESP=$(docker network rm $NETWORKNAME)
wait

# Folder structure creation
echo ""
echo "Creating folder structure"
echo "-------------------------------------------"

for NODE in $NODE1 $NODE2 $NODE3; do
  if [ -d ./$NETWORKNAME/$NODE/data ]; then
    echo "  Directory for $NODE exists."
  else
    echo "  Created $NODE directory"
    mkdir -p ./$NETWORKNAME/$NODE/data
  fi
done
echo "-------------------------------------------"

# Check if Docker is installed and running
echo ""
echo "Docker containers creation"
echo "-------------------------------------------"

if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please, install it first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "Docker is not running. Start the Docker service and try again."
    exit 1
fi

# Node-1 address creation
echo "Generating an address for $NODE1"
RESP=$(docker run --rm -v ./$NETWORKNAME/$NODE1/data:/data hyperledger/besu:latest --data-path=/data public-key export-address --to=/data/node1Address)
wait 
NODE1ADDRESS=$(cat ./$NETWORKNAME/$NODE1/data/node1Address)
NODE1ADDRESS="${NODE1ADDRESS:2}"
echo "$NODE1 address generated ${NODE1ADDRESS}"

# Create genesis file
echo ""
echo "Creating genesis file ..."
NEWGENESIS="${GENESIS//$GENREPTEXT/$NODE1ADDRESS}"
echo "$NEWGENESIS" > ${NETWORKNAME}/cliqueGenesis.json
echo "Created genesis file"
wait 

# Create the network in Docker
echo ""
echo "Creating ${NETWORKNAME} network ..."
NETWORKRESP=$(docker network create $NETWORKNAME)
wait
echo "$NETWORKRESP created"

# Running NODE1
echo ""
echo "Starting $NODE1 Docker container"
NODE1DOCKER=$(docker run -d --name $NETWORKNAME-$NODE1 --network $NETWORKNAME -v ./$NETWORKNAME/$NODE1/data:/data -v ./$NETWORKNAME:/config -p ${PORTS_JSON[0]}:8545 -p ${PORTS_WS[0]}:8546 -p ${PORTS_P2P[0]}:30303 hyperledger/besu:latest --data-path=/data --genesis-file=/config/cliqueGenesis.json --network-id $NETWORKNUMBER --rpc-http-enabled --rpc-http-api=ETH,NET,CLIQUE,WEB3,ADMIN --host-allowlist="*" --rpc-http-cors-origins="all" --profile=ENTERPRISE)
wait
echo "$NODE1 created ${NODE1DOCKER}"
echo "Waiting for the node internal deploy"
sleep 10

# Getting NODE1 internal IP and Enode
NODE1IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $NETWORKNAME-$NODE1)
echo "  $NETWORKNAME-$NODE1 IP: $NODE1IP"
ENODE=$(docker logs $NETWORKNAME-$NODE1 | grep "enode" | grep -o 'enode://[^ ]*@')
ENODE=$ENODE$NODE1IP:${PORTS_P2P[0]}
echo "  Enode $NODE1 ready"

# Running NODE2
echo ""
echo "Starting $NODE2 Docker container"
NODE2DOCKER=$(docker run -d --name $NETWORKNAME-$NODE2 --network $NETWORKNAME -v ./$NETWORKNAME/$NODE2/data:/data -v ./$NETWORKNAME:/config -p ${PORTS_JSON[1]}:8545 -p ${PORTS_WS[1]}:8546 -p ${PORTS_P2P[1]}:30303 hyperledger/besu:latest --data-path=/data --genesis-file=/config/cliqueGenesis.json --bootnodes=$ENODE --network-id $NETWORKNUMBER --rpc-http-enabled --rpc-http-api=ETH,NET,CLIQUE,WEB3,ADMIN --host-allowlist="*" --rpc-http-cors-origins="all" --profile=ENTERPRISE)
echo "$NODE2 created ${NODE2DOCKER}"
wait

# Running NODE3
echo ""
echo "Starting $NODE3 Docker container"
NODE3DOCKER=$(docker run -d --name $NETWORKNAME-$NODE3 --network $NETWORKNAME -v ./$NETWORKNAME/$NODE3/data:/data -v ./$NETWORKNAME:/config -p ${PORTS_JSON[2]}:8545 -p ${PORTS_WS[2]}:8546 -p ${PORTS_P2P[2]}:30303 hyperledger/besu:latest --data-path=/data --genesis-file=/config/cliqueGenesis.json --bootnodes=$ENODE --network-id $NETWORKNUMBER --rpc-http-enabled --rpc-http-api=ETH,NET,CLIQUE,WEB3,ADMIN --host-allowlist="*" --rpc-http-cors-origins="all" --profile=ENTERPRISE)
echo "$NODE3 created ${NODE3DOCKER}"
wait
echo "-------------------------------------------"
sleep 5

# Testing transactions
echo ""
echo "Testing transactions"
echo "-------------------------------------------"
node ./dist/index.js 0x789b1182f498Be80c0d7D36E395c2CBC53b44B0C
echo "-------------------------------------------"
echo ""
echo "Script execution finished."