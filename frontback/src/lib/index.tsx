"use server";
import * as child_process from 'node:child_process';
const { exec } = child_process;
import { ethers } from 'ethers';
import * as path from 'path';
const scriptPath = path.resolve(__dirname, '../../../../../script/');
export { getNodeAddress, getBalance, getBlockNumber, transferFrom, getNetworkInfo, launchNewNode, deleteNode, faucetSubmit, getAllBalances, newNetwork, shutDown };
const url = process.env.BESU_URL as string
const provider = new ethers.JsonRpcProvider(url);
const privateKey = process.env.PRIVATE_KEY as string




type JsonRpcResponse = {
    jsonrpc: string;
    id: number;
    result?: any;
    error?: any;
};

async function callApi(url: string, method: string, params: any[]): Promise<JsonRpcResponse> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: 1,
        }),
    });

    const json: JsonRpcResponse = await response.json();
    //console.log("API Response:", json);

    return json;
}


async function getBalance(formData: FormData) {
    const account = formData.get('account') as string;
    if (!account) throw new Error('Account is required')
    const data = await callApi(url, "eth_getBalance", [account, "latest"]);
    if (!data.result) {
        throw new Error("Invalid response: Missing result field");
    }
    const balanceInWei = data.result;
    const balanceInEther = ethers.formatEther(balanceInWei);

    return { balance: balanceInEther };
}

async function getBlockNumber(url: string): Promise<number> {
    const data = await callApi(url, "eth_blockNumber", []);
    if (!data.result) {
        throw new Error("Invalid response: Missing result field");
    }
    return parseInt(data.result, 16);
}

async function transferFrom(from: string, to: string, amount: number): Promise<ethers.TransactionReceipt | null> {
    try {
        const wallet = new ethers.Wallet(privateKey, provider);
        const tx = await wallet.sendTransaction({
            to: to,
            value: ethers.parseEther(amount.toString()),
        });

        return await tx.wait();
    } catch (error) {
        console.error("Transaction failed:", error);
        throw error;
    }
}

type NetworkInfo = {
    version: JsonRpcResponse;
    peerCount: JsonRpcResponse;
};

async function getNetworkInfo(url: string): Promise<NetworkInfo> {
    const version = await callApi(url, "net_version", []);
    const peerCount = await callApi(url, "net_peerCount", []);
    return { version, peerCount };
}


function launchNewNode(): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(`${scriptPath}/newNode.sh`, (error, stdout, stderr) => {
            if (error) {
                reject(error.message);
                return;
            }
            if (stderr) {
                reject(stderr);
                return;
            }
            resolve(stdout);
        });
    });
}

function deleteNode(nodeId: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(`${scriptPath}/deleteNode.sh ${nodeId}`, (error, stdout, stderr) => {
            if (error) {
                reject(error.message);
                return;
            }
            if (stderr) {
                reject(stderr);
                return;
            }
            resolve(stdout);
        });
    });
}

async function faucetSubmit(formData: FormData) {

    const account = formData.get('account') as string;
    if (!account) throw new Error('Account is required');
    const wallet = new ethers.Wallet(privateKey, provider);

    const tx = await wallet.sendTransaction({
        to: account,
        value: ethers.parseEther('1.0')
    });

    await tx.wait();
    return { success: true };
}

function getNodeAddress(nodeName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(`${scriptPath}/getNodeAddress.sh ${nodeName}`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`Script error: ${stderr}`);
                return;
            }

            // Remove whitespace and newlines from the output
            const address = stdout.trim();

            // Verify that the address has a valid format (0x followed by hexadecimal characters)
            if (/^0x[0-9a-fA-F]+$/.test(address)) {
                resolve(address); // Return the node's address
            } else {
                reject("Error: Invalid address format returned by script.");
            }
        });
    });
}

type NodeBalance = {
    nodeName: string;
    address: string;
    balance: string; // Balance in Wei
};

async function getAllBalances(): Promise<NodeBalance[]> {
    return new Promise((resolve, reject) => {
        exec(`${scriptPath}/AllBalances.sh`, (error, stdout, stderr) => {
            if (error) {
                console.error("Error executing AllBalances.sh:", error.message);
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error("Script error:", stderr);
                reject(`Script error: ${stderr}`);
                return;
            }

            //console.log("Script output:", stdout); 

            const lines = stdout.trim().split('\n');
            const balances: NodeBalance[] = [];

            for (const line of lines) {
                const match = line.match(/Node(\d+) \((0x[0-9a-fA-F]+)\) balance: (0x[0-9a-fA-F]+) Wei/); if (match) {
                    balances.push({
                        nodeName: `node${match[1]}`,
                        address: match[2],
                        balance: match[3],
                    });
                }
            }

            //console.log("Parsed balances:", balances); // Debug: Ver los datos parseados
            resolve(balances);
        });
    });
}

function newNetwork(): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(`${scriptPath}/NodeCreation.sh`, (error, stdout, stderr) => {
            if (error) {
                console.error("Error executing NodeCreation.sh:", error.message);
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error("Script error:", stderr);
                reject(`Script error: ${stderr}`);
                return;
            }

            // Verificar si la salida contiene el mensaje de éxito
            if (stdout.includes("Archivo .env creado exitosamente en")) {
                resolve(stdout); // Devolver la salida del script
            } else {
                reject("Error: Script did not complete successfully.");
            }
        });
    });
}

function shutDown(): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(`${scriptPath}/TurnOffAndLetsGo.sh`, (error, stdout, stderr) => {
            if (error) {
                console.error("Error executing TurnOffAndLetsGo.sh:", error.message);
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error("Script error:", stderr);
                reject(`Script error: ${stderr}`);
                return;
            }
            console.log("TurnOffAndLetsGo.sh output:", stdout); // Debug: Ver la salida del script
            resolve(stdout);
        });
    });
}