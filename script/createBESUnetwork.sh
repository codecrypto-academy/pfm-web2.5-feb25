#!/bin/bash


# FUNCIÓN PARA CONFIGURAR IPs, de manera manual o automática.
## 🛠️ Mejora futura: Sacar el while y la pregunta de la función
## 🛠️ Mejora futura: Que no te permita mandar IPs repetidas
## por el momento solo busca en las IP ya usadas en la network de docker pero si tu mandas 2 IPs iguales no te marca error

configure_IPs() {
    local typeOfNode=$1
    local numberOfNodes=$2
    local nodesIPs=()

    while [[ -z $configureNodesIp ]]; do
        read -p "Do you want to configure the ${typeOfNode}s IP manually? (y/n): " configureNodesIp
        case "$configureNodesIp" in
            y|Y)
                for i in $(seq 1 $numberOfNodes); do
                    local nodeIpSet=false
                    local nodeIp=""
                    while [[ $nodeIpSet = false ]]; do
                        while [[ -z $nodeIp ]]; do
                            read -p "Enter the $typeOfNode $i IP: " nodeIp
                        done
                        networkPrefix=$(docker network inspect $networkName | grep -oP '(?<="Subnet": ")[^"]+' | cut -d'.' -f1-3)
                        nodeIp="${networkPrefix}.${nodeIp}"
                        if docker network inspect $networkName | grep -q $nodeIp; then
                            echo "The ip $nodeIp is already in use"
                            nodeIp=""
                            nodeIpSet=false 
                        else
                            nodeIpSet=true
                        fi
                    done
                    nodesIPs+=($nodeIp)
                done
                ;;
            n|N)
                for i in $(seq 1 $numberOfNodes); do
                    local nodeIpSet=false
                    local nodeIp=""
                    while [[ $nodeIpSet = false ]]; do
                        nodeIp=$(shuf -i 2-254 -n 1)
                        local networkPrefix=$(docker network inspect $networkName | grep -oP '(?<="Subnet": ")[^"]+' | cut -d'.' -f1-3)
                        nodeIp="${networkPrefix}.${nodeIp}"
                        if docker network inspect $networkName | grep -q $nodeIp; then
                            nodeIpSet=false
                        else
                            nodeIpSet=true
                        fi
                    done
                    nodesIPs+=($nodeIp)
                done
                ;;
            *)
                configureNodesIp=""
                echo "Invalid option";
                ;;
        esac
    done
    echo "${nodesIPs[@]}"
}

# FUNCIONES PARA CREAR NODOS 
## Nodos RPC
create_RPC_node() {
    local name=$1
    local ip=$2
    local rpcPort=$3
    local typeOfNode=$4

    if [[ typeOfNode="bootnode" ]]; then
        local configFile="bootnode-config.toml"
    else
        echo "HELLO"
        local configFile="config.toml"
    fi
    docker run -d --name $name --network $networkName --ip $ip \
    -p $rpcPort:8545 \
    -v $directory/$networkName:/data hyperledger/besu:latest \
    --config-file=/data/$configFile \
    --data-path=/data/$name/data \
    --node-private-key-file=/data/$name/key
}

## Nodos no RPC
create_node() {
    local name=$1
    local ip=$2
    local typeOfNode=$3

    if [[ typeOfNode="bootnode" ]]; then
        local configFile="bootnode-config.toml"
    else
        echo "HELLO"
        local configFile="config.toml"
    fi

    docker run -d --name $name --network $networkName --ip $ip \
    -v $directory/$networkName:/data hyperledger/besu:latest \
    --config-file=/data/$configFile \
    --data-path=/data/$name/data \
    --node-private-key-file=/data/$name/key
}


# El script espera un argumento para especificar cual de las siguientes funciones va a realizar:
## - createBesuNetwork | Crea una red de BESU
## - deleteBesuNetwork | Elimina una red BESU
## - addBesuNode | Añade un nodo a una red BESU existente !Aún no implementada
## - deleteBesuNode | Elimina un nodo de una red BESU existente !Aún no implementada

# Verificar que se haya pasado un argumento
if [[ -z "$1" ]]; then
    echo "Usage: $0 <command>"
    exit 1
fi

