#!/bin/bash

echo "🚀 Iniciando todos los nodos de la red Besu..."
docker start $(docker ps -aq --filter "name=nodo")
echo "✅ Todos los nodos han sido iniciados."
