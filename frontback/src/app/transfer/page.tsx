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
            <div className="flex gap-4 items-center flex-col sm:flex-row">
                <h1>Transfer Funds</h1>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="from">Sender Address:</label>
                        <input type="text" id="from" name="from" required />
                    </div>
                    <div>
                        <label htmlFor="to">Recipient Address:</label>
                        <input type="text" id="to" name="to" required />
                    </div>
                    <div>
                        <label htmlFor="amount">Amount (ETH):</label>
                        <input type="number" id="amount" name="amount" step="0.0001" required />
                    </div>
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? "Processing..." : "Send"}
                    </button>
                </form>
                {status && !isLoading && (
                    <div>
                        <p>{status}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
