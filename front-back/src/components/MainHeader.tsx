"use client";
import Link from "next/link";

export default function MainHeader() {
  return (
    <header className="border-b p-4 bg-gray-200">
      <div className="container flex justify-between items-center">
        <nav className="flex space-x-4">
          <Link href="/net">
            <span className="cursor-pointer font-bold hover:underline">🌐 NetTools</span>
          </Link>
          <Link href="/ethereum">
            <span className="cursor-pointer font-bold hover:underline">⛓️ EthereumTools</span>
          </Link>

        </nav>
      </div>
    </header>
  );
}
