import { useState, useMemo } from "react";
import { RESOURCES } from "../data/simco_static";
import { Search, ChevronRight, Share2, Layers } from "lucide-react";

export function ProductionFlowPage() {
  const [targetId, setTargetId] = useState<number>(2); // Default to Apples
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    RESOURCES.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
  , [search]);

  const tree = useMemo(() => {
    const buildTree = (id: number, depth = 0): any => {
      const res = RESOURCES.find(r => r.id === id);
      if (!res || depth > 4) return { id, name: res?.name || '?', inputs: [] };
      const inputs = res.inputs ? Object.entries(res.inputs).map(([iid, qty]) => ({
        ...buildTree(Number(iid), depth + 1),
        qty
      })) : [];
      return { id, name: res.name, inputs };
    };
    return buildTree(targetId);
  }, [targetId]);

  return (
    <div className="space-y-6 font-mono text-[10px] animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest">Production_Flow_Visualizer</h1>
          <p className="text-[10px] text-surface-500 mt-0.5 font-bold uppercase opacity-60">Supply_Chain_Mapping</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30" />
              <input
                type="text"
                placeholder="FIND_RESOURCE..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 pl-8 pr-2 py-1 text-[10px] uppercase font-bold outline-none focus:border-surface-900 dark:focus:border-white"
              />
              {search && (
                 <div className="absolute top-full left-0 right-0 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 z-50 max-h-40 overflow-y-auto">
                    {filtered.map(r => (
                       <button
                         key={r.id}
                         onClick={() => { setTargetId(r.id); setSearch(""); }}
                         className="w-full text-left px-2 py-1 hover:bg-surface-50 dark:hover:bg-surface-900 uppercase font-bold border-b border-surface-100 dark:border-surface-900 last:border-0"
                       >
                          {r.name}
                       </button>
                    ))}
                 </div>
              )}
           </div>
        </div>
      </div>

      <div className="border border-surface-200 dark:border-surface-800 p-8 min-h-[500px] overflow-x-auto bg-surface-50/30 dark:bg-surface-950/30">
         <div className="flex flex-col items-center">
            <TreeNode node={tree} isRoot />
         </div>
      </div>
    </div>
  );
}

function TreeNode({ node, isRoot, qty }: { node: any; isRoot?: boolean; qty?: any }) {
  return (
    <div className="flex flex-col items-center">
       <div className={`p-4 border ${isRoot ? 'border-2 border-surface-900 dark:border-white bg-white dark:bg-surface-900' : 'border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50'} relative group`}>
          {qty && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-surface-900 text-white dark:bg-white dark:text-surface-950 px-1 text-[8px] font-black">{qty}U</span>}
          <span className="uppercase font-black tracking-tight">{node.name}</span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
             <ChevronRight size={12} className="rotate-90" />
          </div>
       </div>

       {node.inputs && node.inputs.length > 0 && (
          <div className="flex gap-8 mt-12 relative">
             <div className="absolute -top-6 left-1/2 w-px h-6 bg-surface-200 dark:border-surface-800" />
             {node.inputs.map((input: any, i: number) => (
                <TreeNode key={i} node={input} qty={input.qty} />
             ))}
          </div>
       )}
    </div>
  );
}
