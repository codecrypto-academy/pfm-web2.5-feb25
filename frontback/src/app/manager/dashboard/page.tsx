"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Node {
    name: string;
    port: string;
}

interface Network {
    name: string;
    chainId: string;
    nodes: Node[];
}

export default function ViewNetworks() {
    const [networks, setNetworks] = useState<Network[]>([]);
    const [error, setError] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [networkToDelete, setNetworkToDelete] = useState<string | null>(null);

    useEffect(() => {
        const fetchNetworks = async () => {
            try {
                const response = await fetch('/api');
                if (response.ok) {
                    const data = await response.json();
                    setNetworks(data);
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

    const handleDeleteNetwork = async () => {
        if (!networkToDelete) return;
        try {
            const response = await fetch('/api', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ networkName: networkToDelete }),
            });

            if (response.ok) {
                setNetworks(networks.filter(network => network.name !== networkToDelete));
                setShowConfirm(false);
                setNetworkToDelete(null);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete network');
            }
        } catch (error) {
            setError('An error occurred while deleting the network');
            console.error('Failed to delete network', error);
        }
    };

    const confirmDeleteNetwork = (networkName: string) => {
        setNetworkToDelete(networkName);
        setShowConfirm(true);
    };

    return (
        <main className="bg-gray-100 text-gray-900 min-h-screen flex flex-col items-center py-16 relative">
            <div className={`container mx-auto text-center px-6 ${showConfirm ? 'opacity-15' : ''}`}>
                <h1 className="text-4xl font-bold text-primary mb-6">
                    Networks Dashboard
                </h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <div className="bg-white p-6 shadow-lg rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Networks</h3>
                    {networks.length === 0 ? (
                        <div>
                            <p className="text-gray-500">No networks have been created yet.</p>
                            <Link href="/manager/create" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4 inline-block">
                                Create Network
                            </Link>
                        </div>
                    ) : (
                        <table className="min-w-full bg-white border border-gray-300">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="py-2 px-4 border-b">Network Name</th>
                                    <th className="py-2 px-4 border-b">Nodes</th>
                                    <th className="py-2 px-2 border-b w-1/3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {networks.map((network) => (
                                    <tr key={network.name} className="hover:bg-gray-100">
                                        <td className="border px-4 py-2 text-center">
                                            {network.name}
                                            <br />
                                            <span className="text-sm text-gray-500">Chain ID: {network.chainId}</span>
                                        </td>
                                        <td className="border px-4 py-2">
                                            <ul>
                                                {network.nodes.map((node, index) => (
                                                    <li key={index}>{node.name}:{node.port}</li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="border px-2 py-2">
                                            <div className="flex justify-center space-x-2">
                                                <Link href={`/manager/addnode?network=${network.name}`} className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-600">
                                                    Add Node
                                                </Link>
                                                <Link href={`/manager/deletenode?network=${network.name}`} className="bg-red-400 text-white px-4 py-2 rounded hover:bg-red-600">
                                                    Delete Node
                                                </Link>
                                                <button
                                                    onClick={() => confirmDeleteNetwork(network.name)}
                                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                                >
                                                    Delete Network
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showConfirm && (
                <div className="fixed inset-0 flex items-center justify-center bg-grey bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
                        <p className="mb-4">Are you sure you want to delete the network "{networkToDelete}"?</p>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleDeleteNetwork}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                Yes, Delete
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}