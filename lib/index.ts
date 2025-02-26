import pkg from 'elliptic';
import * as child_process from 'child_process';
const { exec } = child_process;
import { ethers } from 'ethers';
const scriptPath = "../../scripts/";

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
    return json;
}

async function getBalance(url: string, address: string): Promise<bigint> {
    const data = await callApi(url, "eth_getBalance", [address, "latest"]);
    if (!data.result) {
        throw new Error("Invalid response: Missing result field");
    }
    return BigInt(data.result);
}

async function getBlockNumber(url: string): Promise<number> {
    const data = await callApi(url, "eth_blockNumber", []);
    if (!data.result) {
        throw new Error("Invalid response: Missing result field");
    }
    return parseInt(data.result, 16);
}

async function transferFrom(url: string, fromPrivate: string, to: string, amount: number): Promise<ethers.providers.TransactionReceipt | null> {
    try {
        const wallet = new ethers.Wallet(fromPrivate);
        const provider = new ethers.JsonRpcProvider(url, {
            chainId: 123999,
            name: "private",
        });
        const connectedWallet = wallet.connect(provider);
        const tx = await connectedWallet.sendTransaction({
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


function launchNewNode(): void {
    exec(`${scriptPath}newNode.sh`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing newNode.sh: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

function deleteNode(nodeId: string): void {
    exec(`${scriptPath}deleteNode.sh ${nodeId}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing deleteNode.sh: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}
