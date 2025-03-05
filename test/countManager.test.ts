import { JsonRpcProvider, ethers} from 'ethers'; 
import { getBalance, sendTransaction } from "../lib/countManager";
import fs from "fs";
import path from "path";

const providerUrl = "http://localhost:2224"; // URL del nodo Ethereum

const address_alloc = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const balance_alloc = "0xad78ebc5ac6200000";

// Ruta de los archivos de bootnode
const addressFilePath = path.resolve(__dirname, "../network/bootnode/address");
const privateKeyFilePath = path.resolve(__dirname, "../network/bootnode/key.priv");

// Leemos los archivos para obtener la dirección y la clave privada
const address_origen = fs.readFileSync(addressFilePath, "utf8").trim();
const privateKey = fs.readFileSync(privateKeyFilePath, "utf8").trim();

const address_dest = "0xC49807c3C4b32Cb0290599AF5b53b3724aed7eBD";  //C1Majo
const transferAmountETH = "75"; 

// Test para verificar que la función `getBalance` devuelve el balance correctamente
describe("Pruebas de balance", () => {
    
    it("La cuenta alloc deberia tener los fondos asignados en genesis", async () => {
        const balance = await getBalance(providerUrl, address_alloc); 

        //console.log(`Balance de la cuenta ${address_alloc}:`, balance.toString());

        // Comprobar que el balance no es nulo o undefined
        expect(balance).not.toBeNull();
        expect(balance).not.toBeUndefined();

        // Comprobar que el balance es un BigInt usando typeof
        expect(typeof balance).toBe("bigint");

        // Convertir el balance_alloc (hexadecimal) a BigInt
        const expectedBalance = BigInt(balance_alloc);

        // Comparar el balance de la cuenta con el balance esperado
        expect(balance).toBe(expectedBalance);
    });
});



// Test para verificar que la función `sendTransaction` transfiere correctamente
describe("Pruebas de transferencia de ETH", () => {
    it("Debería transferir 75 ETH de la cuenta origen (bootnode) a la cuenta destino", async () => {
        // Convertir ETH a wei
        const transferAmountWei = ethers.parseUnits(transferAmountETH, "ether");  // 'ether' es el valor en ETH y lo convierte a wei

        // Crear un wallet usando la clave privada y el provider
        const provider = new JsonRpcProvider(providerUrl);
        const wallet = new ethers.Wallet(privateKey, provider);

        // Obtener el balance antes de la transacción
        const balanceBeforeOrigen = await getBalance(providerUrl, address_origen);
        const balanceBeforeDest = await getBalance(providerUrl, address_dest);

        console.log(`Balance antes de la transacción:`);
        console.log(`Cuenta de origen (${address_origen}):`, balanceBeforeOrigen.toString());
        console.log(`Cuenta de destino (${address_dest}):`, balanceBeforeDest.toString());

        // Intentar enviar la transacción
        try {
            const tx = await wallet.sendTransaction({
                to: address_dest,
                value: transferAmountWei
            });

            console.log("Hash de la transacción:", tx.hash);
            const receipt = await tx.wait(); // Esperar la confirmación de la transacción
            console.log("Transacción confirmada:", receipt);

        } catch (error) {
            console.error("Error al enviar la transacción:", error);
        }

        // Obtener el balance después de la transacción
        const balanceAfterOrigen = await getBalance(providerUrl, address_origen);
        const balanceAfterDest = await getBalance(providerUrl, address_dest);

        console.log(`Balance después de la transacción:`);
        console.log(`Cuenta de origen (${address_origen}):`, balanceAfterOrigen.toString());
        console.log(`Cuenta de destino (${address_dest}):`, balanceAfterDest.toString());

        // Verificar que el balance de la cuenta origen disminuyó en la cantidad de la transacción
        const expectedBalanceOrigen = balanceBeforeOrigen - transferAmountWei;
        expect(balanceAfterOrigen).toBe(expectedBalanceOrigen);

        // Verificar que el balance de la cuenta destino aumentó en la cantidad de la transacción
        const expectedBalanceDest = balanceBeforeDest + transferAmountWei;
        expect(balanceAfterDest).toBe(expectedBalanceDest);
    });
});