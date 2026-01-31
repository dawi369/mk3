import { Construction } from "lucide-react";

export function AiLabView() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
      <Construction className="w-12 h-12 opacity-20" />
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground/80 mb-1">AI Laboratory</h1>
        <p className="text-sm opacity-60">Experimental features coming soon.</p>
      </div>
    </div>
  );
}
