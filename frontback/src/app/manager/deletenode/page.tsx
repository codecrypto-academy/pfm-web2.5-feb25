"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Node {
    name: string;
    port: string;
}

interface Network {
    name: string;
    nodes: Node[];
}

export default function DeleteNode() {
    const [network, setNetwork] = useState<Network | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const networkName = searchParams.get('network');

    useEffect(() => {
        const fetchNetwork = async () => {
            try {
                const response = await fetch(`/api?networkName=${networkName}`);
                if (response.ok) {
                    const data = await response.json();
                    setNetwork({ name: networkName!, nodes: data });
                } else {
                    setError('Failed to fetch networks');
                }
            } catch (error) {
                setError('An error occurred while fetching networks');
                console.error('Failed to fetch networks', error);
            }
        };
        if (networkName) {
            fetchNetwork();
        }
    }, [networkName]);

    const handleDeleteNode = async () => {
        if (!nodeToDelete || !network) return;
        setError('');
        setSuccess('');
        setIsDeleting(true);

        try {
            const response = await fetch('/api', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ containerName: nodeToDelete, networkName }),
            });

            if (response.ok) {
                setSuccess(`Node ${nodeToDelete} deleted successfully.`);
                setNetwork({
                    ...network,
                    nodes: network.nodes.filter(node => node.name !== nodeToDelete)
                });
                setNodeToDelete(null);
                setShowPopup(false);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete node');
            }
        } catch (error) {
            setError('An error occurred while deleting the node');
            console.error('Failed to delete node', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmDeleteNode = (nodeName: string) => {
        setNodeToDelete(nodeName);
        setShowPopup(true);
    };

    return (
        <main className="bg-gray-100 text-gray-900 min-h-screen flex flex-col items-center py-16">
            <div className={`container mx-auto text-center px-6 ${showPopup ? 'opacity-40' : ''}`}>
                <h1 className="text-4xl font-bold text-primary mb-6">
                    Delete Node
                </h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}
                {isDeleting && <p className="text-blue-500 mb-4">Deleting node, please wait...</p>}
                <div className="bg-white p-6 shadow-lg rounded-lg">
                <h3 className="text-xl font-semibold mb-4">{network?.name}</h3>
                    {network ? (
                        <table className="min-w-full bg-white border border-gray-300">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="py-2 px-4 border-b">Node Name</th>
                                    <th className="py-2 px-4 border-b">Port</th>
                                    <th className="py-2 px-2 border-b w-1/3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {network.nodes.map((node, index) => (
                                    <tr key={index} className="hover:bg-gray-100">
                                        <td className="border px-4 py-2">{node.name}</td>
                                        <td className="border px-4 py-2">{node.port}</td>
                                        <td className="border px-2 py-2">
                                            <button
                                                onClick={() => confirmDeleteNode(node.name)}
                                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-500">Loading network...</p>
                    )}
                </div>
            </div>

            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-grey bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
                        <p className="mb-4">Are you sure you want to delete the node "{nodeToDelete}" from network "{network?.name}"?</p>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleDeleteNode}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                Yes, Delete
                            </button>
                            <button
                                onClick={() => setShowPopup(false)}
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