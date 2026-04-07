class FlameGraphBuilder:
    def __init__(self):
        self.root = {"name": "all", "value": 0, "type": "root", "children": []}
        
    def build(self, counts, stack_traces, bpf):
        # Build hierarchy
        root = {"name": "all", "value": 0, "type": "root", "children_dict": {}}
        
        for k, v in counts:
            pid = k.pid
            user_stack_id = k.user_stack_id
            kern_stack_id = k.kern_stack_id
            count = v.value
            
            frames = []
            
            # user stack (top-down)
            if user_stack_id >= 0 and bpf is not None:
                for addr in stack_traces.walk(user_stack_id):
                    sym = bpf.sym(addr, pid)
                    name = sym.decode('utf-8', 'replace') if sym else f"0x{addr:x}"
                    # Detect if inlined - heuristic based on gcc/clang
                    # since BCC itself doesn't tag inline, we'll just check common tags
                    is_inlined = "inlined" in name or "[ext]" in name
                    ftype = "inlined" if is_inlined else "user"
                    frames.append({"name": name, "type": ftype})
                    
            # kernel stack (top-down)
            if kern_stack_id >= 0 and bpf is not None:
                for addr in stack_traces.walk(kern_stack_id):
                    sym = bpf.ksym(addr)
                    name = sym.decode('utf-8', 'replace') if sym else f"0x{addr:x}"
                    frames.append({"name": name, "type": "kernel"})
                    
            # reverse it to make it bottom-up (root -> base func -> nested func)
            frames.reverse()
            
            node = root
            node["value"] += count
            
            for frame in frames:
                fname = frame["name"]
                if fname not in node["children_dict"]:
                    node["children_dict"][fname] = {
                        "name": fname, 
                        "value": 0, 
                        "type": frame["type"], 
                        "children_dict": {}
                    }
                node = node["children_dict"][fname]
                node["value"] += count

        # Convert dicts back to arrays for D3
        def dict_to_list(n):
            if "children_dict" in n:
                n["children"] = [dict_to_list(c) for c in n["children_dict"].values()]
                
                # Sort children by value to arrange the flamegraph nicely
                n["children"].sort(key=lambda x: x["value"], reverse=True)
                del n["children_dict"]
            return n

        self.root = dict_to_list(root)
        return self.root
