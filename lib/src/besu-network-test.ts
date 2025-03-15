import { BesuNetwork, GenesisOptions } from '.';
import * as path from 'path';

/**
 * Script de prueba para la clase BesuNetwork
 * Este script crea una red Besu, realiza transacciones, consulta saldos y limpia los recursos
 */
async function testBesuNetwork() {
  try {
    console.log('===== Iniciando prueba de BesuNetwork =====');
    
    // Configuración
    const dataDir = path.join(__dirname, 'test-besu-network');
    const networkName = 'test-network';
    
    // Crear la instancia de BesuNetwork
    const besuNetwork = new BesuNetwork(networkName, {
      dataDir,
      enableLogging: true
    });
    
    console.log(`Red creada con nombre: ${besuNetwork.getName()}`);
    
    // Paso 1: Crear nodos
    console.log('\n===== Creando nodos =====');
    const node1 = besuNetwork.createNode({ name: 'node-1', isSigner: true });
    console.log(`Nodo 1 creado: ${node1.name} (${node1.address})`);
    
    const node2 = besuNetwork.createNode({ name: 'node-2', isSigner: true });
    console.log(`Nodo 2 creado: ${node2.name} (${node2.address})`);
    
    const node3 = besuNetwork.createNode({ name: 'node-3', isSigner: false });
    console.log(`Nodo 3 creado: ${node3.name} (${node3.address})`);
    
    // Verificar que los nodos se han creado correctamente
    const nodes = besuNetwork.getNodes();
    console.log(`Total de nodos creados: ${nodes.length}`);
    
    // Paso 2: Generar archivos de configuración
    console.log('\n===== Generando archivos de configuración =====');
    
    // Opciones para el genesis.json
    const genesisOptions: GenesisOptions = {
      chainId: 12345,
      clique: {
        blockperiodseconds: 5,
        epochlength: 30000
      },
      alloc: {
        // Añadir una cuenta adicional con saldo para pruebas
        '0x1234567890123456789012345678901234567890': {
          balance: '0x100000000000000000000000000'
        }
      }
    };
    
    // Generar todos los archivos de configuración
    besuNetwork.generateFullNetworkConfig(dataDir);
    console.log(`Configuración generada en: ${dataDir}`);
    
    // Paso 3: Iniciar la red
    console.log('\n===== Iniciando la red =====');
    await besuNetwork.startNetwork(dataDir);
    console.log('Red iniciada correctamente');
    
    // Paso 4: Obtener estado de la red
    console.log('\n===== Comprobando estado de la red =====');
    const networkStatus = await besuNetwork.getNetworkStatus(dataDir);
    console.log(`Estado de la red: ${networkStatus.running ? 'En ejecución' : 'Detenida'}`);
    
    if (networkStatus.running) {
      console.log('Estado de los nodos:');
      for (const [nodeName, nodeStatus] of Object.entries(networkStatus.nodes)) {
        console.log(`- ${nodeName}: ${nodeStatus.running ? 'En ejecución' : 'Detenido'}`);
        if (nodeStatus.running && nodeStatus.blockHeight !== undefined) {
          console.log(`  Altura de bloque: ${nodeStatus.blockHeight}`);
        }
        if (nodeStatus.running && nodeStatus.peers) {
          console.log(`  Peers conectados: ${nodeStatus.peers.length}`);
        }
      }
    }
    
    // Paso 5: Consultar saldo inicial
    console.log('\n===== Consultando saldo inicial =====');
    try {
      const balance1 = await besuNetwork.getBalance('node-1', node1.address);
      console.log(`Saldo de ${node1.name} (${node1.address}): ${balance1} wei`);
      console.log(`Saldo en ether: ${BesuNetwork.weiToEther(balance1)} ETH`);
      
      const balance2 = await besuNetwork.getBalance('node-1', node2.address);
      console.log(`Saldo de ${node2.name} (${node2.address}): ${balance2} wei`);
      console.log(`Saldo en ether: ${BesuNetwork.weiToEther(balance2)} ETH`);
    } catch (error) {
      console.error('Error al consultar saldo inicial:', error);
    }
    
    // Paso 6: Enviar una transacción
    console.log('\n===== Enviando transacción =====');
    try {
      // Esperar unos segundos para que la red esté lista
      console.log('Esperando 5 segundos para que la red esté lista...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const transaction = {
        from: node1.address,
        to: node2.address,
        value: '0x1000000000000000' // 0.00001 ETH
      };
      
      console.log(`Enviando transacción desde ${node1.address} a ${node2.address}`);
      const txResponse = await besuNetwork.sendTransaction('node-1', transaction);
      
      if (txResponse.status === 'failed') {
        console.error(`Error al enviar transacción: ${txResponse.error}`);
      } else {
        console.log(`Transacción enviada con hash: ${txResponse.transactionHash}`);
        
        // Esperar a que la transacción sea confirmada
        console.log('Esperando confirmación de la transacción...');
        const confirmedTx = await besuNetwork.waitForTransaction('node-1', txResponse.transactionHash);
        
        console.log(`Estado de la transacción: ${confirmedTx.status}`);
        if (confirmedTx.blockNumber) {
          console.log(`Confirmada en el bloque: ${confirmedTx.blockNumber}`);
        }
      }
    } catch (error) {
      console.error('Error en el proceso de transacción:', error);
    }
    
    // Paso 7: Consultar saldo después de la transacción
    console.log('\n===== Consultando saldo después de la transacción =====');
    try {
      const balance1 = await besuNetwork.getBalance('node-1', node1.address);
      console.log(`Nuevo saldo de ${node1.name} (${node1.address}): ${balance1} wei`);
      console.log(`Saldo en ether: ${BesuNetwork.weiToEther(balance1)} ETH`);
      
      const balance2 = await besuNetwork.getBalance('node-1', node2.address);
      console.log(`Nuevo saldo de ${node2.name} (${node2.address}): ${balance2} wei`);
      console.log(`Saldo en ether: ${BesuNetwork.weiToEther(balance2)} ETH`);
    } catch (error) {
      console.error('Error al consultar saldo después de la transacción:', error);
    }
    
    // Paso 8: Detener la red
    console.log('\n===== Deteniendo la red =====');
    await besuNetwork.stopNetwork(dataDir);
    console.log('Red detenida correctamente');
    
    // Verificar el estado después de detener
    const stoppedStatus = await besuNetwork.getNetworkStatus(dataDir);
    console.log(`Estado de la red: ${stoppedStatus.running ? 'En ejecución' : 'Detenida'}`);
    
    // Paso 9: Destruir la red (descomentar para ejecutar)
    console.log('\n===== Destruyendo la red =====');
    await besuNetwork.destroyNetwork(dataDir);
    console.log('Red destruida correctamente');
    
    console.log('\n===== Prueba completada con éxito =====');
    
  } catch (error) {
    console.error('Error durante la prueba:', error);
  }
}

// Ejecutar la prueba
testBesuNetwork().catch(error => {
  console.error('Error crítico durante la ejecución:', error);
});