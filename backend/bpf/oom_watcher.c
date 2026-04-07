#include <uapi/linux/ptrace.h>
#include <linux/sched.h>
#include <linux/oom.h>

struct oom_event_t {
    u32 pid;
    char comm[TASK_COMM_LEN];
    long points;
};

BPF_PERF_OUTPUT(oom_events);

// Kernel 5.x+ oom_kill_process signature usually:
// static void oom_kill_process(struct oom_control *oc, const char *message)
// We will just catch it by name to extract the victim context.
int kprobe__oom_kill_process(struct pt_regs *ctx, struct oom_control *oc, const char *message) {
    if (!oc || !oc->chosen) return 0;
    
    struct task_struct *task = oc->chosen;
    struct oom_event_t event = {};
    
    bpf_probe_read_kernel(&event.pid, sizeof(event.pid), &task->pid);
    bpf_probe_read_kernel_str(&event.comm, sizeof(event.comm), task->comm);
    // oc->totalpages is available, but points is inside oc->chosen? 
    // We'll just grab the PID and COMM for the alert.
    event.points = 0; 
    
    oom_events.perf_submit(ctx, &event, sizeof(event));
    return 0;
}
