SCRIPT_DIR="$(dirname "$(realpath "$0")")"
NETWORK_DIR="$SCRIPT_DIR/../network"

NETWORK_NAME=$1
BOOTNODE_IP=$2
BOOTNODE_PUERTO=$3

echo "Lanzando el BOOTNODE en Docker"

docker run -d \
    --name bootnode-besu-network \
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
    echo "Bootnode lanzado exitosamente."
else
    echo "Error al lanzar el Bootnode" >&2
    exit 1
fi