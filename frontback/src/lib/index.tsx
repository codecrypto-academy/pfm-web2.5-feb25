"use server";
import * as child_process from 'node:child_process';
const { exec } = child_process;
import { ethers } from 'ethers';
import * as path from 'path';
const scriptPath = path.resolve(__dirname, '../script/');
export { getBalance, getBlockNumber, transferFrom, getNetworkInfo, launchNewNode, deleteNode, faucetSubmit };
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