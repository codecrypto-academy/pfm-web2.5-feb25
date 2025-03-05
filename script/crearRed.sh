#!/bin/bash
NETWORK_NAME=$1
NETWORK=$2

echo "Creando red Docker: $NETWORK_NAME con subnet $NETWORK"
docker network create --subnet=$NETWORK $NETWORK_NAME

if [ $? -eq 0 ]; then
    echo "Red $NETWORK_NAME creada con éxito."
else
    echo "Error al crear la red."
    exit 1
fi
