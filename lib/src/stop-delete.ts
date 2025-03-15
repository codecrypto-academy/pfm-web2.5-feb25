import { BesuNetwork } from '.';

async function main() {
  // Cargar una red existente
  const network = BesuNetwork.loadFromConfig('./besu-test/network-config.json');
  
  try {
    // Para detener la red temporalmente
    await network.stopNetwork('./besu-test');
    console.log('Red detenida exitosamente');
    
    // O para eliminarla completamente
    await network.destroyNetwork('./besu-test');
    console.log('Red eliminada completamente');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();