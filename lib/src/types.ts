/**
 * Interfaz para la configuración de red Besu
 */
export interface NetworkConfigInterface {
  /**
   * Configuración de nodos
   */
  nodes: {
    /** Número de nodos validadores */
    validators: number;
    /** Número de nodos completos (no validadores) */
    fullnodes: number;
  };

  /**
   * Configuración de la red
   */
  network: {
    /** Nombre de la red Docker */
    networkName: string;
    /** Puerto base para la API HTTP (se incrementará por cada nodo) */
    basePort: number;
  };

  /**
   * Especificaciones técnicas
   */
  tech: {
    /** Imagen Docker a utilizar */
    dockerImage: string;
    /** Tiempo de espera para iniciar el validador (segundos) */
    validatorStartupTime: number;
  };

  /**
   * Configuración de la cadena (genesis)
   */
  chain: {
    /** ID de la cadena (chainID) */
    chainId: number;
    /** Bloque en el que se activa la actualización de Londres */
    londonBlock: number;
    /** Límite de gas */
    gasLimit: string;
    /** Dificultad inicial */
    difficulty: string;
    /** Configuración del algoritmo de consenso Clique */
    clique: {
      /** Tiempo entre bloques en segundos */
      blockPeriodSeconds: number;
      /** Longitud de época */
      epochLength: number;
      /** Si se deben crear bloques vacíos */
      createEmptyBlocks: boolean;
    };
  };

  /**
   * Configuración de la transacción de prueba
   */
  transaction: {
    /** Dirección destino para la transacción de prueba */
    to: string;
    /** Cantidad de ETH para enviar */
    amount: string;
    /** Si se debe realizar una transacción de prueba */
    perform: boolean;
  };

  /**
   * Opciones de ejecución
   */
  execution: {
    /** Si se debe realizar el ejemplo de agregar/quitar un nodo */
    performDemonstration: boolean;
  };
}
