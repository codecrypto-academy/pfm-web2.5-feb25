# #!/bin/bash

# echo "🔥 Eliminando la red Besu completamente..."

# # 🛑 Detener y eliminar todos los nodos de la red
# docker ps -aq --filter "name=nodo" | xargs -r docker stop
# docker ps -aq --filter "name=nodo" | xargs -r docker rm

# # 🛑 Eliminar la red de Docker
# docker network rm redBesu 2>/dev/null || echo "⚠️ La red redBesu no existe o ya fue eliminada."

# # 🗑️ Eliminar volúmenes y contenedores huérfanos
# docker volume prune -f
# docker container prune -f

# # 📂 Eliminar la carpeta de datos `besu`
# FOLDER_NAME="./besu"
# if [[ -d "$FOLDER_NAME" ]]; then
#     rm -rf "$FOLDER_NAME"
#     echo "✅ Carpeta $FOLDER_NAME eliminada."
# else
#     echo "⚠️ No se encontró la carpeta de datos."
# fi

# echo "✅ Red Besu eliminada y sistema limpio."
#!/bin/bash

echo "🔥 Eliminando la red Besu completamente..."

# 📌 Obtener la ruta absoluta del proyecto (carpeta raíz)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FOLDER_NAME="$PROJECT_ROOT/besu"

echo "📂 Buscando carpeta de datos en: $FOLDER_NAME"

# 🛑 Detener y eliminar todos los nodos de la red
docker ps -aq --filter "name=nodo" | xargs -r docker stop
docker ps -aq --filter "name=nodo" | xargs -r docker rm

# 🛑 Eliminar la red de Docker
docker network rm redBesu 2>/dev/null || echo "⚠️ La red redBesu no existe o ya fue eliminada."

# 🗑️ Eliminar volúmenes y contenedores huérfanos
docker volume prune -f
docker container prune -f

# 📂 Eliminar la carpeta de datos `besu`
if [[ -d "$FOLDER_NAME" ]]; then
    rm -rf "$FOLDER_NAME"
    echo "✅ Carpeta $FOLDER_NAME eliminada."
else
    echo "⚠️ No se encontró la carpeta de datos en $FOLDER_NAME."
fi

echo "✅ Red Besu eliminada y sistema limpio."
