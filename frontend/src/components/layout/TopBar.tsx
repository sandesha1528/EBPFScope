export function TopBar({ connected, ts }: { connected: boolean; ts: number }) {
  return (
    <header className="h-14 shrink-0 border-b border-border bg-surface px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-[#3fb950]' : 'bg-[#f85149]'}`} />
          <span className="text-sm text-gray-400 font-mono">
            {connected ? 'LIVE' : 'DISCONNECTED'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-400 font-mono bg-background px-3 py-1 rounded border border-border">
          {ts ? new Date(ts * 1000).toLocaleTimeString() : '---'}
        </div>
      </div>
    </header>
  );
}
