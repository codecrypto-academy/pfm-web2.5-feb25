import { randomBytes } from 'crypto';
import { keccak256 } from 'js-sha3';
import * as secp256k1 from 'secp256k1';
import * as fs from 'fs';
import * as path from 'path';
import { exec, spawn, execSync } from 'child_process';
import { promisify } from 'util';
import * as http from 'http'
import { TransactionFactory, LegacyTransaction } from '@ethereumjs/tx';
import { Common } from '@ethereumjs/common';
import { Address } from '@ethereumjs/util';
import { ethers } from 'ethers';

const execAsync = promisify(exec);

// Definición de interfaces
interface NodeOptions {
  name?: string;
  port?: number;
  rpcPort?: number;
  host?: string;
  isSigner?: boolean;
}

interface BesuNode {
  name: string;
  privateKey: string;
  publicKey: string;
  address: string;
  enode: string;
  port: number;
  rpcPort: number;
  host: string;
  isSigner: boolean;
  containerId?: string;
  containerName?: string;
  running?: boolean;
}

interface NetworkConfig {
  name: string;
  nodes: {
    name: string;
    address: string;
    enode: string;
    port: number;
    rpcPort: number;
    host: string;
    isSigner: boolean;
  }[];
}

interface GenesisConfig {
  chainId: number;
  constantinopleForkBlock: number;
  clique: {
    blockperiodseconds: number;
    epochlength: number;
    signers?: string[];
  };
  alloc: {
    [address: string]: {
      balance: string;
    };
  };
}

// Actualiza esta interfaz para reflejar la estructura correcta
interface GenesisOptions {
  chainId?: number;
  constantinopleForkBlock?: number;
  clique?: {
    blockperiodseconds?: number;  // Mantenemos este nombre para compatibilidad con el código existente
    epochlength?: number;         // Mantenemos este nombre para compatibilidad con el código existente
  };
  alloc?: {
    [address: string]: {
      balance: string;
    };
  };
}

interface BesuConfig {
  data_path: string;
  network_id: number;
  rpc_http_enabled: boolean;
  rpc_http_host: string;
  rpc_http_port: number;
  p2p_port: number;
  bootnodes: string[];
  miner_enabled: boolean;
  miner_coinbase: string;
}

interface DockerConfig {
  image: string;
  networkName: string;
  dataDir: string;
  enableLogging: boolean;
  dockerComposeFile: string;
}

interface NodeStatus {
  running: boolean;
  blockHeight?: number;
  peers?: string[];
  enode?: string;
}

interface NetworkStatus {
  running: boolean;
  nodes: {
    [nodeName: string]: NodeStatus;
  };
  metrics?: {
    totalBlocks?: number;
    averagePeers?: number;
  };
}

// Interfaces para transacciones
interface Transaction {
  from: string;
  to: string;
  value: string; // En wei, como string hexadecimal
  gas?: string;  // Límite de gas, como string hexadecimal
  gasPrice?: string; // Precio del gas, como string hexadecimal
  nonce?: string; // Nonce, como string hexadecimal
  data?: string; // Datos adicionales, como string hexadecimal
}

// Respuesta de una transacción
interface TransactionResponse {
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  error?: string;
}

class BesuNetwork {
  private name: string;
  private nodes: BesuNode[];
  private dockerConfig: DockerConfig;

  constructor(name: string = 'clique-network', dockerConfig?: Partial<DockerConfig>) {
    this.name = name;
    this.nodes = [];
    this.dockerConfig = {
      image: 'hyperledger/besu:latest',
      networkName: `besu-${name}`,
      dataDir: './besu-data',
      enableLogging: true,
      dockerComposeFile: './docker-compose.yml',
      ...dockerConfig
    };
  }

  public getName(): string {
    return this.name;
  }

  public getNodes(): BesuNode[] {
    return this.nodes;
  }

