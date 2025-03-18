#!/bin/bash
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
NETWORK_DIR="$SCRIPT_DIR/../network"
BOOTNODE_DIR="$NETWORK_DIR/bootnode"
NETWORK_NAME=$1

echo -e "✅ Network Name recibido: '$NETWORK_NAME'\n"

# Verificar si la carpeta "network" existe antes de eliminar en el proyecto
if [ -d "$NETWORK_DIR" ]; then
    echo -e "🗑️ Eliminando contenido de la carpeta 'network'\n"
    rm -rf "$NETWORK_DIR"/*
else
    echo -e "⚠️ La carpeta 'network' no existe, se creará automáticamente.\n"
fi

mkdir -p "$BOOTNODE_DIR"
echo -e "📁 Carpeta 'network' lista para usarse\n"

# Eliminar contenedores y red en docker
echo -e "🗑️ Eliminando contenedores de la red '$NETWORK_NAME' (si existen)\n"

docker ps -aq --filter "label=network=${NETWORK_NAME}" | while read -r container_id; do
    [ -n "$container_id" ] && docker rm -f "$container_id"
done

echo -e "🗑️ Eliminando la red '$NETWORK_NAME' (si existe en docker)\n"
docker network rm ${NETWORK_NAME} 2>/dev/null || echo -e "⚠️ Red $NETWORK_NAME no existe.\n"

echo -e "✅ Proceso concluido exitosamente"