"use client";
import { useState } from "react";
import { useGlobal } from "../components/GlobalContext";
import { getBalance } from "../../lib/index"

export default function Balance(){
    const [balance, setBalance]= useState<string |null>(null);
    const {account} = useGlobal();
    async function handleSubmit(formData:FormData) {
        const result = await getBalance(formData);
        setBalance(result.balance);

        
    }

    return(
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
                        />
                    </div>
                    <button type="submit">Request!</button>
                </form>
                {balance &&(
                    <div className="grid grid-rows-[20px_1fr_20px]" >
                        <p>Balance : {balance} ETH</p>
                    </div>
                )}
                
            </div>
        </div>
    )
}