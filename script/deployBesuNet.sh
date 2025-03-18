#!/bin/bash
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FOLDER_NAME="$PROJECT_ROOT/besu"
DEFAULT_NETWORK_NAME="redBesu"
DEFAULT_CHAIN_ID=13371337
DEFAULT_BALANCE="0x200000000000000000000000000000000000000000000000"

NUM_NODES=${1:-3}       
CHAIN_ID=${2:-13371337}
EXTRA_ACCOUNT=${3:-""}  



echo "🚀 Iniciando despliegue con:"
echo "➡️ Número de nodos: $NUM_NODES"
echo "➡️ Cuenta Alloc: $EXTRA_ACCOUNT"
echo "➡️ Chain ID: $CHAIN_ID"

# 🛑 **Eliminar contenedores antiguos sin borrar datos**
echo "🛑 Deteniendo cualquier nodo activo..."
docker ps -aq --filter "name=nodo" | xargs -r docker stop

echo "✅ Sistema listo para el despliegue."

# 🏗️ **Crear carpetas**
mkdir -p "$FOLDER_NAME"
for i in $(seq 1 $NUM_NODES); do
    NODE_FOLDER="$FOLDER_NAME/nodo$i"
    mkdir -p "$NODE_FOLDER/data"
done

# 🌐 **Crear la red de Docker**
docker network create "$DEFAULT_NETWORK_NAME"

# 🔑 **Generar claves de los nodos**
for i in $(seq 1 $NUM_NODES); do
    NODE_FOLDER="$FOLDER_NAME/nodo$i"
    besu --data-path="$NODE_FOLDER" public-key export --to="$NODE_FOLDER/public_key"
    besu --data-path="$NODE_FOLDER" public-key export-address --to="$NODE_FOLDER/address"
done

# 📌 **Obtener dirección del nodo 1 (Bootnode)**
NODE1_ADDRESS=$(cat "$FOLDER_NAME/nodo1/address")
# Construcción del extraData
EXTRA_DATA="0x"$(printf '0%.0s' {1..64})"${NODE1_ADDRESS:2}"$(printf '0%.0s' {1..130})

# 🔵 **Construir el alloc con más de una cuenta**
ALLOC="\"$NODE1_ADDRESS\": { \"balance\": \"$DEFAULT_BALANCE\" }"
if [[ -n "$EXTRA_ACCOUNT" ]]; then
    ALLOC="$ALLOC, \"$EXTRA_ACCOUNT\": { \"balance\": \"$DEFAULT_BALANCE\" }"
fi

# ⚙️ **Generar archivo genesis.json**
cat <<EOF > "$FOLDER_NAME/genesis.json"
{
  "config": {
    "chainId": $CHAIN_ID,
    "londonBlock": 0,
    "clique": {
      "blockpersecond": 4,
      "epochlength": 3000,
      "createemptyblocks": true
    }
  },
  "extraData": "$EXTRA_DATA",
  "gasLimit": "0x1ffffffffffff",
  "difficulty": "0x1",
  "alloc": { $ALLOC }
}
EOF

echo "✅ Archivo genesis.json generado."

# 🏗️ **Crear archivo config.toml para nodo1**
NODE1_FOLDER="$FOLDER_NAME/nodo1"
cat <<EOF > "$NODE1_FOLDER/config.toml"
genesis-file="/data/genesis.json"
p2p-host="0.0.0.0"
p2p-port=30303
rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=8545
rpc-http-api=["ETH","NET","CLIQUE","ADMIN","TRACE","DEBUG","TXPOOL","PERM"]
host-allowlist=["*"]
EOF

echo "✅ Archivo config.toml creado para nodo1."

# 🚀 **Iniciar nodo1 (Bootnode)**
docker run -d --name nodo1 --network "$DEFAULT_NETWORK_NAME" \
  -p 9997:8545 \
  -v "$FOLDER_NAME:/data" \
  hyperledger/besu:latest \
  --config-file=/data/nodo1/config.toml \
  --data-path=/data/nodo1/data \
  --genesis-file=/data/genesis.json

echo "⏳ Esperando a que nodo1 arranque..."
sleep 10

# 📌 **Obtener IP del nodo1**
NODE1_IP=""
while [ -z "$NODE1_IP" ]; do
    sleep 2
    NODE1_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' nodo1 2>/dev/null)
done
echo "✅ IP de nodo1: $NODE1_IP"

# 🏗️ **Generar enode para nodo1**
NODE1_KEY_PUBLIC=$(cat "$FOLDER_NAME/nodo1/public_key")
NODE1_KEY_PUBLIC_FORMAT=${NODE1_KEY_PUBLIC#0x}
BOOTNODE_ENODE="enode://$NODE1_KEY_PUBLIC_FORMAT@$NODE1_IP:30303"

echo "✅ Bootnode Enode generado: $BOOTNODE_ENODE"

# 🏗️ **Crear archivos config.toml para los otros nodos**
for i in $(seq 2 $NUM_NODES); do
    NODE_FOLDER="$FOLDER_NAME/nodo$i"
    cat <<EOF > "$NODE_FOLDER/config.toml"
genesis-file="/data/genesis.json"
p2p-host="0.0.0.0"
p2p-port=30303
bootnodes=["$BOOTNODE_ENODE"]
rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=8545
rpc-http-api=["ETH","NET","CLIQUE","ADMIN","TRACE","DEBUG","TXPOOL","PERM"]
host-allowlist=["*"]
EOF
    echo "✅ Archivo config.toml creado para nodo$i."
done

# 🚀 **Iniciar los demás nodos**
for i in $(seq 2 $NUM_NODES); do
    NODE_NAME="nodo$i"
    docker run -d --name $NODE_NAME --network "$DEFAULT_NETWORK_NAME" \
      -v "$FOLDER_NAME:/data" \
      hyperledger/besu:latest \
      --config-file=/data/$NODE_NAME/config.toml \
      --data-path=/data/$NODE_NAME/data \
      --genesis-file=/data/genesis.json
    echo "✅ Nodo $NODE_NAME iniciado."
    sleep 1
done

echo "🎉 ✅ Red Besu desplegada con éxito con $NUM_NODES nodos."
