#include <uapi/linux/ptrace.h>
#include <linux/sched.h>
#include <linux/fs.h>

struct file_stat_t {
    u64 reads;
    u64 read_bytes;
    u64 writes;
    u64 write_bytes;
    u64 opens;
    u64 total_latency_ns;
    char comm[TASK_COMM_LEN];
};

struct file_key_t {
    u32 pid;
    char filename[256];
};

BPF_HASH(file_stats, struct file_key_t, struct file_stat_t);

// Temporary state for tracking open/read/write entry
struct entry_t {
    u64 ts;
    const char *filename;
};
BPF_HASH(entry_info, u64, struct entry_t);

static inline void get_file_path(struct file *file, char *buf, size_t size) {
    // Simple dentry name extraction (can't safely get full path in bpf easily)
    struct dentry *de = file->f_path.dentry;
    if (de) {
        struct qstr d_name = de->d_name;
        bpf_probe_read_kernel_str(buf, size, d_name.name);
    }
}

int kprobe__vfs_read(struct pt_regs *ctx, struct file *file, char __user *buf, size_t count, loff_t *pos) {
    u64 pid_tgid = bpf_get_current_pid_tgid();
    struct entry_t e = {};
    e.ts = bpf_ktime_get_ns();
    // store file directly to resolve on return
    e.filename = (const char *)file;
    entry_info.update(&pid_tgid, &e);
    return 0;
}

int kretprobe__vfs_read(struct pt_regs *ctx) {
    u64 pid_tgid = bpf_get_current_pid_tgid();
    struct entry_t *e = entry_info.lookup(&pid_tgid);
    if (!e) return 0;
    
    s64 ret = PT_REGS_RC(ctx);
    if (ret < 0) {
        entry_info.delete(&pid_tgid);
        return 0;
    }

    struct file_key_t key = {};
    key.pid = pid_tgid >> 32;
    get_file_path((struct file *)e->filename, key.filename, sizeof(key.filename));

    struct file_stat_t *stat = file_stats.lookup(&key);
    struct file_stat_t zero = {};
    if (!stat) {
        bpf_get_current_comm(&zero.comm, sizeof(zero.comm));
        stat = &zero;
    }
    
    stat->reads++;
    stat->read_bytes += ret;
    stat->total_latency_ns += bpf_ktime_get_ns() - e->ts;
    file_stats.update(&key, stat);
    
    entry_info.delete(&pid_tgid);
    return 0;
}

int kprobe__vfs_write(struct pt_regs *ctx, struct file *file, const char __user *buf, size_t count, loff_t *pos) {
    u64 pid_tgid = bpf_get_current_pid_tgid();
    struct entry_t e = {};
    e.ts = bpf_ktime_get_ns();
    e.filename = (const char *)file;
    entry_info.update(&pid_tgid, &e);
    return 0;
}

int kretprobe__vfs_write(struct pt_regs *ctx) {
    u64 pid_tgid = bpf_get_current_pid_tgid();
    struct entry_t *e = entry_info.lookup(&pid_tgid);
    if (!e) return 0;
    
    s64 ret = PT_REGS_RC(ctx);
    if (ret < 0) {
        entry_info.delete(&pid_tgid);
        return 0;
    }

    struct file_key_t key = {};
    key.pid = pid_tgid >> 32;
    get_file_path((struct file *)e->filename, key.filename, sizeof(key.filename));

    struct file_stat_t *stat = file_stats.lookup(&key);
    struct file_stat_t zero = {};
    if (!stat) {
        bpf_get_current_comm(&zero.comm, sizeof(zero.comm));
        stat = &zero;
    }
    
    stat->writes++;
    stat->write_bytes += ret;
    stat->total_latency_ns += bpf_ktime_get_ns() - e->ts;
    file_stats.update(&key, stat);
    
    entry_info.delete(&pid_tgid);
    return 0;
}

int kprobe__vfs_open(struct pt_regs *ctx, const struct path *path, struct file *file) {
    u64 pid_tgid = bpf_get_current_pid_tgid();
    struct entry_t e = {};
    e.ts = bpf_ktime_get_ns();
    e.filename = (const char *)file;
    entry_info.update(&pid_tgid, &e);
    return 0;
}

int kretprobe__vfs_open(struct pt_regs *ctx) {
    u64 pid_tgid = bpf_get_current_pid_tgid();
    struct entry_t *e = entry_info.lookup(&pid_tgid);
    if (!e) return 0;

    struct file_key_t key = {};
    key.pid = pid_tgid >> 32;
    get_file_path((struct file *)e->filename, key.filename, sizeof(key.filename));

    struct file_stat_t *stat = file_stats.lookup(&key);
    struct file_stat_t zero = {};
    if (!stat) {
        bpf_get_current_comm(&zero.comm, sizeof(zero.comm));
        stat = &zero;
    }

    stat->opens++;
    stat->total_latency_ns += bpf_ktime_get_ns() - e->ts;
    file_stats.update(&key, stat);

    entry_info.delete(&pid_tgid);
    return 0;
}

// Support for do_sys_openat2
int kprobe__do_sys_openat2(struct pt_regs *ctx, int dfd, const char __user *filename, struct open_how *how) {
    u64 pid_tgid = bpf_get_current_pid_tgid();
    struct entry_t e = {};
    e.ts = bpf_ktime_get_ns();
    e.filename = filename;
    entry_info.update(&pid_tgid, &e);
    return 0;
}

int kretprobe__do_sys_openat2(struct pt_regs *ctx) {
    u64 pid_tgid = bpf_get_current_pid_tgid();
    struct entry_t *e = entry_info.lookup(&pid_tgid);
    if (!e) return 0;
    
    long ret = PT_REGS_RC(ctx);
    if (ret < 0) {
        entry_info.delete(&pid_tgid);
        return 0;
    }

    struct file_key_t key = {};
    key.pid = pid_tgid >> 32;
    bpf_probe_read_user_str(&key.filename, sizeof(key.filename), e->filename);

    struct file_stat_t *stat = file_stats.lookup(&key);
    struct file_stat_t zero = {};
    if (!stat) {
        bpf_get_current_comm(&zero.comm, sizeof(zero.comm));
        stat = &zero;
    }

    stat->opens++;
    stat->total_latency_ns += bpf_ktime_get_ns() - e->ts;
    file_stats.update(&key, stat);

    entry_info.delete(&pid_tgid);
    return 0;
}
