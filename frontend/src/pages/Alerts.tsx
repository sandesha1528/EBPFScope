import { useOutletContext } from 'react-router-dom';
import { AlertFeed } from '../components/AlertFeed';
import { useAlerts } from '../hooks/useAlerts';
import { MetricsState } from '../types';

export function Alerts() {
  const { state } = useOutletContext<{ state: MetricsState | null }>();
  const { alerts, dismissAlert } = useAlerts(state?.alerts || []);

  return (
    <div className="h-full flex flex-col pt-6 px-8 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-mono text-gray-100">Alert Center</h1>
        <p className="text-sm text-gray-400 mt-1">Critical kernel events and anomalies</p>
      </div>
      <div className="flex-1 min-h-0 max-w-4xl">
        <AlertFeed alerts={alerts} dismiss={dismissAlert} />
      </div>
    </div>
  );
}
