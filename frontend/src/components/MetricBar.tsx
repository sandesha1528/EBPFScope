import { MetricsState } from '../types';

export function MetricBar({ state }: { state: MetricsState | null }) {
  if (!state) return null;

  const totalSyscalls = Object.values(state.syscalls).reduce((acc, curr) => acc + curr.total, 0);
  const totalNet = state.network.length;
  const totalFiles = state.files.length;
  const totalAlerts = state.alerts.length;

  return (
    <div className="h-10 shrink-0 bg-surface border-b border-border flex items-center gap-6 px-6 text-sm font-mono tracking-wide">
      <div className="flex items-center gap-2">
        <span className="text-[#58a6ff] font-bold">{totalSyscalls.toLocaleString()}</span>
        <span className="text-[10px] text-gray-500 uppercase mt-0.5">Syscalls/s</span>
      </div>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-2">
        <span className="text-[#3fb950] font-bold">{totalNet}</span>
        <span className="text-[10px] text-gray-500 uppercase mt-0.5">Active Flows</span>
      </div>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-2">
        <span className="text-[#d29922] font-bold">{totalFiles}</span>
        <span className="text-[10px] text-gray-500 uppercase mt-0.5">File Ops/s</span>
      </div>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-2">
        <span className={`${totalAlerts > 0 ? "text-accent-red animate-pulse" : "text-gray-400"} font-bold`}>{totalAlerts}</span>
        <span className="text-[10px] text-gray-500 uppercase mt-0.5">Alerts/s</span>
      </div>
    </div>
  );
}
