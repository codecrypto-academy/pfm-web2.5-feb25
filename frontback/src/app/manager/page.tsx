"use client";
import { useState, useEffect } from "react";
import {
    launchNewNode,
    deleteNode,
    getBalance,
    getAllBalances,
    getNodeAddress,
    newNetwork,
    shutDown,
} from "../../lib/index";

type NodeBalance = {
    nodeName: string;
    address: string;
    balance: string;
};

export default function Manager() {
    const [status, setStatus] = useState<string>("");
    const [isLaunching, setIsLaunching] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [nodeId, setNodeId] = useState("");
    const [nodeBalances, setNodeBalances] = useState<NodeBalance[]>([]);

    // Fetch node balances on component mount
    useEffect(() => {
        fetchNodeBalances();
    }, []);

    // Function to fetch node balances
    async function fetchNodeBalances() {
        try {
            const balances = await getAllBalances();
            console.log("Fetched balances:", balances);
            setNodeBalances(balances);
        } catch (error) {
            console.error("Failed to fetch node balances:", error);
            setStatus("Error: Failed to fetch node balances.");
        }
    }

    function extractFinalOutput(output: string): string {
        const nodeMatch = output.match(/Node(\d+) created and started successfully!/);
        const endpointMatch = output.match(/RPC endpoint: (http:\/\/localhost:\d+)/);
        if (nodeMatch && endpointMatch) {
            return `Node ${nodeMatch[1]} - RPC: ${endpointMatch[1]}`;
        }
        return "Error parsing response";
    }

    function extractDeleteOutput(output: string): string {
        const deleteMatch = output.match(/Nodo (node\d+) eliminado exitosamente\./);
        if (deleteMatch) {
            return `${deleteMatch[1]} successfully deleted.`;
        }
        return "Error parsing response";
    }

    async function handleLaunchNode() {
        try {
            setIsLaunching(true);
            setStatus("");
            const result = await launchNewNode();
            setStatus(extractFinalOutput(result));
            // Refresh node balances after launching a new node
            await fetchNodeBalances();
        } catch (error) {
            setStatus("Error: " + (error as Error).message);
        } finally {
            setIsLaunching(false);
        }
    }

    async function handleDeleteNode(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!nodeId) {
            setStatus("Please enter a node ID.");
            return;
        }
        if (nodeId === "node1") {
            setStatus("Node 1 is the validator node; it cannot be deleted.");
            return;
        }
        try {
            setIsDeleting(true);
            setStatus("");

            // Get the node's address
            const nodeAddress = await getNodeAddress(nodeId);

            // Check balance before deletion
            const formData = new FormData();
            formData.append("account", nodeAddress);
            const balance = await getBalance(formData);

            // Convert balance from hexadecimal to decimal
            const balanceInWei = parseInt(balance.balance, 16);

            // If the node has funds, ask for confirmation
            if (balanceInWei !== 0) {
                const confirmDelete = window.confirm(
                    `The node ${nodeId} has funds (${balanceInWei} Wei). Do you wish to proceed with the deletion?`
                );
                if (!confirmDelete) {
                    setIsDeleting(false);
                    return;
                }
            }

            // Delete the node
            const result = await deleteNode(nodeId);
            setStatus(extractDeleteOutput(result));

            // Refresh node balances after deleting a node
            await fetchNodeBalances();
        } catch (error) {
            setStatus("Error: " + (error as Error).message);
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleNewNetwork() {
        try {
            setStatus("Creating new network...");
            const result = await newNetwork();

            // Verificar si el resultado contiene el mensaje de éxito
            if (result.includes("Archivo .env creado exitosamente en")) {
                setStatus("New network created successfully!");
            } else {
                setStatus("Error: Network creation did not complete successfully.");
            }

            // Refresh node balances after creating a new network
            await fetchNodeBalances();
        } catch (error) {
            setStatus("Error: " + (error as Error).message);
        }
    }

    async function handleShutDown() {
        try {
            setStatus("Shutting down network...");
            const result = await shutDown();
            setStatus(result);
            // Refresh node balances after shutting down the network
            await fetchNodeBalances();
        } catch (error) {
            setStatus("Error: " + (error as Error).message);
        }
    }

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <h1 className="text-3xl font-bold mb-8">Node Manager</h1>

            {/* Network Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                    onClick={handleNewNetwork}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                    Create New Network
                </button>
                <button
                    onClick={handleShutDown}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                >
                    Shut Down Network
                </button>
            </div>

            {/* Node Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                    onClick={handleLaunchNode}
                    disabled={isLaunching || isDeleting}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isLaunching ? "Launching..." : "Launch New Node"}
                </button>
                <form onSubmit={handleDeleteNode} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="nodeId" className="text-sm font-medium mb-1">
                            Node ID:
                        </label>
                        <input
                            type="text"
                            id="nodeId"
                            name="nodeId"
                            value={nodeId}
                            onChange={(e) => setNodeId(e.target.value)}
                            required
                            className="border border-gray-300 p-2 rounded-md"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isDeleting || isLaunching}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-6 sm:mt-0"
                    >
                        {isDeleting ? "Deleting..." : "Delete Node"}
                    </button>
                </form>
            </div>

            {/* Status Message */}
            {status && !isLaunching && !isDeleting && (
                <div className="bg-black text-white p-4 rounded-md mt-4">
                    <p>{status}</p>
                </div>
            )}

            {/* Node Balances Table */}
            <div className="w-full max-w-4xl mt-8">
                <h2 className="text-xl font-bold mb-4">Nodes</h2>
                {nodeBalances.length > 0 ? (
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-black text-white">
                                <th className="border border-gray-300 p-2">Node Name</th>
                                <th className="border border-gray-300 p-2">Address</th>
                                <th className="border border-gray-300 p-2">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nodeBalances.map((node, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 p-2 text-center">{node.nodeName}</td>
                                    <td className="border border-gray-300 p-2 text-center">{node.address}</td>
                                    <td className="border border-gray-300 p-2 text-center">{node.balance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No nodes created.</p>
                )}
            </div>
        </div>
    );
}