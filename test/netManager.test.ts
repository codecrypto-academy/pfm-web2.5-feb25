import { prepararNetwork, limpiarRedEnDocker, crearRed, crearBootnode, crearArchivosDeConfiguracion, lanzarBootnode, lanzarNodo } from "../lib/netManager";
import { isIpInNetwork } from "../lib/networkUtils";
import fs from 'fs/promises';
import path from 'path';

const NETWORK_DIR = path.resolve(__dirname, "../network");  // Directorio raíz de la red
const BOOTNODE_DIR = path.join(NETWORK_DIR, "bootnode");    // Directorio donde se generarán los archivos

//variables para las pruebas
const NETWORK_NAME = "besu-network-test";
const NETWORK = "162.24.0.0/16";
const BOOTNODE_IP = "162.24.0.8";
const BOOTNODE_PUERTO=2819;
const CHAIN_ID = 110786;
const ALLOC_ADDRESS_0X = "70997970C51812dc3A010C7d01b50e0d17dc79C8";



describe("Validación de formatos válidos", () => { 

    it("NETWORK_NAME debe ser un string mayor a 5 caracteres", () => {
        expect(typeof NETWORK_NAME).toBe("string");
        expect(NETWORK_NAME.length).toBeGreaterThan(5);
    });

    it("NETWORK debe estar en formato CIDR (IPv4/Máscara)", () => {
        const regex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/;
        expect(NETWORK).toMatch(regex);
    });

    it("CHAIN_ID debe ser un número de hasta 8 dígitos", () => {
        expect(typeof CHAIN_ID).toBe("number");
        expect(CHAIN_ID.toString().length).toBeLessThanOrEqual(8);
    });

    it("ALLOC_ADDRESS_0X debe ser un hexadecimal válido para una dirección de Ethereum", () => {
        const ethAddressRegex = /^[a-fA-F0-9]{40}$/; // Sin el prefijo "0x"
        
        // Verifica que la dirección tenga exactamente 40 caracteres hexadecimales
        expect(ALLOC_ADDRESS_0X).toMatch(ethAddressRegex);
    });;

    it("BOOTNODE_IP debe ser una dirección IPv4 válida dentro de la red NETWORK", () => {
        expect(isIpInNetwork(BOOTNODE_IP, NETWORK)).toBe(true);
    });

    it("BOOTNODE_PUERTO debe ser un número de 4 dígitos", () => {
        expect(typeof BOOTNODE_PUERTO).toBe("number");
        expect(BOOTNODE_PUERTO).toBeGreaterThanOrEqual(1000);
        expect(BOOTNODE_PUERTO).toBeLessThanOrEqual(9999);
    });

});


describe("Gestión de redes en Docker", () => {

    it("Debe limpiar la carpeta network y subcarpeta bootnode o crearlas de no existir", async () => {
        await expect(prepararNetwork()).resolves.toContain(`Carpeta 'network' lista para usarse`);
    });
    
    it("Debe limpiar una red en Docker", async () => {
        await expect(limpiarRedEnDocker(NETWORK_NAME)).resolves.toContain(`Eliminando la red ${NETWORK_NAME}`);
    });

    it("Debe crear una red en Docker", async () => {
        await expect(crearRed(NETWORK_NAME, NETWORK)).resolves.toContain(`Red ${NETWORK_NAME} creada con éxito.`);
    });

    it("Debe crear el bootnode correctamente", async () => {
        // Ejecutar la función crearBootnode y verificar la creación de archivos
        await expect(crearBootnode(BOOTNODE_IP)).resolves.toContain("Bootnode creado");

        // Verificar que el directorio 'bootnode' y los archivos existen
        const bootnodeFiles = await fs.readdir(BOOTNODE_DIR);
        expect(bootnodeFiles).toHaveLength(4);  

        // Verificar que los archivos esperados están en el directorio
        expect(bootnodeFiles).toContain('address');  
        expect(bootnodeFiles).toContain('enode');
        expect(bootnodeFiles).toContain('key.priv');
        expect(bootnodeFiles).toContain('key.pub');
    });

    it("Debe crear archivos de configuracion dentro de network: genesis.json y config.toml", async () => {
        await expect(crearArchivosDeConfiguracion(CHAIN_ID,ALLOC_ADDRESS_0X)).resolves.toContain(`Archivos genesis.json y config.toml creados exitosamente`);
    });

    it("Debe lanzar el Bootnode", async () => {
        await expect( lanzarBootnode(NETWORK_NAME,BOOTNODE_IP,BOOTNODE_PUERTO)).resolves.toContain(`Bootnode lanzado exitosamente.`);
    });

    it("Debe lanzar Nodo", async () => {
        await expect( lanzarNodo(NETWORK_NAME,1234)).resolves.toContain(`Nuevo nodo lanzado exitosamente.`);
    });

    it("Debe lanzar Nodo", async () => {
        await expect( lanzarNodo(NETWORK_NAME,1235)).resolves.toContain(`Nuevo nodo lanzado exitosamente.`);
    });


});
