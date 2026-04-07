import socket
import struct
import structlog
from .loader import load_bpf_program

logger = structlog.get_logger(__name__)

def int_to_ip(addr):
    return socket.inet_ntoa(struct.pack("<I", addr))

# Map kernel TCP states to strings
TCP_STATES = {
    1: "ESTABLISHED",
    2: "SYN_SENT",
    3: "SYN_RECV",
    4: "FIN_WAIT1",
    5: "FIN_WAIT2",
    6: "TIME_WAIT",
    7: "CLOSE",
    8: "CLOSE_WAIT",
    9: "LAST_ACK",
    10: "LISTEN",
    11: "CLOSING",
    12: "NEW_SYN_RECV",
}

class NetworkTracer:
    def __init__(self):
        self.bpf = None

    def start(self):
        self.bpf = load_bpf_program("network_tracer.c")

    def get_summary(self):
        if not self.bpf:
            return []
            
        flows = self.bpf["ipv4_flows"]
        results = []
        for key, val in list(flows.items()):
            state_str = TCP_STATES.get(val.state, str(val.state))
            results.append({
                "pid": key.pid,
                "comm": val.comm.decode("utf-8", "replace").strip("\x00"),
                "saddr": f"{int_to_ip(key.saddr)}:{key.sport}",
                "daddr": f"{int_to_ip(key.daddr)}:{key.dport}",
                "rx_bytes": val.rx_bytes,
                "tx_bytes": val.tx_bytes,
                "retransmits": val.retransmits,
                "state": state_str
            })

            # Clear entry if it is completely closed, otherwise accumulate
            if val.state == 7: # CLOSE
                flows.pop(key)

        results.sort(key=lambda x: x["rx_bytes"] + x["tx_bytes"], reverse=True)
        return results
