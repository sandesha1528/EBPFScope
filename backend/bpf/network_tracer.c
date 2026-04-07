#include <uapi/linux/ptrace.h>
#include <net/sock.h>
#include <net/inet_sock.h>
#include <bcc/proto.h>

struct ipv4_flow_key_t {
    u32 saddr;
    u32 daddr;
    u16 sport;
    u16 dport;
    u32 pid;
};

struct flow_val_t {
    u64 rx_bytes;
    u64 tx_bytes;
    u32 retransmits;
    u32 state;
    char comm[TASK_COMM_LEN];
};

BPF_HASH(ipv4_flows, struct ipv4_flow_key_t, struct flow_val_t);

static inline void update_flow(struct sock *sk, u32 pid, u32 is_tx, size_t bytes, u32 retransmit) {
    struct inet_sock *inet = inet_sk(sk);
    u16 sport = inet->inet_sport;
    u16 dport = sk->__sk_common.skc_dport;
    u32 saddr = inet->inet_saddr;
    u32 daddr = sk->__sk_common.skc_daddr;

    if (saddr == 0 || daddr == 0) return;

    struct ipv4_flow_key_t key = {};
    key.saddr = saddr;
    key.daddr = daddr;
    key.sport = ntohs(sport);
    key.dport = ntohs(dport);
    key.pid = pid;

    struct flow_val_t *val = ipv4_flows.lookup(&key);
    struct flow_val_t zero = {};
    if (!val) {
        bpf_get_current_comm(&zero.comm, sizeof(zero.comm));
        zero.state = sk->__sk_common.skc_state;
        val = &zero;
    }

    if (is_tx) {
        val->tx_bytes += bytes;
    } else {
        val->rx_bytes += bytes;
    }
    
    val->retransmits += retransmit;
    val->state = sk->__sk_common.skc_state;
    ipv4_flows.update(&key, val);
}

int kprobe__tcp_sendmsg(struct pt_regs *ctx, struct sock *sk, struct msghdr *msg, size_t size) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    update_flow(sk, pid, 1, size, 0);
    return 0;
}

int kprobe__tcp_recvmsg(struct pt_regs *ctx, struct sock *sk, struct msghdr *msg, size_t len) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    update_flow(sk, pid, 0, len, 0);
    return 0;
}

int kprobe__tcp_connect(struct pt_regs *ctx, struct sock *sk) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    update_flow(sk, pid, 1, 0, 0);
    return 0;
}

int kprobe__tcp_close(struct pt_regs *ctx, struct sock *sk) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    update_flow(sk, pid, 0, 0, 0);
    return 0;
}

int kprobe__udp_sendmsg(struct pt_regs *ctx, struct sock *sk, struct msghdr *msg, size_t len) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    update_flow(sk, pid, 1, len, 0);
    return 0;
}

int kprobe__tcp_retransmit_skb(struct pt_regs *ctx, struct sock *sk) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    update_flow(sk, pid, 1, 0, 1);
    return 0;
}
