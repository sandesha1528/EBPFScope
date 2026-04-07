import { useOutletContext } from 'react-router-dom';
import { FlameGraph } from '../components/FlameGraph';
import { SyscallHistogram } from '../components/SyscallHistogram';
import { MetricBar } from '../components/MetricBar';
import { MetricsState } from '../types';

export function Dashboard() {
  const { state } = useOutletContext<{ state: MetricsState | null }>();

  return (
    <div className="h-full flex flex-col pt-6">
      <div className="px-8 pb-4">
        <h1 className="text-2xl font-bold font-mono text-gray-100">System Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Real-time kernel observability and CPU profiler</p>
      </div>
      <div className="px-8 mb-6">
        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
          <MetricBar state={state} />
        </div>
      </div>
      <div className="flex-1 px-8 pb-8 flex flex-col lg:flex-row gap-6 min-h-0">
        <div className="flex-[2] flex flex-col min-w-0">
          <h2 className="text-sm font-bold font-mono text-gray-300 mb-3 uppercase tracking-wider">CPU Flame Graph (99Hz)</h2>
          <div className="flex-1 min-h-[350px]">
            <FlameGraph data={state?.flamegraph} />
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <h2 className="text-sm font-bold font-mono text-gray-300 mb-3 uppercase tracking-wider">Syscall Rate Breakdown</h2>
          <div className="flex-1 min-h-[350px]">
            <SyscallHistogram data={state?.syscalls} />
          </div>
        </div>
      </div>
    </div>
  );
}
