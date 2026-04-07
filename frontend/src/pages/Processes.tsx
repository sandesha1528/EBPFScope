import { useOutletContext } from 'react-router-dom';
import { ProcessTable } from '../components/ProcessTable';
import { MetricsState } from '../types';

export function Processes() {
  const { state } = useOutletContext<{ state: MetricsState | null }>();

  return (
    <div className="h-full flex flex-col pt-6 px-8 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-mono text-gray-100">Process Explorer</h1>
        <p className="text-sm text-gray-400 mt-1">Per-process syscall latencies and event rates</p>
      </div>
      <div className="flex-1 min-h-0">
        <ProcessTable data={state?.syscalls} />
      </div>
    </div>
  );
}
