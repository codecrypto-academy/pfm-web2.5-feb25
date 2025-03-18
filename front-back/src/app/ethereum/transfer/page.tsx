"use client";

import { useState } from 'react';
import { balanceSubmit} from '@/lib/actions'
import { useGlobal } from '@/context/GlobalContext'

declare global {
  interface Window {
    ethereum?: any; // o un tipo más específico si lo conoces
  }
}


export default function TransferPage() {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const {account} = useGlobal();

  async function handleSubmit(formData: FormData) {
      try {
        if (typeof window !== 'undefined' && !window.ethereum) {
          throw new Error("Please install MetaMask");
        }
    
        const ethereum = window.ethereum;
        const amount = formData.get("amount");
        const toAccount = formData.get("toAccount");
    
        if (!account) {
          throw new Error("Please connect your wallet first");
        }
    
        // Create transaction parameters
        const transactionParameters = {
          from: account,
          to: toAccount,
          value: "0x" + (Number(amount) * 1e18).toString(16), // Convert ETH to Wei
        };
    
        //Send transaction via Metamask
        await ethereum.request({
          method: "eth_sendTransaction",
          params: [transactionParameters]
        });
        setStatus('✅ Transfer Successfully!');

      } catch (error) {
        setStatus('❌ Error: ' + (error as Error).message);
      }
    }

    return (
        <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold">Transfer ETH</h1>
        <p>Transfer funds.</p>
        <br/>
        <form action={handleSubmit} className='space-y-4'>
        <div>
            <label htmlFor="account1" className="block mb-2">From Account: </label>
            <input type="text" id="fromAccount" name="fromAccount" defaultValue={account || ''} className="w-full p-2 border rounder" required />
        </div>
        <div>
            <label htmlFor="accoun2" className="block mb-2">To Account: </label>
            <input type="text" id="toAccount" name="toAccount" defaultValue={''} className="w-full p-2 border rounder" required />
        </div>
        <div>
            <label htmlFor="amount" className="block mb-2">Amount (ETH): </label>
            <input type="number" id="amount" name="amount" step="0.000000000000000001" className="w-full p-2 border rounder" required />
        </div>
        <button type='submit' className='bg-green-200 text-black px-4 py-2 rounded'>
        Transfer
        </button>
        </form>
        {status && (
          <div className='mt-4'>
            <p>{status}</p>
          </div>)
        }
        </div>
    );
  }