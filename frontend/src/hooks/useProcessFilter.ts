import { useState, useMemo } from 'react';
import { SyscallSummary } from '../types';

export function useProcessFilter(syscalls: Record<string, SyscallSummary>) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'total' | 'latency' | 'pid'>('total');

  const filteredAndSorted = useMemo(() => {
    let arr = Object.entries(syscalls).map(([pid, summary]) => ({
      pid,
      ...summary
    }));

    if (search) {
      const lower = search.toLowerCase();
      arr = arr.filter(p => 
        p.pid.includes(lower) || 
        p.comm.toLowerCase().includes(lower)
      );
    }

    arr.sort((a, b) => {
      if (sortBy === 'total') return b.total - a.total;
      if (sortBy === 'latency') return b.p99_us - a.p99_us;
      if (sortBy === 'pid') return parseInt(a.pid) - parseInt(b.pid);
      return 0;
    });

    return arr;
  }, [syscalls, search, sortBy]);

  return { search, setSearch, sortBy, setSortBy, processes: filteredAndSorted };
}
