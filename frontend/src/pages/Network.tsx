import { useOutletContext } from 'react-router-dom';
import { NetworkFlowView } from '../components/NetworkFlow';
import { MetricsState } from '../types';

export function Network() {
  const { state } = useOutletContext<{ state: MetricsState | null }>();

  return (
    <div className="h-full flex flex-col pt-6 px-8 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-mono text-gray-100">Network Flows</h1>
        <p className="text-sm text-gray-400 mt-1">Active TCP/UDP connections and byte tracking</p>
      </div>
      <div className="flex-1 min-h-0">
        <NetworkFlowView data={state?.network || []} />
      </div>
    </div>
  );
}
