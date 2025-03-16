import Link from "next/link";

export default function Home() {
    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
                <h1 className="text-3xl font-bold mb-4">Tools</h1>
                <ol className="list-inside list-decimal text-lg text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
                    <li className="mb-4">
                        <Link
                            href="/manager"
                            className="text-blue-500 hover:text-blue-600 transition-colors"
                        >
                            Manager
                        </Link>
                    </li>
                    <li className="mb-4">
                        <Link
                            href="/balance"
                            className="text-blue-500 hover:text-blue-600 transition-colors"
                        >
                            Balance
                        </Link>
                    </li>
                    <li className="mb-4">
                        <Link
                            href="/faucet"
                            className="text-blue-500 hover:text-blue-600 transition-colors"
                        >
                            Faucet
                        </Link>
                    </li>
                    <li className="mb-4">
                        <Link
                            href="/transfer"
                            className="text-blue-500 hover:text-blue-600 transition-colors"
                        >
                            Transfers
                        </Link>
                    </li>
                </ol>
            </main>
            <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-sm text-gray-500">
                <p>© 2025 Francisco Marcos - CodeCrypto.</p>
            </footer>
        </div>
    );
}