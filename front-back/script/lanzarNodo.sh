SCRIPT_DIR="$(dirname "$(realpath "$0")")"
NETWORK_DIR="$SCRIPT_DIR/../network"
BOOTNODE_DIR="$NETWORK_DIR/bootnode"
BOOTNODE_ENODE=$(cat "$BOOTNODE_DIR/enode")

NETWORK_NAME=$1
NODO_PUERTO=$2
NAME_NODO="${NETWORK_NAME}-${NODO_PUERTO}"

#echo "Lanzando NODO ${NAME_NODO} en Docker"

CONTAINER_ID=$(
docker run -d \
    --name "${NAME_NODO}" \
    --label network="${NETWORK_NAME}" \
    --network "${NETWORK_NAME}" \
    -p ${NODO_PUERTO}:8545 \
    -v "$NETWORK_DIR:/datadoker" \
    hyperledger/besu:latest \
    --config-file="/datadoker/config.toml" \
    --data-path="/datadoker/${NAME_NODO}/data" \
    --bootnodes="$BOOTNODE_ENODE" | cut -c -5)

# Verificar si el contenedor se inició correctamente
if [ -n "$CONTAINER_ID" ]; then
    echo "Container ID: $CONTAINER_ID"
    echo "✅ Nodo lanzado exitosamente."
else
    echo "❌ Error al lanzar el nodo. Verifica si el puerto ya está en uso o si la red existe."
    exit 1
fi