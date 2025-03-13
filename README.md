# Hyperledger Besu Automated Network Setup

This script automates the setup of a Hyperledger Besu blockchain network with 1 validator and 2 full nodes, running in Docker containers.

## Requirements

- **Docker**: For running the nodes
- **Hyperledger Besu**: For key generation and network configuration
- **jq**: For JSON processing
- **bc**: For mathematical calculations

## Quick Start

```bash
chmod +x script.sh
./script.sh
```

## What the Script Does

1. **Environment Setup**

   - Cleans existing files and containers
   - Checks for required dependencies
   - Creates a Docker network for node communication

2. **Node Configuration**

   - Creates 3 nodes: 1 validator and 2 full nodes
   - Generates keys for each node
   - Creates configuration files (genesis.json, config.toml, config-fullnode.toml)

3. **Network Launch**

   - Launches the validator node
   - Obtains the validator's enode information
   - Launches the 2 full nodes connected to the validator

4. **Network Verification**
   - Automatically sends a test transaction of 50 ETH to a predefined address
   - Shows transaction details and updated account balances
   - Confirms the network is operating correctly

## Node Access

- Validator Node: http://localhost:10001
- Full Node 1: http://localhost:10002
- Full Node 2: http://localhost:10003

## Files Generated

- `genesis.json`: Blockchain genesis configuration
- `config.toml`: Validator node configuration
- `config-fullnode.toml`: Full node configuration
- Node directories with keys and addresses

## Uso de la librería

Esta librería proporciona funciones modulares para configurar y gestionar una red Hyperledger Besu. A continuación se muestra cómo utilizarla:

### Importación

```typescript
import {
  setupBesuNetwork,
  getBalance,
  sendTransaction,
  addNode,
  removeNode,
} from "./lib/src";
```

### Configurar una red

```typescript
// Usar la configuración por defecto
await setupBesuNetwork();

// O utilizar una configuración personalizada
import { NetworkConfigInterface } from "./lib/src/types";

const miConfig: NetworkConfigInterface = {
  network: {
    networkName: "mi-red-besu",
    basePort: 8545,
  },
  chain: {
    chainId: 1337,
    // otros parámetros...
  },
  nodes: {
    validators: 1,
    fullnodes: 3,
  },
  // ...resto de configuración
};

await setupBesuNetwork(miConfig);
```

### Consultar saldo

```typescript
const direccion = "0x123...";
const saldo = await getBalance(direccion);
console.log(`Saldo: ${saldo} ETH`);
```

### Enviar transacción

```typescript
// Usando valores por defecto
const hashTx = await sendTransaction();

// O con parámetros específicos
const hashTx = await sendTransaction("1.5", "0xDestination...");
```

### Gestionar nodos

```typescript
// Añadir un nuevo nodo
const nuevoNodo = await addNode();
console.log(`Nodo añadido: ${nuevoNodo.nodeId}, URL: ${nuevoNodo.nodeUrl}`);

// Eliminar un nodo (excepto el validador)
await removeNode(3); // Elimina el nodo3
```

### Otras funciones disponibles

- `cleanExistingFiles()`: Limpia archivos y contenedores Docker existentes
- `createDockerNetwork()`: Crea una red Docker para los nodos
- `showNetworkInfo()`: Muestra información sobre la red configurada

## Troubleshooting

- If dependencies are missing, the script will detect this and provide installation instructions
- For Docker permission issues, you may need to run with sudo or add your user to the docker group

---

For more information about Hyperledger Besu, visit the [official documentation](https://besu.hyperledger.org/).
