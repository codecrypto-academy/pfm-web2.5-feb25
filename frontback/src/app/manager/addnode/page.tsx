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

export default function AddNode() {
    const [network, setNetwork] = useState<Network | null>(null);
    const [nodeName, setNodeName] = useState('');
    const [nodePort, setNodePort] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
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
                    setError('Failed to fetch network');
                }
            } catch (error) {
                setError('An error occurred while fetching the network');
                console.error('Failed to fetch network', error);
            }
        };

        if (networkName) {
            fetchNetwork();
        }
    }, [networkName]);

    //Docker port requirements
    const validatePort = (port: string) => {
        const portNumber = parseInt(port, 10);
        return portNumber >= 1 && portNumber <= 65535;
    };

    const handleAddNode = async () => {
        if (!nodeName || !nodePort) {
            setError('Node name and port are required');
            return;
        }

        if (!validatePort(nodePort)) {
            setError('Invalid node port. Please use a port number between 1 and 65535.');
            return;
        }

        if (network?.nodes.some(node => node.name === nodeName || node.port === nodePort)) {
            setError('Node name or port already exists');
            return;
        }

        try {
            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ containerName: nodeName, networkName, nodeport: nodePort, networkPath: `networks/${networkName}` }),
            });

            if (response.ok) {
                setSuccess(`Node ${nodeName} added successfully.`);
                setNetwork({
                    name: network!.name,
                    nodes: [...network!.nodes, { name: nodeName, port: nodePort }]
                });
                setNodeName('');
                setNodePort('');
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to add node');
            }
        } catch (error) {
            setError('An error occurred while adding the node');
            console.error('Failed to add node', error);
        }
    };

    return (
        <main className="bg-gray-100 text-gray-900 min-h-screen flex flex-col items-center py-16">
            <div className="container mx-auto text-center px-6">
                <h1 className="text-4xl font-bold text-primary mb-6">
                    Add Node to {network?.name}
                </h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}
                <div className="bg-white p-6 shadow-lg rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Current Nodes</h3>
                    {network ? (
                        <table className="min-w-full bg-white border border-gray-300 mb-6">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="py-2 px-4 border-b">Node Name</th>
                                    <th className="py-2 px-4 border-b">Port</th>
                                </tr>
                            </thead>
                            <tbody>
                                {network.nodes.map((node, index) => (
                                    <tr key={index} className="hover:bg-gray-100">
                                        <td className="border px-4 py-2">{node.name}</td>
                                        <td className="border px-4 py-2">{node.port}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-500">Loading network...</p>
                    )}
                    <div className="mb-4">
                        <label className="block text-left mb-2">Node Name</label>
                        <input
                            type="text"
                            value={nodeName}
                            onChange={(e) => {
                                setNodeName(e.target.value);
                                setError('');
                                setSuccess('');
                            }}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-left mb-2">Node Port</label>
                        <input
                            type="text"
                            value={nodePort}
                            onChange={(e) => {
                                setNodePort(e.target.value);
                                setError('');
                                setSuccess('');
                            }}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                    <button
                        onClick={handleAddNode}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add Node
                    </button>
                </div>
            </div>
        </main>
    );
}