"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NetHeader() {
  return (
    <header className="border-b">
      <div className="container flex h-14 items-center">
        <nav className="flex items-center space-x-4">
          <Link href="/net">
            <Button variant="ghost">Home</Button>
          </Link>
          <Link href="/net/network">
            <Button variant="ghost">Network</Button>
          </Link>
          <Link href="/net/node">
            <Button variant="ghost">Node</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
