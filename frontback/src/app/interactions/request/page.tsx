"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Network {
    name: string;
}

export default function RequestTokens() {
    const [networks, setNetworks] = useState<Network[]>([]);
    const [selectedNetwork, setSelectedNetwork] = useState<string>('');
    const [toAddress, setToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isRequesting, setIsRequesting] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const networkName = searchParams.get('network');

    useEffect(() => {
        const fetchNetworks = async () => {
            try {
                const response = await fetch('/api');
                if (response.ok) {
                    const data = await response.json();
                    setNetworks(data);
                    const savedNetwork = localStorage.getItem('selectedNetwork');
                    if (savedNetwork) {
                        setSelectedNetwork(savedNetwork);
                    }
                } else {
                    setError('Failed to fetch networks');
                }
            } catch (error) {
                setError('An error occurred while fetching networks');
                console.error('Failed to fetch networks', error);
            }
        };

        fetchNetworks();
    }, []);

    const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const network = e.target.value;
        setSelectedNetwork(network);
        localStorage.setItem('selectedNetwork', network);
    };

    const handleRequestTokens = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsRequesting(true);

        if (!toAddress || !amount) {
            setError('Address and amount are required.');
            setIsRequesting(false);
            return;
        }

        if (!/^(0x)?[0-9a-fA-F]{40}$/.test(toAddress)) {
            setError('Invalid address format.');
            setIsRequesting(false);
            return;
        }

        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            setError('Invalid amount.');
            setIsRequesting(false);
            return;
        }

        try {
            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ networkName: selectedNetwork, to: toAddress, amount }),
            });

            if (response.ok) {
                setSuccess('Tokens requested successfully.');
                setToAddress('');
                setAmount('');
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to request tokens.');
            }
        } catch (error) {
            setError('An error occurred while requesting tokens.');
            console.error('Failed to request tokens', error);
        } finally {
            setIsRequesting(false);
        }
    };

    return (
        <main className="bg-gray-100 text-gray-900 min-h-screen flex flex-col items-center py-16">
            <div className="container mx-auto text-center px-6">
                <h1 className="text-4xl font-bold text-primary mb-6">
                    Request Tokens
                </h1>

                <div className="mb-8">
                    <label htmlFor="network" className="block text-gray-700 text-sm font-bold mb-2">
                        Select Network
                    </label>
                    <select
                        id="network"
                        value={selectedNetwork}
                        onChange={handleNetworkChange}
                        className="shadow appearance-none border rounded w-auto py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mx-auto"
                        style={{ textAlign: 'center' }}
                    >
                        <option value="">Select a network</option>
                        {networks.map((network) => (
                            <option key={network.name} value={network.name}>
                                {network.name}
                            </option>
                        ))}
                    </select>
                </div>

                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}
                <form onSubmit={handleRequestTokens} className="bg-white p-6 shadow-lg rounded-lg">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="toAddress">
                            To Address
                        </label>
                        <input
                            type="text"
                            id="toAddress"
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
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                            Amount
                        </label>
                        <input
                            type="text"
                            id="amount"
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
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        disabled={isRequesting}
                    >
                        {isRequesting ? 'Requesting...' : 'Request Tokens'}
                    </button>
                </form>
            </div>
        </main>
    );
}