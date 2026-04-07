import { FileAccess } from '../types';

export function FileTracker({ data }: { data: FileAccess[] }) {
  if (!data) return null;

  return (
    <div className="flex flex-col h-full bg-surface rounded-lg border border-border overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs uppercase bg-[#1c2128] text-gray-400 sticky top-0 shadow-sm z-10 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-mono font-medium tracking-wider">PID / Comm</th>
              <th className="px-6 py-4 font-medium tracking-wider">Filename</th>
              <th className="px-6 py-4 font-medium tracking-wider text-right">Reads</th>
              <th className="px-6 py-4 font-medium tracking-wider text-right">Writes</th>
              <th className="px-6 py-4 font-medium tracking-wider text-right">Read B/s</th>
              <th className="px-6 py-4 border-l border-border/50 text-right tracking-wider">Write B/s</th>
            </tr>
          </thead>
          <tbody>
            {data.map((f, idx) => (
              <tr key={`${f.pid}-${f.filename}-${idx}`} className={`border-b border-border hover:bg-[#21262d] transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#1c2128]/50'}`}>
                <td className="px-6 py-3">
                  <div className="font-mono text-gray-300">{f.pid}</div>
                  <div className="text-xs text-gray-500">{f.comm}</div>
                </td>
                <td className="px-6 py-3 text-gray-200 break-all max-w-md">{f.filename}</td>
                <td className="px-6 py-3 font-mono text-accent-blue text-right">{f.reads}</td>
                <td className="px-6 py-3 font-mono text-accent-amber text-right">{f.writes}</td>
                <td className="px-6 py-3 text-right font-mono text-gray-300">
                  <div className="relative w-full flex items-center justify-end">
                    <span className="z-10 bg-surface/50 px-1 rounded">{f.read_bytes}</span>
                    <div className="absolute right-0 h-4/5 bg-[#58a6ff]/20 rounded-sm pointer-events-none" style={{width: `${Math.min(100, (f.read_bytes / 1024 / 1024) * 100)}%`}}/>
                  </div>
                </td>
                <td className="px-6 py-3 border-l border-border/50 text-right font-mono text-gray-300">
                  <div className="relative w-full flex items-center justify-end">
                    <span className="z-10 bg-surface/50 px-1 rounded">{f.write_bytes}</span>
                    <div className="absolute right-0 h-4/5 bg-accent-amber/20 rounded-sm pointer-events-none" style={{width: `${Math.min(100, (f.write_bytes / 1024 / 1024) * 100)}%`}}/>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500 font-mono">No file activity detected</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
