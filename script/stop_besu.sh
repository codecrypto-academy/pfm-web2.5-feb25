#!/bin/bash

echo "🛑 Deteniendo todos los nodos de la red Besu..."

# 🛑 Detener todos los nodos que están corriendo
docker ps -aq --filter "name=nodo" | xargs -r docker stop

echo "✅ Todos los nodos de la red Besu han sido detenidos."
