import { Outlet } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { useWebSocket } from './hooks/useWebSocket';

export default function App() {
  const { state, isConnected } = useWebSocket();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-gray-200 selection:bg-[#58a6ff]/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar connected={isConnected} ts={state?.ts || 0} />
        <main className="flex-1 overflow-auto bg-[#0d1117] shadow-inner">
          <Outlet context={{ state }} />
        </main>
      </div>
    </div>
  );
}