  /**
   * Crea un nuevo nodo para la red Besu con Clique
   * @param options Opciones del nodo
   * @returns El nodo creado
   */
  createNode(options: NodeOptions = {}): BesuNode {
    const defaultOptions: NodeOptions = {
      name: `node-${this.nodes.length + 1}`,
      port: 30303 + this.nodes.length,
      rpcPort: 8545 + this.nodes.length,
      host: '127.0.0.1',
      isSigner: true // Por defecto, todos los nodos son signers en Clique
    };

    const nodeOptions = { ...defaultOptions, ...options };
    
    // Generar par de claves
    const privateKeyBuffer: Buffer = randomBytes(32);
    const privateKeyHex: string = '0x' + privateKeyBuffer.toString('hex');
    
    // Derivar clave pública
    const publicKeyBuffer: Uint8Array = secp256k1.publicKeyCreate(privateKeyBuffer, false).slice(1); // Remove prefix
    
    // Versión para obtener la clave pública
    const publicKeyHex: string = '0x' + Array.from(publicKeyBuffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Calcular address
    const hashArrayBuffer: ArrayBuffer = keccak256.arrayBuffer(publicKeyBuffer);
    const addressUint8Array: Uint8Array = new Uint8Array(hashArrayBuffer).slice(-20);
    const address: string = '0x' + Array.from(addressUint8Array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Crear enode
    const nodeId: string = publicKeyHex.slice(2); // Remove 0x prefix
    // En lugar de usar el nombre del nodo, usa la dirección IP
    const enode: string = `enode://${nodeId}@${nodeOptions.host}:${nodeOptions.port}`;
    
    const node: BesuNode = {
      name: nodeOptions.name!,
      privateKey: privateKeyHex,
      publicKey: publicKeyHex,
      address,
      enode,
      port: nodeOptions.port!,
      rpcPort: nodeOptions.rpcPort!,
      host: nodeOptions.host!,
      isSigner: nodeOptions.isSigner!,
      containerName: `${this.name}-${nodeOptions.name!}`,
      running: false
    };
    
    this.nodes.push(node);
    return node;
  }

  /**
   * Guarda la configuración de la red en archivos
   * @param outputDir Directorio de salida
   */
  saveNetworkConfig(outputDir: string): void {
    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Guardar la configuración de la red
    const networkConfig: NetworkConfig = {
      name: this.name,
      nodes: this.nodes.map(node => ({
        name: node.name,
        address: node.address,
        enode: node.enode,
        port: node.port,
        rpcPort: node.rpcPort,
        host: node.host,
        isSigner: node.isSigner
      }))
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'network-config.json'),
      JSON.stringify(networkConfig, null, 2)
    );
    
    // Guardar las claves privadas en archivos separados
    this.nodes.forEach(node => {
      const nodeDir: string = path.join(outputDir, node.name);
      if (!fs.existsSync(nodeDir)) {
        fs.mkdirSync(nodeDir, { recursive: true });
      }
      
      // Guardar clave privada
      fs.writeFileSync(
        path.join(nodeDir, 'key'),
        node.privateKey.slice(2) // Eliminar prefijo 0x
      );

      // Asegurar que los permisos son correctos (si estás en un sistema tipo Unix)
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync(path.join(nodeDir, 'key'), 0o600); // Solo lectura/escritura para el propietario
        } catch (error) {
          console.warn(`No se pudieron cambiar los permisos del archivo de clave: ${error}`);
        }
      }
      
      // Guardar dirección
      fs.writeFileSync(
        path.join(nodeDir, 'address'),
        node.address
      );
    });
  }

 /**
 * Genera la configuración genesis para la red Besu con Clique
 * @param options Opciones de configuración genesis
 * @returns Configuración genesis
 */
