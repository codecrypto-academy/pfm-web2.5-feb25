#!/bin/bash

set -e  # Detener ejecución en caso de error
set -o pipefail  # Manejar errores en pipes

# Definir variables de configuración
NETWORK_NAME="besu-net"
NETWORK="172.24.0.0/16"
CHAIN_ID=80185

# Direccion a la que se le van agregar fondos desde json
ALLOC_ADDRESS="70997970C51812dc3A010C7d01b50e0d17dc79C8"

BOOTNODE_IP="172.24.0.20"
BOOTNODE_PUERTO=2224
NODO1_PUERTO=2225
NODO2_PUERTO=2226
NODO3_PUERTO=2227

# Definir la ruta base absoluta para evitar problemas de ubicación
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
NETWORK_DIR="$SCRIPT_DIR/../network"
BOOTNODE_DIR="$NETWORK_DIR/bootnode"
NODO1_DIR="$NETWORK_DIR/nodo1"
NODO2_DIR="$NETWORK_DIR/nodo2"
NODO3_DIR="$NETWORK_DIR/nodo3"
NODO4_DIR="$NETWORK_DIR/nodo4"


# Verificar si la carpeta "network" existe antes de eliminar
if [ -d "$NETWORK_DIR" ]; then
    echo "🗑️  Eliminando contenido de la carpeta 'network'..."
    rm -rf "$NETWORK_DIR"/*
else
    echo "⚠️  La carpeta 'network' no existía, se creará automáticamente."
fi

mkdir -p "$BOOTNODE_DIR"

# Borrar contenedores con label "besu-net" si existen
echo "🗑️  Eliminando contenedores con label 'besu-net'..."
docker ps -aq --filter "label=network=${NETWORK_NAME}" | while read -r container_id; do
    [ -n "$container_id" ] && docker rm -f "$container_id"
done

# Borrar la red "besu-net" si existe
echo "🗑️  Eliminando la red '${NETWORK_NAME}'..."
docker network rm ${NETWORK_NAME} 2>/dev/null || echo "⚠️  Red '${NETWORK_NAME}' no existía."

# Crear la red "besu-net" con las características especificadas
echo "🌐 Creando la red '${NETWORK_NAME}'..."
docker network create "${NETWORK_NAME}" \
    --subnet="${NETWORK}" \
    --label network="${NETWORK_NAME}" \
    --label type=besu
echo "✅ Red '${NETWORK_NAME}' creada exitosamente."

# Verificar si Node.js está instalado antes de ejecutar
if ! command -v node &>/dev/null; then
    echo "❌ Node.js no está instalado. Instálalo y vuelve a intentarlo." >&2
    exit 1
fi

# Ejecutar el script de bootnode sin necesidad de cambiar de directorio
echo "🔗 Creando bootnode"
node "$SCRIPT_DIR/index.mjs" createKeys "${BOOTNODE_IP}" "${BOOTNODE_DIR}"

# Verificar si el comando anterior fue exitoso
if [ $? -eq 0 ]; then
    echo "✅ Bootnode creado exitosamente"
else
    echo "❌ Error al crear el bootnode" >&2
    exit 1
fi

# guardo valores relevantes del bootnode 
BOOTNODE_ADDRESS=$(cat "$BOOTNODE_DIR/address")
BOOTNODE_ENODE=$(cat "$BOOTNODE_DIR/enode")

# Crear genesis.json con Clique PoA
echo "🔗 Creando genesis.json con Clique PoA..."
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
echo "🔗 Creando config.toml..."
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

echo "✅ Archivos genesis.json y config.toml creados exitosamente..."

# Lanzar el boonode en Docker
echo "🔗 Lanzando el BOOTNODE en Docker..."

docker run -d \
    --name bootnode-besu-net \
    --label network="${NETWORK_NAME}" \
    --ip "${BOOTNODE_IP}" \
    --network "${NETWORK_NAME}" \
    -p ${BOOTNODE_PUERTO}:8545 \
    -v "$NETWORK_DIR:/datadoker" \
    hyperledger/besu:latest \
    --config-file="/datadoker/config.toml" \
    --data-path="/datadoker/bootnode/data" \
    --node-private-key-file="/datadoker/bootnode/key.priv"

# Verificar si el contenedor se inició correctamente
if [ $? -eq 0 ]; then
    echo "✅ Bootnode lanzado exitosamente."
else
    echo "❌ Error al lanzar el Bootnode" >&2
    exit 1
fi

# Lanzar el Nodo1 en Docker
echo "🔗 Lanzando el NODO1 en Docker..."
docker run -d \
    --name nodo1-besu-net \
    --label network="${NETWORK_NAME}" \
    --network "${NETWORK_NAME}" \
    -p ${NODO1_PUERTO}:8545 \
    -v "$NETWORK_DIR:/datadoker" \
    hyperledger/besu:latest \
    --config-file="/datadoker/config.toml" \
    --data-path="/datadoker/nodo1/data" \
    --bootnodes="$BOOTNODE_ENODE"

# Verificar si el contenedor se inició correctamente
if [ $? -eq 0 ]; then
    echo "✅ Nodo1 lanzado exitosamente."
else
    echo "❌ Error al lanzar el Nodo1" >&2
    exit 1
fi

# Lanzar el Nodo2 en Docker
echo "🔗 Lanzando el NODO2 en Docker..."
docker run -d \
    --name nodo2-besu-net \
    --label network="${NETWORK_NAME}" \
    --network "${NETWORK_NAME}" \
    -p ${NODO2_PUERTO}:8545 \
    -v "$NETWORK_DIR:/datadoker" \
    hyperledger/besu:latest \
    --config-file="/datadoker/config.toml" \
    --data-path="/datadoker/nodo2/data" \
    --bootnodes="$BOOTNODE_ENODE"

# Verificar si el contenedor se inició correctamente
if [ $? -eq 0 ]; then
    echo "✅ Nodo2 lanzado exitosamente."
else
    echo "❌ Error al lanzar el Nodo2" >&2
    exit 1
fi

# Lanzar el Nodo3 en Docker
echo "🔗 Lanzando el NODO3 en Docker..."
docker run -d \
    --name nodo3-besu-net \
    --label network="${NETWORK_NAME}" \
    --network "${NETWORK_NAME}" \
    -p ${NODO3_PUERTO}:8545 \
    -v "$NETWORK_DIR:/datadoker" \
    hyperledger/besu:latest \
    --config-file="/datadoker/config.toml" \
    --data-path="/datadoker/nodo3/data" \
    --bootnodes="$BOOTNODE_ENODE"

# Verificar si el contenedor se inició correctamente
if [ $? -eq 0 ]; then
    echo "✅ Nodo3 lanzado exitosamente."
else
    echo "❌ Error al lanzar el Nodo3" >&2
    exit 1
fi

