import Link from "next/link";
import Image from "next/image";

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden flex-col">
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center ml-2">
            <Image
              src="/mk3LogoTransparent.png"
              alt="Swordfish Logo"
              width={40}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
