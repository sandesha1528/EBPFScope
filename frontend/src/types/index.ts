export interface FlameGraphNode {
  name: string;
  value: number;
  type: "root" | "kernel" | "user" | "inlined";
  children?: FlameGraphNode[];
}

export interface SyscallSummary {
  comm: string;
  total: number;
  by_name: Record<string, number>;
  p50_us: number;
  p95_us: number;
  p99_us: number;
}

export interface FileAccess {
  pid: number;
  comm: string;
  filename: string;
  reads: number;
  read_bytes: number;
  writes: number;
  write_bytes: number;
  opens: number;
  total_latency_us: number;
}

export interface NetworkFlow {
  pid: number;
  comm: string;
  saddr: string;
  daddr: string;
  rx_bytes: number;
  tx_bytes: number;
  retransmits: number;
  state: string;
}

export interface AlertEvent {
  pid: number;
  comm: string;
  points: number;
  message: string;
}

export interface MetricsState {
  type: string;
  ts: number;
  syscalls: Record<string, SyscallSummary>;
  flamegraph: FlameGraphNode;
  network: NetworkFlow[];
  files: FileAccess[];
  alerts: AlertEvent[];
}
