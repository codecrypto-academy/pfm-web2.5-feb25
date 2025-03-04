#!/bin/bash
# Script de creación de red Blockchain Hyperledger Besu con mejoras de depuración

# Configurar variables comunes
NETWORK="172.24.0.0/16"

# Verificar número de argumentos
if [ "$#" -eq 0 ]; then
  # Modo automático: crear red y 5 nodos
  RED="red-$(date +%s | sha256sum | head -c 8)"
  echo "Modo automático: Creando red '$RED' con 5 nodos..."
  
  # Crear red
  mkdir -p networks/$RED
  docker network create $RED \
    --subnet $NETWORK \
    --label network=$RED \
    --label type=besu
  
  # Pausa después de crear la red
  echo "Red creada. Esperando 5 segundos..."
  sleep 5
  
  # Arrays para almacenar información de nodos
  declare -a NODOS_PORTS
  declare -a NODOS_ADDRESSES
  
  # Crear 5 nodos
  for i in {1..5}; do
    NODO="nodo$i"
    NODO_IP="172.24.0.$((10 + i))" # IPs secuenciales para evitar conflictos
    HTTP_PORT=$((8545 + i))
    P2P_PORT="30303"
    MACHINE_PORT=$((8888 + i))
    
    # Guardar puerto para uso posterior
    NODOS_PORTS[$i]=$MACHINE_PORT
    
    echo "Creando nodo $i: $NODO (IP: $NODO_IP, Puerto: $MACHINE_PORT)"
    
    # Crear directorios y claves para el nodo
    mkdir -p networks/$RED/$NODO
    cd networks/$RED/$NODO
    
    # Mejora en la generación de claves con control de errores
    node ../../../index.mjs create-keys ${NODO_IP} ${P2P_PORT} || {
        echo "ERROR: No se pudieron generar las claves para $NODO"
        exit 1
    }
    
    # Verificar que el archivo de dirección se haya creado
    if [ ! -f address ]; then
        echo "ERROR: No se generó el archivo de dirección para $NODO"
        # Generar una dirección de respaldo si falla
        BACKUP_ADDRESS=$(openssl rand -hex 20)
        echo "$BACKUP_ADDRESS" > address
        echo "ADVERTENCIA: Se generó una dirección de respaldo para $NODO"
    fi
    
    cd ../../..
    
    # Guardar dirección para uso posterior
    NODOS_ADDRESSES[$i]=$(cat networks/$RED/$NODO/address)
    
    # Mostrar la dirección generada
    echo "Dirección del Nodo $NODO: ${NODOS_ADDRESSES[$i]}"
    
    # Si es el primer nodo, crear genesis.json con todas las direcciones
    if [ $i -eq 1 ]; then
      # Crear el archivo genesis.json
      cat > networks/$RED/genesis.json << EOF
{
  "config": {
    "chainId": 13371337,
    "londonBlock": 0,
    "clique": {
      "blockperiodseconds": 4,
      "epochlength": 30000,
      "createemptyblocks": true
    }
  },
  "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000$(cat networks/$RED/$NODO/address)0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "gasLimit": "0x1fffffffffffff",
  "difficulty": "0x1",
  "alloc": {
EOF
      # Agregar todas las direcciones al alloc
      for j in {1..5}; do
        CURRENT_NODO="nodo$j"
        # Verificar si existe el archivo de dirección, sino usar una dirección de respaldo
        if [ -f networks/$RED/$CURRENT_NODO/address ]; then
          CURRENT_ADDRESS=$(cat networks/$RED/$CURRENT_NODO/address)
        else
          CURRENT_ADDRESS=$(openssl rand -hex 20)
          echo "ADVERTENCIA: Usando dirección de respaldo para $CURRENT_NODO"
        fi
        
        # Si no es el último nodo, agregar una coma después
        if [ $j -lt 5 ]; then
          cat >> networks/$RED/genesis.json << EOF
    "0x$CURRENT_ADDRESS": {
      "balance": "0x200000000000000000000000"
    },
EOF
        else
          cat >> networks/$RED/genesis.json << EOF
    "0x$CURRENT_ADDRESS": {
      "balance": "0x200000000000000000000000"
    }
EOF
        fi
      done
      # Cerrar el alloc y el JSON
      cat >> networks/$RED/genesis.json << EOF
  }
}
EOF
    fi
    
    # Crear el archivo config.toml para cada nodo
    cat > networks/$RED/config-$NODO.toml << EOF
