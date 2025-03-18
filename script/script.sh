#!/bin/bash

# Verificar si docker está cocrriendo
dockerExists=$(echo $(docker --version))
if [[ "$dockerExists" == "The command 'docker' could not be found in this WSL 2 distro. We recommend to activate the WSL integration in Docker Desktop settings. For details about using Docker Desktop with WSL 2, visit: https://docs.docker.com/go/wsl2/" ]]; then
    exit 1
fi

# Verificar si la red existe
if [[ -n $(docker network ls | grep "besu-network") ]]; then
    ## Borrar todos los contenedores dentro de la red
    docker rm -f $(docker ps -a -q --filter "label=besu-network")

    ## Borrar la network de Docker
    docker network rm besu-network

    ## Borrar todos los directorios de la red
    # rm ./besu-network/*
    # rmdir ./besu-network
    rm -r ./besu-network

fi

# Crear la network de docker
docker network create besu-network --subnet "172.19.0.0/16"

# Crear directorio para la red (En directorio actual)
mkdir ./besu-network

# Crear directorio para cada nodo.
mkdir ./besu-network/miner-node
mkdir ./besu-network/rpc-node
mkdir ./besu-network/bootnode

# Crear par de llaves para cada nodo
node ./createPrivatePublicKeys.mjs createKeys "./besu-network/miner-node"
node ./createPrivatePublicKeys.mjs createKeys "./besu-network/rpc-node"

# Crear llaves y enode para el bootnode
node ./createPrivatePublicKeys.mjs createKeysAndEnode "172.19.0.2" "30303" "./besu-network/bootnode"


# Crear archivo génesis
touch ./besu-network/genesis.json
echo '{
    "config": {
        "chainId": 246700,
        "londonBlock": 0,
        "clique": {
            "blockperiodseconds": 4,
            "epochlenght": 30000,
            "createemptyblocks": true  
        }
    },
    "extraData": "'"0x0000000000000000000000000000000000000000000000000000000000000000$(cat ./besu-network/miner-node/address)0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"'",
    "gasLimit": "0x1fffffffffffff",
    "difficulty": "0x1",
    "alloc": {
        "'"0x$(cat ./besu-network/miner-node/address)"'": {
            "balance": "0x20000000000000000000000000000000000000000000000000000000000"
        }
    }
}' > ./besu-network/genesis.json

# Crear archivo config.toml
touch ./besu-network/config.toml
echo '
genesis-file="/data/genesis.json"

p2p-host="0.0.0.0"
p2p-port="30303"
p2p-enabled=true

bootnodes=[
"'"$(cat ./besu-network/bootnode/enode)"'"
]

discovery-enabled=true

rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=8545
rpc-http-cors-origins=["*"]
rpc-http-api=["ADMIN","ETH", "CLIQUE", "NET", "TRACE", "DEBUG", "TXPOOL", "PERM"]
host-allowlist=["*"]

' > ./besu-network/config.toml

# Crear archivo bootnode-config.toml
touch ./besu-network/bootnode-config.toml

echo '
genesis-file="/data/genesis.json"

p2p-host="0.0.0.0"
p2p-port="30303"
p2p-enabled=true

discovery-enabled=true

rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=8545
rpc-http-cors-origins=["*"]
rpc-http-api=["ADMIN","ETH", "CLIQUE", "NET", "TRACE", "DEBUG", "TXPOOL", "PERM"]
host-allowlist=["*"]

' > ./besu-network/bootnode-config.toml

# Levantar contenedor de nodo minero
docker run -d --name miner-node --label besu-network --network besu-network --ip 172.19.0.3 \
-v ./besu-network:/data hyperledger/besu:latest \
--config-file=/data/config.toml \
--data-path=/data/miner-node/data \
--node-private-key-file=/data/miner-node/key

# Levantar contenedor de bootnode
docker run -d --name bootnode --label besu-network --network besu-network --ip 172.19.0.2 \
-v ./besu-network/:/data hyperledger/besu:latest \
--config-file=/data/bootnode-config.toml \
--data-path=/data/bootnode/data \
--node-private-key-file=/data/bootnode/key

# Levantar contenedor para nodo RPC
docker run -d --name rpc-node --label besu-network --network besu-network --ip 172.19.0.4 \
-p 1002:8545 \
-v ./besu-network/:/data hyperledger/besu:latest \
--config-file=/data/config.toml \
--data-path=/data/rpc-node/data \
--node-private-key-file=/data/rpc-node/key

# Realizar una prueba de transferencia
# node transaction.js 1002 0x$(cat ./besu-network/miner-node/key) 0x$(cat ./besu-network/bootnode/address) 1