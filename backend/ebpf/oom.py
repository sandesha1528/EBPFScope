import ctypes
import asyncio
import structlog
from .loader import load_bpf_program

logger = structlog.get_logger(__name__)

class OomEvent(ctypes.Structure):
    _fields_ = [
        ("pid", ctypes.c_uint32),
        ("comm", ctypes.c_char * 16),
        ("points", ctypes.c_long),
    ]

class OomWatcher:
    def __init__(self):
        self.bpf = None
        self.alerts = []

    def start(self):
        self.bpf = load_bpf_program("oom_watcher.c")
        if not self.bpf:
            return

        def handle_event(cpu, data, size):
            event = ctypes.cast(data, ctypes.POINTER(OomEvent)).contents
            self.alerts.append({
                "pid": event.pid,
                "comm": event.comm.decode("utf-8", "replace").strip("\x00"),
                "points": event.points,
                "message": f"OOM Killer invoked on {event.comm.decode('utf-8', 'replace').strip()}"
            })

        self.bpf["oom_events"].open_perf_buffer(handle_event)
        self.task = asyncio.create_task(self.poll_loop())

    async def poll_loop(self):
        while True:
            try:
                self.bpf.perf_buffer_poll(timeout=10)
            except Exception as e:
                logger.error("Error polling OOM events", error=str(e))
            await asyncio.sleep(0.01)

    def get_and_clear_alerts(self):
        alerts = self.alerts
        self.alerts = []
        return alerts
