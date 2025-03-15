import { BesuNetwork, GenesisOptions } from '.';
import * as path from 'path';

async function main() {
  try {
    // Crear una nueva instancia de BesuNetwork
    const network = new BesuNetwork('mi-red-besu', {
      dataDir: './mi-red-besu-data',
      enableLogging: true
    });
    
    // Definir opciones personalizadas para el genesis si lo deseas
    const genesisOptions: GenesisOptions = {
      chainId: 888999,
      clique: {
        blockperiodseconds: 5,  // Bloques cada 5 segundos para desarrollo
        epochlength: 30000
      }
    };
    
    // Desplegar la red con 3 nodos, 2 de ellos signers
    const outputDir = path.resolve('./mi-red-besu-data');
    await network.deployNetwork(3, 2, outputDir, genesisOptions);
    
    // Obtener información de los nodos
    const nodes = network.getNodes();
    console.log('Nodos creados:');
    nodes.forEach((node, index) => {
      console.log(`Nodo ${index + 1}:`);
      console.log(`  Nombre: ${node.name}`);
      console.log(`  Dirección: ${node.address}`);
      console.log(`  Es signer: ${node.isSigner}`);
      console.log(`  Puerto P2P: ${node.port}`);
      console.log(`  Puerto RPC: ${node.rpcPort}`);
      console.log(`  enode: ${node.enode}`);
      console.log('---');
    });
    
    // Obtener el estado de la red
    const status = await network.getNetworkStatus(outputDir);
    console.log('Estado de la red:', status.running ? 'En ejecución' : 'Detenida');
    
    console.log('Red Besu desplegada exitosamente.');
  } catch (error) {
    console.error('Error al desplegar la red Besu:', error);
  }
}

main().catch(console.error);