# Guardamos el argumento en la variable "command" y según su valor ejecutamos una funcionalidad.
command=$1
case "$command" in
    # En el caso de que el comando sea "createBesuNetwork" creamos una red BESU
    "createBesuNetwork")
        # Para crear una red BESU necesitamos los siguientes parámetros
        prompts=("ChainId" "number of nodes" "network name" "network ip" "number of bootnodes" "directory")
        # Iteramos sobre el array de prompts para preguntar por cada uno de los parámetros
        declare -a inputValues
        for prompt in "${prompts[@]}"; do
            read -p "Enter the $prompt: " inputValue
            # Si el valor de la promt es una stirng vacía, marcamos un error y paramos la ejecución
            if [[ -z $inputValue ]]; then
                echo -e "\e[33mPrompt \"$prompt\" is required\e[0m"
                exit 1
            fi
            # Si el número de bootnodes especificados es mayor al número de nodos totales, marcamos un error y paramos la ejecución
            if [[ "$prompt" == "number of bootnodes" && inputValue -gt ${inputValues[1]} ]]; then 
                echo -e "\e[31mError: You are specifying more bootnodes than the total amount of nodes in the network.\e[0m"
                exit 1
            fi

            # 🛠️ Mejora futura: Validar que el valor tenga un formato adecuado y no se haya manda cualquier cosa
            
            # Si todo va bien agregar el valor a un array que guarda los valores de todos los parámetros 
            inputValues+=($inputValue)
        done

        # Extraemos los valores en el array de parámetros y los guardamos en variables para fácil acceso
        chainId=${inputValues[0]}
        numberOfNodes=${inputValues[1]}
        networkName=${inputValues[2]}
        networkIp=${inputValues[3]}
        numberOfBootnodes=$((inputValues[4]))
        directory=${inputValues[5]}

        # Si el número de bootnodes es menor a 0 marcamos un error
        if [[ "$numberOfBootnodes" -lt 0 ]]; then
            echo -e "\e[33mBootnode number must be at least 1\e[0m"
            exit 1
        fi

        # COMIENZA LA REACIÓN DE LA RED BESU
        echo "Creating the network..." 
        
        ## PASO 1: CREAR LA NETWORK DE DOCKER
        # Creamos la network con los parámetros especificados por el usuario
        docker network create $networkName --subnet=$networkIp
        # Si docker responde con un código no igual a 0 (Ocurrio algún error)
        if [[ $? -ne 0 ]]; then
          # Mostramos un mesaje de error
          echo -e "\e[31mError creating network\e[0m"
          exit 1
        fi
        # Si docker respnde con código 0 (Éxito)
        # Mostramos un mensaje indicando que la red se creo con éxito
        echo -e "\e[32mNetwork created successfully\e[0m"
        

        ## PASO 2: CONFIGURAR LAS IPs PARA CADA NODO
        # Creamos un array que guardará todas las IPs de los nodos
        declare -a allNodeIPs

        # Configurar las IPs para los bootnodes
        echo "Configuring the IPs of the bootnodes..."
        # Utilizando la función para configuar IPs configuro IPs para todos los bootnodes
        # El resultado de llamar a la función configure_IPs lo guardo en bootnodeIPs
        # bootnodeIPs guarda una string con las IP's configuradas separadas por un espacio
        mapfile -t bootnodeIPs < <(configure_IPs "bootnode" $numberOfBootnodes)
        # Imprimimos las IPs configuradas
        echo -e "\e[34mConfigured the IPs of the bootnodes:\e[0m ${bootnodeIPs[@]}"
        echo -e "\e[32mThe IPs of the bootnodes were configured successfully.\e[0m"
        
        # Creamos un array con las IPs de los bootnode para fácil acceso
        # Añadimos las IPs al array que guarda las IPs de todos los nodos
        for i in $(seq 1 $numberOfBootnodes); do
            # Para obtener la IP i de la variable "bootnodeIPs"(String) utilzámos el comando cut
            # En este caso cut utiliza un espacio como su delimitador y toma el field correspondiente a la ip i
            bootnodeIPsArray+=($(echo $bootnodeIPs | cut -d' ' -f$i-$i))
            allNodeIPs+=($(echo $bootnodeIPs | cut -d' ' -f$i-$i))
        done
    
        # Obtenemos el número de nodos normales (Nodos totales menos el número de bootnodes)
        numberOfNormalNodes=$((numberOfNodes - numberOfBootnodes))
        # Si el número de nodos normales es mayor a 0 configuramos sus IPs
        if [[ "$numberOfNormalNodes" -gt 0 ]]; then
            echo "Configuring IPs of the normal nodes..."
            # Utilizando la función para configuar IPs configuro IPs para todos los nodos normales
            # El resultado de llamar a la función configure_IPs lo guardo en normalNodeIPs
            # normalNodeIPs guarda una string con las IP's configuradas separadas por un espacio
            mapfile -t normalNodeIPs < <(configure_IPs "node" $numberOfNormalNodes)
            # Imprimimos las IPs configuradas
            echo -e "\e[34mConfigured the IPs of the normal nodes:\e[0m ${normalNodeIPs[@]}"
            echo -e "\e[32mThe IPs of the normal nodes were configured successfully.\e[0m"

            # Creamos un array con las IPs de los nodos normales para fácil acceso
            # Añadimos las IPs al array que guarda las IPs de todos los nodos
            for i in $(seq 1 $numberOfNormalNodes); do
                # Para obtener la IP i de la variable "normalNodeIPs"(String) utilzámos el comando cut
                # En este caso cut utiliza un espacio como su delimitador y toma el field correspondiente a la ip i
                normalNodeIPsArray+=($(echo $normalNodeIPs | cut -d' ' -f$i-$i))
                allNodeIPs+=($(echo $normalNodeIPs | cut -d' ' -f$i-$i))
            done        
        fi 


        ## PASO 3: ESCOJER EL NODO MINERO
        # Con el uso de fzf se le muestra al usuario un menú para escojer entre las diferentes IPs para establecer un nodo minero
        # Para especificar las opciones usamos el array "allNodeIPs" que guarda todas las IPs configuradas para los nodos
        InitialSignerChoice=$(printf "%s\n" "${allNodeIPs[@]}" | fzf --height=10 --border --prompt="Select a initial signer node: ")
        

        ## PASO 4: CREAR EL DIRECTORIO PARA LA RED Y UN DIRECTORIO PARA CADA NODO
        # Dentro del directorio especificado por el usuario crear el directorio de la red
        mkdir $directory/$networkName
        
        minerIsEnode=false
        # Delcaro un array para guardar todos los enodes
        declare -a enodes
        # Crear un directorio, enode y claves para cada bootnode.
        for i in $(seq 1 $numberOfBootnodes); do
            # Si el bootnode i es el nodo minero entonces creamos una carpeta llamada minernode en vez de bootnode 
            if [ "${bootnodeIPsArray[$((i-1))]}" = "$InitialSignerChoice" ]; then
                mkdir $directory/$networkName/minernode
                # Crear claves y enode
                node ./createPrivatePublicKeys.mjs createKeysAndEnode "${bootnodeIPsArray[$((i-1))]}" 30303 "$directory/$networkName/minernode"
                # Guardamos el enode en el array de enodes
                enode=$(cat "$directory/$networkName/minernode/enode")
                enodes+=$enode
                minerIsEnode=true
            else
                mkdir $directory/$networkName/bootnode$i
                # Crear claves y enode
                node ./createPrivatePublicKeys.mjs createKeysAndEnode "${bootnodeIPsArray[$((i-1))]}" 30303 "$directory/$networkName/bootnode$i"
                # Guardamos el enode en el array de enodes
                enode=$(cat "$directory/$networkName/bootnode$i/enode")
                enodes+=($enode)
            fi
        done
        # Crear un directorio para cada nodo normal
        for i in $(seq 1 $numberOfNormalNodes); do
            # Si el nodo minero no es un bootnode, creo un directorio minernode en vez de solo node
            if [ "$minerIsEnode" = false ] && [ "$i" -eq 1 ]; then
                mkdir $directory/$networkName/minernode
                # Crear claves
                # Como no es un bootnode no necesitamos crear un enode.
                node ./createPrivatePublicKeys.mjs createKeys "$directory/$networkName/minernode"
            else
                mkdir $directory/$networkName/node$i
                # Crear claves
                node ./createPrivatePublicKeys.mjs createKeys "$directory/$networkName/node$i"
            fi

        done


        # Crear archivo génesis
        # En el extradata especifico el address del nodo minero.
        # El nodo minera también lo especifico en alloc para darle un saldo inicial.
        echo "Creating genesis file..."

        cat > $directory/$networkName/genesis.json <<EOF
{
"config": {
    "chainId": $chainId,
    "londonBlock": 0,
    "clique": {
    "blockperiodseconds": 4,
    "epochlength": 30000,
    "createemptyblocks": true
    }
},
"extraData": "0x0000000000000000000000000000000000000000000000000000000000000000$(cat $directory/$networkName/minernode/address)0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
"gasLimit": "0x1fffffffffffff",
"difficulty": "0x1",
"alloc": {
    "0x$(cat $directory/$networkName/minernode/address)": {
    "balance": "0x20000000000000000000000000000000000000000000000000000000000"
    }
}
}
EOF
        # Crear un archivo config.toml para los nodos normales (Necesitan que los bootnode se especifiquen)
        echo "Creating config.toml file..."
        echo ${enodes[@]}
        bootnodes_toml=$(printf '  "%s",\n' "${enodes[@]}" | sed '$s/,$//')

        cat > $directory/$networkName/config.toml << EOF
