#!/bin/bash

# Script para crear una red Hyperledger Besu automatizada con validadores y fullnodes
# Autor: Claude
# Fecha: 28/02/2025

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_message() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[AVISO]${NC} $1"
}

# Verificar que Besu y Docker estén instalados
check_dependencies() {
  print_message "Verificando dependencias..."
  
  if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor, instálalo antes de continuar."
    exit 1
  fi
  
  if ! command -v besu &> /dev/null; then
    print_error "Hyperledger Besu no está instalado. Por favor, instálalo antes de continuar."
    exit 1
  fi
  
  print_message "Todas las dependencias están instaladas."
}

# Crear la red de Docker
create_docker_network() {
  print_message "Creando red Docker 'besu'..."
  
  # Comprobar si la red ya existe
  if docker network inspect besu &> /dev/null; then
    print_warning "La red 'besu' ya existe. Se utilizará la existente."
  else
    docker network create besu
    print_message "Red 'besu' creada correctamente."
  fi
}

# Solicitar al usuario el número de nodos
get_node_count() {
  read -p "Introduce el número total de nodos que deseas crear (incluyendo el nodo validador): " node_count
  
  # Validar que sea un número
  if ! [[ "$node_count" =~ ^[0-9]+$ ]]; then
    print_error "Por favor, introduce un número válido."
    get_node_count
  fi
  
  # Validar que sea al menos 1
  if [ "$node_count" -lt 1 ]; then
    print_error "El número de nodos debe ser al menos 1."
    get_node_count
  fi
  
  print_message "Se crearán $node_count nodos (1 validador y $((node_count-1)) fullnodes)."
}

