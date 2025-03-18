"use client";

import { useState } from 'react';
import { faucetSubmit} from '@/lib/actions'
import { useGlobal } from '@/context/GlobalContext'

export default function FaucetPage() {
    const [status, setStatus] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const {account} = useGlobal();
    
    async function handleSubmit(formData: FormData) {
      try{
        setIsLoading(true);
        await faucetSubmit(formData);
        setStatus('✅ Successfully sent 5 ETH!');
        setIsLoading(false);
      } catch(error) {
        setStatus('❌ Error: ' + (error as Error).message);
      }
    }
    return (
        <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold">Faucet</h1>
        <p>Request funds for your account.</p>
        <br/>
        <form action={handleSubmit} className='space-y-4'>
        <div>
            <label htmlFor="account" className="block mb-2">Recipient Account: </label>
            <input type="text" id="account" name="account" defaultValue={account || ''} className="w-full p-2 border rounder" required />
        </div>
        <button type='submit' className='bg-blue-200 text-black px-4 py-2 rounded'>
        Requiere 5 ETH
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
