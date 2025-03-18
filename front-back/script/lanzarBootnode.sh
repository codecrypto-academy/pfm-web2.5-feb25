SCRIPT_DIR="$(dirname "$(realpath "$0")")"
NETWORK_DIR="$SCRIPT_DIR/../network"

NETWORK_NAME=$1
BOOTNODE_IP=$2
BOOTNODE_PUERTO=$3
NAME_NODO="bootnode-${NETWORK_NAME}-${BOOTNODE_PUERTO}"


#echo "Lanzando el BOOTNODE en Docker"
CONTAINER_ID=$(
    docker run -d \
    --name "${NAME_NODO}" \
    --label network="${NETWORK_NAME}" \
    --ip "${BOOTNODE_IP}" \
    --network "${NETWORK_NAME}" \
    -p ${BOOTNODE_PUERTO}:8545 \
    -v "$NETWORK_DIR:/datadoker" \
    hyperledger/besu:latest \
    --config-file="/datadoker/config.toml" \
    --data-path="/datadoker/bootnode/data" \
    --node-private-key-file="/datadoker/bootnode/key.priv" | cut -c -5)

# Verificar si el contenedor se inició correctamente
if [ -n "$CONTAINER_ID" ]; then
    echo "Container ID: $CONTAINER_ID"
    echo "✅ Bootnode lanzado exitosamente."
else
    echo "❌ Error al lanzar el bootnode."
    exit 1
fi

