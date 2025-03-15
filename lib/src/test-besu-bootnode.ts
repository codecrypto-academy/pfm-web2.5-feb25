import { BesuNetwork, GenesisOptions } from '.'; // Ajusta la ruta según donde tengas el archivo original
import * as fs from 'fs';
import * as path from 'path';

// Función para verificar la configuración de bootnode en los archivos generados
async function testBootnodeConfiguration() {
  console.log("=== INICIANDO PRUEBA DE CONFIGURACIÓN DE BOOTNODE ===");
  
  // Directorio para los archivos de la prueba
  const testDir = path.join(__dirname, 'besu-test-network');

  try {
    // Crear red Besu con 3 nodos (todos signers)
    console.log("Creando red Besu con 3 nodos...");
    const network = new BesuNetwork('bootnode-test');
    
    // Crear nodos
    const node1 = network.createNode({ name: 'node-1', port: 30301, rpcPort: 8545 });
    const node2 = network.createNode({ name: 'node-2', port: 30302, rpcPort: 8546 });
    const node3 = network.createNode({ name: 'node-3', port: 30303, rpcPort: 8547 });
    
    console.log("Nodos creados:");
    console.log(`- Nodo 1: ${node1.name} (${node1.enode})`);
    console.log(`- Nodo 2: ${node2.name} (${node2.enode})`);
    console.log(`- Nodo 3: ${node3.name} (${node3.enode})`);
    
    // En lugar de usar los métodos individuales, usar el método deployNetwork que está disponible
    console.log("\nDesplegando red de prueba (solo generando archivos)...");
    
    // Crear directorio si no existe
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Usaremos una función manual para generar los archivos de configuración
    // basándonos en los métodos que sí funcionan
    console.log("Generando archivos de configuración manualmente...");
    
    // 1. Guardar configuración de red
    network.saveNetworkConfig(testDir);
    console.log("- Red guardada");
    
    // 2. Generar archivo genesis
    network.generateGenesisFile(testDir);
    console.log("- Genesis generado");
    
    // 3. Generar configuración Besu (esto incluye la configuración de bootnodes)
    network.generateBesuConfig(testDir);
    console.log("- Configuración Besu generada");
    
    // Verificar que los archivos de configuración existen
    console.log("\nVerificando archivos generados...");
    const configFiles = [
      path.join(testDir, 'network-config.json'),
      path.join(testDir, 'genesis.json'),
      path.join(testDir, 'node-1', 'config.toml'),
      path.join(testDir, 'node-2', 'config.toml'),
      path.join(testDir, 'node-3', 'config.toml')
    ];
    
    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ Archivo existente: ${path.basename(file)}`);
      } else {
        console.log(`❌ Archivo no encontrado: ${path.basename(file)}`);
      }
    });
    
    // Verificar la configuración de bootnode en cada nodo
    console.log("\nVerificando configuración de bootnode en cada nodo:");
    
    // Leer configuración del nodo 1 (no debería tener bootnode)
    const node1Config = fs.readFileSync(path.join(testDir, 'node-1', 'config.toml'), 'utf8');
    const node1HasBootnode = node1Config.includes('bootnodes =');
    const node1HasEmptyBootnode = node1Config.includes('bootnodes = []');
    console.log(`- Nodo 1 no tiene bootnode configurado: ${(!node1HasBootnode || node1HasEmptyBootnode) ? '✅ Correcto' : '❌ Incorrecto'}`);
    console.log(`  -> ${node1HasEmptyBootnode ? 'Tiene bootnodes = []' : node1HasBootnode ? 'Tiene bootnodes configurados' : 'No tiene configuración de bootnodes'}`);
    
    // Leer configuración del nodo 2 (debería tener el nodo 1 como bootnode)
    const node2Config = fs.readFileSync(path.join(testDir, 'node-2', 'config.toml'), 'utf8');
    const node2HasNode1AsBootnode = node2Config.includes(node1.enode.replace(node1.name, node1.containerName!));
    console.log(`- Nodo 2 tiene el nodo 1 como bootnode: ${node2HasNode1AsBootnode ? '✅ Correcto' : '❌ Incorrecto'}`);
    
    // Extraer la línea de bootnodes para mostrarla
    const node2BootnodesLine = node2Config.split('\n').find(line => line.startsWith('bootnodes ='));
    console.log(`  -> Configuración: ${node2BootnodesLine || 'No encontrada'}`);
    
    // Leer configuración del nodo 3 (debería tener el nodo 1 como bootnode)
    const node3Config = fs.readFileSync(path.join(testDir, 'node-3', 'config.toml'), 'utf8');
    const node3HasNode1AsBootnode = node3Config.includes(node1.enode.replace(node1.name, node1.containerName!));
    console.log(`- Nodo 3 tiene el nodo 1 como bootnode: ${node3HasNode1AsBootnode ? '✅ Correcto' : '❌ Incorrecto'}`);
    
    // Extraer la línea de bootnodes para mostrarla
    const node3BootnodesLine = node3Config.split('\n').find(line => line.startsWith('bootnodes ='));
    console.log(`  -> Configuración: ${node3BootnodesLine || 'No encontrada'}`);
    
    // Mostrar el contenido completo de los archivos para análisis
    console.log("\n=== CONTENIDO DE LOS ARCHIVOS CONFIG.TOML ===");
    console.log("node-1/config.toml:");
    console.log(node1Config);
    console.log("\nnode-2/config.toml:");
    console.log(node2Config);
    console.log("\nnode-3/config.toml:");
    console.log(node3Config);
    
    // Resumen de la prueba
    console.log("\n=== RESUMEN DE LA PRUEBA ===");
    if (
      (!node1HasBootnode || node1HasEmptyBootnode) && 
      node2HasNode1AsBootnode && 
      node3HasNode1AsBootnode
    ) {
      console.log("✅ PRUEBA EXITOSA: La configuración de bootnode es correcta");
      console.log("- El primer nodo no tiene bootnode configurado");
      console.log("- Los nodos posteriores tienen el primer nodo configurado como bootnode");
    } else {
      console.log("❌ PRUEBA FALLIDA: Hay problemas con la configuración de bootnode");
      console.log("Revisa los detalles anteriores para identificar el problema");
    }
    
    // No intentamos desplegar la red, sólo verificamos la configuración generada
    
  } catch (error) {
    console.error("Error durante la prueba:", error);
  } finally {
    console.log("\n=== PRUEBA FINALIZADA ===");
  }
}

// Ejecutar la prueba
testBootnodeConfiguration()
  .then(() => {
    console.log("Prueba completada.");
  })
  .catch(error => {
    console.error("Error inesperado:", error);
  });