#!/bin/bash

SCRIPT_DIR="$(dirname "$(realpath "$0")")"
NETWORK_DIR="$(realpath "$SCRIPT_DIR/../network")"
BOOTNODE_DIR="$(realpath "$NETWORK_DIR/bootnode")"

NETWORK_NAME=$1
CHAIN_ID=$2
NETWORK=$3
BOOTNODE_IP=$4
BOOTNODE_PUERTO=$5
ALLOC_ADDRESS=$6

BOOTNODE_NAME="bootnode-${NETWORK_NAME}"

echo "Creando red Docker: '$NETWORK_NAME' con subnet '$NETWORK'"
#echo "Ejecutando: docker network create --subnet=$NETWORK $NETWORK_NAME"

NETWORK_ID=$(docker network create --subnet=$NETWORK $NETWORK_NAME | cut -c -5)
echo "Network ID: $NETWORK_ID"


if [ $? -eq 0 ]; then
    echo "✅ Red '$NETWORK_NAME' creada con éxito."
else
    echo "❌ Error al crear la red."
    exit 1
fi


#echo "Creando bootnode"
# Verificar que la IP esté presente
if [ -z "$BOOTNODE_IP" ]; then
    echo "Error: Se debe proporcionar la IP del Bootnode."
    exit 1
fi

# Ejecutar el script de Node.js==> filesconfig.mjs
node "$SCRIPT_DIR/filesconfig.mjs" "$BOOTNODE_IP" "$BOOTNODE_DIR"

# Verificar si la ejecución fue exitosa
if [ $? -eq 0 ]; then
    echo "✅ Bootnode creado exitosamente en ${BOOTNODE_IP} "
else
    echo "❌ Error al crear el bootnode" >&2
    exit 1
fi

BOOTNODE_ADDRESS=$(cat "$BOOTNODE_DIR/address")
BOOTNODE_ENODE=$(cat "$BOOTNODE_DIR/enode")

# Crear genesis.json con Clique PoA
cat > "$NETWORK_DIR/genesis.json" << EOF
{
  "config": {
    "chainId": ${CHAIN_ID},
    "londonBlock": 0,
    "clique": {
      "blockperiodseconds": 4,
      "createemptyblocks": true,
      "epochlength": 30000
    }
  },
  "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000${BOOTNODE_ADDRESS}0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "gasLimit": "0xa00000",
  "difficulty": "0x1",
  "alloc": {
    "${ALLOC_ADDRESS}": {
      "balance": "0xad78ebc5ac6200000"
    },
    "${BOOTNODE_ADDRESS}": {
      "balance": "0xad78ebc5ac6200000"
    }
  }
}
EOF

# Crear el config.toml
cat > "$NETWORK_DIR/config.toml" <<EOF
genesis-file="/datadoker/genesis.json"
# Networking
p2p-host="0.0.0.0"
p2p-port=30303
p2p-enabled=true

# JSON-RPC
rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=8545
rpc-http-cors-origins=["*"]
rpc-http-api=["ETH","NET","CLIQUE","ADMIN","TRACE","DEBUG","TXPOOL","PERM","WEB3"]
host-allowlist=["*"]
EOF

echo "✅ Archivos genesis.json y config.toml creados exitosamente"

