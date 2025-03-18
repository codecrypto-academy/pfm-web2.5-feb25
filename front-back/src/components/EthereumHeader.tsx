"use client";
import Link from "next/link";
import { Button } from "./ui/button";
import { useGlobal } from "@/context/GlobalContext";

export default function EthereumHeader() {
  const { account, connectWallet, disconnectWallet } = useGlobal();

  console.log("Account: ", account);  // Verifica si el valor de account cambia
  console.log("ConnectWallet function: ", connectWallet);  // Verifica si la función está disponible

  return (
    <header className="border-b">
      <div className="container flex h-14 items-center">
        <nav className="flex items-center space-x-4">
          <Link href="/ethereum">
            <Button variant="ghost">Home</Button>
          </Link>
          <Link href="/ethereum/faucet">
            <Button variant="ghost">Faucet</Button>
          </Link>
          <Link href="/ethereum/balance">
            <Button variant="ghost">Balance</Button>
          </Link>
          <Link href="/ethereum/transfer">
            <Button variant="ghost">Transfer</Button>
          </Link>
        </nav>
        <div className="ml-auto">
          {account ? (
            <Button onClick={disconnectWallet}>Disconnect {account}</Button>
          ) : (
            <Button onClick={connectWallet}>Connect Wallet</Button>
          )}
        </div>
      </div>
    </header>
  );
}
