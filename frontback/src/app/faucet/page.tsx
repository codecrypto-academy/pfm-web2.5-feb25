"use client";
import { useState } from "react";
import { useGlobal } from "../components/GlobalContext";
import { faucetSubmit } from "../../lib/index";

export default function Faucet() {
    const { account } = useGlobal();
    const [status, setStatus] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        try {
            setIsLoading(true);
            setStatus(""); // Limpiar el estado anterior

            // Validar que la dirección no esté vacía
            const address = formData.get("account") as string;
            if (!address || address.trim() === "") {
                setStatus("Error: Please enter a valid address.");
                return;
            }

            await faucetSubmit(formData);
            setStatus("Successfully sent!");
        } catch (error) {
            setStatus("Error: " + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <h1 className="text-3xl font-bold mb-8">Faucet</h1>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <form action={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="account" className="text-sm font-medium mb-1">
                            Recipient Address:
                        </label>
                        <input
                            type="text"
                            id="account"
                            name="account"
                            defaultValue={account || ""}
                            required
                            className="border border-gray-300 p-2 rounded-md"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-6 sm:mt-0"
                    >
                        {isLoading ? "Processing..." : "Request!"}
                    </button>
                </form>
            </div>

            {status && !isLoading && (
                <div
                    className={`p-4 rounded-md mt-4 ${
                        status.startsWith("Error") ? "bg-red-500 text-white" : "bg-black text-white"
                    }`}
                >
                    <p>{status}</p>
                </div>
            )}
        </div>
    );
}