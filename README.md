# EBPFScope

"X-ray vision for your Linux kernel"

EBPFScope is a observability platform that attaches eBPF programs via kprobes, tracepoints, and perf events to capture system calls, file access, network events, and CPU stack traces with microsecond precision.

## Architecture

*   **Backend:** Python FastAPI, asyncio, BCC Python bindings.
*   **eBPF:** 5 distinct C programs loaded dynamically to trace syscalls, network, files, CPU profiling (99Hz), and OOM events.
*   **Frontend:** React 18, Tailwind, D3.js (custom flamegraphs), Recharts.

## Requirements

*   **Linux Kernel:** 5.15+ (tested on Ubuntu 22.04 LTS). Requires BPF ring buffer support and CAP_BPF.
*   **Docker:** Docker Compose with privileged mode enabled.
*   **Host requirements:** Must have `linux-headers-$(uname -r)` available on the host for dynamic BCC compilation.

## Quick Start

1.  Clone the repository.
2.  Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
3.  Build and run with docker-compose:
    ```bash
    docker-compose up --build
    ```
    *Note: The backend container runs in `privileged: true` mode with host PID namespace and mounts `/sys/kernel/debug` and `/lib/modules`. This is fundamentally required for eBPF observability tools to attach to the host kernel.*

4.  Open `http://localhost/` in your browser. (Nginx proxies port 80 to the frontend and backend).

## Troubleshooting

- **`cannot attach kprobe` or BCC compilation errors:** Ensure your host linux headers are installed and match your running kernel.
- **WebSocket connection failed:** The frontend attempts to connect to `/ws`. If running via Vite dev server, ensure the proxy in `vite.config.ts` is active or change the dev URL.


Author - Rohit Patil