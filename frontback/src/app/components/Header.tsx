"use client"; 

import Link from "next/link";
import { useGlobal } from "./GlobalContext";

export function Header() {
    const { account, connectWallet, disconnectWallet } = useGlobal();

    return (
        <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold">Besu Network Manager</h1>
                <nav className="space-x-4">
                    <Link href="/" className="hover:underline">
                        Home
                    </Link>
                    <Link href="/manager" className="hover:underline">
                        Manager
                    </Link>
                    <Link href="/faucet" className="hover:underline">
                        Faucet
                    </Link>
                    <Link href="/transfer" className="hover:underline">
                        Transfers
                    </Link>
                    <Link href="/balance" className="hover:underline">
                        Balance
                    </Link>

                </nav>

                <div>
                   {account ? (
                    <button onClick={disconnectWallet}>Disconnect {account}</button>
                   ) : (
                    <button onClick={connectWallet}>Connect</button>
                   )} 
                </div>
            </div>
        </header>
    )
}