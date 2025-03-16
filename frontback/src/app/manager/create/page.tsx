"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateNetwork() {
    const [networkName, setNetworkName] = useState('');
    const [chainId, setChainId] = useState('');
    const [subnet, setSubnet] = useState('');
    const [bootnode, setBootnode] = useState({ name: '', port: '' });
    const [nodes, setNodes] = useState([{ name: '', port: '' }]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();

    //Docker Subnet requirements
    const validateSubnet = (subnet: string) => {
        const subnetRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$/;
        if (!subnetRegex.test(subnet)) {
            return false;
        }

        const [ip, prefix] = subnet.split('/');
        const octets = ip.split('.').map(Number);
        const prefixNumber = parseInt(prefix, 10);

        if (octets.some(octet => octet < 0 || octet > 255)) {
            return false;
        }

        if (prefixNumber < 1 || prefixNumber > 32) {
            return false;
        }

        return true;
    };

    //Docker port requirements
    const validatePort = (port: string) => {
        const portNumber = parseInt(port, 10);
        return portNumber >= 1 && portNumber <= 65535;
    };

    const handleNodeChange = (index: number, field: string, value: string) => {
        const newNodes = [...nodes];
        newNodes[index][field as keyof typeof newNodes[number]] = value;
        setNodes(newNodes);
    };

    const addNodeField = () => {
        setNodes([...nodes, { name: '', port: '' }]);
    };

    const removeNodeField = (index: number) => {
        const newNodes = nodes.filter((_, i) => i !== index);
        setNodes(newNodes);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsCreating(true);

        if (!validateSubnet(subnet)) {
            setError('Invalid subnet format. Please use a valid subnet (e.g., 172.20.0.0/16).');
            setIsCreating(false);
            return;
        }

        if (!bootnode.name || !bootnode.port) {
            setError('Bootnode is required. Please provide a name and port for the bootnode.');
            setIsCreating(false);
            return;
        }

        if (!validatePort(bootnode.port)) {
            setError('Invalid bootnode port. Please use a port number between 1 and 65535.');
            setIsCreating(false);
            return;
        }

        // All requirements filled validation
        for (const node of nodes) {
            if ((node.name && !node.port) || (!node.name && node.port)) {
                setError('Nodes must have both name and port filled.');
                setIsCreating(false);
                return;
            }
            if (node.port && !validatePort(node.port)) {
                setError('Invalid node port. Please use a port number between 1 and 65535.');
                setIsCreating(false);
                return;
            }
        }

        // Unique node names and ports validation
        const allNodes = [{ name: bootnode.name, port: bootnode.port }, ...nodes.filter(node => node.name && node.port)];
        const names = allNodes.map(node => node.name);
        const ports = allNodes.map(node => node.port);

        if (new Set(names).size !== names.length) {
            setError('Node names must be unique.');
            setIsCreating(false);
            return;
        }

        if (new Set(ports).size !== ports.length) {
            setError('Node ports must be unique.');
            setIsCreating(false);
            return;
        }

        // API-call
        try {
            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ networkName, chainId, subnet, bootnode, nodes: nodes.filter(node => node.name && node.port) }),
            });

            if (response.ok) {
                setSuccess(`Network ${networkName} created successfully.`);
                setTimeout(() => {
                    router.push('/manager');
                }, 3000);
            } else {
                const data = await response.json();
                if (data.error.includes('already exists') || data.error.includes('Port') || data.error.includes('Node name')) {
                    setPopupMessage(data.error);
                    setShowPopup(true);
                } else {
                    setError(data.error || 'Failed to create network');
                }
            }
        } catch (error) {
            setError('An error occurred while creating the network');
            console.error('Failed to create network', error);
        } finally {
            setIsCreating(false);
        }
    };


    return (
        <main className="bg-gray-100 text-gray-900 min-h-screen flex flex-col items-center py-16">
            <div className={`container mx-auto text-center px-6 ${showPopup ? 'opacity-40' : ''}`}>
                <h1 className="text-4xl font-bold text-primary mb-6">
                    Create Network
                </h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}  {/* Error display */}
                {success && <p className="text-green-500 mb-4">{success}</p>} {/*Success display*/}
                {isCreating && <p className="text-blue-500 mb-4">Creating network, please wait...</p>} {/*Loading display*/}
                <form onSubmit={handleSubmit} className="bg-white p-6 shadow-lg rounded-lg">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="networkName">
                            Network Name
                        </label>
                        <input
                            type="text"
                            id="networkName"
                            value={networkName}
                            onChange={(e) => setNetworkName(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-4 flex space-x-2">
                        <div className="w-1/2">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="chainId">
                                Chain ID
                            </label>
                            <input
                                type="text"
                                id="chainId"
                                value={chainId}
                                onChange={(e) => setChainId(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subnet">
                                Subnet
                            </label>
                            <input
                                type="text"
                                id="subnet"
                                value={subnet}
                                onChange={(e) => setSubnet(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Bootnode (Required)
                        </label>
                        <div className="mb-2 flex space-x-2">
                            <input
                                type="text"
                                placeholder="Bootnode Name"
                                value={bootnode.name}
                                onChange={(e) => setBootnode({ ...bootnode, name: e.target.value })}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Bootnode Port"
                                value={bootnode.port}
                                onChange={(e) => setBootnode({ ...bootnode, port: e.target.value })}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Nodes
                        </label>
                        {nodes.map((node, index) => (
                            <div key={index} className="mb-2 flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Node Name"
                                    value={node.name}
                                    onChange={(e) => handleNodeChange(index, 'name', e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                <input
                                    type="text"
                                    placeholder="Node Port"
                                    value={node.port}
                                    onChange={(e) => handleNodeChange(index, 'port', e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeNodeField(index)}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addNodeField}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Add Node
                        </button>
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Create Network
                    </button>
                </form>
            </div>

            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-grey bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Error</h2>
                        <p className="text-red-400 mb-4">{popupMessage}</p>
                        <button
                            onClick={() => setShowPopup(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}