import { SyscallSummary } from '../types';
import { useProcessFilter } from '../hooks/useProcessFilter';

export function ProcessTable({ data }: { data: Record<string, SyscallSummary> | undefined }) {
  const { search, setSearch, sortBy, setSortBy, processes } = useProcessFilter(data || {});

  return (
    <div className="flex flex-col h-full bg-surface rounded-lg border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex gap-4 items-center justify-between">
        <input 
          type="text" 
          placeholder="Filter by PID or command..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-background border border-border rounded px-4 py-2 text-sm w-72 text-gray-200 outline-none focus:border-[#58a6ff] transition-colors"
        />
        <div className="flex gap-1 text-sm text-gray-400 bg-background rounded-lg border border-border p-1">
          <button 
            className={`px-4 py-1.5 rounded transition-colors ${sortBy === 'total' ? 'bg-[#21262d] text-white' : 'hover:text-white hover:bg-border/50'}`}
            onClick={() => setSortBy('total')}
          >
            Events
          </button>
          <button 
            className={`px-4 py-1.5 rounded transition-colors ${sortBy === 'latency' ? 'bg-[#21262d] text-white' : 'hover:text-white hover:bg-border/50'}`}
            onClick={() => setSortBy('latency')}
          >
            Latency
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs uppercase bg-[#1c2128] text-gray-400 sticky top-0 shadow-sm z-10">
            <tr>
              <th className="px-6 py-4 font-mono font-medium tracking-wider">PID</th>
              <th className="px-6 py-4 font-medium tracking-wider">Command</th>
              <th className="px-6 py-4 font-medium tracking-wider text-right">Events/sec</th>
              <th className="px-6 py-4 border-l border-border/50 text-right tracking-wider">P50 Latency</th>
              <th className="px-6 py-4 text-right tracking-wider">P95 Latency</th>
              <th className="px-6 py-4 text-right tracking-wider">P99 Latency</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p, idx) => (
              <tr key={p.pid} className={`border-b border-border hover:bg-[#21262d] transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#1c2128]/50'}`}>
                <td className="px-6 py-3 font-mono text-gray-300">{p.pid}</td>
                <td className="px-6 py-3 text-gray-200 pl-6">{p.comm}</td>
                <td className="px-6 py-3 font-mono text-[#58a6ff] text-right">{p.total}</td>
                <td className="px-6 py-3 border-l border-border/50 text-right font-mono text-gray-400">{p.p50_us} µs</td>
                <td className="px-6 py-3 text-right font-mono text-gray-400">{p.p95_us} µs</td>
                <td className="px-6 py-3 text-right font-mono text-[#d29922]">{p.p99_us} µs</td>
              </tr>
            ))}
            {processes.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500 font-mono">No processes matching filter</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