genesis-file="/data/genesis.json"
# Networking
p2p-host="0.0.0.0"
p2p-port=$P2P_PORT
p2p-enabled=true
# JSON-RPC
rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=$HTTP_PORT
rpc-http-cors-origins=["*"]
rpc-http-api=["ETH","NET","CLIQUE","ADMIN","TRACE","DEBUG","TXPOOL","PERM","WEB3"]
host-allowlist=["*"]
EOF
    
    mkdir -p networks/$RED/$NODO/data
    
    # Iniciar el nodo Besu
    docker run -d \
      --name $RED-$NODO \
      --label nodo=$NODO \
      --label network=$RED \
      --ip ${NODO_IP} \
      --network $RED \
      -p $MACHINE_PORT:$HTTP_PORT \
      -v $(pwd)/networks/$RED:/data \
      hyperledger/besu:latest \
      --config-file=/data/config-$NODO.toml \
      --data-path=/data/$NODO/data \
      --node-private-key-file=/data/$NODO/key.priv \
      --genesis-file=/data/genesis.json
    
    echo "Nodo $RED-$NODO iniciado con éxito en puerto $MACHINE_PORT"
    
    # Pausa entre nodos
    if [ $i -lt 5 ]; then
      echo "Esperando 5 segundos antes de crear el siguiente nodo..."
      sleep 5
    fi
  done
  
  # Crear una clave de prueba para transferencias
  echo "Creando clave de prueba para transferencias..."
  node ./index.mjs create-keys 192.168.1.100 "30303"
  
  # Esperar a que la red se estabilice
  echo "Esperando 15 segundos para que la red se estabilice..."
  sleep 15
  
  # Pruebas para cada nodo
  echo -e "\n=== REALIZANDO PRUEBAS EN TODOS LOS NODOS ==="
  
  # Dirección de destino para transferencias (la misma para todos)
  TEST_ADDRESS="0x$(cat address)"
  
  for i in {1..5}; do
    NODO="nodo$i"
    PORT=${NODOS_PORTS[$i]}
    ADDRESS=${NODOS_ADDRESSES[$i]}
    NODE_KEY=$(cat networks/$RED/$NODO/key.priv)
    
    echo -e "\n==== PRUEBAS PARA $RED-$NODO (Puerto: $PORT) ===="
    
    # Verificar saldo inicial
    echo "Verificando saldo inicial del nodo $NODO..."
    node ./index.mjs balance $ADDRESS "http://localhost:$PORT"
    
    # Transferir fondos a la dirección de prueba
    echo "Realizando transferencia desde nodo $NODO..."
    node ./index.mjs transfer $NODE_KEY $TEST_ADDRESS 10000 "http://localhost:$PORT"
    
    # Verificar saldo después de la transferencia
    echo "Verificando saldo después de la transferencia..."
    node ./index.mjs balance $ADDRESS "http://localhost:$PORT"
    
    # Verificar saldo de la dirección de prueba
    echo "Verificando saldo de la dirección destino..."
    node ./index.mjs balance $TEST_ADDRESS "http://localhost:$PORT"
    
    # Obtener información de la red desde este nodo
    echo "Obteniendo información de red desde nodo $NODO..."
    node ./index.mjs network-info "http://localhost:$PORT"
    
    # Pausa entre las pruebas de cada nodo
    if [ $i -lt 5 ]; then
      echo "Esperando 5 segundos antes de probar el siguiente nodo..."
      sleep 5
    fi
  done
  
  echo -e "\n==================================="
  echo "Red '$RED' creada con 5 nodos:"
  docker ps --filter "network=$RED" --format "{{.Names}} - {{.Ports}}"
  echo "==================================="
