import structlog
from .loader import load_bpf_program

logger = structlog.get_logger(__name__)

class FileTracker:
    def __init__(self):
        self.bpf = None

    def start(self):
        self.bpf = load_bpf_program("file_tracker.c")
        if not self.bpf:
            return
        logger.info("File tracker started")

    def get_summary(self):
        if not self.bpf:
            return []
        
        stats = self.bpf["file_stats"]
        results = []
        for key, val in stats.items():
            results.append({
                "pid": key.pid,
                "filename": key.filename.decode("utf-8", "replace").strip("\x00"),
                "reads": val.reads,
                "read_bytes": val.read_bytes,
                "writes": val.writes,
                "write_bytes": val.write_bytes,
                "opens": val.opens,
                "total_latency_us": val.total_latency_ns / 1000.0,
                "comm": val.comm.decode("utf-8", "replace").strip("\x00")
            })
        
        # Clear stats after reading to get per-second windows
        stats.clear()
        
        # Sort by total throughput
        results.sort(key=lambda x: x["read_bytes"] + x["write_bytes"], reverse=True)
        return results[:100] # Return top 100 to avoid huge payloads