genesis-file="/data/genesis.json"
# Networking
p2p-host="0.0.0.0"
p2p-port=30303
p2p-enabled=true

bootnodes=[
$bootnodes_toml
]

# JSON-RPC

# Node discovery
discovery-enabled=true



rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=8545
rpc-http-cors-origins=["*"]
rpc-http-api=["ETH","NET","CLIQUE", "ADMIN", "TRACE", "DEBUG", "TXPOOL", "PERM"]
host-allowlist=["*"]
EOF
        # Crear archivo de configuración config.toml para los bootnodes (No necesitan que se especifiquen los bootnodes)
        echo "Creating bootnode-config.toml file..."

        cat > $directory/$networkName/bootnode-config.toml << EOF
genesis-file="/data/genesis.json"
# Networking
p2p-host="0.0.0.0"
p2p-port=30303
p2p-enabled=true



# JSON-RPC

# Node discovery
discovery-enabled=true



rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=8545
rpc-http-cors-origins=["*"]
rpc-http-api=["ETH","NET","CLIQUE", "ADMIN", "TRACE", "DEBUG", "TXPOOL", "PERM"]
host-allowlist=["*"]
EOF


        # Crear todos los bootnodes
        for i in $(seq 1 $numberOfBootnodes); do
            if [ "${bootnodeIPsArray[$((i-1))]}" = "$InitialSignerChoice" ]; then
                read -p "Is minernode "${bootnodeIPsArray[$((i-1))]}" a RPC node? (y/n): " minernodeIsRpc

                case "$minernodeIsRpc" in
                    y|Y)
                        read -p "What is it's RPC port? " minernodeRpc
                        create_RPC_node "minernode" "${bootnodeIPsArray[$((i-1))]}" $minernodeRpc "bootnode"
                        ;;
                    n|N)
                        create_node "minernode" "${bootnodeIPsArray[$((i-1))]}" "bootnode"
                        ;;
                    *)
                        echo -e "Error: Invalid option"
                        exit 1
                        ;;
                esac
            else
                read -p "Is bootnode$i "${bootnodeIPsArray[$((i-1))]}" a RPC node? (y/n): " bootnodeIsRpc

                case "$bootnodeIsRpc" in
                    y|Y)
                        read -p "What is it's RPC port? " bootnodeRpc
                        create_RPC_node "bootnode$i" "${bootnodeIPsArray[$((i-1))]}" $bootnodeRpc "bootnode"
                        ;;
                    n|N)
                        create_node "bootnode$i" "${bootnodeIPsArray[$((i-1))]}" "bootnode"
                        ;;
                    *)
                        echo -e "Error: Invalid option"
                        exit 1
                        ;;     
                esac            
            fi
        done
        # Crear todos los nodos normales
        for i in $(seq 1 $numberOfNormalNodes); do
            if [ "$minerIsEnode" = false ] && [ "$i" -eq 1 ]; then
                read -p "Is minernode "${normalNodeIPsArray[$((i-1))]}" a RPC node? (y/n): " minernodeIsRpc

                case "$minernodeIsRpc" in
                    y|Y)
                        read -p "What is it's RPC port? " minernodeRpc
                        create_RPC_node "minernode" "${normalNodeIPsArray[$((i-1))]}" $minernodeRpc
                        ;;
                    n|N)
                        create_node "minernode" "${normalNodeIPsArray[$((i-1))]}"
                        ;;
                    *)
                        echo -e "Error: Invalid option"
                        exit 1
                        ;;
                esac
            else
                read -p "Is node$i "${normalNodeIPsArray[$((i-1))]}" a RPC node? (y/n): " nodeIsRpc

                case "$nodeIsRpc" in
                    y|Y)
                        read -p "What is it's RPC port? " nodeRpc
                        create_RPC_node "node$i" "${normalNodeIPsArray[$((i-1))]}" $nodeRpc
                        ;;
                    n|N)
                        create_node "node$i" "${normalNodeIPsArray[$((i-1))]}"
                        ;;
                    *)
                        echo -e "Error: Invalid option"
                        exit 1
                        ;;
                esac
            fi

        done

    ;;
esac