generateGenesisConfig(options: GenesisOptions = {}): any {
  // Obtener los signers para incluirlos en extraData
  const signerAddresses = this.nodes
    .filter(node => node.isSigner)
    .map(node => node.address.slice(2)); // Eliminar el prefijo 0x
  
  // Construir extraData para Clique (formato especial requerido por Besu)
  let extraData = '0x';
  extraData += '0'.repeat(64); // 32 bytes de ceros
  extraData += signerAddresses.join(''); // Las direcciones sin 0x
  extraData += '0'.repeat(130); // 65 bytes de ceros

  const defaultOptions = options.clique || {};
  
  // Estructura correcta para Besu con todos los campos requeridos
  const genesisConfig: {
    config: {
      chainId: number;
      londonBlock: number;   // Agregar soporte para London
      constantinopleForkBlock: number;
      clique: {
        blockPeriodSeconds: number;
        epochLength: number;
      };
    };
    difficulty: string;
    mixHash: string;
    gasLimit: string;
    timestamp: string;
    nonce: string;
    coinbase: string;
    extraData: string;
    alloc: {
      [address: string]: {
        balance: string;
      };
    };
  } = {
    config: {
      chainId: 13371337,  // ¡Cambiar el chainId a 13371337!
      londonBlock: 0,     // Agregar soporte para London desde el bloque 0
      constantinopleForkBlock: options.constantinopleForkBlock || 0,
      clique: {
        blockPeriodSeconds: defaultOptions.blockperiodseconds || 5,
        epochLength: defaultOptions.epochlength || 30000
      }
    },
    difficulty: "0x1",
    mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    gasLimit: "0x1fffffffffffff",  // Usar el mismo gasLimit que en tu script
    timestamp: "0x00",
    nonce: "0x0000000000000000",
    coinbase: "0x0000000000000000000000000000000000000000",
    extraData: extraData,
    alloc: {}
  };
  
  // Añadir las cuentas al alloc
  this.nodes.forEach(node => {
    genesisConfig.alloc[node.address] = {
      balance: '0x1000000000000000000000000000'
    };
  });

  // Añadir allocaciones adicionales si se proporcionan
  if (options.alloc) {
    Object.entries(options.alloc).forEach(([address, info]) => {
      genesisConfig.alloc[address] = info;
    });
  }
  
  return genesisConfig;
}

  /**
   * Genera los archivos de configuración de Besu para cada nodo
   * @param outputDir Directorio de salida
   */
  generateBesuConfig(outputDir: string): void {
    this.nodes.forEach((node, index) => {
      const nodeDir: string = path.join(outputDir, node.name);
      if (!fs.existsSync(nodeDir)) {
        fs.mkdirSync(nodeDir, { recursive: true });
      }
      
      // Configuración de Besu para Clique
      const besuConfig: BesuConfig = {
        data_path: `./data`,
        network_id: 888999, // Usando el mismo chainId
        rpc_http_enabled: true,
        rpc_http_host: "0.0.0.0", // Permitir conexiones externas en Docker
        rpc_http_port: node.rpcPort,
        p2p_port: node.port,
        // El primer nodo (index 0) no debe tener bootnode configurado
        // Los bootnodes se configurarán durante el inicio con las IPs reales
        bootnodes: [],
        miner_enabled: node.isSigner, // Habilitar minería solo para los nodos signers
        miner_coinbase: node.address // Utilizar la dirección del nodo como coinbase
      };
      
      fs.writeFileSync(
        path.join(nodeDir, 'config.toml'),
        Object.entries(besuConfig)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key} = [${value.map(v => `"${v}"`).join(', ')}]`;
            }
            return `${key} = ${typeof value === 'string' ? `"${value}"` : value}`;
          })
          .join('\n')
      );
    });
  }

  /**
   * Genera el archivo genesis.json para la red
   * @param outputDir Directorio de salida
   * @param options Opciones de configuración genesis
   */
  generateGenesisFile(outputDir: string, options: GenesisOptions = {}): void {
    const genesisConfig = this.generateGenesisConfig(options);
    
    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'genesis.json'),
      JSON.stringify(genesisConfig, null, 2)
    );
  }

  /**
   * Genera el archivo docker-compose.yml para la red
   * @param outputDir Directorio de salida
   */
  generateDockerCompose(outputDir: string): void {
    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Crear un objeto JavaScript que representará el archivo docker-compose.yml
    const dockerComposeObj: any = {
      version: '3.8',
      services: {},
      networks: {
        default: {
          name: this.dockerConfig.networkName
        }
      }
    };
    
    // Agregar cada nodo como un servicio
    this.nodes.forEach((node, index) => {
      // Rutas absolutas para montajes de volúmenes
      const nodeDataDir = path.resolve(path.join(outputDir, node.name));
      const genesisFile = path.resolve(path.join(outputDir, 'genesis.json'));
      
      // Comando base para todos los nodos
      let command = [
        "--data-path=/opt/besu/data",
        "--genesis-file=/opt/besu/genesis.json",
        "--rpc-http-enabled=true",
        "--rpc-http-host=0.0.0.0",
        `--rpc-http-port=${node.rpcPort}`,
        `--p2p-port=${node.port}`,
        `--miner-enabled=${node.isSigner}`,
        `--miner-coinbase=${node.address}`,
        "--node-private-key-file=/opt/besu/data/key",
        "--rpc-http-api=ETH,NET,CLIQUE,ADMIN,TRACE,DEBUG,TXPOOL,PERM,WEB3",
        "--p2p-enabled=true",
        "--discovery-enabled=true"
      ];
      
      // Para los nodos que no sean el primero, agregaremos un placeholder para el bootnode
      if (index > 0) {
        const bootnode = this.nodes[0];
        const nodeId = bootnode.enode.split('@')[0].split('://')[1];
        // Usamos 127.0.0.1 como placeholder que será reemplazado después
        command.push(`--bootnodes=enode://${nodeId}@127.0.0.1:${bootnode.port}`);
      }
      
      // Crear configuración del servicio para este nodo
      dockerComposeObj.services[node.name] = {
        container_name: node.containerName,
        image: this.dockerConfig.image,
        restart: 'unless-stopped',
        volumes: [
          `${nodeDataDir}:/opt/besu/data`,
          `${genesisFile}:/opt/besu/genesis.json`
        ],
        ports: [
          `${node.port}:${node.port}/tcp`,
          `${node.port}:${node.port}/udp`,
          `${node.rpcPort}:${node.rpcPort}`
        ],
        command: command.join(' ')
      };
      
      // Agregar opciones de logging
      if (this.dockerConfig.enableLogging) {
        dockerComposeObj.services[node.name].logging = {
          driver: 'json-file',
          options: {
            'max-size': '10m',
            'max-file': '3'
          }
        };
      }
    });
    
    // Convertir el objeto a YAML manualmente con formato controlado
    let yamlString = `version: '3.8'\n\nservices:\n`;
    
    // Agregar cada servicio
    Object.entries(dockerComposeObj.services).forEach(([name, service]: [string, any]) => {
      yamlString += `  ${name}:\n`;
      yamlString += `    container_name: ${service.container_name}\n`;
      yamlString += `    image: ${service.image}\n`;
      yamlString += `    restart: ${service.restart}\n`;
      
      // Agregar volumes
      yamlString += `    volumes:\n`;
      service.volumes.forEach((volume: string) => {
        yamlString += `      - ${volume}\n`;
      });
      
      // Agregar ports
      yamlString += `    ports:\n`;
      service.ports.forEach((port: string) => {
        yamlString += `      - "${port}"\n`;
      });
      
      // Agregar command
      yamlString += `    command: >\n`;
      yamlString += `      ${service.command}\n`;
      
      // Agregar logging si existe
      if (service.logging) {
        yamlString += `    logging:\n`;
        yamlString += `      driver: "${service.logging.driver}"\n`;
        yamlString += `      options:\n`;
        yamlString += `        max-size: "${service.logging.options['max-size']}"\n`;
        yamlString += `        max-file: "${service.logging.options['max-file']}"\n`;
      }
      
      // Agregar línea en blanco entre servicios
      yamlString += `\n`;
    });
    
    // Agregar networks
    yamlString += `networks:\n`;
    yamlString += `  default:\n`;
    yamlString += `    name: ${dockerComposeObj.networks.default.name}\n`;
    
    // Guardar el archivo docker-compose
    fs.writeFileSync(
      path.join(outputDir, 'docker-compose.yml'),
      yamlString
    );
    
    // Mostrar mensaje de confirmación
    console.log(`Docker Compose generado en: ${path.join(outputDir, 'docker-compose.yml')}`);
  }
  
  /**
 * Inicia la red Besu usando Docker Compose
 * @param dataDir Directorio con la configuración
 * @returns Promesa que se resuelve cuando la red ha iniciado
 */
  async startNetwork(dataDir: string = this.dockerConfig.dataDir): Promise<void> {
    try {
      // Verificar que el archivo docker-compose.yml existe
      const composeFile = path.join(dataDir, 'docker-compose.yml');
      if (!fs.existsSync(composeFile)) {
        this.generateDockerCompose(dataDir);
      }
      
      // Paso 1: Iniciar solo el primer nodo (que no necesita bootnode)
      console.log(`Iniciando el primer nodo de la red Besu en ${dataDir}...`);
      const firstNode = this.nodes[0];
      await execAsync(`docker-compose -f ${composeFile} up -d ${firstNode.name}`);
      
      // Esperar un momento para que el nodo se inicie completamente
      console.log('Esperando a que el primer nodo se inicie...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Paso 2: Obtener la IP real del primer nodo
      let firstNodeIp = '';
      try {
        const { stdout } = await execAsync(`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${firstNode.containerName}`);
        firstNodeIp = stdout.trim();
        console.log(`IP del primer nodo (${firstNode.name}): ${firstNodeIp}`);
        
        if (!firstNodeIp) {
          throw new Error(`No se pudo obtener la IP del primer nodo: ${firstNode.containerName}`);
        }
      } catch (error) {
        console.error('Error al obtener la IP del primer nodo:', error);
        throw error;
      }
      
      // Paso 3: Actualizar el archivo docker-compose.yml con la IP real para los bootnodes
      if (this.nodes.length > 1) {
        console.log('Actualizando la configuración de bootnodes con la IP real...');
        
        let dockerComposeContent = fs.readFileSync(composeFile, 'utf8');
        
        // Para cada nodo (excepto el primero), actualizar el bootnode
        for (let i = 1; i < this.nodes.length; i++) {
          const node = this.nodes[i];
          // Crear el nuevo valor de bootnode con la IP real
          const nodeId = firstNode.enode.split('@')[0].split('://')[1];
          const newBootnodeValue = `--bootnodes=enode://${nodeId}@${firstNodeIp}:${firstNode.port}`;
          
          // Usar una expresión regular para encontrar y reemplazar la línea del bootnode
          const bootNodeRegex = new RegExp(`--bootnodes=enode://[^@]+@[^\\s]+`, 'g');
          dockerComposeContent = dockerComposeContent.replace(bootNodeRegex, newBootnodeValue);
        }
        
        // Guardar el archivo actualizado
        fs.writeFileSync(composeFile, dockerComposeContent);
        console.log('Docker Compose actualizado con la IP real del bootnode');
      }
      
      // Paso 4: Iniciar el resto de los nodos
      if (this.nodes.length > 1) {
        console.log('Iniciando el resto de los nodos...');
        const otherNodes = this.nodes.slice(1).map(n => n.name).join(' ');
        await execAsync(`docker-compose -f ${composeFile} up -d ${otherNodes}`);
      }
      
      // Paso 5: Actualizar estado de los nodos
      for (const node of this.nodes) {
        try {
          const { stdout } = await execAsync(`docker ps -q -f name=${node.containerName}`);
          if (stdout.trim()) {
            node.containerId = stdout.trim();
            node.running = true;
            
            // Obtener la IP real y actualizar el enode
            const { stdout: ipStdout } = await execAsync(`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${node.containerName}`);
            const nodeIp = ipStdout.trim();
            
            if (nodeIp) {
              // Actualizar el enode con la IP real
              const nodeId = node.enode.split('@')[0].split('://')[1];
              node.enode = `enode://${nodeId}@${nodeIp}:${node.port}`;
            }
            
            console.log(`Nodo ${node.name} iniciado con ID: ${node.containerId}, IP: ${nodeIp}`);
          }
        } catch (error) {
          console.error(`Error al comprobar el estado del nodo ${node.name}:`, error);
        }
      }
      
      console.log('Red Besu iniciada correctamente.');
    } catch (error) {
      console.error('Error al iniciar la red Besu:', error);
      throw error;
    }
  }

  /**
   * Detiene la red Besu
   * @param dataDir Directorio con la configuración
   * @returns Promesa que se resuelve cuando la red ha detenido
   */
  async stopNetwork(dataDir: string = this.dockerConfig.dataDir): Promise<void> {
    try {
      const composeFile = path.join(dataDir, 'docker-compose.yml');
      if (!fs.existsSync(composeFile)) {
        throw new Error(`El archivo docker-compose no existe en ${composeFile}`);
      }
      
      console.log(`Deteniendo red Besu en ${dataDir}...`);
      await execAsync(`docker-compose -f ${composeFile} down`);
      
      // Actualizar estado de los nodos
      for (const node of this.nodes) {
        node.running = false;
        node.containerId = undefined;
      }
      
      console.log('Red Besu detenida correctamente.');
    } catch (error) {
      console.error('Error al detener la red Besu:', error);
      throw error;
    }
  }

  /**
   * Elimina la red Besu y todos los datos asociados
   * @param dataDir Directorio con la configuración
   * @returns Promesa que se resuelve cuando la red ha sido eliminada
   */
  async destroyNetwork(dataDir: string = this.dockerConfig.dataDir): Promise<void> {
    try {
      // Detener la red primero
      await this.stopNetwork(dataDir);
      
      // Eliminar los volúmenes y redes
      console.log(`Eliminando volúmenes y redes de ${dataDir}...`);
      await execAsync(`docker-compose -f ${path.join(dataDir, 'docker-compose.yml')} down -v`);
      
      // Eliminar el directorio de datos
      if (fs.existsSync(dataDir)) {
        console.log(`Eliminando directorio de datos: ${dataDir}`);
        fs.rmSync(dataDir, { recursive: true, force: true });
      }
      
      console.log('Red Besu eliminada correctamente.');
    } catch (error) {
      console.error('Error al eliminar la red Besu:', error);
      throw error;
    }
  }

  /**
   * Reinicia la red Besu
   * @param dataDir Directorio con la configuración
   * @returns Promesa que se resuelve cuando la red ha sido reiniciada
   */
  async restartNetwork(dataDir: string = this.dockerConfig.dataDir): Promise<void> {
    try {
      await this.stopNetwork(dataDir);
      await this.startNetwork(dataDir);
      console.log('Red Besu reiniciada correctamente.');
    } catch (error) {
      console.error('Error al reiniciar la red Besu:', error);
      throw error;
    }
  }

  /**
 * Obtiene el estado actual de la red y sus nodos
 * @param dataDir Directorio con la configuración
 * @returns Promesa que se resuelve con el estado de la red
 */
async getNetworkStatus(dataDir: string = this.dockerConfig.dataDir): Promise<NetworkStatus> {
  const status: NetworkStatus = {
    running: false,
    nodes: {}
  };
  
  try {
    const composeFile = path.join(dataDir, 'docker-compose.yml');
    if (!fs.existsSync(composeFile)) {
      return status;
    }
    
    // Comprobar si la red está en ejecución
    const { stdout } = await execAsync(`docker-compose -f ${composeFile} ps -q`);
    const runningContainers = stdout.trim().split('\n').filter(Boolean);
    status.running = runningContainers.length > 0;
    
    // Obtener información detallada de cada nodo
    for (const node of this.nodes) {
      const nodeStatus: NodeStatus = {
        running: false
      };
      
      try {
        // Comprobar si el contenedor está en ejecución
        const { stdout: containerStatus } = await execAsync(`docker ps -q -f name=${node.containerName}`);
        nodeStatus.running = !!containerStatus.trim();
        
        if (nodeStatus.running) {
          // Obtener altura de bloque
          try {
            const blockHeight = await this.jsonRpcRequest(node.name, 'eth_blockNumber', []);
            if (blockHeight) {
              nodeStatus.blockHeight = parseInt(blockHeight, 16);
            }
          } catch (error) {
            console.warn(`No se pudo obtener la altura de bloque para ${node.name}`);
          }
          
          // Obtener peers
          try {
            const peers = await this.jsonRpcRequest(node.name, 'admin_peers', []);
            if (peers && Array.isArray(peers)) {
              nodeStatus.peers = peers.map((peer: any) => peer.id);
            }
          } catch (error) {
            console.warn(`No se pudo obtener los peers para ${node.name}`);
          }
          
          // Obtener enode
          try {
            const nodeInfo = await this.jsonRpcRequest(node.name, 'admin_nodeInfo', []);
            if (nodeInfo && nodeInfo.enode) {
              nodeStatus.enode = nodeInfo.enode;
            }
          } catch (error) {
            console.warn(`No se pudo obtener el enode para ${node.name}`);
          }
        }
      } catch (error) {
        console.warn(`Error al obtener el estado del nodo ${node.name}:`, error);
      }
      
      status.nodes[node.name] = nodeStatus;
    }
    
    // Calcular métricas
    if (Object.keys(status.nodes).length > 0) {
      const runningNodes = Object.values(status.nodes).filter(node => node.running);
      if (runningNodes.length > 0) {
        const blockHeights = runningNodes
          .map(node => node.blockHeight)
          .filter((height): height is number => height !== undefined);
        
        if (blockHeights.length > 0) {
          status.metrics = {
            totalBlocks: Math.max(...blockHeights),
            averagePeers: runningNodes.reduce((sum, node) => sum + (node.peers?.length || 0), 0) / runningNodes.length
          };
        }
      }
    }
    
    return status;
  } catch (error) {
    console.error('Error al obtener el estado de la red:', error);
    return status;
  }
}

  /**
   * Crea y despliega una red Besu completa
   * @param numNodes Número de nodos a crear
   * @param numSigners Número de signers (debe ser menor o igual a numNodes)
   * @param outputDir Directorio de salida
   * @param options Opciones adicionales
   * @returns Promesa que se resuelve cuando la red ha sido creada y desplegada
   */
  async deployNetwork(numNodes: number, numSigners: number, outputDir: string, options: GenesisOptions = {}): Promise<void> {
    try {
      // Validar parámetros
      if (numSigners > numNodes) {
        throw new Error('El número de signers no puede ser mayor que el número de nodos');
      }
      
      // Crear nodos
      for (let i = 0; i < numNodes; i++) {
        const isSigner = i < numSigners;
        this.createNode({
          name: `node-${i + 1}`,
          isSigner,
          port: 30303 + i,
          rpcPort: 8545 + i
        });
      }
      
      // Generar archivos de configuración
      this.saveNetworkConfig(outputDir);
      this.generateGenesisFile(outputDir, options);
      this.generateBesuConfig(outputDir);
      this.generateDockerCompose(outputDir);
      
      // Iniciar la red
      await this.startNetwork(outputDir);
      
      console.log(`Red Besu con ${numNodes} nodos (${numSigners} signers) desplegada correctamente en ${outputDir}`);
    } catch (error) {
      console.error('Error al desplegar la red Besu:', error);
      throw error;
    }
  }

  /**
   * Crea un archivo de configuración completo para la red Besu
   * @param outputDir Directorio de salida
   */
  generateFullNetworkConfig(outputDir: string): void {
    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generar todos los archivos de configuración
    this.saveNetworkConfig(outputDir);
    this.generateGenesisFile(outputDir);
    this.generateBesuConfig(outputDir);
    this.generateDockerCompose(outputDir);
    
    console.log(`Configuración completa de la red generada en ${outputDir}`);
  }

  /**
   * Agrega un nodo existente a la red
   * @param nodeConfig Configuración del nodo
   * @returns El nodo agregado
   */
  addExistingNode(nodeConfig: Partial<BesuNode>): BesuNode {
    if (!nodeConfig.name || !nodeConfig.privateKey || !nodeConfig.address) {
      throw new Error('La configuración del nodo debe incluir al menos name, privateKey y address');
    }
    
    // Generar el enode a partir de la clave privada si no está especificado
    let enode = nodeConfig.enode;
    if (!enode && nodeConfig.privateKey) {
      // Derivar la clave pública a partir de la privada
      const privateKeyBuffer = Buffer.from(nodeConfig.privateKey.slice(2), 'hex');
      const publicKeyBuffer = secp256k1.publicKeyCreate(privateKeyBuffer, false).slice(1);
      const publicKeyHex = '0x' + Array.from(publicKeyBuffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const nodeId = publicKeyHex.slice(2);
      enode = `enode://${nodeId}@${nodeConfig.host || '127.0.0.1'}:${nodeConfig.port || 30303}`;
    }
    
    const node: BesuNode = {
      name: nodeConfig.name,
      privateKey: nodeConfig.privateKey!,
      publicKey: nodeConfig.publicKey || '',
      address: nodeConfig.address!,
      enode: enode!,
      port: nodeConfig.port || 30303 + this.nodes.length,
      rpcPort: nodeConfig.rpcPort || 8545 + this.nodes.length,
      host: nodeConfig.host || '127.0.0.1',
      isSigner: nodeConfig.isSigner !== undefined ? nodeConfig.isSigner : true,
      containerName: nodeConfig.containerName || `${this.name}-${nodeConfig.name}`
    };
    
    this.nodes.push(node);
    return node;
  }

  /**
   * Carga una configuración de red desde un archivo
   * @param configFile Ruta al archivo de configuración
   * @returns La instancia de BesuNetwork con la configuración cargada
   */
  static loadFromConfig(configFile: string): BesuNetwork {
    if (!fs.existsSync(configFile)) {
      throw new Error(`El archivo de configuración no existe: ${configFile}`);
    }
    
    const config = JSON.parse(fs.readFileSync(configFile, 'utf-8')) as NetworkConfig;
    const network = new BesuNetwork(config.name);
    
    for (const nodeConfig of config.nodes) {
      // Intentar cargar la clave privada
      const nodeDir = path.join(path.dirname(configFile), nodeConfig.name);
      let privateKey = '';
      
      if (fs.existsSync(path.join(nodeDir, 'key'))) {
        privateKey = '0x' + fs.readFileSync(path.join(nodeDir, 'key'), 'utf-8').trim();
      } else {
        console.warn(`No se encontró la clave privada para el nodo ${nodeConfig.name}, generando una nueva.`);
        privateKey = '0x' + randomBytes(32).toString('hex');
      }
      
      network.addExistingNode({
        ...nodeConfig,
        privateKey
      });
    }
    
    return network;
  }

/**
 * Envía una transacción firmada a la red Besu
 * @param nodeName Nombre del nodo desde el que se envía la transacción
 * @param transaction Datos de la transacción
 * @param waitForConfirmation Si es true, espera a que la transacción sea minada
 * @returns Promesa que se resuelve con la respuesta de la transacción
 */
/**
 * Envía una transacción firmada a la red Besu
 * @param nodeName Nombre del nodo desde el que se envía la transacción
 * @param transaction Datos de la transacción
 * @param waitForConfirmation Si es true, espera a que la transacción sea minada
 * @returns Promesa que se resuelve con la respuesta de la transacción
 */
/**
 * Envía una transacción firmada a la red Besu
 * @param nodeName Nombre del nodo desde el que se envía la transacción
 * @param transaction Datos de la transacción
 * @param waitForConfirmation Si es true, espera a que la transacción sea minada
 * @returns Promesa que se resuelve con la respuesta de la transacción
 */
async sendTransaction(
  nodeName: string, 
  transaction: Transaction, 
  waitForConfirmation: boolean = true
): Promise<TransactionResponse> {
  try {
    // Buscar el nodo por nombre
    const node = this.nodes.find(n => n.name === nodeName);
    if (!node) {
      throw new Error(`Nodo no encontrado: ${nodeName}`);
    }
    
    if (!node.running) {
      throw new Error(`El nodo ${nodeName} no está en ejecución`);
    }
    
    console.log(`\n📤 Preparando transacción desde ${transaction.from} a ${transaction.to}`);
    
    // Asegurarse de que from sea la dirección del nodo
    if (transaction.from.toLowerCase() !== node.address.toLowerCase()) {
      throw new Error(`La dirección 'from' debe coincidir con la dirección del nodo ${nodeName}`);
    }
    
    // Usar el mismo enfoque que en index.mjs
    const privateKey = node.privateKey.startsWith('0x') 
      ? node.privateKey 
      : `0x${node.privateKey}`;
    
    const wallet = new ethers.Wallet(privateKey);
    const provider = new ethers.JsonRpcProvider(`http://localhost:${node.rpcPort}`, {
      chainId: 13371337,  // Usar exactamente el mismo chainId que en index.mjs
      name: "private"
    });
    
    const connectedWallet = wallet.connect(provider);
    
    console.log(`🔐 Usando wallet ${connectedWallet.address}...`);
    
    // Preparar una transacción simple como en index.mjs
    const txRequest = {
      to: transaction.to,
      value: transaction.value ? BigInt(transaction.value) : BigInt(0)
      // No especificar gas, gasPrice, nonce o chainId - dejar que ethers lo maneje
    };
    
    console.log(`📡 Enviando transacción a la red...`);
    const tx = await connectedWallet.sendTransaction(txRequest);
    
    console.log(`📝 Transacción enviada con hash: ${tx.hash}`);
    
    // La transacción fue enviada correctamente
    if (waitForConfirmation) {
      console.log(`⏱️ Esperando a que la transacción sea confirmada...`);
      const receipt = await tx.wait();
      
      console.log(`✅ Transacción confirmada en el bloque ${receipt?.blockNumber}`);
      
      return {
        transactionHash: tx.hash,
        status: "confirmed",
        blockNumber: receipt?.blockNumber
      };
    } else {
      return {
        transactionHash: tx.hash,
        status: "pending"
      };
    }
    
  } catch (error: any) {
    console.error(`❌ Error al enviar la transacción: ${error?.message || 'Error desconocido'}`);
    return {
      transactionHash: "",
      status: "failed",
      error: error?.message || "Error desconocido"
    };
  }
}

/**
 * Consulta el saldo de una dirección en la red Besu
 * @param nodeName Nombre del nodo desde el que se consulta
 * @param address Dirección Ethereum a consultar
 * @returns Promesa que se resuelve con el saldo en wei (como string hexadecimal)
 */
// Método para obtener el saldo usando jsonRpcRequest
async getBalance(nodeName: string, address: string): Promise<string> {
  try {
    // Verificar que la dirección tenga el formato correcto
    if (!address.startsWith('0x') || address.length !== 42) {
      throw new Error(`Dirección inválida: ${address}`);
    }
    
    const result = await this.jsonRpcRequest(nodeName, 'eth_getBalance', [address, 'latest']);
    return result || '0x0';
  } catch (error) {
    console.error('Error al consultar saldo:', error);
    throw error;
  }
}

/**
 * Realiza una solicitud JSON-RPC a un nodo
 * @param nodeName Nombre del nodo
 * @param method Método RPC
 * @param params Parámetros del método
 * @returns Promesa que se resuelve con el resultado de la solicitud
 */
private async jsonRpcRequest(nodeName: string, method: string, params: any[]): Promise<any> {
  try {
    const node = this.nodes.find(n => n.name === nodeName);
    if (!node) {
      throw new Error(`Nodo no encontrado: ${nodeName}`);
    }
    
    if (!node.running || !node.containerName) {
      throw new Error(`El nodo ${nodeName} no está en ejecución`);
    }
    
    // En lugar de conectarnos directamente al nodo dentro del contenedor,
    // usamos el mapeo de puerto expuesto en el host
    return new Promise<any>((resolve, reject) => {
      const postData = JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: 1
      });
      
      const options = {
        hostname: 'localhost',  // Conectar al host local
        port: node.rpcPort,     // Puerto mapeado
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = http.request(options, (res: http.IncomingMessage) => {
        let data = '';
        
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.error) {
              reject(new Error(`Error RPC: ${JSON.stringify(response.error)}`));
            } else {
              resolve(response.result);
            }
          } catch (err) {
            const parseError = err as Error;
            reject(new Error(`Error al parsear respuesta: ${data}. Error: ${parseError.message}`));
          }
        });
      });
      
      req.on('error', (err: Error) => {
        reject(new Error(`Error en la solicitud HTTP: ${err.message}`));
      });
      
      req.write(postData);
      req.end();
    });
  } catch (err) {
    const error = err as Error;
    console.error(`Error en jsonRpcRequest (${method}):`, error);
    throw error;
  }
}

