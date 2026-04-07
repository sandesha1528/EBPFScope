# EBPFScope — Project Report         Created By Sandesha Wakchaure.

**"X-ray vision for your Linux kernel"**

---

## 1. Executive Summary

EBPFScope is a Linux kernel observability platform built on eBPF (Extended Berkeley Packet Filter) technology. It attaches lightweight, sandboxed programs directly into the Linux kernel at runtime — with zero application restarts, zero code modifications, and zero performance overhead — and streams the captured data to a modern real-time React dashboard.

The platform provides deep visibility into five critical dimensions of system behavior: system call tracing, CPU profiling, virtual filesystem I/O tracking, network flow monitoring, and out-of-memory (OOM) kill detection. All data is streamed live over WebSockets and visualized with sub-second latency.

---

## 2. Problem Statement

Traditional observability tools require either:
- **Static instrumentation** — adding logging or tracing calls directly into source code
- **Kernel module installation** — loading kernel modules that can crash the system
- **Process restarts** — attaching debuggers that interrupt running services
- **Heavy sampling** — using strace/ltrace which can 10–100× slow down traced processes

These approaches are incompatible with production environments where applications cannot be stopped and performance is critical.

**EBPFScope solves all of these problems** by leveraging eBPF, a kernel technology that allows safe, verified bytecode programs to run inside the kernel without any of the above limitations.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| eBPF Programs | C (BCC) | Kernel-level instrumentation |
| Kernel Interface | Linux kprobes, tracepoints, perf events | Attach points for eBPF programs |
| Backend Runtime | Python 3.10, FastAPI, asyncio | API server and eBPF coordinator |
| eBPF Loader | BCC Python bindings | Compile and load C programs at runtime |
| WebSocket | FastAPI WebSocket, uvicorn | Real-time data streaming |
| Database | SQLite (aiosqlite) | Snapshot and alert persistence |
| Frontend | React 18, TypeScript, Vite | Dashboard UI |
| Visualization | D3.js v7, Recharts | Flame graphs, histograms |
| Styling | TailwindCSS 3 | Dark-themed component system |
| Deployment | Docker Compose, Nginx | Container orchestration |
| Logging | structlog (JSON output) | Structured backend logging |

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    LINUX KERNEL                         │
│                                                         │
│  kprobes/tracepoints/perf_events                        │
│       │            │              │                     │
│  [syscall]    [vfs_read/write] [tcp_sendmsg]            │
│  [tracepoint] [vfs_open]       [perf_event_open 99Hz]   │
│       │            │              │                     │
│  BPF_PERF_OUTPUT  BPF_HASH   BPF_STACK_TRACE            │
└───────┼────────────┼──────────────┼─────────────────────┘
        │            │              │
┌───────▼────────────▼──────────────▼─────────────────────┐
│                 PYTHON BACKEND (FastAPI)                │
│                                                         │
│  ebpf/syscall.py  ebpf/files.py  ebpf/network.py        │
│  ebpf/profiler.py               ebpf/oom.py             │
│            │                                            │
│       aggregator.py ──► flamegraph.py                   │
│            │                                            │
│       websocket.py (broadcast every 1sec)               │
│            │                                            │
│    api/metrics  api/processes  api/flamegraph           │
│    api/files    api/network    api/alerts               │
└───────────────────────────────┬─────────────────────────┘
                                │  WebSocket + REST API
