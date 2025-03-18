"use client";  

import detectEthereumProvider from '@metamask/detect-provider';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GlobalContextType {
  account: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const GlobalContext = createContext<GlobalContextType>({
  account: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export function useGlobal() {
  return useContext(GlobalContext);
}

interface GlobalProviderProps {
  children: ReactNode;
}

export function GlobalProvider({ children }: GlobalProviderProps) {
  const [account, setAccount] = useState<string | null>(null);

  
  const connectWallet = async () => {
    const provider: any = await detectEthereumProvider();

    if (provider) {
      try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error('Error connecting to MetaMask', error);
      }
    } else {
      console.error('Please install MetaMask');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
  };

  useEffect(() => {
    const initProvider = async () => {
      const provider: any = await detectEthereumProvider();
      if (provider) {
        provider.on('accountsChanged', (accounts: string[]) => {
          setAccount(accounts[0] || null);
        });

        return () => {
          provider.removeListener('accountsChanged', () => {});
        };
      }
    };

    initProvider();
  }, []);

  const value = {
    account,
    connectWallet,
    disconnectWallet,
  };

  return (
    <GlobalContext.Provider value={{account, connectWallet, disconnectWallet}}>
      {children}
    </GlobalContext.Provider>
  );
}