# Solicitar cuenta de Metamask
get_metamask_account() {
  print_message "A continuación, introduce una dirección de Metamask para incluir en el genesis.json"
  
  read -p "Introduce la dirección de Metamask (formato 0x...): " account1
  
  # Validar formato de dirección Ethereum
  if ! [[ "$account1" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    print_error "La dirección debe tener el formato 0x seguido de 40 caracteres hexadecimales."
    get_metamask_account
    return
  fi
  
  print_message "Cuenta de Metamask registrada correctamente."
}

# Crear directorio para el nodo y generar su clave
create_node_directory() {
  local node_num=$1
  local node_dir="node${node_num}"
  
  print_message "Creando directorio para el nodo $node_num..."
  
  # Crear directorio si no existe
  mkdir -p "$node_dir"
  
  # Generar clave y dirección para el nodo
  print_message "Generando clave y dirección para el nodo $node_num..."
  besu --data-path="$node_dir" public-key export-address --to="$node_dir/address"
  
  print_message "Nodo $node_num configurado correctamente."
}

# Crear el archivo genesis.json
create_genesis_file() {
  print_message "Creando archivo genesis.json..."
  
  # Obtener la dirección del primer nodo para el extradata
  NODE1_ADDRESS=$(cat node1/address)
  NODE1_ADDRESS_STRIP=$(echo "$NODE1_ADDRESS" | tail -n 1 | sed 's/0x//')
  
  # Crear el extradata con la dirección del primer nodo
  # El formato es: 0x + 32 bytes de ceros + 20 bytes de la dirección + 65 bytes de ceros
  EXTRADATA="0x0000000000000000000000000000000000000000000000000000000000000000${NODE1_ADDRESS_STRIP}0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
  
  # Crear el archivo genesis.json
  cat > genesis.json << EOL
{
  "config": {
    "chainID": 4004,
    "londonBlock": 0,
    "clique": {
      "blockperiodseconds": 4,
      "epochlength": 30000,
      "createemptyblocks": true
    }
  },
  "extradata": "${EXTRADATA}",
  "gasLimit": "0x1fffffffffffff",
  "difficulty": "0x1",
  "alloc": {
    "${account1}": {
      "balance": "0x2000000000000000000000000000"
    },
    "${account2}": {
      "balance": "0x1000000000000000000000000000"
    }
  }
}
EOL
  
  print_message "Archivo genesis.json creado correctamente."
}

# Crear el archivo config-validator.toml
create_validator_config() {
  print_message "Creando archivo config.toml para el nodo validador..."
  
  cat > config.toml << EOL
genesis-file = "/data/genesis.json"
# Networking
p2p-host = "0.0.0.0"
p2p-port = 30303
p2p-enabled = true
# IPC configuration
# JSON-RPC
# Node discovery
discovery-enabled = true
rpc-http-enabled = true
rpc-http-host = "0.0.0.0"
rpc-http-port = 8545
rpc-http-cors-origins = ["*"]
rpc-http-api = [
  "ETH",
  "NET",
  "CLIQUE",
  "ADMIN",
  "TRACE",
  "DEBUG",
  "TXPOOL",
  "PERM",
]
host-allowlist = ["*"]
EOL
  
  print_message "Archivo config.toml para el nodo validador creado correctamente."
}

# Obtener el enode del nodo validador
get_validator_enode() {
  print_message "Lanzando el nodo validador para obtener su enode..."
  
  # Lanzar el contenedor del nodo validador
  docker run -d \
    --name node1 \
    --network besu \
    -p 10001:8545 \
    -v "${PWD}:/data" \
    hyperledger/besu:latest \
    --config-file=/data/config.toml \
    --data-path=/data/node1/data \
    --node-private-key-file=/data/node1/key \
    --genesis-file=/data/genesis.json
  
  print_message "Contenedor del nodo validador lanzado correctamente."
  
  # Esperar a que el nodo se inicie
  print_message "Esperando a que el nodo validador se inicie (15 segundos)..."
  sleep 15
  
  # Obtener la IP del nodo validador
  NODE1_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' node1)
  print_message "IP del nodo validador: $NODE1_IP"
  
  # Obtener la clave pública del nodo directamente del archivo key.pub
  if [ -f "node1/key.pub" ]; then
    print_message "Obteniendo la clave pública del archivo key.pub..."
    NODE1_PUBKEY=$(cat node1/key.pub)
    
    # Asegurarse de que no tenga el prefijo 0x
    NODE1_PUBKEY=$(echo "$NODE1_PUBKEY" | sed 's/^0x//')
    
    # Verificar que la clave tenga 128 caracteres
    if [ ${#NODE1_PUBKEY} -eq 128 ]; then
      ENODE_FINAL="enode://${NODE1_PUBKEY}@${NODE1_IP}:30303"
      print_message "Enode generado correctamente: $ENODE_FINAL"
      return 0
    else
      print_warning "La clave pública no tiene el formato correcto (128 caracteres). Longitud actual: ${#NODE1_PUBKEY}"
    fi
  fi
  
  # Si no se pudo obtener del archivo key.pub, intentar exportarla con besu
  print_message "Intentando exportar la clave pública con besu..."
  NODE1_PUBKEY=$(besu --data-path=node1 public-key export 2>/dev/null | tail -1)
  
  # Asegurarse de que no tenga el prefijo 0x
  NODE1_PUBKEY=$(echo "$NODE1_PUBKEY" | sed 's/^0x//')
  
  # Verificar que la clave tenga 128 caracteres
  if [ ! -z "$NODE1_PUBKEY" ] && [ ${#NODE1_PUBKEY} -eq 128 ]; then
    ENODE_FINAL="enode://${NODE1_PUBKEY}@${NODE1_IP}:30303"
    print_message "Enode generado correctamente: $ENODE_FINAL"
    return 0
  fi
  
  # Si llegamos aquí, no pudimos obtener la clave pública correctamente
  print_error "No se pudo obtener una clave pública válida para el nodo validador."
  print_error "Asegúrate de que el nodo se ha inicializado correctamente y que la clave pública está disponible."
  exit 1
}

# Crear el archivo config-fullnode.toml
create_fullnode_config() {
  print_message "Creando archivo config-fullnode.toml para los nodos completos..."
  
  cat > config-fullnode.toml << EOL
genesis-file = "/data/genesis.json"
# Networking
p2p-host = "0.0.0.0"
p2p-port = 30303
p2p-enabled = true
# Bootstrap node connection
bootnodes = [
  "${ENODE_FINAL}",
]
# JSON-RPC
rpc-http-enabled = true
rpc-http-host = "0.0.0.0"
rpc-http-port = 8545
rpc-http-cors-origins = ["*"]
rpc-http-api = ["ETH", "NET", "CLIQUE", "ADMIN", "DEBUG", "TXPOOL"]
host-allowlist = ["*"]
# Disable mining for non-validator nodes
miner-enabled = false
# Sync mode (full sync for non-validators)
sync-mode = "FULL"
EOL
  
  print_message "Archivo config-fullnode.toml creado correctamente."
}

# Lanzar los contenedores de los fullnodes
launch_fullnode_containers() {
  local total_nodes=$1
  
  # Si solo hay un nodo, salir (ya se ha lanzado el validador)
  if [ "$total_nodes" -eq 1 ]; then
    return 0
  fi
  
  # Lanzar los nodos fullnode (a partir del segundo nodo)
  for i in $(seq 2 $total_nodes); do
    local node_name="node$i"
    local port=$((10000 + i))
    
    print_message "Lanzando contenedor para el fullnode $node_name en el puerto $port..."
    
    docker run -d \
      --name "$node_name" \
      --network besu \
      -p "$port:8545" \
      -v "${PWD}:/data" \
      hyperledger/besu:latest \
      --config-file=/data/config-fullnode.toml \
      --data-path=/data/"$node_name"/data
    
    print_message "Contenedor del fullnode $node_name lanzado correctamente."
  done
}

# Mostrar información de la red
show_network_info() {
  local total_nodes=$1
  
  print_message "Red Hyperledger Besu creada correctamente!"
  print_message "Información de la red:"
  print_message "- Número total de nodos: $total_nodes"
  print_message "- Nodo validador: 1"
  print_message "- Nodos fullnode: $((total_nodes-1))"
  print_message "- Cuenta de Metamask incluida: $account1"

  print_message "Acceso a los nodos:"
  print_message "- Nodo validador: http://localhost:10001"
  
  for i in $(seq 2 $total_nodes); do
    local port=$((10000 + i))
    print_message "- Fullnode $i: http://localhost:$port"
  done
  
  print_message "Enode del nodo validador: $ENODE_FINAL"
}

# Función principal
main() {
  print_message "=== Script de configuración de red Hyperledger Besu con validadores y fullnodes ==="
  
  # Verificar dependencias
  check_dependencies
  
  # Crear red Docker
  create_docker_network
  
  # Obtener número de nodos
  get_node_count
  
  # Obtener cuenta de Metamask
  get_metamask_account
  
  # Crear directorios y claves para cada nodo
  for i in $(seq 1 $node_count); do
    create_node_directory $i
  done
  
  # Crear archivos de configuración para el nodo validador
  create_genesis_file
  create_validator_config
  
  # Lanzar el nodo validador y obtener su enode
  get_validator_enode
  
  # Crear archivo de configuración para los fullnodes
  create_fullnode_config
  
  # Lanzar los contenedores de los fullnodes
  launch_fullnode_containers $node_count
  
  # Mostrar información de la red
  show_network_info $node_count
}

# Ejecutar la función principal
main