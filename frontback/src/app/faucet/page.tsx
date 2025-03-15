"use client";
import { useState } from "react";
import { useGlobal } from "../components/GlobalContext";
import { faucetSubmit } from "../../lib/index"

export default function Faucet() {
    const { account } = useGlobal();
    const [status, setStatus] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        try {
            setIsLoading(true);
            await faucetSubmit(formData);
            setStatus('successfully sent!');
            setIsLoading(false);

        } catch (error) {
            setStatus('Error: ' + (error as Error).message);
        }
    }

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <div className="flex gap-4 items-center flex-col sm:flex-row">
                <h1>Faucet</h1>
                <form action={handleSubmit}>
                    <div>
                        <label htmlFor="account">Recipient Address:</label>
                        <input
                            type="text"
                            id="account"
                            name="account"
                            defaultValue={account || ''}
                            required
                        />
                    </div>
                    <button type="submit">Request!</button>
                </form>
                {status && !isLoading && (
                    <div>
                        <p>{status}</p>
                    </div>
                )}
            </div>
        </div>
    )
}