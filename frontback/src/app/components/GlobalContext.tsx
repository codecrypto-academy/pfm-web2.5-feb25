"use client"; 

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string }) => Promise<string[]>;
            on: (event: string, callback: (...args: any[]) => void) => void;
            removeListener: (event: string, callback: (...args: any[]) => void) => void;
        };
    }
}

interface GlobalContextType {
    account: string | null;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    error: string | null;
}

const GlobalContext = createContext<GlobalContextType>({
    account: null,
    connectWallet: async () => { },
    disconnectWallet: () => { },
    error: null,
});

export function useGlobal() {
    return useContext(GlobalContext);
}

interface GlobalProviderProps {
    children: ReactNode;
}

export function GlobalProvider({ children }: GlobalProviderProps) {
    const [account, setAccount] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const connectWallet = async () => {
        if (typeof window.ethereum !== "undefined") {
            try {
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });
                setAccount(accounts[0]);
                setError(null);
            } catch (error) {
                console.error("Error connecting to MetaMask", error);
                setError("Failed to connect to MetaMask. Please try again.");
            }
        } else {
            console.error("Please install MetaMask");
            setError("MetaMask is not installed. Please install it to continue.");
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
    };

    useEffect(() => {
        if (typeof window.ethereum !== "undefined") {
            const handleAccountsChanged = (accounts: string[]) => {
                setAccount(accounts[0] || null);
            };

            window.ethereum.on("accountsChanged", handleAccountsChanged);

            return () => {
                window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
            };
        }
    }, []);

    return (
        <GlobalContext.Provider value={{ account, connectWallet, disconnectWallet, error }}>
            {children}
        </GlobalContext.Provider>
    );
}