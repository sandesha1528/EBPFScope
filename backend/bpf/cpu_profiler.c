#include <uapi/linux/ptrace.h>
#include <linux/sched.h>

struct profile_key_t {
    u32 pid;
    int user_stack_id;
    int kern_stack_id;
};

// 10240 is max stack traces
BPF_STACK_TRACE(stack_traces, 10240);
BPF_HASH(counts, struct profile_key_t, u64);

int on_cpu_sample(struct bpf_perf_event_data *ctx) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    
    // We only care about userland apps (optional, but let's profile all)
    if (pid == 0) return 0;
    
    struct profile_key_t key = {};
    key.pid = pid;
    
    // Get stack IDs
    key.user_stack_id = stack_traces.get_stackid(ctx, BPF_F_USER_STACK);
    key.kern_stack_id = stack_traces.get_stackid(ctx, 0);
    
    u64 *val = counts.lookup(&key);
    u64 zero = 0;
    if (!val) {
        val = &zero;
    }
    
    (*val)++;
    counts.update(&key, val);
    
    return 0;
}
