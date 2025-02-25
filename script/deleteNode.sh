#!/bin/bash

# Define the base directory
baseDir=$(dirname "$0")/..
nodesDir="$baseDir/nodes"

# Validar argumento de entrada
if [ -z "$1" ]; then
    echo "Uso: $0 <nombre_nodo | ip_nodo>"
    exit 1
fi

nodeIdentifier="$1"

deleteNode=""
containerName=""

# Buscar nodo por nombre o IP en los directorios de nodos
for nodeDir in "$nodesDir"/node*; do
    if [ -d "$nodeDir" ]; then
        nodeName=$(basename "$nodeDir")
        
        # Obtener IP desde Docker
        nodeIP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$nodeName" 2>/dev/null)
        
        if [[ "$nodeName" == "$nodeIdentifier" || "$nodeIP" == "$nodeIdentifier" ]]; then
            deleteNode="$nodeDir"
            containerName="$nodeName"
            break
        fi
    fi
done

if [ -z "$deleteNode" ]; then
    echo "No se encontró un nodo con el nombre o IP especificado."
    exit 1
fi

# Detener y eliminar el contenedor Docker
echo "Eliminando nodo: $containerName"
docker stop "$containerName" 2>/dev/null && docker rm "$containerName" 2>/dev/null

# Eliminar directorio del nodo
rm -rf "$deleteNode"

echo "Nodo $containerName eliminado exitosamente."
