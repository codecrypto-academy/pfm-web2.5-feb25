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
interface GenesisOptions {
    chainId?: number;
    constantinopleForkBlock?: number;
    clique?: {
        blockperiodseconds?: number;
        epochlength?: number;
    };
    alloc?: {
        [address: string]: {
            balance: string;
        };
    };
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
interface Transaction {
    from: string;
    to: string;
    value: string;
    gas?: string;
    gasPrice?: string;
    nonce?: string;
    data?: string;
}
interface TransactionResponse {
    transactionHash: string;
    status: 'pending' | 'confirmed' | 'failed';
    blockNumber?: number;
    error?: string;
}
declare class BesuNetwork {
    private name;
    private nodes;
    private dockerConfig;
    constructor(name?: string, dockerConfig?: Partial<DockerConfig>);
    getName(): string;
    getNodes(): BesuNode[];
    /**
     * Crea un nuevo nodo para la red Besu con Clique
     * @param options Opciones del nodo
     * @returns El nodo creado
     */
    createNode(options?: NodeOptions): BesuNode;
    /**
     * Guarda la configuración de la red en archivos
     * @param outputDir Directorio de salida
     */
    saveNetworkConfig(outputDir: string): void;
    /**
    * Genera la configuración genesis para la red Besu con Clique
    * @param options Opciones de configuración genesis
    * @returns Configuración genesis
    */
    generateGenesisConfig(options?: GenesisOptions): any;
    /**
     * Genera los archivos de configuración de Besu para cada nodo
     * @param outputDir Directorio de salida
     */
    generateBesuConfig(outputDir: string): void;
    /**
     * Genera el archivo genesis.json para la red
     * @param outputDir Directorio de salida
     * @param options Opciones de configuración genesis
     */
    generateGenesisFile(outputDir: string, options?: GenesisOptions): void;
    /**
     * Genera el archivo docker-compose.yml para la red
     * @param outputDir Directorio de salida
     */
    generateDockerCompose(outputDir: string): void;
    /**
   * Inicia la red Besu usando Docker Compose
   * @param dataDir Directorio con la configuración
   * @returns Promesa que se resuelve cuando la red ha iniciado
   */
    startNetwork(dataDir?: string): Promise<void>;
    /**
     * Detiene la red Besu
     * @param dataDir Directorio con la configuración
     * @returns Promesa que se resuelve cuando la red ha detenido
     */
    stopNetwork(dataDir?: string): Promise<void>;
    /**
     * Elimina la red Besu y todos los datos asociados
     * @param dataDir Directorio con la configuración
     * @returns Promesa que se resuelve cuando la red ha sido eliminada
     */
    destroyNetwork(dataDir?: string): Promise<void>;
    /**
     * Reinicia la red Besu
     * @param dataDir Directorio con la configuración
     * @returns Promesa que se resuelve cuando la red ha sido reiniciada
     */
    restartNetwork(dataDir?: string): Promise<void>;
    /**
   * Obtiene el estado actual de la red y sus nodos
   * @param dataDir Directorio con la configuración
   * @returns Promesa que se resuelve con el estado de la red
   */
    getNetworkStatus(dataDir?: string): Promise<NetworkStatus>;
    /**
     * Crea y despliega una red Besu completa
     * @param numNodes Número de nodos a crear
     * @param numSigners Número de signers (debe ser menor o igual a numNodes)
     * @param outputDir Directorio de salida
     * @param options Opciones adicionales
     * @returns Promesa que se resuelve cuando la red ha sido creada y desplegada
     */
    deployNetwork(numNodes: number, numSigners: number, outputDir: string, options?: GenesisOptions): Promise<void>;
    /**
     * Crea un archivo de configuración completo para la red Besu
     * @param outputDir Directorio de salida
     */
    generateFullNetworkConfig(outputDir: string): void;
    /**
     * Agrega un nodo existente a la red
     * @param nodeConfig Configuración del nodo
     * @returns El nodo agregado
     */
    addExistingNode(nodeConfig: Partial<BesuNode>): BesuNode;
    /**
     * Carga una configuración de red desde un archivo
     * @param configFile Ruta al archivo de configuración
     * @returns La instancia de BesuNetwork con la configuración cargada
     */
    static loadFromConfig(configFile: string): BesuNetwork;
    /**
    * Envía una transacción a la red Besu
    * @param nodeName Nombre del nodo desde el que se envía la transacción
    * @param transaction Datos de la transacción
    * @returns Promesa que se resuelve con la respuesta de la transacción
    */
    sendTransaction(nodeName: string, transaction: Transaction): Promise<TransactionResponse>;
    /**
     * Consulta el saldo de una dirección en la red Besu
     * @param nodeName Nombre del nodo desde el que se consulta
     * @param address Dirección Ethereum a consultar
     * @returns Promesa que se resuelve con el saldo en wei (como string hexadecimal)
     */
    getBalance(nodeName: string, address: string): Promise<string>;
    /**
     * Realiza una solicitud JSON-RPC a un nodo
     * @param nodeName Nombre del nodo
     * @param method Método RPC
     * @param params Parámetros del método
     * @returns Promesa que se resuelve con el resultado de la solicitud
     */
    private jsonRpcRequest;
    /**
     * Convierte un valor hexadecimal a ether (valor legible)
     * @param weiHex Valor en wei como string hexadecimal
     * @returns El valor en ether como string
     */
    static weiToEther(weiHex: string): string;
    /**
     * Espera a que una transacción sea minada y confirmada
     * @param nodeName Nombre del nodo desde el que se consulta
     * @param txHash Hash de la transacción
     * @param maxAttempts Número máximo de intentos (por defecto 20)
     * @param interval Intervalo entre intentos en ms (por defecto 1000)
     * @returns Promesa que se resuelve con la respuesta de la transacción
     */
    waitForTransaction(nodeName: string, txHash: string, maxAttempts?: number, interval?: number): Promise<TransactionResponse>;
}
export default BesuNetwork;
export { BesuNetwork, BesuNode, NodeOptions, GenesisOptions, NetworkStatus, NodeStatus };
