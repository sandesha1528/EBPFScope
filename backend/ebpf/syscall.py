import ctypes
import asyncio
import structlog
from .loader import load_bpf_program

logger = structlog.get_logger(__name__)

class SyscallEvent(ctypes.Structure):
    _fields_ = [
        ("pid", ctypes.c_uint32),
        ("tgid", ctypes.c_uint32),
        ("uid", ctypes.c_uint32),
        ("syscall_id", ctypes.c_uint64),
        ("entry_ts", ctypes.c_uint64),
        ("exit_ts", ctypes.c_uint64),
        ("latency_ns", ctypes.c_uint64),
        ("ret", ctypes.c_long),
        ("comm", ctypes.c_char * 16),
    ]

# Syscall resolver uses BCC's mapping if available
try:
    from bcc import syscall as bcc_syscall
except ImportError:
    bcc_syscall = None

class SyscallTracer:
    def __init__(self):
        self.bpf = None
        self.events = []
        
    def start(self):
        self.bpf = load_bpf_program("syscall_tracer.c")
        if not self.bpf:
            return
        
        def handle_event(cpu, data, size):
            event = ctypes.cast(data, ctypes.POINTER(SyscallEvent)).contents
            
            syscall_name = str(event.syscall_id)
            if bcc_syscall and event.syscall_id < 1000:
                name_bytes = bcc_syscall.syscall_name(event.syscall_id)
                if name_bytes:
                    syscall_name = name_bytes.decode("utf-8", "replace")

            self.events.append({
                "pid": event.pid,
                "comm": event.comm.decode("utf-8", "replace").strip("\x00"),
                "syscall": syscall_name,
                "latency_us": event.latency_ns / 1000.0,
                "ret": event.ret
            })

        self.bpf["events"].open_perf_buffer(handle_event)
        self.task = asyncio.create_task(self.poll_loop())

    async def poll_loop(self):
        # Async task to poll perf ring buffer continuously
        while True:
            try:
                self.bpf.perf_buffer_poll(timeout=10)
            except Exception as e:
                logger.error("Error polling syscall events", error=str(e))
            await asyncio.sleep(0.01)

    def get_and_clear_events(self):
        events = self.events
        self.events = []
        return events
