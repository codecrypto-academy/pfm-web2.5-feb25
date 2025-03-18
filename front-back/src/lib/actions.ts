"use server";

import { ethers } from 'ethers';
import fs from 'fs';

const provider = new ethers.JsonRpcProvider(process.env.BESU_SCRIPT_URL);

// Obtener un balance de una dirección en Ethereum
export async function balanceSubmit(formData: FormData): Promise<{ balance: string }> {
    const account = formData.get('account') as string;
    if (!account) throw new Error('La cuenta es requerida');

    const balance = await provider.getBalance(account);
    return { balance: ethers.formatEther(balance) }; 
}

export async function faucetSubmit(formData: FormData) {
    const account = formData.get('account') as string;
    if (!account) throw new Error('Account is required');

    const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_FILE || '', 'utf8');

    const wallet = new ethers.Wallet(privateKey, provider);
    const tx = await wallet.sendTransaction({
        to: account,
        value: ethers.parseEther('5.0') 
    });

    await tx.wait();
    return { success: true };
}