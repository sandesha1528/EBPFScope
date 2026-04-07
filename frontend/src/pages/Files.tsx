import { useOutletContext } from 'react-router-dom';
import { FileTracker } from '../components/FileTracker';
import { MetricsState } from '../types';

export function Files() {
  const { state } = useOutletContext<{ state: MetricsState | null }>();

  return (
    <div className="h-full flex flex-col pt-6 px-8 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-mono text-gray-100">File IO Tracker</h1>
        <p className="text-sm text-gray-400 mt-1">Virtual File System (VFS) operations and throughput</p>
      </div>
      <div className="flex-1 min-h-0">
        <FileTracker data={state?.files || []} />
      </div>
    </div>
  );
}
