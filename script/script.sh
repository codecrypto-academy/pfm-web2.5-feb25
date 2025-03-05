#!/bin/bash

if [ -z "$1" ]; then
  echo "Por favor, proporciona un nombre para la red (por ejemplo, red1, red2)."
  echo "Ejemplo: ./script.sh red1 nodo1"
  exit 1
fi

if [ -z "$2" ]; then
  echo "Por favor, proporciona un nombre para el nodo (por ejemplo, nodo1, nodo2)."
  echo "Ejemplo: ./script.sh red1 nodo1"
  exit 1
fi

RED=$1
NODO=$2
NODO_IP="172.24.0.$((RANDOM % 254 + 1))"
export HTTP_PORT=$((8545 + $(shuf -i 0-1000 -n 1))) # Generar un puerto HTTP aleatorio entre 8545 y 9545 Puerto del contenedor
#P2P_PORT=$((30303 + $(shuf -i 0-1000 -n 1))) # Generar un puerto P2P aleatorio entre 30303 y 31303
export P2P_PORT="30303"
export MACHINE_PORT=$((8888 + $(shuf -i 0-1000 -n 1))) #Puerto de la máquina

# Eliminar redes y contenedores Docker existentes
#rm -rf networks
#docker rm -f $(docker ps -aq --filter "label=network=besu-network") 2>/dev/null || true
#docker network rm besu-network 2>/dev/null || true

# Configurar la red
NETWORK="172.24.0.0/16"
#BOOTNODE_IP="172.24.0.20"

# Crear directorios y red Docker
if ! docker network inspect $1 >/dev/null 2>&1; then
  echo "La red '$1' no existe. Creándola..."
  mkdir -p networks/$1
  docker network create $1 \
    --subnet $NETWORK \
    --label network=$1 \
    --label type=besu
#else
#  echo "La red '$1' ya existe."

  #exit 1
fi

if docker ps -a --filter "name=$1-$NODO" --format '{{.Names}}' | grep -w "$1-$NODO" >/dev/null 2>&1; then
  echo "El contenedor '$1-$NODO' ya existe."
  exit 1
else
  echo "El contenedor '$1-$NODO' no existe. Procediendo a crearlo..."
fi


#mkdir -p networks/besu-network
#docker network create besu-network \
#  --subnet $NETWORK \
#  --label network=besu-network \
#  --label type=besu

# Crear claves privadas y públicas, y direcciones
cd networks/$1
mkdir -p $NODO
cd $NODO
node ../../../index.mjs create-keys ${NODO_IP} ${P2P_PORT}
cd ../../..

# Crear el archivo genesis.json
cat > networks/$1/genesis.json << EOF
{
  "config": {
    "chainId": 13371337,
    "londonBlock": 0,
    "clique": {
      "blockperiodseconds": 4,
      "epochlength": 30000,
      "createemptyblocks": true
    }
  },
  "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000$(cat networks/besu-network/$NODO/address)0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "gasLimit": "0x1fffffffffffff",
  "difficulty": "0x1",
  "alloc": {
    "$(cat networks/besu-network/$NODO/address)": {
      "balance": "0x200000000000000000000000"
    }
  }
}
EOF

# Crear el archivo config.toml
cat > networks/$1/config.toml << EOF
genesis-file="/data/genesis.json"
# Networking
p2p-host="0.0.0.0"
p2p-port=$P2P_PORT
p2p-enabled=true
# JSON-RPC
rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=$HTTP_PORT
rpc-http-cors-origins=["*"]
rpc-http-api=["ETH","NET","CLIQUE","ADMIN","TRACE","DEBUG","TXPOOL","PERM","WEB3"]
host-allowlist=["*"]
EOF

mkdir -p networks/$1/$NODO/data

# Iniciar el nodo Besu

  docker run -d \
  --name $1-$NODO \
  --label nodo=$NODO \
  --label network=$1 \
  --ip ${NODO_IP} \
  --network $1 \
  -p $MACHINE_PORT:$HTTP_PORT \
  -v $(pwd)/networks/$1:/data \
  hyperledger/besu:latest \
  --config-file=/data/config.toml \
  --data-path=/data/$NODO/data \
  --node-private-key-file=/data/$NODO/key.priv \
  --genesis-file=/data/genesis.json

# Crear una clave de prueba y realizar transacciones
echo "SCRIPT: Creando clave de prueba..."
node ./index.mjs create-keys 192.168.1.100 "$P2P_PORT"
#echo "SCRIPT: Resultado de create-keys: $?"

sleep 10

# Verificar saldo
echo "SCRIPT: Verificando saldo inicial..."
node ./index.mjs balance $(cat networks/$1/$NODO/address) "http://localhost:$MACHINE_PORT"
#echo "SCRIPT: Resultado de balance inicial: $?"

# Transferir fondos
echo "SCRIPT: Transfiriendo fondos..."
node ./index.mjs transfer $(cat networks/$1/$NODO/key.priv) 0x$(cat address) 10000 "http://localhost:$MACHINE_PORT"
#echo "SCRIPT: Resultado de transfer: $?"

# Verificar saldo nuevamente
echo "SCRIPT: Verificando saldo final..."
node ./index.mjs balance 0x$(cat networks/$1/$NODO/address) "http://localhost:$MACHINE_PORT"
#echo "SCRIPT: Resultado de balance final: $?"

# Obtener información de red
echo "SCRIPT: Obteniendo información de red..."
node ./index.mjs network-info "http://localhost:$MACHINE_PORT"
#echo "SCRIPT: Resultado de network-info: $?"
