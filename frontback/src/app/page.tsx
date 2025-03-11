import Link from 'next/link';

export default function Home() {
  return (
    <main className="bg-gray-100 text-gray-900 min-h-screen flex flex-col items-center py-16">
      <div className="container mx-auto text-center px-6">
        <h1 className="text-4xl font-bold text-primary mb-6">
          Create and Manage Private Networks with Hyperledger Besu
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Unlock the power of blockchain with our easy-to-use platform for creating and managing private networks using Hyperledger Besu. Our platform supports the Clique PoA protocol, enabling secure, fast, and scalable networks tailored to your business needs.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Network Creation</h3>
            <p className="text-gray-600">Easily create your private blockchain network with customizable settings to match your requirements.</p>
          </div>
          
          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Network Management</h3>
            <p className="text-gray-600">Monitor, manage, and upgrade your network seamlessly with our intuitive interface.</p>
          </div>

          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Secure Consensus</h3>
            <p className="text-gray-600">Leverage the power of PoA Clique to ensure secure and efficient consensus within your network.</p>
          </div>
        </div>

        <p className="text-lg text-gray-700 mb-8">
          Whether you’re building a private network for enterprise use or exploring the possibilities of decentralized applications, our platform simplifies the setup and operation of your blockchain infrastructure.
        </p>

        <div className="space-x-4">
          <Link href="/manager" className="inline-block px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-primary-dark">
            Network Manager
          </Link>
          <Link href="/interactions" className="inline-block px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
            Interactions
          </Link>
        </div>
      </div>
    </main>
  );
}