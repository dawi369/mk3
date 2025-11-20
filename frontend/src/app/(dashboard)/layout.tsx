export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar Placeholder */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar-background md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-semibold">Swordfish</span>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {/* Add Sidebar Items Here */}
            <div className="px-3 py-2 text-muted-foreground">
              Dashboard Navigation
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
          <div className="font-semibold">Dashboard</div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
