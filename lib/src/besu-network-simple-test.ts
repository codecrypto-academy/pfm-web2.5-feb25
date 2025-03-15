import { BesuNetwork } from '.';
import * as path from 'path';

// Configuración básica
const DATA_DIR = path.join(__dirname, 'besu-test');
const NETWORK_NAME = 'test-simple';

/**
 * Función principal para probar funcionalidades específicas
 */
async function main() {
  try {
    // Crear instancia de BesuNetwork
    const network = new BesuNetwork(NETWORK_NAME, {
      dataDir: DATA_DIR,
      enableLogging: true
    });
    
    // Crear nodos (2 firmantes y 1 no firmante)
    const signer1 = network.createNode({ name: 'signer-1', isSigner: true });
    const signer2 = network.createNode({ name: 'signer-2', isSigner: true });
    const validator = network.createNode({ name: 'validator-1', isSigner: false });
    
    console.log('Nodos creados:');
    console.log(`- ${signer1.name}: ${signer1.address}`);
    console.log(`- ${signer2.name}: ${signer2.address}`);
    console.log(`- ${validator.name}: ${validator.address}`);
    
    // Generar configuración
    network.generateFullNetworkConfig(DATA_DIR);
    console.log(`Configuración generada en: ${DATA_DIR}`);
    
    // Iniciar la red
    console.log('Iniciando la red...');
    await network.startNetwork();
    
    // Esperar a que la red se inicie completamente
    console.log('Esperando 10 segundos para que la red se estabilice...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Consultar estado de la red
    const status = await network.getNetworkStatus();
    console.log('Estado de la red:');
    console.log(`- Running: ${status.running}`);
    if (status.metrics) {
      console.log(`- Bloques: ${status.metrics.totalBlocks}`);
      console.log(`- Peers promedio: ${status.metrics.averagePeers}`);
    }
    
    // Consultar saldos iniciales
    const balance1 = await network.getBalance('signer-1', signer1.address);
    console.log(`Saldo de ${signer1.name}: ${BesuNetwork.weiToEther(balance1)} ETH`);
    
    // Enviar una transacción
    console.log('Enviando transacción...');
    const tx = {
      from: signer1.address,
      to: signer2.address,
      value: '0x2540BE400' // 10000000000 (0.00000001 ETH)
    };
    
    const txResult = await network.sendTransaction('signer-1', tx);
    console.log(`Transacción enviada: ${txResult.transactionHash}`);
    
    // Esperar confirmación
    if (txResult.status !== 'failed') {
      console.log('Esperando confirmación...');
      const confirmed = await network.waitForTransaction('signer-1', txResult.transactionHash);
      console.log(`Estado final: ${confirmed.status}`);
      
      // Verificar nuevos saldos
      const newBalance1 = await network.getBalance('signer-1', signer1.address);
      const newBalance2 = await network.getBalance('signer-1', signer2.address);
      
      console.log(`Nuevo saldo de ${signer1.name}: ${BesuNetwork.weiToEther(newBalance1)} ETH`);
      console.log(`Nuevo saldo de ${signer2.name}: ${BesuNetwork.weiToEther(newBalance2)} ETH`);
    }
    
    // Detener y eliminar la red
    console.log('¿Desea detener la red? (Comentar las siguientes líneas si desea mantenerla en ejecución)');
    await network.stopNetwork();
    console.log('Red detenida correctamente');
    
    // Descomentar para eliminar completamente la red
    // console.log('Eliminando la red...');
    // await network.destroyNetwork();
    // console.log('Red eliminada correctamente');
    
  } catch (error) {
    console.error('Error durante la ejecución:', error);
  }
}

// Ejecutar el script
main().catch(console.error);