┌───────────────────────────────▼─────────────────────────┐
│                 REACT FRONTEND (Vite)                   │
│                                                         │
│  useWebSocket.ts ──► App.tsx ──► React Router           │
│                                                         │
│  Dashboard.tsx         Processes.tsx                    │
│  ├─ FlameGraph.tsx     ├─ ProcessTable.tsx              │
│  └─ SyscallHistogram   └─ ProcessFilter.tsx             │
│                                                         │
│  Files.tsx             Network.tsx    Alerts.tsx        │
│  └─ FileTracker.tsx    └─ NetworkFlow └─ AlertFeed.tsx  │
└─────────────────────────────────────────────────────────┘
```

---

## 5. eBPF Program Details

### 5.1 Syscall Tracer (`syscall_tracer.c`)

**Attach points:** `tracepoint:raw_syscalls:sys_enter` and `sys_exit`

Captures every system call made by every process on the system. On `sys_enter`, the current timestamp is stored in a `BPF_HASH` keyed by `pid_tgid`. On `sys_exit`, the hash is looked up, latency is computed as `exit_ts - entry_ts`, and the full event (PID, TGID, UID, comm, syscall ID, latency, return value) is emitted via `BPF_PERF_OUTPUT`.

Supports **PID filtering** via a `BPF_ARRAY` map — the Python loader can set a specific PID to reduce noise.

**Key metrics produced:**
- Syscall name and count per process
- Latency percentiles: P50, P95, P99 (computed in Python aggregator)

---

### 5.2 File Tracker (`file_tracker.c`)

**Attach points:** `kprobe+kretprobe` on `vfs_read`, `vfs_write`, `vfs_open`, `do_sys_openat2`

On entry, timestamps and file pointers are stored in a `BPF_HASH`. On return, the filename is extracted from the dentry structure using `bpf_probe_read_kernel_str()`, bytes transferred are read from the return value, and per-file/per-process statistics (reads, writes, opens, bytes, latency) are accumulated in a `BPF_HASH`.

**Key metrics produced:**
- Per-file read/write byte counts
- Operation counts (opens, reads, writes)
- Average latency per file

---

### 5.3 Network Tracer (`network_tracer.c`)

**Attach points:** `kprobe` on `tcp_sendmsg`, `tcp_recvmsg`, `tcp_connect`, `tcp_close`, `udp_sendmsg`, `tcp_retransmit_skb`

Each probe extracts source/destination IP and port from the `sock` structure using `inet_sk()` and accumulates per-connection byte counts and retransmit counts in a `BPF_HASH` keyed on `(src_ip, src_port, dst_ip, dst_port, pid)`.

TCP connection state is tracked from `sk->__sk_common.skc_state` and mapped to human-readable strings (ESTABLISHED, TIME_WAIT, CLOSE_WAIT, etc.).

**Key metrics produced:**
- Active connections with source/dest addresses
- RX/TX bytes per connection
- TCP retransmit counts
- Connection state

---

### 5.4 CPU Profiler (`cpu_profiler.c`)

**Attach point:** `perf_event_open` with `PERF_TYPE_SOFTWARE` / `PERF_COUNT_SW_CPU_CLOCK` at **99 Hz** sampling rate (not 100 Hz — avoids lockstep with the kernel's HZ timer which causes systematic sampling bias).

On each timer interrupt, the BPF program captures:
- Current PID
- Full kernel stack trace ID (via `BPF_STACK_TRACE`)
- Full user stack trace ID (via `BPF_STACK_TRACE` with `BPF_F_USER_STACK`)

Stack traces are stored as integer IDs in a `BPF_HASH` of `{pid, kern_stack_id, user_stack_id} → count`. In Python, IDs are resolved to symbol names using `bpf.ksym()` (kernel) and `bpf.sym()` (user, with PID context for ASLR-aware resolution).

The resulting folded stack format is fed into `flamegraph.py` which assembles D3 hierarchy JSON.

**Key metrics produced:**
- Full CPU flame graph (kernel + user stacks)
- Per-PID CPU utilization

---

### 5.5 OOM Watcher (`oom_watcher.c`)

**Attach point:** `kprobe` on `oom_kill_process`

Fires immediately when the Linux OOM killer selects a victim process. Extracts the PID and process name from the `oom_control` struct's `chosen` task pointer and emits the event via `BPF_PERF_OUTPUT`.

The Python reader picks this up in real-time and pushes a high-priority alert to all connected WebSocket clients within milliseconds of the OOM event.

**Key metrics produced:**
- PID and process name of killed process
- Timestamp of OOM event

---

## 6. Backend Architecture

### 6.1 FastAPI Application (`main.py`)

The FastAPI app is structured with a `lifespan` context manager that:
1. Initializes the SQLite database
2. Starts all five eBPF programs
3. Launches the 1-second aggregation loop

CORS middleware allows frontend access. A single `/ws` WebSocket endpoint broadcasts all real-time data.

### 6.2 Data Pipeline

```
eBPF perf ring buffer
        │
   Python callback (C struct → dict)
        │
   get_and_clear_events() / get_summary()
        │
   UnifiedStateAggregator (every 1 second)
        │
   flamegraph.py → D3 JSON hierarchy
        │
   WebSocket broadcast → all connected clients
        │
   SQLite snapshot (every 10 seconds)
```

### 6.3 Authentication

Bearer token authentication via `EBPFSCOPE_API_KEY` environment variable. The `HTTPBearer` middleware rejects any request with a missing or invalid token with `HTTP 401`.

### 6.4 Flame Graph Builder (`flamegraph.py`)

Converts the raw `{(pid, kern_stack_id, user_stack_id) → count}` map into a nested D3 hierarchy tree:
- Resolves kernel symbols using `bpf.ksym(addr)`
- Resolves user symbols using `bpf.sym(addr, pid)` (ASLR-aware)
- Builds bottom-up tree (root → base function → nested calls)
- Tags each frame as `kernel`, `user`, or `inlined`
- Returns `{ name, value, type, children[] }` JSON

---

## 7. Frontend Architecture

### 7.1 Real-Time Data Flow

```
useWebSocket.ts
  ├── Connects to ws://host/ws
  ├── Auto-reconnects on disconnect (2s backoff)
  ├── Parses JSON messages of type "metrics"
  └── Returns { state: MetricsState | null, isConnected: boolean }

