#!/bin/bash
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FOLDER_NAME="$PROJECT_ROOT/besu"
DEFAULT_NETWORK_NAME="redBesu"

# 📌 Obtener el número del nuevo nodo
NEW_NODE_NUMBER=$1

if [[ -z "$NEW_NODE_NUMBER" ]]; then
    echo "❌ Debes especificar un número para el nuevo nodo."
    exit 1
fi

NODE_FOLDER="$FOLDER_NAME/nodo$NEW_NODE_NUMBER"
mkdir -p "$NODE_FOLDER/data"

# 📌 Obtener la IP del Bootnode (nodo1)
echo "🔍 Obteniendo la IP de nodo1..."
BOOTNODE_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' nodo1)

if [[ -z "$BOOTNODE_IP" ]]; then
    echo "❌ No se pudo obtener la IP de nodo1. Asegúrate de que la red está activa."
    exit 1
fi

# 📌 Obtener la clave pública del Bootnode (nodo1)
NODE1_KEY_PUBLIC=$(cat "$FOLDER_NAME/nodo1/public_key")
NODE1_KEY_PUBLIC_FORMAT=${NODE1_KEY_PUBLIC#0x}
BOOTNODE_ENODE="enode://$NODE1_KEY_PUBLIC_FORMAT@$BOOTNODE_IP:30303"

echo "✅ Bootnode Enode: $BOOTNODE_ENODE"

# 🏗️ **Crear archivo de configuración `config.toml` para el nuevo nodo**
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

echo "✅ Archivo config.toml creado para nodo$NEW_NODE_NUMBER."

# 🚀 **Lanzar el nuevo nodo en Docker**
docker run -d --name nodo$NEW_NODE_NUMBER --network "$DEFAULT_NETWORK_NAME" \
    -v "$FOLDER_NAME:/data" \
    hyperledger/besu:latest \
    --config-file=/data/nodo$NEW_NODE_NUMBER/config.toml \
    --data-path=/data/nodo$NEW_NODE_NUMBER/data \
    --genesis-file=/data/genesis.json

echo "✅ Nodo nodo$NEW_NODE_NUMBER agregado a la red."