elif [ "$#" -eq 2 ]; then
  # Modo manual: crear un nodo específico
  RED=$1
  NODO=$2
  NODO_IP="172.24.0.$((RANDOM % 254 + 1))"
  HTTP_PORT=$((8545 + $(shuf -i 0-1000 -n 1)))
  P2P_PORT="30303"
  MACHINE_PORT=$((8888 + $(shuf -i 0-1000 -n 1)))
  
  echo "Modo manual: Creando nodo '$NODO' en red '$RED'..."
  
  # Crear red Docker si no existe
  if ! docker network inspect $RED >/dev/null 2>&1; then
    echo "La red '$RED' no existe. Creándola..."
    mkdir -p networks/$RED
    docker network create $RED \
      --subnet $NETWORK \
      --label network=$RED \
      --label type=besu
    
    # Pausa después de crear la red
    echo "Red creada. Esperando 5 segundos..."
    sleep 5
  fi
  
  # Verificar si el nodo ya existe
  if docker ps -a --filter "name=$RED-$NODO" --format '{{.Names}}' | grep -w "$RED-$NODO" >/dev/null 2>&1; then
    echo "El contenedor '$RED-$NODO' ya existe."
    exit 1
  else
    echo "El contenedor '$RED-$NODO' no existe. Procediendo a crearlo..."
  fi
  
  # Crear directorios y claves para el nodo
  cd networks/$RED
  mkdir -p $NODO
  cd $NODO
  node ../../../index.mjs create-keys ${NODO_IP} ${P2P_PORT}
  cd ../../..
  
  # Verificar si existe genesis.json, si no, crearlo
  if [ ! -f networks/$RED/genesis.json ]; then
    # Crear el archivo genesis.json
    cat > networks/$RED/genesis.json << EOF
{
  "config": {
    "chainId": 13371337,
    "londonBlock": 0,
    "clique": {
      "blockperiodseconds": 4,
      "epochlength": 30000,
      "createemptyblocks": true
    }
  },
  "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000$(cat networks/$RED/$NODO/address)0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "gasLimit": "0x1fffffffffffff",
  "difficulty": "0x1",
  "alloc": {
    "$(cat networks/$RED/$NODO/address)": {
      "balance": "0x200000000000000000000000"
    }
  }
}
EOF
  fi
  
  # Crear el archivo config.toml
  cat > networks/$RED/config.toml << EOF
genesis-file="/data/genesis.json"
# Networking
p2p-host="0.0.0.0"
p2p-port=$P2P_PORT
p2p-enabled=true
# JSON-RPC
rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=$HTTP_PORT
rpc-http-cors-origins=["*"]
rpc-http-api=["ETH","NET","CLIQUE","ADMIN","TRACE","DEBUG","TXPOOL","PERM","WEB3"]
host-allowlist=["*"]
EOF
  
  mkdir -p networks/$RED/$NODO/data
  
  # Iniciar el nodo Besu
  docker run -d \
    --name $RED-$NODO \
    --label nodo=$NODO \
    --label network=$RED \
    --ip ${NODO_IP} \
    --network $RED \
    -p $MACHINE_PORT:$HTTP_PORT \
    -v $(pwd)/networks/$RED:/data \
    hyperledger/besu:latest \
    --config-file=/data/config.toml \
    --data-path=/data/$NODO/data \
    --node-private-key-file=/data/$NODO/key.priv \
    --genesis-file=/data/genesis.json
  
  echo "Nodo $RED-$NODO iniciado con éxito. Esperando 5 segundos..."
  sleep 5
  
  # Crear una clave de prueba y realizar transacciones
  node ./index.mjs create-keys 192.168.1.100 "$P2P_PORT"
  sleep 10
  
  # Verificar saldo
  node ./index.mjs balance $(cat networks/$RED/$NODO/address) "http://localhost:$MACHINE_PORT"
  
  # Transferir fondos
  node ./index.mjs transfer $(cat networks/$RED/$NODO/key.priv) 0x$(cat address) 10000 "http://localhost:$MACHINE_PORT"
  
  # Verificar saldo nuevamente
  node ./index.mjs balance 0x$(cat networks/$RED/$NODO/address) "http://localhost:$MACHINE_PORT"
  
  # Obtener información de la red
  node ./index.mjs network-info "http://localhost:$MACHINE_PORT"
  
  echo "Nodo $RED-$NODO creado con éxito."
  echo "Puerto HTTP: $MACHINE_PORT"
  echo "IP del nodo: $NODO_IP"
else
  # Número incorrecto de argumentos
  echo "Uso:"
  echo "  $0                  # Crea automáticamente una red y 5 nodos"
  echo "  $0 red1 nodo1       # Crea un solo nodo específico en la red indicada"
  exit 1
fi