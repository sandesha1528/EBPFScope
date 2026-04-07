import { X, AlertTriangle } from 'lucide-react';
import { UIAlert } from '../hooks/useAlerts';

export function AlertFeed({ alerts, dismiss }: { alerts: UIAlert[], dismiss: (id: number) => void }) {
  return (
    <div className="h-full flex flex-col bg-surface border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border bg-[#1c2128]">
        <h2 className="font-mono text-sm text-gray-300 flex items-center gap-2">
          <AlertTriangle size={16} className="text-accent-red" />
          Recent Kernel Alerts
        </h2>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3 bg-[#0d1117]">
        {alerts.length === 0 ? (
          <div className="text-gray-500 text-sm font-mono text-center flex flex-col items-center justify-center h-full">
            <span className="mb-2 text-border"><AlertTriangle size={32} /></span>
            No alerts detected
          </div>
        ) : alerts.map(alert => (
          <div key={alert.id} className="relative bg-[#161b22] border-l-4 border-accent-red p-4 rounded shadow-sm group hover:bg-[#1c2128] transition-colors">
            <button 
              onClick={() => dismiss(alert.id)}
              className="absolute top-2 right-2 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-background rounded"
            >
              <X size={14} />
            </button>
            <div className="text-accent-red font-mono font-bold text-sm mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse"/>
              Out of Memory (OOM) Kill
            </div>
            <div className="text-gray-300 text-sm mb-3 ml-4">{alert.message}</div>
            <div className="flex gap-4 text-xs font-mono text-gray-500 ml-4">
              <span className="bg-background px-2 py-1 rounded border border-border">PID: {alert.pid}</span>
              <span className="bg-background px-2 py-1 rounded border border-border">Points: {alert.points}</span>
              <span className="ml-auto flex items-center text-gray-600">{new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
