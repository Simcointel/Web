import { RESOURCES } from "./simco_static";

export interface TreeNode {
  id: number;
  name: string;
  inputs: TreeNode[];
  buildingId?: string | number;
  qty?: number | string;
  parentId?: number;
}

export function buildResourceTree(id: number, depth = 0): TreeNode {
  const res = RESOURCES.find(r => r.id === id);
  if (!res || depth > 5) return { id, name: res?.name || '?', inputs: [] };
  const inputs = res.inputs
    ? Object.entries(res.inputs).map(([iid, qty]) => ({
        ...buildResourceTree(Number(iid), depth + 1),
        qty,
        parentId: id,
      }))
    : [];
  return { id, name: res.name, inputs, buildingId: res.buildingId };
}
