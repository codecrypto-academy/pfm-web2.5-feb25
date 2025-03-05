import { JsonRpcProvider, ethers} from 'ethers'; 
import { getBalance, sendTransaction } from "../lib/accountManager";
import fs from "fs";
import path from "path";

const providerUrl = "http://localhost:2819"; // URL del nodo Ethereum

const address_alloc = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

// Ruta de los archivos de bootnode
const addressFilePath = path.resolve(__dirname, "../network/bootnode/address");
const privateKeyFilePath = path.resolve(__dirname, "../network/bootnode/key.priv");

//dirección y clave privada obtenida desde los archivos
const address_origen = fs.readFileSync(addressFilePath, "utf8").trim();
const privateKey = fs.readFileSync(privateKeyFilePath, "utf8").trim();

// Dirección de destino y monto de la transferencia
const address_dest = "0xC49807c3C4b32Cb0290599AF5b53b3724aed7eBD";  //C1Majo
const transferAmountETH = "75"; 

const provider = new JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// Test para verificar que la función `getBalance` devuelve el balance correctamente
describe("Pruebas de balance", () => {
    
    it("La cuenta alloc deberia tener los fondos", async () => {
        const balance = await getBalance(providerUrl, address_alloc); 

        // Comprobar que el balance no es nulo o undefined
        expect(balance).not.toBeNull();
        expect(balance).not.toBeUndefined();

        // Comprobar que el balance es un BigInt usando typeof
        expect(typeof balance).toBe("bigint");

    });
});

describe("Pruebas de transferencia", () => {
    
    it("Debería transferir fondos correctamente y verificar en sus balances la tx", async () => {
        // Obtener balances iniciales
        const balanceInicialOrigen = await getBalance(providerUrl, address_origen);
        const balanceInicialDestino = await getBalance(providerUrl, address_dest);
    
        console.log(`Balance inicial origen: ${balanceInicialOrigen}`);
        console.log(`Balance inicial destino: ${balanceInicialDestino}`);
    
        // Enviar la transacción
        const tx = await wallet.sendTransaction({
            to: address_dest,
            value: ethers.parseEther(transferAmountETH) // Convertir ETH a Wei
        });
    
        console.log(`Hash de la transacción: ${tx.hash}`);
        await tx.wait();
    
        // Obtener balances después de la transacción
        const balanceFinalOrigen = await getBalance(providerUrl, address_origen);
        const balanceFinalDestino = await getBalance(providerUrl, address_dest);
    
        console.log(`Balance final origen: ${balanceFinalOrigen}`);
        console.log(`Balance final destino: ${balanceFinalDestino}`);
    
        // Convertir BigInt a Number para Jest
        const balanceInicialOrigenNum = Number(balanceInicialOrigen);
        const balanceInicialDestinoNum = Number(balanceInicialDestino);
        const balanceFinalOrigenNum = Number(balanceFinalOrigen);
        const balanceFinalDestinoNum = Number(balanceFinalDestino);
    
        // Validar que el balance del origen se redujo
        expect(balanceFinalOrigenNum).toBeLessThan(balanceInicialOrigenNum);
    
        // Validar que el balance del destino aumentó en el monto enviado
        expect(balanceFinalDestinoNum).toBeGreaterThan(balanceInicialDestinoNum);
    });
    
    
});

