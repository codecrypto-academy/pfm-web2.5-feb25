#!/bin/bash
echo "Creando bootnode"

SCRIPT_DIR="$(dirname "$(realpath "$0")")"
BOOTNODE_DIR="$SCRIPT_DIR/../network/bootnode"
BOOTNODE_IP=$1

# Verificar que la IP esté presente
if [ -z "$BOOTNODE_IP" ]; then
    echo "Error: Se debe proporcionar la IP del Bootnode."
    exit 1
fi

# Ejecutar el script de Node.js==> files.mjs
node "$SCRIPT_DIR/files.mjs" "$BOOTNODE_IP" "$BOOTNODE_DIR"

# Verificar si la ejecución fue exitosa
if [ $? -eq 0 ]; then
    echo "Bootnode creado exitosamente en ${BOOTNODE_IP} y en el directorio ${BOOTNODE_DIR}"
else
    echo "❌ Error al crear el bootnode" >&2
    exit 1
fi
