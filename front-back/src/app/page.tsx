import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-6">Welcome to Net & Ethereum Tools</h1>
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <Link href="/net">
          <div className="p-4 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
            <h2 className="text-xl font-semibold">🌐 NetTools</h2>
            <p>Managing a custom network from scratch</p>
          </div>
        </Link>
        <Link href="/ethereum">
          <div className="p-4 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
            <h2 className="text-xl font-semibold">⛓️ EthereumTools</h2>
            <p>Manage Ethereum accounts</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
