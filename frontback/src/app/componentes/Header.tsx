import Link from "next/link";


export function Header() {
    return (
        <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="container mx-auto flex flex-col items-center">
          <h1 className="text-4xl font-bold">Besu Network Manager</h1>
          <nav className="mt-4 space-x-4">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span>|</span>
            <Link href="/manager" className="hover:underline">
              Network Manager
            </Link>
            <span>|</span>
            <Link href="/interactions" className="hover:underline">
              Interactions
            </Link>
          </nav>
        </div>
      </header>
    );
  } 