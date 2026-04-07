import structlog
from .loader import load_bpf_program

logger = structlog.get_logger(__name__)

class CpuProfiler:
    def __init__(self):
        self.bpf = None

    def start(self):
        self.bpf = load_bpf_program("cpu_profiler.c")
        if not self.bpf:
            return
            
        try:
            # Attach hardware/software perf event (PERF_TYPE_SOFTWARE, PERF_COUNT_SW_CPU_CLOCK)
            self.bpf.attach_perf_event(
                ev_type=1,
                ev_config=0,
                fn_name="on_cpu_sample",
                sample_period=0,
                sample_freq=99  # 99Hz sampling to avoid lockstep with 100Hz timers
            )
            logger.info("Attached CPU profiler at 99Hz")
        except Exception as e:
            logger.error("Failed to attach perf event for CPU profiling", error=str(e))

    def get_counts_and_stacks(self):
        if not self.bpf:
            return [], None, None
            
        counts = self.bpf["counts"]
        stack_traces = self.bpf["stack_traces"]
        
        # We need to take a snapshot of the current counts to clear it.
        # BCC maps don't have atomic clear, but we can iterate and pop.
        # Actually counts.clear() exists and clears the map efficiently.
        
        items = list(counts.items())
        counts.clear()
        
        return items, stack_traces, self.bpf
