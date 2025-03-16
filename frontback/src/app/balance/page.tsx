"use client";
import { useState } from "react";
import { useGlobal } from "../components/GlobalContext";
import { getBalance } from "../../lib/index";

export default function Balance() {
    const [balance, setBalance] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { account } = useGlobal();

    async function handleSubmit(formData: FormData) {
        try {
            // Reiniciar estados de error y balance
            setError(null);
            setBalance(null);

            // Validar que la dirección no esté vacía
            const address = formData.get("account") as string;
            if (!address || address.trim() === "") {
                setError("Please enter a valid address.");
                return;
            }

            // Obtener el balance desde el servidor
            const result = await getBalance(formData);
            setBalance(result.balance);
        } catch (error) {
            // Capturar el error y mostrarlo en el estado
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("An unexpected error occurred.");
            }
        }
    }

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <div className="flex gap-4 items-center flex-col sm:flex-row">
                <h1>Balance</h1>
                <form action={handleSubmit}>
                    <div>
                        <label htmlFor="account">Address:</label>
                        <input
                            type="text"
                            id="account"
                            name="account"
                            defaultValue={account || ''}
                            required
                            className="border border-gray-300 p-2 rounded-md"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Request!
                    </button>
                </form>
                {balance && (
                    <div className="mt-4">
                        <p>Balance: {balance} ETH</p>
                    </div>
                )}
                {error && (
                    <div className="mt-4 text-red-500">
                        <p>Error: {error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}