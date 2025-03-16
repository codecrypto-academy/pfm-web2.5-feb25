import Link from 'next/link';

export default function NetworkManager() {
  return (
    <main className="bg-gray-100 text-gray-900 min-h-screen flex flex-col items-center py-16">
      <div className="container mx-auto text-center px-6">
        <h1 className="text-4xl font-bold text-primary mb-6">
          Network Manager
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Manage your private networks and nodes with ease. Create, delete, and query networks and nodes in real time, all in one place.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Create Network</h3>
            <p className="text-gray-600 mb-4">Easily create new private blockchain networks with customizable settings.</p>
            <Link href="/manager/create" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-primary-dark">
              Create Network
            </Link>
          </div>
          
          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Delete Network</h3>
            <p className="text-gray-600 mb-4">Manage your networks and remove unnecessary ones with a single click.</p>
            <Link href="/manager/delete" className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Delete Network
            </Link>
          </div>

          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Networks Dashboard</h3>
            <p className="text-gray-600 mb-4">View the status of your networks and nodes with live updates.</p>
            <Link href="/manager/dashboard" className="inline-block px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-700">
              Networks Dashboard
            </Link>
          </div>
        </div>

        <p className="text-lg text-gray-700 mb-8">
          Whether you're creating a new network, managing nodes, or querying your existing setup, the Network Manager puts everything you need at your fingertips.
        </p>

        <div className="space-x-4">
          <Link href="/interactions" className="inline-block px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
            Go to Interactions
          </Link>
        </div>
      </div>
    </main>
  );
}