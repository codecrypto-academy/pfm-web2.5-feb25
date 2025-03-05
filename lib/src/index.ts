import { execSync, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Wallet } from 'ethers';
import * as readline from 'readline';

/**
 * BesuNetworkManager - Clase principal para gestionar una red Hyperledger Besu
 */
export class BesuNetworkManager {
  private networkName: string = 'besu';
  private basePort: number = 10000;
  private nodeCount: number = 0;
  private validatorNodeAddress?: string;
  private validatorEnode?: string;
  private validatorIp?: string;
  private workDir: string;
  private sharedReadline?: readline.Interface; // Nueva propiedad para compartir la interfaz readline
  private nodeManagementCalled: boolean = false; // Nueva bandera para controlar si ya se llamó a manageNodes

  constructor(options: { 
    networkName?: string; 
    basePort?: number; 
    workDir?: string;
  } = {}) {
    this.networkName = options.networkName || 'besu';
    this.basePort = options.basePort || 10000;
    this.workDir = options.workDir || process.cwd();
    
    // Crear directorio de trabajo si no existe
    if (!fs.existsSync(this.workDir)) {
      fs.mkdirSync(this.workDir, { recursive: true });
    }
  }

  // FUNCIONALIDADES PRINCIPALES

  /**
   * Inicia el proceso de creación de la red Besu
   */
  async createNetwork(): Promise<void> {
    console.log('=== Iniciando la creación de una red Hyperledger Besu ===');
    
    try {
      // Limpiar archivos y carpetas existentes
      await this.cleanExistingFiles();
      
      await this.checkDependencies();
      await this.createDockerNetwork();

      // Solicitar al usuario el número de nodos
      this.nodeCount = await this.getNodeCountFromUser();
      
      console.log(`Creando ${this.nodeCount} nodos (1 validador y ${this.nodeCount-1} fullnodes).`);
      
      // Crear directorios y claves para cada nodo
      for (let i = 1; i <= this.nodeCount; i++) {
        await this.createNodeDirectory(i);
      }
      
      // Crear archivos de configuración
      await this.createGenesisFile();
      await this.createValidatorConfig();
      
      // Lanzar el nodo validador y obtener su enode
      await this.getValidatorEnode();
      
      // Crear configuración para nodos completos
      await this.createFullnodeConfig();
      
      // Lanzar contenedores para nodos completos
      await this.launchFullnodeContainers();
      
      // Mostrar información de la red
      this.showNetworkInfo();
      
      console.log('Red Hyperledger Besu creada exitosamente.');

      // Mostrar el saldo del nodo validador
      if (this.validatorNodeAddress) {
        console.log('Verificando el saldo del nodo validador...');
        // Esperar un poco para que la red esté lista
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const balance = await this.getBalance(this.validatorNodeAddress);
        console.log(`Saldo actual del nodo validador (${this.validatorNodeAddress}): ${balance} ETH`);
      }
      
      // Iniciar el manejador de transacciones
      await this.handleTransactions();
      
      // Añadir la gestión de nodos después de las transacciones (solo si no se ha llamado antes)
      if (!this.nodeManagementCalled) {
        await this.manageNodes();
      }

    } catch (error) {
      console.error('Error al crear la red:', error);
      this.closeSharedReadline(); // Cerrar la interfaz readline en caso de error
      throw error;
    }
  }

