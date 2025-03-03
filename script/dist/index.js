"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTransaction = void 0;
const ethers_1 = require("ethers");
const sendTransaction = (destWallet) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Configurar el proveedor (apunta a un nodo Besu)
    const provider = new ethers_1.ethers.JsonRpcProvider("http://localhost:8545");
    // 2. Crear una wallet con clave privada (usa una cuenta de Besu)
    const privateKey = "0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f"; // Reemplazar con una clave válida
    const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
    provider.getBalance(wallet.address).then((balance) => {
        console.log("Balance:", ethers_1.ethers.formatEther(balance), "ETH");
    });
    // 3. Parámetros de la transacción
    const tx = {
        to: destWallet, // Reemplazar con dirección destino
        value: ethers_1.ethers.parseEther("10"), // 0.1 ETH
        gasLimit: 21000,
        gasPrice: (yield provider.getFeeData()).gasPrice
    };
    // 4. Enviar transacción
    try {
        const txResponse = yield wallet.sendTransaction(tx);
        console.log("TX hash:", txResponse.hash);
        // Esperar confirmación
        const receipt = yield txResponse.wait();
        console.log("Bloque confirmado:", receipt.blockNumber);
        provider.getBalance(wallet.address).then((balance) => {
            console.log("Nuevo balance:", ethers_1.ethers.formatEther(balance), "ETH");
        });
    }
    catch (error) {
        console.error("Error:", error);
    }
});
exports.sendTransaction = sendTransaction;
process.argv.map((arg, index) => {
    if (arg.startsWith('0x')) {
        (0, exports.sendTransaction)(arg);
    }
});
//# sourceMappingURL=index.js.map