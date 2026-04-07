import asyncio
import time
import structlog
from ebpf.syscall import SyscallTracer
from ebpf.files import FileTracker
from ebpf.network import NetworkTracer
from ebpf.profiler import CpuProfiler
from ebpf.oom import OomWatcher
from flamegraph import FlameGraphBuilder
from websocket import wsm
from database import save_snapshot, save_alert

logger = structlog.get_logger(__name__)

class UnifiedStateAggregator:
    def __init__(self):
        self.syscall = SyscallTracer()
        self.files = FileTracker()
        self.network = NetworkTracer()
        self.profiler = CpuProfiler()
        self.oom = OomWatcher()
        self.flame_builder = FlameGraphBuilder()
        self.current_state = {}

    def start_all(self):
        logger.info("Starting all eBPF programs...")
        self.syscall.start()
        self.files.start()
        self.network.start()
        self.profiler.start()
        self.oom.start()
        
        asyncio.create_task(self.aggregate_loop())

    async def aggregate_loop(self):
        while True:
            await asyncio.sleep(1.0) # Emit exactly every 1 second
            try:
                now = time.time()
                
                syscall_events = self.syscall.get_and_clear_events()
                syscall_summary = {}
                for ev in syscall_events:
                    pid = str(ev["pid"])
                    if pid not in syscall_summary:
                        syscall_summary[pid] = {
                            "comm": ev["comm"],
                            "total": 0,
                            "by_name": {},
                            "_latencies": []
                        }
                    
                    syscall_summary[pid]["total"] += 1
                    sname = ev["syscall"]
                    syscall_summary[pid]["by_name"][sname] = syscall_summary[pid]["by_name"].get(sname, 0) + 1
                    syscall_summary[pid]["_latencies"].append(ev["latency_us"])

                for pid, data in syscall_summary.items():
                    lats = sorted(data["_latencies"])
                    if lats:
                        data["p50_us"] = round(lats[int(len(lats)*0.5)], 2)
                        data["p95_us"] = round(lats[int(len(lats)*0.95)], 2)
                        data["p99_us"] = round(lats[int(len(lats)*0.99)], 2)
                    else:
                        data["p50_us"] = data["p95_us"] = data["p99_us"] = 0
                    del data["_latencies"]

                counts, stack_traces, bpf = self.profiler.get_counts_and_stacks()
                flame_json = self.flame_builder.build(counts, stack_traces, bpf)
                
                network_summary = self.network.get_summary()
                file_summary = self.files.get_summary()
                
                alerts = self.oom.get_and_clear_alerts()
                for a in alerts:
                    await save_alert(now, "OOM", a)
                
                state = {
                    "type": "metrics",
                    "ts": now,
                    "syscalls": syscall_summary,
                    "flamegraph": flame_json,
                    "network": network_summary,
                    "files": file_summary,
                    "alerts": alerts
                }
                
                self.current_state = state
                await wsm.broadcast(state)
                
                # Periodically save snapshot (e.g. every 10s)
                if int(now) % 10 == 0:
                    await save_snapshot(now, state)
                    
            except Exception as e:
                logger.error("Error in aggregation loop", error=str(e))

aggregator = UnifiedStateAggregator()
