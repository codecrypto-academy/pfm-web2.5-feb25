#!/bin/bash
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
NETWORK_DIR="$SCRIPT_DIR/../network"
BOOTNODE_DIR="$NETWORK_DIR/bootnode"


# Verificar si la carpeta "network" existe antes de eliminar en el proyecto
if [ -d "$NETWORK_DIR" ]; then
    echo "Eliminando contenido de la carpeta 'network'"
    rm -rf "$NETWORK_DIR"/*
else
    echo "La carpeta 'network' no existía, se creará automáticamente."
fi

mkdir -p "$BOOTNODE_DIR"
echo "Carpeta 'network' lista para usarse"