App.tsx
  ├── Calls useWebSocket()
  ├── Passes state down via React Router Outlet context
  └── Renders Sidebar + TopBar + page content
```

### 7.2 Flame Graph Component (`FlameGraph.tsx`)

A fully custom D3 v7 SVG flame graph — **no external flamegraph library used**.

| Feature | Implementation |
|---|---|
| Layout | `d3.partition()` with SVG `<rect>` + `<text>` |
| Click-to-zoom | `useFlameGraph` hook manages a zoom path stack |
| Breadcrumb | Renders zoom path as clickable trail |
| Frame colors | Kernel=`#58a6ff`, User=`#D85A30`, Inlined=`#F0A500` |
| Tooltip | Absolutely positioned `div` with D3 mouse position |
| Text truncation | Calculates pixel width vs. character count |
| Transitions | CSS `transition: all 300ms ease` on `<rect>` |
| Re-render | `useEffect` on `currentRoot` change |

### 7.3 Custom Hooks

| Hook | Purpose |
|---|---|
| `useWebSocket` | WS connection lifecycle, parse, reconnect |
| `useFlameGraph` | Zoom path stack, currentRoot derivation |
| `useProcessFilter` | Search, sort, and filter for process list |
| `useAlerts` | Alert queue accumulation, dismiss by ID |

### 7.4 Pages

| Page | Route | Key Component |
|---|---|---|
| Dashboard | `/` | FlameGraph + SyscallHistogram + MetricBar |
| Processes | `/processes` | ProcessTable (sortable, filterable) |
| Files | `/files` | FileTracker (VFS I/O table) |
| Network | `/network` | NetworkFlowView (TCP/UDP table) |
| Alerts | `/alerts` | AlertFeed (OOM events with dismiss) |

---

## 8. Deployment Architecture

```
Docker Compose
├── backend (ubuntu:22.04)
│   ├── privileged: true              ← Required for eBPF
│   ├── pid: host                     ← Host PID namespace
│   ├── cap_add: SYS_ADMIN, BPF,
│   │           PERFMON, NET_ADMIN   ← Required capabilities
│   └── volumes:
│       ├── /sys/kernel/debug         ← debugfs (BCC requirement)
│       ├── /proc                     ← Host process info
│       ├── /lib/modules:ro           ← Kernel module headers
│       └── /usr/src:ro               ← Kernel source headers
│
├── frontend (node:18-alpine)
│   └── Vite dev server on :5173
│
└── nginx (nginx:alpine)
    └── Proxy: / → frontend:5173
              /api/ → backend:8000
              /ws → backend:8000 (WebSocket upgrade)
```

> **Security Note:** The `privileged: true` flag is a fundamental requirement for eBPF kernel-level observability — it is not a misconfiguration. In production, this container should be deployed only on trusted infrastructure, ideally with AppArmor/SELinux profiles scoped to BPF operations.

---

## 9. Design System

The dashboard uses a GitHub-dark-inspired design language:

| Token | Value | Usage |
|---|---|---|
| `--background` | `#0d1117` | Page background |
| `--surface` | `#161b22` | Cards, panels |
| `--border` | `#30363d` | Dividers |
| `--accent-green` | `#3fb950` | Live indicator, ESTABLISHED state |
| `--accent-amber` | `#d29922` | Warnings, P99 latency |
| `--accent-red` | `#f85149` | OOM alerts, critical events |
| `--accent-blue` | `#58a6ff` | Kernel frames, syscall counts |
| Mono font | JetBrains Mono / Fira Code | PIDs, addresses, latencies |
| Sans font | Inter / system-ui | Labels, descriptions |

---

## 10. File Structure

