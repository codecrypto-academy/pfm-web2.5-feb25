SCRIPT_DIR="$(dirname "$(realpath "$0")")"
NETWORK_DIR="$SCRIPT_DIR/../network"
BOOTNODE_DIR="$NETWORK_DIR/bootnode"
BOOTNODE_ADDRESS=$(cat "$BOOTNODE_DIR/address")
BOOTNODE_ENODE=$(cat "$BOOTNODE_DIR/enode")
CHAIN_ID=$1
ALLOC_ADDRESS=$2

# Crear genesis.json con Clique PoA
echo "Creando genesis.json con Clique PoA"
cat > "$NETWORK_DIR/genesis.json" << EOF
{
  "config": {
    "chainId": ${CHAIN_ID},
    "londonBlock": 0,
    "clique": {
      "blockperiodseconds": 4,
      "createemptyblocks": true,
      "epochlength": 30000
    }
  },
  "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000${BOOTNODE_ADDRESS}0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "gasLimit": "0xa00000",
  "difficulty": "0x1",
  "alloc": {
    "${ALLOC_ADDRESS}": {
      "balance": "0xad78ebc5ac6200000"
    },
    "${BOOTNODE_ADDRESS}": {
      "balance": "0xad78ebc5ac6200000"
    }
  }
}
EOF

# Crear el config.toml
echo "Creando config.toml"
cat > "$NETWORK_DIR/config.toml" <<EOF
genesis-file="/datadoker/genesis.json"
# Networking
p2p-host="0.0.0.0"
p2p-port=30303
p2p-enabled=true

# JSON-RPC
rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=8545
rpc-http-cors-origins=["*"]
rpc-http-api=["ETH","NET","CLIQUE","ADMIN","TRACE","DEBUG","TXPOOL","PERM","WEB3"]
host-allowlist=["*"]
EOF

echo "Archivos genesis.json y config.toml creados exitosamente"
