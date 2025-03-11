import Link from 'next/link';

export default function Interactions() {
  return (
    <main className="bg-gray-100 text-gray-900 min-h-screen flex flex-col items-center py-16">
      <div className="container mx-auto text-center px-6">
        <h1 className="text-4xl font-bold text-primary mb-6">
          Interactions
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Perform blockchain transactions, request tokens from providers, and query account balances with ease.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Transfer Tokens</h3>
            <p className="text-gray-600 mb-4">Send tokens from one address to another quickly and securely.</p>
            <Link href="/interactions/transfer" className="inline-block px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-primary-dark">
              Transfer Tokens
            </Link>
          </div>
          
          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Request Tokens</h3>
            <p className="text-gray-600 mb-4">Request tokens from your provider for your network or personal wallet.</p>
            <Link href="/interactions/request" className="inline-block px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700">
              Request Tokens
            </Link>
          </div>

          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Check Balances</h3>
            <p className="text-gray-600 mb-4">Get real-time information on the balances of your blockchain addresses.</p>
            <Link href="/interactions/balance" className="inline-block px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-gray-700">
              Check Balances
            </Link>
          </div>
        </div>

        <p className="text-lg text-gray-700 mb-8">
          Take control of your blockchain interactions: from transferring tokens to checking balances, everything you need is available in one place.
        </p>

        <div className="space-x-4">
          <Link href="/manager" className="inline-block px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
            Go to Network Manager
          </Link>
        </div>
      </div>
    </main>
  );
}
