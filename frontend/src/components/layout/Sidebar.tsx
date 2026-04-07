import { NavLink } from 'react-router-dom';
import { LayoutDashboard, List, FileText, Network, AlertTriangle } from 'lucide-react';

export function Sidebar() {
  const links = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/processes', label: 'Processes', icon: <List size={20} /> },
    { to: '/files', label: 'Files', icon: <FileText size={20} /> },
    { to: '/network', label: 'Network', icon: <Network size={20} /> },
    { to: '/alerts', label: 'Alerts', icon: <AlertTriangle size={20} /> },
  ];

  return (
    <aside className="w-16 md:w-56 h-full bg-surface border-r border-border flex flex-col pt-4 shrink-0 transition-all">
      <div className="px-4 mb-8 hidden md:block">
        <h1 className="text-xl font-bold font-mono text-gray-100 flex items-center gap-2">
          <span>EBPF</span>
          <span className="text-[#58a6ff]">Scope</span>
        </h1>
      </div>
      <nav className="flex-1 flex flex-col gap-2 px-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                  ? 'bg-border text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-border/50'
              }`
            }
          >
            {link.icon}
            <span className="hidden md:inline">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