  /**
   * Limpia archivos y carpetas existentes
   */
  async cleanExistingFiles(): Promise<void> {
    console.log('Limpiando archivos y carpetas existentes...');
    
    try {
      // Detener y eliminar contenedores Docker existentes
      console.log('Deteniendo y eliminando contenedores Docker existentes...');
      const containers = execSync('docker ps -a --filter name=node* -q').toString().trim();
      
      if (containers) {
        const containerList = containers.split('\n');
        for (const container of containerList) {
          if (container) {
            try {
              execSync(`docker stop ${container}`);
              execSync(`docker rm ${container}`);
            } catch (e) {
              console.warn(`No se pudo eliminar el contenedor ${container}`);
            }
          }
        }
      }
      console.log('Contenedores Docker eliminados.');
      
      // Eliminar archivos de configuración
      console.log('Eliminando archivos de configuración...');
      const configFiles = [
        'genesis.json', 
        'config.toml', 
        'config-fullnode.toml', 
        'sign_tx.js', 
        'package.json', 
        'package-lock.json'
      ];
      
      for (const file of configFiles) {
        const filePath = path.join(this.workDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      console.log('Archivos de configuración eliminados.');
      
      // Eliminar directorios de nodos
      console.log('Eliminando directorios de nodos...');
      const dirs = fs.readdirSync(this.workDir);
      for (const dir of dirs) {
        const dirPath = path.join(this.workDir, dir);
        if (fs.statSync(dirPath).isDirectory() && dir.startsWith('node')) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      }
      console.log('Directorios de nodos eliminados.');
      
      // Eliminar node_modules si existe
      const nodeModulesPath = path.join(this.workDir, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        console.log('Eliminando node_modules...');
        fs.rmSync(nodeModulesPath, { recursive: true, force: true });
        console.log('node_modules eliminado.');
      }
      
      console.log('Limpieza completada. El entorno está listo para una nueva instalación.');
    } catch (error) {
      console.error('Error durante la limpieza:', error);
      throw error;
    }
  }

  // IMPLEMENTACIÓN DE FUNCIONES DEL SCRIPT ORIGINAL

  /**
   * Verifica que las dependencias necesarias estén instaladas
   */
  async checkDependencies(): Promise<void> {
    console.log('Verificando dependencias...');
    
    try {
      // Verificar Docker
      execSync('docker --version', { stdio: 'ignore' });
    } catch (error) {
      console.error('Docker no está instalado. Por favor, instálelo antes de continuar.');
      throw new Error('Docker no está instalado');
    }
    
    try {
      // Verificar Besu (opcional, podríamos no requerirlo si usamos solo Docker)
      execSync('besu --version', { stdio: 'ignore' });
    } catch (error) {
      console.warn('Hyperledger Besu no está instalado localmente. Se usará solo Docker.');
    }
    
    // Verificar jq
    try {
      execSync('jq --version', { stdio: 'ignore' });
    } catch (error) {
      console.warn('jq no está instalado. Algunas funcionalidades podrían no estar disponibles.');
    }
    
    console.log('Todas las dependencias están instaladas.');
  }

  /**
   * Crea una red Docker para los nodos Besu
   */
  async createDockerNetwork(): Promise<void> {
    console.log(`Creando red Docker '${this.networkName}'...`);
    
    try {
      // Verificar si la red ya existe
      const networkCheck = execSync(`docker network inspect ${this.networkName} 2>/dev/null || echo "not_exists"`).toString();
      
      if (!networkCheck.includes('not_exists')) {
        console.warn(`La red '${this.networkName}' ya existe. Se usará la existente.`);
      } else {
        execSync(`docker network create ${this.networkName}`);
        console.log(`Red '${this.networkName}' creada exitosamente.`);
      }
    } catch (error) {
      console.error(`Error al crear la red Docker '${this.networkName}':`, error);
      throw error;
    }
  }

  /**
   * Solicita al usuario el número de nodos a crear
   */
  async getNodeCountFromUser(): Promise<number> {
    // Crear una nueva interfaz readline (no usamos la compartida aquí porque es temprano en el flujo)
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise<number>((resolve) => {
      const askNodeCount = () => {
        rl.question('Ingrese el número total de nodos que desea crear (incluyendo el nodo validador): ', (answer) => {
          const nodeCount = parseInt(answer.trim());
          
          // Validar que sea un número
          if (isNaN(nodeCount)) {
            console.error('Por favor, ingrese un número válido.');
            return askNodeCount();
          }
          
          // Validar que sea al menos 1
          if (nodeCount < 1) {
            console.error('El número de nodos debe ser al menos 1.');
            return askNodeCount();
          }
          
          rl.close();
          console.log(`Creando ${nodeCount} nodos (1 validador y ${nodeCount-1} fullnodes).`);
          resolve(nodeCount);
        });
      };
      
      askNodeCount();
    });
  }

  /**
   * Crea un directorio para un nodo y genera sus claves
   */
  async createNodeDirectory(nodeNum: number): Promise<void> {
    const nodeDir = path.join(this.workDir, `node${nodeNum}`);
    
    console.log(`Creando directorio para el nodo ${nodeNum}...`);
    
    // Crear directorio si no existe
    if (!fs.existsSync(nodeDir)) {
      fs.mkdirSync(nodeDir, { recursive: true });
    }
    
    console.log(`Generando clave y dirección para el nodo ${nodeNum}...`);
    
    try {
      // Generar un wallet aleatorio con ethers
      const wallet = Wallet.createRandom();
      
      // Guardar la clave privada (sin el 0x prefix)
      fs.writeFileSync(
        path.join(nodeDir, 'key'), 
        wallet.privateKey.substring(2)
      );
      
      // Obtener la clave pública completa (sin comprimir)
      const publicKey = wallet.signingKey.publicKey.replace(/^0x/, '');
      fs.writeFileSync(path.join(nodeDir, 'key.pub'), publicKey);
      
      // Guardar la dirección (manteniendo el 0x prefix)
      fs.writeFileSync(path.join(nodeDir, 'address'), wallet.address);
      
      // Si es el primer nodo (validador), guardamos su dirección
      if (nodeNum === 1) {
        this.validatorNodeAddress = wallet.address;
      }
      
      console.log(`Nodo ${nodeNum} configurado correctamente.`);
    } catch (error) {
      console.error(`Error al generar claves para el nodo ${nodeNum}:`, error);
      throw error;
    }
  }

  /**
   * Crea el archivo genesis.json
   */
  async createGenesisFile(): Promise<boolean> {
    console.log('Creando archivo genesis.json...');
    
    try {
      // Obtener la dirección del primer nodo para extradata y alloc
      const nodeDir = path.join(this.workDir, 'node1');
      const addressFile = path.join(nodeDir, 'address');
      
      if (!fs.existsSync(addressFile)) {
        throw new Error('No se encontró el archivo de dirección para el nodo validador');
      }
      
      // Leer la dirección del nodo validador
      const node1Address = fs.readFileSync(addressFile, 'utf8').trim();
      const node1AddressStrip = node1Address.replace(/^0x/, '');
      
      // Crear el extradata con la dirección del primer nodo
      const extradata = `0x0000000000000000000000000000000000000000000000000000000000000000${node1AddressStrip}0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`;
      
      // Crear el archivo genesis.json
      const genesisContent = {
        config: {
          chainID: 4004,
          londonBlock: 0,
          clique: {
            blockperiodseconds: 4,
            epochlength: 30000,
            createemptyblocks: true
          }
        },
        extradata: extradata,
        gasLimit: "0x1fffffffffffff",
        difficulty: "0x1",
        alloc: {
          [node1Address]: {
            balance: "0x21e19e0c9bab2400000"
          }
        }
      };
      
      // Escribir el archivo genesis.json
      fs.writeFileSync(
        path.join(this.workDir, 'genesis.json'),
        JSON.stringify(genesisContent, null, 2)
      );
      
      console.log('Archivo genesis.json creado exitosamente.');
      
      // Guardar la dirección del validador para uso posterior
      this.validatorNodeAddress = node1Address;
      
      return true;
    } catch (error) {
      console.error('Error al crear el archivo genesis.json:', error);
      throw error;
    }
  }

  /**
   * Crea el archivo config.toml para el nodo validador
   */
  async createValidatorConfig(): Promise<boolean> {
    console.log('Creando archivo config.toml para el nodo validador...');
    
    try {
      // Contenido del archivo config.toml
      const configContent = `genesis-file = "/data/genesis.json"
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
host-allowlist = ["*"]`;
      
      // Escribir el archivo config.toml
      fs.writeFileSync(
        path.join(this.workDir, 'config.toml'),
        configContent
      );
      
      console.log('Archivo config.toml para el nodo validador creado exitosamente.');
      return true;
    } catch (error) {
      console.error('Error al crear el archivo config.toml:', error);
      throw error;
    }
  }

  /**
   * Obtiene el enode del nodo validador
   */
  async getValidatorEnode(): Promise<string> {
    console.log('Lanzando el nodo validador para obtener su enode...');
    
    try {
      // Lanzar el contenedor del nodo validador
      execSync(`docker run -d \
        --name node1 \
        --network ${this.networkName} \
        -p ${this.basePort + 1}:8545 \
        -v "${this.workDir}:/data" \
        hyperledger/besu:latest \
        --config-file=/data/config.toml \
        --data-path=/data/node1/data \
        --node-private-key-file=/data/node1/key \
        --genesis-file=/data/genesis.json`);
      
      console.log('Contenedor del nodo validador lanzado exitosamente.');
      
      // Esperar a que el nodo se inicie
      console.log('Esperando a que el nodo validador se inicie (15 segundos)...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      // Obtener la IP del nodo validador
      const node1Ip = execSync(`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' node1`).toString().trim();
      console.log(`IP del nodo validador: ${node1Ip}`);
      this.validatorIp = node1Ip;

      console.log('Intentando exportar la clave pública con besu...');
      
      try {
        // Usar besu para exportar la clave pública
        const node1PubKey = execSync(`besu --data-path=node1 public-key export 2>/dev/null | tail -1`).toString().trim().replace(/^0x/, '');
        
        // Verificar que la clave tenga 128 caracteres
        if (node1PubKey && node1PubKey.length === 128) {
          this.validatorEnode = `enode://${node1PubKey}@${node1Ip}:30303`;
          console.log(`Enode generado exitosamente: ${this.validatorEnode}`);
          return this.validatorEnode;
        } else {
          console.warn(`La clave pública exportada no tiene el formato correcto. Longitud: ${node1PubKey ? node1PubKey.length : 0}`);
        }
      } catch (error) {
        console.error('Error al exportar la clave pública con besu:', error);
      }
      
      // Si llegamos aquí, no pudimos obtener la clave pública correctamente
      throw new Error('No se pudo obtener una clave pública válida para el nodo validador.');
    } catch (error) {
      console.error('Error al obtener el enode del nodo validador:', error);
      throw error;
    }
  }

  /**
   * Crea el archivo config-fullnode.toml para los nodos completos
   */
  async createFullnodeConfig(): Promise<boolean> {
    console.log('Creando archivo config-fullnode.toml para los nodos completos...');
    
    if (!this.validatorEnode) {
      throw new Error('No se ha obtenido el enode del nodo validador.');
    }
    
    try {
      // Contenido del archivo config-fullnode.toml
      const configContent = `genesis-file = "/data/genesis.json"
# Networking
p2p-host = "0.0.0.0"
p2p-port = 30303
p2p-enabled = true
# Bootstrap node connection
bootnodes = [
  "${this.validatorEnode}",
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
sync-mode = "FULL"`;
      
      // Escribir el archivo config-fullnode.toml
      fs.writeFileSync(
        path.join(this.workDir, 'config-fullnode.toml'),
        configContent
      );
      
      console.log('Archivo config-fullnode.toml creado exitosamente.');
      return true;
    } catch (error) {
      console.error('Error al crear el archivo config-fullnode.toml:', error);
      throw error;
    }
  }

  /**
   * Lanza los contenedores para los nodos completos
   */
  async launchFullnodeContainers(): Promise<void> {
    // Si solo hay un nodo, salir (el validador ya ha sido lanzado)
    if (this.nodeCount <= 1) {
      return;
    }
    
    // Lanzar los nodos completos (a partir del segundo nodo)
    for (let i = 2; i <= this.nodeCount; i++) {
      const nodeName = `node${i}`;
      const port = this.basePort + i;
      
      console.log(`Lanzando contenedor para el nodo completo ${nodeName} en el puerto ${port}...`);
      
      try {
        execSync(`docker run -d \
          --name ${nodeName} \
          --network ${this.networkName} \
          -p ${port}:8545 \
          -v "${this.workDir}:/data" \
          hyperledger/besu:latest \
          --config-file=/data/config-fullnode.toml \
          --data-path=/data/${nodeName}/data`);
        
        console.log(`Contenedor del nodo completo ${nodeName} lanzado exitosamente.`);
      } catch (error) {
        console.error(`Error al lanzar el contenedor para el nodo ${nodeName}:`, error);
        throw error;
      }
    }
  }

  /**
   * Muestra información de la red
   */
  showNetworkInfo(): void {
    console.log('¡Red Hyperledger Besu creada exitosamente!');
    console.log('Información de la red:');
    console.log(`- Número total de nodos: ${this.nodeCount}`);
    console.log('- Nodo validador: 1');
    console.log(`- Nodos completos: ${this.nodeCount - 1}`);
    
    console.log('Acceso a los nodos:');
    console.log(`- Nodo validador: http://localhost:${this.basePort + 1}`);
    
    for (let i = 2; i <= this.nodeCount; i++) {
      const port = this.basePort + i;
      console.log(`- Nodo completo ${i}: http://localhost:${port}`);
    }
    
    if (this.validatorEnode) {
      console.log(`- Enode del validador: ${this.validatorEnode}`);
    }
  }

  /**
  * Obtiene el saldo de una dirección
  */
  async getBalance(address: string): Promise<string> {
    try {
      const response = await axios.post(`http://localhost:${this.basePort + 1}`, {
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1
      });
        
      if (response.data.result === null || response.data.result === '0x0') {
        return '0.00';
      }
        
      // Convertir de hexadecimal a decimal
      let balanceHex = response.data.result.replace(/^0x/, '');
      let balanceWei = BigInt('0x' + balanceHex);
        
      // Convertir de wei a ETH
      const ethValue = Number(balanceWei) / 1e18;
      return ethValue.toFixed(2);
    } catch (error) {
      console.error('Error al obtener el saldo:', error);
      return '0.00';
    }
  }

  /**
   * Maneja transacciones en la red
   */
  async handleTransactions(): Promise<void> {
    console.log('Iniciando el manejador de transacciones...');
    
    try {
      // Crear un script temporal para firmar transacciones
      const signTxScript = `
const { Transaction } = require('@ethereumjs/tx');
const { Common } = require('@ethereumjs/common');
const { bufferToHex, toBuffer } = require('ethereumjs-util');

// Obtener argumentos de la línea de comandos
const privateKey = process.argv[2];
const nonce = process.argv[3];
const to = process.argv[4];
const value = process.argv[5];
const gasPrice = process.argv[6] || '0x3B9ACA00'; // 1 Gwei por defecto
const gasLimit = process.argv[7] || '0x5208';     // 21000 por defecto
const chainId = parseInt(process.argv[8]) || 4004; // ChainID por defecto

// Crear un objeto Common para la cadena personalizada
const common = Common.custom({ chainId: chainId });

// Crear la transacción
const txData = {
  nonce: nonce,
  gasPrice: gasPrice,
  gasLimit: gasLimit,
  to: to,
  value: value,
  data: '0x',
};

// Crear y firmar la transacción
const tx = Transaction.fromTxData(txData, { common });
const privateKeyBuffer = toBuffer(privateKey.startsWith('0x') ? privateKey : '0x' + privateKey);
const signedTx = tx.sign(privateKeyBuffer);

// Obtener la transacción serializada
const serializedTx = bufferToHex(signedTx.serialize());
console.log(serializedTx);
`;
      
      // Escribir el script a un archivo
      const scriptPath = path.join(this.workDir, 'sign_tx.js');
      fs.writeFileSync(scriptPath, signTxScript);
      
      // Instalar dependencias necesarias para el script
      console.log('Instalando dependencias para el manejador de transacciones...');
      execSync('npm init -y', { cwd: this.workDir, stdio: 'ignore' });
      execSync('npm install --save-dev @ethereumjs/tx@^4.0.0 @ethereumjs/common@^3.0.0 ethereumjs-util@^7.1.5', { cwd: this.workDir });
      
      // Obtener la dirección y clave privada del nodo validador
      if (!this.validatorNodeAddress) {
        throw new Error('No se ha obtenido la dirección del nodo validador.');
      }
      
      const validatorKeyPath = path.join(this.workDir, 'node1', 'key');
      if (!fs.existsSync(validatorKeyPath)) {
        throw new Error('No se encontró el archivo de clave privada para el nodo validador.');
      }
      
      const privateKey = fs.readFileSync(validatorKeyPath, 'utf8').trim().replace(/^0x/, '');
      
      // Verificar que la cuenta del validador tenga fondos
      const validatorBalance = await this.getBalance(this.validatorNodeAddress);
      console.log(`Saldo actual de la cuenta del validador (${this.validatorNodeAddress}): ${validatorBalance} ETH`);
      
      // IMPORTANTE: Inicializar la interfaz readline aquí antes de usarla
      this.initSharedReadline();
      
      // Crear una promesa que se resuelve cuando el usuario termina con las transacciones
      return new Promise<void>((resolve) => {
        if (!this.sharedReadline) {
          console.error('Error: La interfaz readline no está inicializada.');
          resolve(); // Resolver la promesa para continuar con el flujo
          return;
        }
        
        const askTransaction = () => {
          this.sharedReadline!.question('¿Desea realizar una transacción? (s/n): ', async (answer) => {
            if (answer.toLowerCase() !== 's') {
              console.log('Saliendo del manejador de transacciones.');
              resolve(); // Resolver la promesa para continuar con el flujo
              return;
            }
            
            // Solicitar dirección de destino
            const askDestination = () => {
              this.sharedReadline!.question('Ingrese la dirección de destino: ', (toAddress) => {
                // Validar formato de dirección Ethereum
                if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
                  console.error('La dirección debe tener el formato 0x seguido de 40 caracteres hexadecimales.');
                  return askDestination();
                }
                
                // Solicitar cantidad a enviar
                const askAmount = () => {
                  this.sharedReadline!.question('Ingrese la cantidad a enviar (en ETH): ', async (amountEth) => {
                    // Validar que la cantidad sea un número positivo
                    const amount = parseFloat(amountEth);
                    if (isNaN(amount) || amount <= 0) {
                      console.error('Por favor, ingrese un número positivo mayor que cero.');
                      return askAmount();
                    }
                    
                    // Convertir ETH a wei (hex) para la transacción
                    const amountWeiDec = BigInt(Math.floor(amount * 1e18));
                    const amountWeiHex = '0x' + amountWeiDec.toString(16);
                    
                    console.log(`Enviando ${amount} ETH (${amountWeiDec} wei) a ${toAddress}...`);
                    
                    try {
                      // Obtener el nonce para la transacción
                      const response = await axios.post(`http://localhost:${this.basePort + 1}`, {
                        jsonrpc: '2.0',
                        method: 'eth_getTransactionCount',
                        params: [this.validatorNodeAddress, 'latest'],
                        id: 1
                      });
                      
                      const nonceHex = response.data.result;
                      
                      // Ejecutar el script de firma de transacción con la ruta correcta
                      // Usar process.cwd() como directorio de trabajo para el script
                      const command = `node "${scriptPath}" "${privateKey}" "${nonceHex}" "${toAddress}" "${amountWeiHex}"`;
                      const signedTx = execSync(command, { cwd: this.workDir }).toString().trim();
                      
                      // Enviar la transacción firmada
                      const txResponse = await axios.post(`http://localhost:${this.basePort + 1}`, {
                        jsonrpc: '2.0',
                        method: 'eth_sendRawTransaction',
                        params: [signedTx],
                        id: 1
                      });
                      
                      const txHash = txResponse.data.result;
                      const error = txResponse.data.error;
                      
                      if (!txHash && error) {
                        console.error(`Error al enviar la transacción: ${error.message}`);
                        askTransaction();
                        return;
                      }
                      
                      console.log(`Transacción enviada. Hash: ${txHash}`);
                      console.log('Esperando a que la transacción sea procesada (10 segundos)...');
                      await new Promise(resolve => setTimeout(resolve, 10000));
                      
                      // Obtener los nuevos saldos
                      const newFromBalance = await this.getBalance(this.validatorNodeAddress || "");
                      const newToBalance = await this.getBalance(toAddress);
                      
                      console.log(`Nuevo saldo de la cuenta del validador (${this.validatorNodeAddress}): ${newFromBalance} ETH`);
                      console.log(`Nuevo saldo de la cuenta de destino (${toAddress}): ${newToBalance} ETH`);
                      
                      // Preguntar si desea realizar otra transacción
                      askTransaction();
                    } catch (error) {
                      console.error('Error durante la transacción:', error);
                      askTransaction();
                    }
                  });
                };
                
                askAmount();
              });
            };
            
            askDestination();
          });
        };
        
        askTransaction();
      });
    } catch (error) {
      console.error('Error en el manejador de transacciones:', error);
      // No llamamos a manageNodes() aquí para evitar la duplicación
    }
  }

  /**
   * Añade un nuevo nodo a la red existente
   * @param options Opciones para la configuración del nodo
   * @returns Información del nodo añadido
   */
  async addNode(options: { 
    nodeName?: string;
    customPort?: number;
  } = {}): Promise<{
    nodeName: string;
    nodeAddress: string;
    httpPort: number;
    containerName: string;
  }> {
    console.log('=== Añadiendo nuevo nodo a la red existente ===');
    
    try {
      // Verificar que la red existe y que el nodo validador está en ejecución
      if (!this.validatorEnode || !this.validatorIp) {
        // Intentar obtener la información del validador si no la tenemos
        await this.detectExistingNetwork();
      }

      // Contar los nodos existentes para generar un nuevo ID
      const nodeCount = this.countExistingNodes();
      const newNodeNum = nodeCount + 1;
      const nodeName = options.nodeName || `node${newNodeNum}`;
      const httpPort = options.customPort || (this.basePort + newNodeNum);

      console.log(`Creando nodo '${nodeName}' con puerto HTTP ${httpPort}...`);
      
      // Crear directorio y claves para el nuevo nodo
      await this.createNodeDirectory(newNodeNum);
      
      // Obtener la dirección del nuevo nodo
      const nodeAddressPath = path.join(this.workDir, `node${newNodeNum}`, 'address');
      if (!fs.existsSync(nodeAddressPath)) {
        throw new Error(`No se encontró el archivo de dirección para el nodo ${newNodeNum}`);
      }
      const nodeAddress = fs.readFileSync(nodeAddressPath, 'utf8').trim();
      
      // Lanzar el contenedor del nuevo nodo
      const containerName = nodeName;
      execSync(`docker run -d \
        --name ${containerName} \
        --network ${this.networkName} \
        -p ${httpPort}:8545 \
        -v "${this.workDir}:/data" \
        hyperledger/besu:latest \
        --config-file=/data/config-fullnode.toml \
        --data-path=/data/${nodeName}/data`);
      
      console.log(`Nodo '${nodeName}' añadido exitosamente y accesible en http://localhost:${httpPort}`);
      this.nodeCount = newNodeNum; // Actualizar contador de nodos
      
      return {
        nodeName,
        nodeAddress,
        httpPort,
        containerName
      };
    } catch (error) {
      console.error('Error al añadir nuevo nodo:', error);
      throw error;
    }
  }

  /**
   * Elimina un nodo existente de la red
   * @param nodeIdentifier Nombre o número del nodo a eliminar
   * @param removeData Si true, elimina también los archivos del nodo
   * @returns true si el nodo fue eliminado correctamente
   */
  async removeNode(nodeIdentifier: string | number, removeData: boolean = false): Promise<boolean> {
    console.log(`=== Eliminando nodo '${nodeIdentifier}' de la red ===`);
    
    try {
      let containerName: string;
      let nodeName: string;
      
      // Convertir el identificador a nombre de contenedor
      if (typeof nodeIdentifier === 'number') {
        containerName = `node${nodeIdentifier}`;
        nodeName = containerName;
      } else {
        containerName = nodeIdentifier;
        nodeName = nodeIdentifier;
      }
      
      // Verificar si es el nodo validador (no permitir eliminarlo)
      if (containerName === 'node1') {
        throw new Error('No se puede eliminar el nodo validador (node1).');
      }
      
      // Verificar si el nodo existe
      const containerExists = execSync(`docker ps -a --filter name=${containerName} -q`).toString().trim();
      if (!containerExists) {
        throw new Error(`El nodo '${containerName}' no existe.`);
      }
      
      // Detener y eliminar el contenedor
      console.log(`Deteniendo y eliminando contenedor '${containerName}'...`);
      execSync(`docker stop ${containerName}`);
      execSync(`docker rm ${containerName}`);
      
      // Eliminar archivos si se solicita
      if (removeData) {
        const nodePath = path.join(this.workDir, nodeName);
        if (fs.existsSync(nodePath)) {
          console.log(`Eliminando datos del nodo '${nodeName}'...`);
          fs.rmSync(nodePath, { recursive: true, force: true });
        }
      }
      
      console.log(`Nodo '${nodeIdentifier}' eliminado exitosamente.`);
      
      // Actualizar el contador de nodos (opcional, no es preciso si se han eliminado nodos antes)
      this.nodeCount--;
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar nodo '${nodeIdentifier}':`, error);
      throw error;
    }
  }

  /**
   * Cuenta los nodos existentes en la red
   * @private
   * @returns Número de nodos encontrados
   */
  private countExistingNodes(): number {
    try {
      // Contar contenedores con nombre que comienza por "node"
      const output = execSync('docker ps -a --filter name=node* --format "{{.Names}}"').toString();
      const containers = output.trim().split('\n').filter(Boolean);
      return containers.length;
    } catch (error) {
      console.warn('Error al contar nodos existentes:', error);
      return this.nodeCount > 0 ? this.nodeCount : 0;
    }
  }

  /**
   * Detecta una red existente y obtiene información del validador
   * @private
   */
  private async detectExistingNetwork(): Promise<boolean> {
    console.log('Intentando detectar una red existente...');
    
    try {
      // Verificar si el nodo validador está en ejecución
      const validatorRunning = execSync('docker ps -q --filter name=node1').toString().trim();
      if (!validatorRunning) {
        throw new Error('El nodo validador no está en ejecución.');
      }
      
      // Obtener la IP del nodo validador
      const node1Ip = execSync(`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' node1`).toString().trim();
      this.validatorIp = node1Ip;
      
      // Intentar obtener el enode del validador haciendo una petición RPC
      try {
        const response = await axios.post('http://localhost:10001', {
          jsonrpc: '2.0',
          method: 'admin_nodeInfo',
          params: [],
          id: 1
        });
        
        if (response.data.result && response.data.result.enode) {
          this.validatorEnode = response.data.result.enode;
          console.log(`Enode del validador detectado: ${this.validatorEnode}`);
          
          // Actualizar la configuración de fullnode por si se necesita
          await this.createFullnodeConfig();
          
          return true;
        }
      } catch (error) {
        console.error('Error al obtener información del nodo validador por RPC:', error);
      }
      
      // Fallback: crear un enode sintético con la IP del validador
      console.warn('No se pudo obtener el enode exacto del validador.');
      console.warn('Usando un enode sintético para conectar nuevos nodos...');
      
      // Obtener el directorio node1
      const nodeDir = path.join(this.workDir, 'node1');
      if (fs.existsSync(path.join(nodeDir, 'key.pub'))) {
        const publicKey = fs.readFileSync(path.join(nodeDir, 'key.pub'), 'utf8').trim();
        this.validatorEnode = `enode://${publicKey}@${node1Ip}:30303`;
        await this.createFullnodeConfig();
        return true;
      }
      
      throw new Error('No se pudo detectar la información necesaria del nodo validador.');
    } catch (error) {
      console.error('Error al detectar la red existente:', error);
      throw error;
    }
  }

  /**
   * Gestiona los nodos de la red (añadir/eliminar)
   */
  async manageNodes(): Promise<void> {
    // Marcar que esta función ya fue llamada para evitar duplicaciones
    this.nodeManagementCalled = true;
    
    console.log('\n=== Gestión de Nodos de la Red ===');
    
    // Inicializar la interfaz readline compartida si no existe
    this.initSharedReadline();

    const askManageNodes = () => {
      this.sharedReadline!.question('¿Desea gestionar los nodos de la red? (s/n): ', async (answer) => {
        if (answer.toLowerCase() !== 's') {
          console.log('Saliendo del gestor de nodos.');
          // Ahora sí cerramos la interfaz, ya que es el final del flujo
          this.closeSharedReadline();
          return;
        }

        // Mostrar menú de opciones
        console.log('\nOpciones disponibles:');
        console.log('1. Añadir nuevos nodos');
        console.log('2. Eliminar nodos existentes');
        console.log('0. Salir');

        this.sharedReadline!.question('Seleccione una opción: ', async (option) => {
          switch (option) {
            case '1':
              await this.handleAddNodes(askManageNodes);
              break;
            case '2':
              await this.handleRemoveNodes(askManageNodes);
              break;
            case '0':
              console.log('Saliendo del gestor de nodos.');
              this.closeSharedReadline();
              break;
            default:
              console.log('Opción no válida. Por favor, seleccione una opción correcta.');
              askManageNodes();
              break;
          }
        });
      });
    };

    askManageNodes();
  }

  /**
   * Maneja la adición de nuevos nodos
   * @private
   */
  private async handleAddNodes(callback: () => void): Promise<void> {
    this.sharedReadline!.question('¿Cuántos nodos desea añadir? ', async (answer) => {
      const count = parseInt(answer.trim());
      
      if (isNaN(count) || count <= 0) {
        console.log('Por favor, ingrese un número válido mayor que cero.');
        return this.handleAddNodes(callback);
      }
      
      console.log(`\nAñadiendo ${count} nodos nuevos...`);
      
      try {
        // Añadir los nodos uno por uno
        for (let i = 1; i <= count; i++) {
          console.log(`\nAñadiendo nodo ${i} de ${count}...`);
          const nodeInfo = await this.addNode();
          console.log(`Nodo añadido: ${nodeInfo.nodeName}`);
          console.log(`Dirección: ${nodeInfo.nodeAddress}`);
          console.log(`Puerto HTTP: http://localhost:${nodeInfo.httpPort}`);
        }
        
        console.log(`\n¡Se han añadido ${count} nodos exitosamente!`);
        
        // Actualizar y mostrar la nueva información de la red
        this.showNetworkInfo();
        
        // Volver al menú principal
        callback();
      } catch (error) {
        console.error('Error al añadir nodos:', error);
        callback();
      }
    });
  }

  /**
   * Maneja la eliminación de nodos existentes
   * @private
   */
  private async handleRemoveNodes(callback: () => void): Promise<void> {
    try {
      // Obtener la lista de nodos existentes
      const nodeList = await this.listExistingNodes();
      
      if (nodeList.length <= 1) {
        console.log('Solo existe el nodo validador en la red. No hay nodos para eliminar.');
        callback();
        return;
      }

      console.log('\nNodos disponibles para eliminar:');
      // Mostrar todos los nodos excepto el validador
      nodeList.forEach((node, index) => {
        if (node !== 'node1') {
          console.log(`- ${node}`);
        }
      });

      this.sharedReadline!.question('\nIndique el nombre o número del nodo a eliminar (ej: node3 o 3): ', async (answer) => {
        let nodeIdentifier = answer.trim();
        
        // Si se ingresó solo un número, convertirlo a formato "nodeX"
        if (/^\d+$/.test(nodeIdentifier)) {
          nodeIdentifier = `node${nodeIdentifier}`;
        }
        
        // Verificar que el nodo existe
        if (!nodeList.includes(nodeIdentifier)) {
          console.log(`El nodo "${nodeIdentifier}" no existe. Por favor, seleccione un nodo válido.`);
          return this.handleRemoveNodes(callback);
        }
        
        // No permitir eliminar el nodo validador
        if (nodeIdentifier === 'node1') {
          console.log('No se puede eliminar el nodo validador (node1).');
          return this.handleRemoveNodes(callback);
        }
        
        // Confirmar la eliminación
        this.sharedReadline!.question(`¿Está seguro que desea eliminar el nodo "${nodeIdentifier}"? (s/n): `, async (confirm) => {
          if (confirm.toLowerCase() !== 's') {
            console.log('Operación cancelada.');
            return this.handleRemoveNodes(callback);
          }
          
          // Preguntar si desea eliminar también los datos
          this.sharedReadline!.question('¿Desea eliminar también los datos del nodo? (s/n): ', async (deleteData) => {
            const removeData = deleteData.toLowerCase() === 's';
            
            try {
              await this.removeNode(nodeIdentifier, removeData);
              console.log(`\nNodo "${nodeIdentifier}" eliminado exitosamente.`);
              
              // Actualizar y mostrar la nueva información de la red
              this.showNetworkInfo();
              
              // Preguntar si desea eliminar otro nodo
              this.sharedReadline!.question('¿Desea eliminar otro nodo? (s/n): ', async (anotherOne) => {
                if (anotherOne.toLowerCase() === 's') {
                  return this.handleRemoveNodes(callback);
                } else {
                  callback();
                }
              });
            } catch (error) {
              console.error(`Error al eliminar el nodo "${nodeIdentifier}":`, error);
              callback();
            }
          });
        });
      });
    } catch (error) {
      console.error('Error al listar los nodos:', error);
      callback();
    }
  }

  /**
   * Inicializa la interfaz readline compartida si no existe
   * @private
   */
  private initSharedReadline(): void {
    if (!this.sharedReadline) {
      this.sharedReadline = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }
  }

  /**
   * Cierra la interfaz readline compartida
   * @private
   */
  private closeSharedReadline(): void {
    if (this.sharedReadline) {
      this.sharedReadline.close();
      this.sharedReadline = undefined;
    }
  }

  /**
   * Lista los nodos existentes en la red
   * @private
   * @returns Lista de nombres de nodos
   */
  private async listExistingNodes(): Promise<string[]> {
    try {
      const output = execSync('docker ps -a --filter name=node* --format "{{.Names}}"').toString();
      return output.trim().split('\n').filter(Boolean);
    } catch (error) {
      console.error('Error al listar nodos existentes:', error);
      return [];
    }
  }
}

// Exportar funciones de utilidad si son necesarias
export function weiToEth(weiAmount: string): string {
  const wei = BigInt(weiAmount);
  return (Number(wei) / 1e18).toFixed(18);
}

export function ethToWei(ethAmount: number): string {
  return '0x' + (ethAmount * 1e18).toString(16);
}

// Punto de entrada para pruebas CLI
if (require.main === module) {
  const manager = new BesuNetworkManager();
  
  // Función para probar funcionalidades específicas
  async function testFunctions() {
    try {
      await manager.checkDependencies();
      await manager.createDockerNetwork();
      
      // Descomentar para probar funciones específicas
      // await manager.createNodeDirectory(1);
      // await manager.createGenesisFile();
      // await manager.createValidatorConfig();
      
      console.log('Pruebas completadas con éxito');
    } catch (error) {
      console.error('Error en las pruebas:', error);
    }
  }
  
  // Descomentar para probar funciones específicas
  // testFunctions();
  
  // Descomentar para crear la red completa
  manager.createNetwork().catch(console.error);
}