/**
 * Convierte un valor hexadecimal a ether (valor legible)
 * @param weiHex Valor en wei como string hexadecimal
 * @returns El valor en ether como string
 */
static weiToEther(weiHex: string): string {
  // Convertir de hex a decimal
  const wei = BigInt(weiHex);
  
  // 1 Ether = 10^18 Wei
  const ether = Number(wei) / 1e18;
  
  return ether.toString();
}

/**
 * Espera a que una transacción sea minada y confirmada
 * @param nodeName Nombre del nodo desde el que se consulta
 * @param txHash Hash de la transacción
 * @param maxAttempts Número máximo de intentos (por defecto 20)
 * @param interval Intervalo entre intentos en ms (por defecto 1000)
 * @returns Promesa que se resuelve con la respuesta de la transacción
 */
async waitForTransaction(
  nodeName: string,
  txHash: string,
  maxAttempts: number = 20,
  interval: number = 1000
): Promise<TransactionResponse> {
  console.log(`\n⏱️ Esperando a que la transacción ${txHash} sea minada...`);
  
  // Buscar el nodo por nombre
  const node = this.nodes.find(n => n.name === nodeName);
  if (!node) {
    throw new Error(`Nodo no encontrado: ${nodeName}`);
  }
  
  if (!node.running) {
    throw new Error(`El nodo ${nodeName} no está en ejecución`);
  }
  
  let attempts = 0;
  let lastBlockNumber = await this.jsonRpcRequest(nodeName, 'eth_blockNumber', []);
  lastBlockNumber = parseInt(lastBlockNumber, 16);
  console.log(`🔍 Bloque actual: ${lastBlockNumber}`);
  
  while (attempts < maxAttempts) {
    try {
      // Comprobar si ha habido nuevos bloques
      const currentBlock = await this.jsonRpcRequest(nodeName, 'eth_blockNumber', []);
      const currentBlockNumber = parseInt(currentBlock, 16);
      
      if (currentBlockNumber > lastBlockNumber) {
        console.log(`🆕 Nuevo bloque minado: ${currentBlockNumber}`);
        lastBlockNumber = currentBlockNumber;
      }
      
      const receipt = await this.jsonRpcRequest(
        nodeName,
        'eth_getTransactionReceipt',
        [txHash]
      );
      
      // Si la transacción ha sido procesada
      if (receipt) {
        const blockNumber = parseInt(receipt.blockNumber, 16);
        const success = receipt.status === "0x1";
        
        console.log(`\n✅ Transacción confirmada en el bloque ${blockNumber}`);
        console.log(`Estado: ${success ? 'Exitosa ✅' : 'Fallida ❌'}`);
        console.log(`Gas usado: ${parseInt(receipt.gasUsed, 16)}`);
        
        return {
          transactionHash: txHash,
          status: success ? "confirmed" : "failed",
          blockNumber: blockNumber
        };
      }
      
      if (attempts % 5 === 0) {
        // Cada 5 intentos, mostrar información de la mempool
        try {
          const pendingTxs = await this.jsonRpcRequest(nodeName, 'txpool_content', []);
          if (pendingTxs && (
              (pendingTxs.pending && Object.keys(pendingTxs.pending).length > 0) || 
              (pendingTxs.queued && Object.keys(pendingTxs.queued).length > 0)
            )) {
            const pendingCount = Object.values(pendingTxs.pending || {}).reduce((acc: number, addr: any) => 
              acc + Object.keys(addr).length, 0);
            const queuedCount = Object.values(pendingTxs.queued || {}).reduce((acc: number, addr: any) => 
              acc + Object.keys(addr).length, 0);
            
            console.log(`ℹ️ Transacciones pendientes: ${pendingCount}, En cola: ${queuedCount}`);
          }
        } catch (error) {
          // Es posible que txpool_content no esté disponible, no mostramos error
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error al consultar transacción (intento ${attempts + 1}):`, error);
    }
    
    // Mostrar progreso
    process.stdout.write('.');
    if (attempts % 10 === 9) {
      process.stdout.write('\n');
    }
    
    // Esperar antes del siguiente intento
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }
  
  console.log(`\n⚠️ Tiempo de espera agotado después de ${maxAttempts} intentos`);
  
  // Si llegamos aquí, la transacción no fue confirmada dentro del plazo
  return {
    transactionHash: txHash,
    status: "pending",
    error: "Transacción pendiente después del tiempo de espera"
  };
}

/**
 * Muestra información detallada sobre una transacción
 * @param nodeName Nombre del nodo
 * @param txHash Hash de la transacción
 */
async logTransactionDetails(nodeName: string, txHash: string): Promise<void> {
  try {
    console.log(`\n----- Detalles de la transacción ${txHash} -----`);
    
    // Obtener la transacción
    const tx = await this.jsonRpcRequest(nodeName, 'eth_getTransactionByHash', [txHash]);
    if (!tx) {
      console.log(`Transacción ${txHash} no encontrada en la mempool.`);
      return;
    }
    
    console.log(`De: ${tx.from}`);
    console.log(`A: ${tx.to}`);
    console.log(`Valor: ${BesuNetwork.weiToEther('0x' + BigInt(tx.value).toString(16))} ETH`);
    console.log(`Gas Price: ${parseInt(tx.gasPrice, 16)} wei`);
    console.log(`Gas: ${parseInt(tx.gas, 16)}`);
    console.log(`Nonce: ${parseInt(tx.nonce, 16)}`);
    
    // Obtener el recibo para ver si ya está minada
    const receipt = await this.jsonRpcRequest(nodeName, 'eth_getTransactionReceipt', [txHash]);
    if (receipt) {
      console.log(`\nEstado: ${receipt.status === '0x1' ? 'Éxito ✅' : 'Fallida ❌'}`);
      console.log(`Bloque: ${parseInt(receipt.blockNumber, 16)}`);
      console.log(`Gas usado: ${parseInt(receipt.gasUsed, 16)}`);
      
      // Calcular tiempo de confirmación si es posible
      const block = await this.jsonRpcRequest(nodeName, 'eth_getBlockByNumber', [receipt.blockNumber, false]);
      if (block) {
        const timestamp = parseInt(block.timestamp, 16);
        const now = Math.floor(Date.now() / 1000);
        console.log(`Confirmado hace: ${now - timestamp} segundos`);
      }
    } else {
      console.log('\nEstado: Pendiente ⏱️');
      
      // Verificar si está en la mempool
      const pendingTxs = await this.jsonRpcRequest(nodeName, 'txpool_content', []);
      if (pendingTxs && (pendingTxs.pending || pendingTxs.queued)) {
        console.log('La transacción está en la mempool');
      } else {
        console.log('La transacción no parece estar en la mempool');
      }
    }
    
    console.log('-----------------------------------------\n');
  } catch (error) {
    console.error(`Error al obtener detalles de la transacción ${txHash}:`, error);
  }
}
}

// Exportar la clase para su uso en otros módulos
export default BesuNetwork;
export {
  BesuNetwork,
  BesuNode,
  NodeOptions,
  GenesisOptions,
  NetworkStatus,
  NodeStatus
};