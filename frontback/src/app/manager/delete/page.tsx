"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteNetwork() {
    const [networkName, setNetworkName] = useState('');
    const [nodes, setNodes] = useState<{ name: string, port: string }[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            const response = await fetch('/api', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ networkName }),
            });

            if (response.ok) {
                setSuccess(`Network ${networkName} and its nodes deleted successfully.`);
                setNetworkName('');
                setNodes([]);
                setTimeout(() => {
                    router.push('/manager');
                }, 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete network');
            }
        } catch (error) {
            setError('An error occurred while deleting the network');
            console.error('Failed to delete network', error);
        } finally {
            setIsDeleting(false);
            setShowPopup(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`/api?networkName=${networkName}`);
            if (response.ok) {
                const data = await response.json();
                setNodes(data);
                setShowPopup(true);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to fetch nodes');
            }
        } catch (error) {
            setError('An error occurred while fetching nodes');
            console.error('Failed to fetch nodes', error);
        }
    };

    return (
        <main className="bg-gray-100 text-gray-900 min-h-screen flex flex-col items-center py-16">
            <div className={`container mx-auto text-center px-6 ${showPopup ? 'opacity-40' : ''}`}>
                <h1 className="text-4xl font-bold text-primary mb-6">
                    Delete Network
                </h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}
                {isDeleting && <p className="text-blue-500 mb-4">Deleting network, please wait...</p>}
                <form onSubmit={handleSubmit} className="bg-white p-6 shadow-lg rounded-lg">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="networkName">
                            Network Name
                        </label>
                        <input
                            type="text"
                            id="networkName"
                            value={networkName}
                            onChange={(e) => {
                                setNetworkName(e.target.value);
                                setError('');
                                setSuccess('');
                            }}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                    >
                        Delete Network
                    </button>
                </form>
            </div>

            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-grey bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
                        <p className="mb-4">Are you sure you want to delete the network "{networkName}"?</p>
                        {nodes.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold">Active Nodes:</h3>
                                <ul className="list-disc list-inside">
                                    {nodes.map((node, index) => (
                                        <li key={index}>{node.name}:{node.port}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="flex space-x-4">
                            <button
                                onClick={handleDelete}
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