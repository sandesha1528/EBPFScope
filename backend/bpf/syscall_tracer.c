#include <uapi/linux/ptrace.h>
#include <linux/sched.h>

struct event_t {
    u32 pid;
    u32 tgid;
    u32 uid;
    u64 syscall_id;
    u64 entry_ts;
    u64 exit_ts;
    u64 latency_ns;
    long ret;
    char comm[TASK_COMM_LEN];
};

BPF_PERF_OUTPUT(events);
BPF_HASH(entry_info, u64, u64); // key: pid_tgid, val: timestamp
BPF_ARRAY(filter_pid, u32, 1);

TRACEPOINT_PROBE(raw_syscalls, sys_enter) {
    u64 pid_tgid = bpf_get_current_pid_tgid();
    u32 pid = pid_tgid >> 32;

    int key = 0;
    u32 *fpid = filter_pid.lookup(&key);
    if (fpid && *fpid != 0 && *fpid != pid) {
        return 0; // Exclude
    }

    u64 ts = bpf_ktime_get_ns();
    entry_info.update(&pid_tgid, &ts);
    return 0;
}

TRACEPOINT_PROBE(raw_syscalls, sys_exit) {
    u64 pid_tgid = bpf_get_current_pid_tgid();
    u32 pid = pid_tgid >> 32;
    
    int key = 0;
    u32 *fpid = filter_pid.lookup(&key);
    if (fpid && *fpid != 0 && *fpid != pid) {
        return 0; // Exclude
    }

    u64 *tsp = entry_info.lookup(&pid_tgid);
    if (!tsp) {
        return 0; // Missed entry
    }

    struct event_t event = {};
    event.pid = pid;
    event.tgid = pid_tgid;
    event.uid = bpf_get_current_uid_gid();
    event.syscall_id = args->id;
    event.entry_ts = *tsp;
    event.exit_ts = bpf_ktime_get_ns();
    event.latency_ns = event.exit_ts - event.entry_ts;
    event.ret = args->ret;
    bpf_get_current_comm(&event.comm, sizeof(event.comm));

    events.perf_submit(args, &event, sizeof(event));
    entry_info.delete(&pid_tgid);

    return 0;
}
