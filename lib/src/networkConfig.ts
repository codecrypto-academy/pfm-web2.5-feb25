/**
 * CONFIGURACIÓN DE LA RED BESU
 * 
 * Modifica los valores según tus necesidades
 */
export const networkConfig = {
  // Número de nodos
  validators: 1,        // Número de nodos validadores
  fullnodes: 2,         // Número de nodos completos (no validadores)
  
  // Configuración de red
  networkName: 'besuNetwork',  // Nombre de la red Docker
  basePort: 10001,      // Puerto base (se incrementa para cada nodo adicional)
  
  // Especificaciones técnicas
  dockerImage: 'hyperledger/besu:latest',  // Imagen Docker a utilizar
  validatorStartupTime: 15,                 // Tiempo de espera para iniciar el validador (segundos)
  
  // Configuración de la transacción de prueba
  transactionTo: '0x125f85D02912c62E7E63FFdc12F1f4511B14c3DC',  // Dirección destino
  transactionAmount: '100',                                       // Cantidad en ETH
  
  // Opciones de ejecución
  performTransaction: true,        // ¿Realizar transacción de prueba?
  performDemonstration: true,      // ¿Realizar demostración de añadir/eliminar nodos?
};