```
ebpfscope/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── config.py
│   ├── auth.py
│   ├── database.py
│   ├── aggregator.py
│   ├── flamegraph.py
│   ├── websocket.py
│   ├── bpf/
│   │   ├── syscall_tracer.c
│   │   ├── file_tracker.c
│   │   ├── network_tracer.c
│   │   ├── cpu_profiler.c
│   │   └── oom_watcher.c
│   ├── ebpf/
│   │   ├── loader.py
│   │   ├── syscall.py
│   │   ├── files.py
│   │   ├── network.py
│   │   ├── profiler.py
│   │   └── oom.py
│   └── api/
│       ├── metrics.py
│       ├── flamegraph.py
│       ├── processes.py
│       ├── files.py
│       ├── network.py
│       └── alerts.py
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── types/index.ts
│       ├── api/client.ts
│       ├── hooks/
│       │   ├── useWebSocket.ts
│       │   ├── useFlameGraph.ts
│       │   ├── useProcessFilter.ts
│       │   └── useAlerts.ts
│       ├── components/
│       │   ├── layout/Sidebar.tsx
│       │   ├── layout/TopBar.tsx
│       │   ├── FlameGraph.tsx
│       │   ├── SyscallHistogram.tsx
│       │   ├── ProcessTable.tsx
│       │   ├── FileTracker.tsx
│       │   ├── NetworkFlow.tsx
│       │   ├── AlertFeed.tsx
│       │   ├── MetricBar.tsx
│       │   └── ProcessFilter.tsx
│       └── pages/
│           ├── Dashboard.tsx
│           ├── Processes.tsx
│           ├── Files.tsx
│           ├── Network.tsx
│           └── Alerts.tsx
├── docker-compose.yml
├── nginx.conf
├── .env.example
├── README.md
└── REPORT.md
```

---

## 11. Setup & Running

### Prerequisites
- Docker Desktop (with Linux containers)
- Linux kernel 5.15+ host (Ubuntu 22.04 LTS recommended)
- `linux-headers-$(uname -r)` installed on host

### Quick Start

```bash
# 1. Clone and configure
git clone <repo>
cd ebpfscope
cp .env.example .env
# Edit .env and set EBPFSCOPE_API_KEY

# 2. Build and run
docker-compose up --build

# 3. Open dashboard
open http://localhost
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `EBPFSCOPE_API_KEY` | Yes | Bearer token for API authentication |
| `EBPFSCOPE_SQLITE_DB_PATH` | No | Path to SQLite DB (default: `ebpfscope.db`) |

### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/metrics` | GET | Current full state snapshot |
| `/api/flamegraph` | GET | Current flame graph JSON |
| `/api/processes` | GET | Per-process syscall summary |
| `/api/files` | GET | File access statistics |
| `/api/network` | GET | Active network connections |
| `/api/alerts` | GET | Recent OOM and anomaly events |
| `/ws` | WebSocket | Real-time 1-second broadcast |

---

## 12. Kernel Compatibility

| Feature | Minimum Kernel |
|---|---|
| kprobes | 2.6.9 |
| BPF tracepoints | 4.7 |
| `BPF_PERF_OUTPUT` | 4.4 |
| `BPF_STACK_TRACE` | 4.6 |
| `CAP_BPF` (separate capability) | 5.8 |
| BPF ring buffer (`BPF_MAP_TYPE_RINGBUF`) | 5.8 |
| CO-RE (libbpf) | 5.2 |

**EBPFScope targets Linux 5.15 LTS** (Ubuntu 22.04 default) and uses BCC for runtime compilation, which is compatible back to kernel 4.4 for most features.

---

## 13. Known Limitations

1. **macOS**: eBPF is a Linux kernel feature. EBPFScope cannot attach eBPF programs on macOS. The Docker container requires a Linux VM (Docker Desktop uses HyperKit/VZ on Mac), so eBPF programs run inside the Linux VM — not on the Mac host kernel. System calls observed will be from the Docker Linux VM, not the Mac host.

2. **Filename resolution**: Full VFS path resolution in BPF is difficult due to the 512-byte BPF stack limit. The file tracker extracts only the dentry's final name component, not the full absolute path.

3. **Symbol resolution latency**: For user-space symbol resolution, BCC uses `/proc/<pid>/maps` and debug info. If binaries are stripped, symbols may appear as hex addresses.

4. **Container isolation**: Each Docker container has its own PID namespace. `pid: host` is required in the backend container to see host (VM) process names correctly.

---

## 14. Deliverable Checklist

| Item | Status |
|---|---|
| All 5 BPF C programs (real, compilable) | ✅ |
| Syscall tracer with latency (entry_ts hash + delta on exit) | ✅ |
| CPU profiler at 99Hz with BPF_STACK_TRACE | ✅ |
| flamegraph.py → D3 hierarchy JSON | ✅ |
| FlameGraph.tsx with zoom, breadcrumb, tooltip, color-by-type | ✅ |
| WebSocket pushes unified JSON every 1 second | ✅ |
| Docker Compose with privileged mode + kernel mounts | ✅ |
| Auth middleware (Bearer token) | ✅ |
| SQLite persistence for snapshots and alerts | ✅ |
| structlog JSON logging throughout backend | ✅ |
| TypeScript strict mode, no `any` | ✅ |
| .env.example with all variables documented | ✅ |
| README with kernel requirements and setup | ✅ |

---

Author - Sandesha Wakchaure