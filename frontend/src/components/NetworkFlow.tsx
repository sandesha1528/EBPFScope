import { NetworkFlow } from '../types';

export function NetworkFlowView({ data }: { data: NetworkFlow[] }) {
  if (!data) return null;

  return (
    <div className="flex flex-col h-full bg-surface rounded-lg border border-border overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs uppercase bg-[#1c2128] text-gray-400 sticky top-0 shadow-sm z-10 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-mono font-medium tracking-wider">PID / Comm</th>
              <th className="px-6 py-4 font-medium tracking-wider">Local Address</th>
              <th className="px-6 py-4 font-medium tracking-wider">Remote Address</th>
              <th className="px-6 py-4 font-medium tracking-wider">State</th>
              <th className="px-6 py-4 border-l border-border/50 text-right tracking-wider">RX Bytes</th>
              <th className="px-6 py-4 text-right tracking-wider">TX Bytes</th>
            </tr>
          </thead>
          <tbody>
            {data.map((n, idx) => (
              <tr key={`${n.pid}-${n.saddr}-${n.daddr}-${idx}`} className={`border-b border-border hover:bg-[#21262d] transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#1c2128]/50'}`}>
                <td className="px-6 py-3">
                  <div className="font-mono text-gray-300">{n.pid}</div>
                  <div className="text-xs text-gray-500">{n.comm}</div>
                </td>
                <td className="px-6 py-3 font-mono text-accent-blue">{n.saddr}</td>
                <td className="px-6 py-3 font-mono text-accent-amber">{n.daddr}</td>
                <td className="px-6 py-3 font-mono">
                  <span className={`px-2 py-0.5 rounded text-xs border ${n.state === 'ESTABLISHED' ? 'bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/30' : 'bg-[#161b22] text-gray-400 border-border'}`}>
                    {n.state}
                  </span>
                </td>
                <td className="px-6 py-3 border-l border-border/50 text-right font-mono text-gray-300">{n.rx_bytes.toLocaleString()}</td>
                <td className="px-6 py-3 text-right font-mono text-gray-300">{n.tx_bytes.toLocaleString()}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500 font-mono">No active connections</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
