"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Network {
    name: string;
}

export default function Interactions() {
    const [networks, setNetworks] = useState<Network[]>([]);
    const [selectedNetwork, setSelectedNetwork] = useState<string>('');
    const [error, setError] = useState('');

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

    return (
        <main className="bg-gray-100 text-gray-900 min-h-screen flex flex-col items-center py-16">
            <div className="container mx-auto text-center px-6">
                <h1 className="text-4xl font-bold text-primary mb-6">
                    Interactions
                </h1>
                <p className="text-lg text-gray-700 mb-8">
                    Perform blockchain transactions, request tokens from providers, and query account balances with ease.
                </p>

                {error && <p className="text-red-500 mb-4">{error}</p>}

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

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-white p-6 shadow-lg rounded-lg">
                        <h3 className="text-xl font-semibold mb-4">Transfer Tokens</h3>
                        <p className="text-gray-600 mb-4">Send tokens from one address to another quickly and securely.</p>
                        <Link
                            href={`/interactions/transfer?network=${selectedNetwork}`}
                            className={`inline-block px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-primary-dark ${!selectedNetwork ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={(e) => !selectedNetwork && e.preventDefault()}
                        >
                            Transfer Tokens
                        </Link>
                    </div>
                    
                    <div className="bg-white p-6 shadow-lg rounded-lg">
                        <h3 className="text-xl font-semibold mb-4">Request Tokens</h3>
                        <p className="text-gray-600 mb-4">Request tokens from your provider for your network or personal wallet.</p>
                        <Link
                            href={`/interactions/request?network=${selectedNetwork}`}
                            className={`inline-block px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 ${!selectedNetwork ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={(e) => !selectedNetwork && e.preventDefault()}
                        >
                            Request Tokens
                        </Link>
                    </div>

                    <div className="bg-white p-6 shadow-lg rounded-lg">
                        <h3 className="text-xl font-semibold mb-4">Check Balances</h3>
                        <p className="text-gray-600 mb-4">Get real-time information on the balances of your blockchain addresses.</p>
                        <Link
                            href={`/interactions/balance?network=${selectedNetwork}`}
                            className={`inline-block px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-gray-700 ${!selectedNetwork ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={(e) => !selectedNetwork && e.preventDefault()}
                        >
                            Check Balances
                        </Link>
                    </div>
                </div>

                <p className="text-lg text-gray-700 mb-8">
                    Take control of your blockchain interactions: from transferring tokens to checking balances, everything you need is available in one place.
                </p>

                <div className="space-x-4">
                    <Link href="/manager" className="inline-block px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                        Go to Network Manager
                    </Link>
                </div>
            </div>
        </main>
    );
}