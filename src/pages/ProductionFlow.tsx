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
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-surface-200 dark:border-surface-800">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 rounded-3xl flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-xl shadow-brand-500/10">
               <Share2 size={32} />
            </div>
            <div>
               <h1 className="text-3xl font-black uppercase italic tracking-tighter">SupplyChain<span className="text-brand-600">.Matrix</span></h1>
               <p className="text-xs font-black uppercase text-surface-400 tracking-[0.2em] mt-1">Recursive Resource Dependency Mapping</p>
            </div>
         </div>

         <div className="relative group w-full max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
            <input
              type="text"
              placeholder="Find Resource Tree..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input !pl-12 !py-4 !rounded-2xl shadow-soft"
            />
            {search && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 z-50 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  {filtered.slice(0, 10).map(r => (
                     <button
                       key={r.id}
                       onClick={() => { setTargetId(r.id); setSearch(""); }}
                       className="w-full text-left p-4 hover:bg-brand-50 dark:hover:bg-brand-900/10 flex justify-between items-center transition-colors border-b border-surface-50 dark:border-surface-900 last:border-0"
                     >
                        <span className="text-sm font-black uppercase italic tracking-tighter">{r.name}</span>
                        <div className="w-6 h-6 rounded-lg bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-surface-400"><ChevronRight size={14} /></div>
                     </button>
                  ))}
               </div>
            )}
         </div>
      </div>

      <div className="card !bg-surface-50/50 dark:!bg-surface-950/30 p-12 min-h-[600px] overflow-x-auto flex flex-col items-center justify-start border-dashed">
         <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TreeNode node={tree} isRoot />
         </motion.div>
      </div>
    </div>
  );
}

function TreeNode({ node, isRoot, qty }: { node: any; isRoot?: boolean; qty?: any }) {
  return (
    <div className="flex flex-col items-center">
       <div className={`p-6 rounded-[2rem] border transition-all duration-500 group relative ${isRoot ? 'bg-surface-900 text-white dark:bg-white dark:text-surface-950 shadow-2xl scale-110 z-10' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 shadow-soft hover:shadow-xl hover:-translate-y-1'}`}>
          {qty && (
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-500 text-white rounded-full text-[10px] font-black shadow-lg shadow-brand-500/30 z-20">
                {qty} Units
             </div>
          )}
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isRoot ? 'bg-white/10 dark:bg-surface-900/10' : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'}`}>
                {isRoot ? <Zap size={20} /> : <Layers size={18} />}
             </div>
             <span className="text-sm font-black uppercase italic tracking-tighter whitespace-nowrap">{node.name}</span>
          </div>
       </div>

       {node.inputs && node.inputs.length > 0 && (
          <div className="flex gap-12 mt-16 relative">
             <div className="absolute -top-16 left-1/2 w-0.5 h-16 bg-gradient-to-b from-surface-200 to-brand-500 dark:from-surface-800 dark:to-brand-400" />
             {node.inputs.map((input: any, i: number) => (
                <div key={i} className="relative pt-4">
                   <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-500 dark:bg-brand-400 opacity-20" />
                   <TreeNode node={input} qty={input.qty} />
                </div>
             ))}
          </div>
       )}
    </div>
  );
}
