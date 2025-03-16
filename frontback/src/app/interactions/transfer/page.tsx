"use client";
import { useEffect, useState } from 'react';

// Extend the Window interface to include the ethereum property
declare global {
    interface Window {
        ethereum?: any;
    }
}
import { useRouter, useSearchParams } from 'next/navigation';
import { BrowserProvider } from 'ethers';

export default function Transfer() {
    const [toAddress, setToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);
    const router = useRouter();

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsTransferring(true);

        if (!toAddress || !amount) {
            setError('All fields are required.');
            setIsTransferring(false);
            return;
        }

        if (!/^(0x)?[0-9a-fA-F]{40}$/.test(toAddress)) {
            setError('Invalid address format.');
            setIsTransferring(false);
            return;
        }

        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            setError('Invalid amount.');
            setIsTransferring(false);
            return;
        }

        try {
            // Check if MetaMask is installed
            if (!window.ethereum) {
                throw new Error("MetaMask is not installed. Please install MetaMask to use this feature.");
            }

            // Create a BrowserProvider
            const provider = new BrowserProvider(window.ethereum);

            // Request account access
            const accounts = await provider.send("eth_requestAccounts", []);
            const fromAddress = accounts[0];

            // Create transaction object
            const signer = await provider.getSigner();
            const amountInWei = BigInt(Math.floor(Number(amount) * 1e18));

            // Send transaction
            const tx = await signer.sendTransaction({
                to: toAddress,
                value: amountInWei
            });

            // Wait for transaction to be mined
            await tx.wait();

            setSuccess(`Transfer successful. Transaction hash: ${tx.hash}`);
            setToAddress('');
            setAmount('');
        } catch (error) {
            console.error('Transfer failed:', error);
            setError(error instanceof Error ? error.message : 'An error occurred while transferring');
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <main className="bg-gray-100 text-gray-900 min-h-screen flex flex-col items-center py-16">
            <div className="container mx-auto text-center px-6 max-w-md">
                <h1 className="text-4xl font-bold text-primary mb-6">
                    Transfer Tokens
                </h1>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                        <p>{error}</p>
                    </div>
                )}
                
                {success && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
                        <p>{success}</p>
                    </div>
                )}
                
                <form onSubmit={handleTransfer} className="bg-white p-6 shadow-lg rounded-lg">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="toAddress">
                            Recipient Address
                        </label>
                        <input
                            type="text"
                            id="toAddress"
                            placeholder="0x..."
                            value={toAddress}
                            onChange={(e) => {
                                setToAddress(e.target.value);
                                setError('');
                                setSuccess('');
                            }}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                            Amount (ETH)
                        </label>
                        <input
                            type="text"
                            id="amount"
                            placeholder="0.01"
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                setError('');
                                setSuccess('');
                            }}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        disabled={isTransferring}
                    >
                        {isTransferring ? 'Processing...' : 'Transfer with MetaMask'}
                    </button>
                </form>
            </div>
        </main>
    );
}