#!/bin/bash
NETWORK_NAME=$1

# Eliminar contenedores y red en docker
echo "Eliminando contenedores de la red $NETWORK_NAME "

docker ps -aq --filter "label=network=${NETWORK_NAME}" | while read -r container_id; do
    [ -n "$container_id" ] && docker rm -f "$container_id"
done


echo "Eliminando la red $NETWORK_NAME "
docker network rm ${NETWORK_NAME} 2>/dev/null || echo " Red $NETWORK_NAME no existía."
