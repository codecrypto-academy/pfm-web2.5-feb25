import fetch from 'node-fetch';

// Obtener un balance de una dirección en Ethereum
export async function getBalance(url: string, address: string): Promise<BigInt> {
    const data = await callApi(url, "eth_getBalance", [address, "latest"]);
    return BigInt(data.result);  // Retorna el balance en formato BigInt
}

// Realizar una transferencia 
export async function sendTransaction(url: string, from: string, to: string, amount: string, privateKey: string): Promise<any> {
    const data = await callApi(url, "eth_sendTransaction", [
        {
            from: from,
            to: to,
            value: amount,
            gas: "0x76c0", // gas limit en hexadecimal
            gasPrice: "0x9184e72a000", // gas price en hexadecimal
            privateKey: privateKey // Este valor se debería firmar adecuadamente en una implementación real
        }
    ]);
    return data; 
}

// Realizar llamadas a la API JSON-RPC de Ethereum
async function callApi(url: string, method: string, params: any[]): Promise<any> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: 1
        })
    });
    const json = await response.json();
    return json;  // Retorna la respuesta de la API en formato JSON
}
