#!/bin/bash

# Variables Initialization 
NETWORKNAME="besuClique";
PORTJSON=8545;
PORTWS=8546;
PORTP2P=30303;

NODE1="node1"
NODE2="node2"
NODE3="node3"

for i in "$@"; do
  case $i in
    -pj=*|--portJSON-RPC=*)
      PORTJSON="${i#*=}"
      shift
      ;;
    -pw=*|--portWS=*)
      PORTWS="${i#*=}"
      shift
      ;;
    -pp=*|--portP2P=*)
      PORTP2P="${i#*=}"
      shift 
      ;;
    --default)
      # PORTJSON=8545;
      # PORTWS=8546;
      # PORTP2P=30303;
      shift 
      ;;
    -*|--*)
      echo "Script 0.01 ( https://script.org )"
      echo ""
      echo "Usage:" 
      echo "  bash script.sh -pj|--portJSON-RPC={number} -pw|--portWS={number} -pp|--portP2P={number}"
      echo ""
      echo "You can also use --default to use default values"
      echo "  bash script.sh --default"
      echo ""
      echo "Example:" 
      echo "  bash script.sh -pj=8545 -pw=8546 -pp=30303"
      echo ""
      exit 1
      ;;
    *)
      ;;
  esac
done

echo "Hyperledger Besu Network sript v.0.0.1 started ..."
echo ""
echo "-------------------------------------------"
echo "Current values:"
echo "-------------------------------------------"
echo "    Network Name  = ${NETWORKNAME}"
echo "    Port JSON-RPC = ${PORTJSON}"
echo "    Port WS       = ${PORTWS}"
echo "    Port P2P      = ${PORTP2P}"
echo "-------------------------------------------"

echo ""
echo "Creating folder structure ..."
echo "-------------------------------------------"

mkdir $NETWORKNAME
if [ $? -eq 0 ]; then
  echo "${NETWORKNAME} folder created successfully"
else
  echo "Command failed: ${$?}"
fi
cd $NETWORKNAME
mkdir 

echo ""
echo "Checking for Docker status ..."

# Verificar si Docker está instalado y en ejecución
if ! command -v docker &> /dev/null
then
    echo "Docker is not installed. Please, install it first."
    exit 1
fi

if ! docker info &> /dev/null
then
    echo "Docker is not running. Start the Docker service and try again."
    exit 1
fi

echo "Starting Docker Besu container ..."

# docker run -d -p ${PORTJSON}:8545 -p ${PORTWS}:8546 -p ${PORTP2P}:30303 hyperledger/besu:latest --rpc-http-enabled --rpc-ws-enabled

echo ""
echo "Script execution finished."