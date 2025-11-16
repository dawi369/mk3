import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/common/navbar";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-center gap-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/mk3LogoTransparent.png"
              alt="Swordfish Logo"
              width={40}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </Link>
          <Navbar />
        </div>
      </div>
    </header>
  );
}

