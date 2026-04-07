import os
import structlog

logger = structlog.get_logger(__name__)

def load_bpf_program(filename: str):
    """Loads a BPF program from the bpf/ directory."""
    try:
        from bcc import BPF
        bpf_path = os.path.join(os.path.dirname(__file__), "..", "bpf", filename)
        logger.info("Loading BPF program", program=filename, path=bpf_path)
        bpf = BPF(src_file=bpf_path)
        logger.info("BPF program loaded successfully", program=filename)
        return bpf
    except ImportError:
        logger.error("bcc bindings not installed. Cannot load BPF programs.")
        return None
    except Exception as e:
        logger.error(
            "Failed to load BPF program",
            program=filename,
            error=str(e),
            hint="Check that you are running as root, have CAP_BPF, and kernel headers are available."
        )
        return None
