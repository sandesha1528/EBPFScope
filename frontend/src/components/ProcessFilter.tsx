import { Dispatch, SetStateAction } from 'react';

interface ProcessFilterProps {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  sortBy: 'total' | 'latency' | 'pid';
  setSortBy: Dispatch<SetStateAction<'total' | 'latency' | 'pid'>>;
}

export function ProcessFilter({ search, setSearch, sortBy, setSortBy }: ProcessFilterProps) {
  return (
    <div className="flex gap-4 items-center w-full">
      <input 
        type="text" 
        placeholder="Filter by PID or command..." 
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="bg-background border border-border rounded px-4 py-2 text-sm w-72 text-gray-200 outline-none focus:border-[#58a6ff] transition-colors shadow-sm"
      />
      <div className="flex gap-1 text-sm text-gray-400 bg-background rounded-lg border border-border p-1 shadow-sm">
        <button 
          className={`px-4 py-1.5 rounded transition-colors ${sortBy === 'total' ? 'bg-[#21262d] text-white shadow-sm' : 'hover:text-white hover:bg-border/50'}`}
          onClick={() => setSortBy('total')}
        >
          Events
        </button>
        <button 
          className={`px-4 py-1.5 rounded transition-colors ${sortBy === 'latency' ? 'bg-[#21262d] text-white shadow-sm' : 'hover:text-white hover:bg-border/50'}`}
          onClick={() => setSortBy('latency')}
        >
          Latency
        </button>
      </div>
    </div>
  );
}
