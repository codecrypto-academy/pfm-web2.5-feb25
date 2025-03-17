import { Link } from "@heroui/link";

import { title } from "@/components/primitives";

export default function AboutPage() {
  return (
    <div className="w-full">
      <h1 className={title()}>PFM Web 2.5 Feb&apos;2025</h1>
      <p className="py-2">
        This is a Next.js app with Tailwind CSS, TypeScript, and HeroUI.
      </p>
      <p className="py-2">
        Developed as the front-end for a blockchain network management tool for
        the last part of my TFM Web 2.5 master at{" "}
      </p>
      <Link isExternal href="https://www.codecrypto.academy">
        <span>Codecrypto</span>
      </Link>
    </div>
  );
}
