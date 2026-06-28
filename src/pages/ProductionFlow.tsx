import { useState, useMemo } from "react";
import { RESOURCES } from "../data/simco_static";
import { Search, ChevronRight, Share2, Layers, Zap } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-100 dark:border-surface-800/50">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
               <Share2 size={20} />
            </div>
            <h1 className="text-xl font-black uppercase italic tracking-tight">Flow.<span className="text-brand-600">Visual</span></h1>
         </div>

         <div className="relative group w-full max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Find Resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input !pl-8 !py-1.5 !rounded shadow-none border-none !bg-surface-50 dark:!bg-surface-950"
            />
            {search && (
               <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-surface-950 border border-surface-100 dark:border-surface-800 z-50 rounded shadow-2xl overflow-hidden">
                  <div className="max-h-40 overflow-y-auto scrollbar-hide">
                     {filtered.slice(0, 8).map(r => (
                        <button
                          key={r.id}
                          onClick={() => { setTargetId(r.id); setSearch(""); }}
                          className="w-full text-left px-3 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/10 flex justify-between items-center transition-all border-b border-surface-50 dark:border-surface-800 last:border-0"
                        >
                           <span className="text-[10px] font-black uppercase text-surface-600 dark:text-surface-400">{r.name}</span>
                           <ChevronRight size={10} className="text-surface-300" />
                        </button>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </div>

      <div className="card !bg-transparent p-4 min-h-[60vh] overflow-x-auto flex flex-col items-center justify-start border-none">
         <motion.div layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <TreeNode node={tree} isRoot />
         </motion.div>
      </div>
    </div>
  );
}

function TreeNode({ node, isRoot, qty }: { node: any; isRoot?: boolean; qty?: any }) {
  return (
    <div className="flex flex-col items-center">
       <div className={`p-2 px-4 rounded border transition-all duration-300 group relative ${isRoot ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/20 border-brand-600' : 'bg-white dark:bg-surface-900 border-surface-100 dark:border-surface-800 hover:border-brand-500 shadow-sm'}`}>
          {qty && (
             <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 text-white rounded-[2px] text-[8px] font-black shadow-lg z-20 uppercase tracking-widest border border-white dark:border-surface-900">
                {qty}
             </div>
          )}
          <div className="flex items-center gap-2">
             <div className={`w-5 h-5 rounded flex items-center justify-center ${isRoot ? 'bg-white/20' : 'bg-brand-50 dark:bg-brand-900/20 text-brand-500'}`}>
                {isRoot ? <Zap size={12} /> : <Layers size={10} />}
             </div>
             <span className="text-[10px] font-black uppercase tracking-tight whitespace-nowrap">{node.name}</span>
          </div>
       </div>

       {node.inputs && node.inputs.length > 0 && (
          <div className="flex gap-4 mt-8 relative">
             <div className="absolute -top-8 left-1/2 w-px h-8 bg-brand-500/30" />
             {node.inputs.map((input: any, i: number) => (
                <div key={i} className="relative pt-2">
                   <div className="absolute top-0 left-0 right-0 h-px bg-brand-500/10" />
                   <TreeNode node={input} qty={input.qty} />
                </div>
             ))}
          </div>
       )}
    </div>
  );
}
