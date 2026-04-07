import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SyscallSummary } from '../types';

export function SyscallHistogram({ data }: { data: Record<string, SyscallSummary> | undefined }) {
  if (!data) return null;

  const aggregated: Record<string, number> = {};
  Object.values(data).forEach(proc => {
    Object.entries(proc.by_name).forEach(([sys, count]) => {
      aggregated[sys] = (aggregated[sys] || 0) + count;
    });
  });

  const chartData = Object.entries(aggregated)
    .map(([sys, count]) => ({ name: sys, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return (
    <div className="h-full w-full bg-surface border border-border rounded-lg p-4 flex flex-col items-center justify-center">
      <h3 className="text-gray-400 text-sm font-mono self-start mb-4">Top 15 Syscalls</h3>
      {chartData.length === 0 ? (
        <span className="text-gray-500 font-mono">Waiting for data...</span>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, top: 0, bottom: 0, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#8b949e', fontSize: 12}} width={90} />
            <Tooltip 
              cursor={{fill: '#21262d'}} 
              contentStyle={{backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '6px', color: '#c9d1d9'}} 
              itemStyle={{color: '#58a6ff'}}
            />
            <Bar dataKey="count" fill="var(--color-kernel)" radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
