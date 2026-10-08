import type { TreeNode as TreeNodeType } from "../data/buildTree";

export interface TreeNodeProps {
  node: TreeNodeType;
  isRoot?: boolean;
  qty?: number | string;
}

export function TreeNode({ node, isRoot, qty }: TreeNodeProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`p-4 px-6 rounded-xl border transition-all duration-300 group relative ${
          isRoot
            ? "bg-brand-600 text-white shadow-md border-brand-700"
            : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 hover:border-brand-500 shadow-sm"
        }`}
      >
        {qty && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-bold shadow-md z-20 uppercase tracking-widest border border-white dark:border-surface-900">
            {typeof qty === "number" ? qty.toFixed(3) : qty} / unit
          </div>
        )}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isRoot ? "bg-white/20" : "bg-brand-50 dark:bg-brand-900/20 text-brand-600"
              }`}
            >
              {isRoot ? <span>⚡</span> : <span>◆</span>}
            </div>
            <span className="text-sm font-bold uppercase tracking-wide whitespace-nowrap">
              {node.name}
            </span>
          </div>
          {node.buildingId && (
            <div
              className={`text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded ${
                isRoot
                  ? "bg-white/10 text-white"
                  : "bg-surface-100 dark:bg-surface-800 text-surface-500"
              }`}
            >
              Produced in: {node.buildingId}
            </div>
          )}
        </div>
      </div>

      {node.inputs.length > 0 && (
        <div className="flex gap-8 mt-12 relative">
          <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-surface-200 dark:bg-surface-800" />
          {node.inputs.map((input, i) => (
            <div key={i} className="relative pt-4">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-surface-100 dark:bg-surface-800/50" />
              <TreeNode node={input} qty={input.qty} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}