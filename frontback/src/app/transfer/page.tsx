"use client";
import { useState } from "react";
import { useGlobal } from "../components/GlobalContext";
import { transferFrom } from "../../lib/index";

export default function Transfer() {
    const { account } = useGlobal();
    const [status, setStatus] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const from = formData.get("from") as string;
        const to = formData.get("to") as string;
        const amount = parseFloat(formData.get("amount") as string);

        if (!from || !to || isNaN(amount) || amount <= 0) {
            setStatus("Invalid input. Please check the details and try again.");
            return;
        }

        try {
            setIsLoading(true);
            setStatus(""); // Limpiar el estado anterior
            await transferFrom(from, to, amount);
            setStatus("Transaction successful!");
        } catch (error) {
            setStatus("Error: " + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <h1 className="text-3xl font-bold mb-8">Transfer Funds</h1>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
                    <div className="flex flex-col">
                        <label htmlFor="from" className="text-sm font-medium mb-1">
                            Sender Address:
                        </label>
                        <input
                            type="text"
                            id="from"
                            name="from"
                            required
                            className="border border-gray-300 p-2 rounded-md"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="to" className="text-sm font-medium mb-1">
                            Recipient Address:
                        </label>
                        <input
                            type="text"
                            id="to"
                            name="to"
                            required
                            className="border border-gray-300 p-2 rounded-md"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="amount" className="text-sm font-medium mb-1">
                            Amount (ETH):
                        </label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            step="0.0001"
                            required
                            className="border border-gray-300 p-2 rounded-md"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Processing..." : "Send"}
                    </button>
                </form>
            </div>

            {status && !isLoading && (
                <div
                    className={`p-4 rounded-md mt-4 ${status.startsWith("Error") ? "bg-red-500 text-white" : "bg-black text-white"
                        }`}
                >
                    <p>{status}</p>
                </div>
            )}
        </div>
    );
}