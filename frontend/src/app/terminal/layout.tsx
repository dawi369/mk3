import Link from "next/link";

export default function TerminalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">
                Swordfish
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/terminal"
                className="transition-colors hover:text-foreground/80 text-foreground"
              >
                Terminal
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* Add search functionality here */}
            </div>
            <nav className="flex items-center">
              {/* User profile or other nav items */}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
