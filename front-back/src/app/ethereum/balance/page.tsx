"use client";

import { useState } from 'react';
import { balanceSubmit} from '@/lib/actions'
import { useGlobal } from '@/context/GlobalContext'


export default function BalancePage() {
    const [balance, setBalance] = useState<string | null>(null);
    const {account} = useGlobal();
    
    async function handleSubmit(formData: FormData) {
      const result = await balanceSubmit(formData);
      setBalance(result.balance);
    }

    return (
        <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold">Check Balance</h1>
        <p>Check the funds in your account.</p>
        <br/>
        <form action={handleSubmit} className='space-y-4'>
        <div>
            <label htmlFor="account" className="block mb-2">Account: </label>
            <input type="text" id="account" name="account" defaultValue={account || ''} className="w-full p-2 border rounder" required />
        </div>
        <button type='submit' className='bg-purple-200 text-black px-4 py-2 rounded'>
        Check Balance
        </button>
        </form>
        {balance && (
          <div className='mt-4'>
            <p>💰 Balance: {balance} ETH</p>
          </div>)
        }
        </div>
    );
  }