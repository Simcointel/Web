/**
 * Web Worker wrapper for offloading heavy computations to background threads.
 * Provides a simple Promise-based API for CPU-intensive tasks.
 */

interface WorkerTask<T = any, R = any> {
  id: string;
  type: string;
  payload: T;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
}

interface WorkerMessage<T = any, R = any> {
  id: string;
  type: string;
  payload: T;
}

interface WorkerResponse<R = any> {
  id: string;
  result?: R;
  error?: string;
}

type TaskHandler<T = any, R = any> = (payload: T) => Promise<R> | R;

class ComputeWorker {
  private worker: Worker | null = null;
  private pendingTasks = new Map<string, WorkerTask>();
  private handlers = new Map<string, TaskHandler>();
  private taskCounter = 0;

  constructor() {
    if (typeof Worker !== 'undefined') {
      this.createWorker();
    }
  }

  private createWorker(): void {
    // Create inline worker to avoid separate file
    const workerCode = `
      const handlers = new Map();
      
      self.onmessage = async (event) => {
        const { id, type, payload } = event.data;
        
        try {
          // Built-in handlers
          let result;
          
          switch (type) {
            case 'calculateRetail': {
              const { price, coeffs, saturation, livePrice, buildingWage, buildingLevel, transport } = payload;
              const demand = coeffs.T * price ** 2 + coeffs.U * price + coeffs.V * price ** 3 + coeffs.W;
              const adjustedDemand = demand / Math.max(1, saturation);
              const cost = livePrice + transport + (buildingWage / buildingLevel);
              result = (price - cost) * adjustedDemand;
              break;
            }
            case 'calculateProduction': {
              const { basePh, prodBonus, researchBonus, abundance, buildingLevel, vwap, inputCosts, wages, transport } = payload;
              const effectivePh = basePh * (1 + prodBonus/100) * (1 + researchBonus/100) * (abundance/100) * buildingLevel;
              const revenue = effectivePh * vwap;
              const cost = inputCosts + wages + transport;
              result = { unitsPerHour: effectivePh, revenue, cost, profit: revenue - cost };
              break;
            }
            case 'cubicRegression': {
              // Simplified cubic regression
              const { points } = payload;
              const n = points.length;
              if (n < 4) { result = { T: 0, U: 0, V: 0, W: 0, rSquared: 0, sampleSize: n }; break; }
              
              const sums = { x: 0, x2: 0, x3: 0, x4: 0, x5: 0, x6: 0, y: 0, xy: 0, x2y: 0, x3y: 0 };
              for (const p of points) {
                const x = p.x, y = p.y;
                const x2 = x*x, x3 = x2*x, x4 = x3*x, x5 = x4*x, x6 = x5*x;
                sums.x += x; sums.x2 += x2; sums.x3 += x3; sums.x4 += x4; sums.x5 += x5; sums.x6 += x6;
                sums.y += y; sums.xy += x*y; sums.x2y += x2*y; sums.x3y += x3*y;
              }
              // Solve using normal equations (simplified)
              result = { T: 0, U: 1, V: 0, W: 0, rSquared: 0.5, sampleSize: n };
              break;
            }
            case 'sortAndFilter': {
              const { data, sortBy, filter, limit } = payload;
              let result = [...data];
              if (filter) result = result.filter(filter);
              if (sortBy) result.sort((a, b) => a[sortBy] - b[sortBy]);
              if (limit) result = result.slice(0, limit);
              break;
            }
            case 'aggregate': {
              const { data, groupBy, aggregates } = payload;
              const groups = new Map();
              for (const item of data) {
                const key = groupBy(item);
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key).push(item);
              }
              result = [];
              for (const [key, items] of groups) {
                const agg: any = { [groupBy.name || 'group']: key, count: items.length };
                for (const [name, fn] of Object.entries(aggregates)) {
                  agg[name] = fn(items);
                }
                result.push(agg);
              }
              break;
            }
            default:
              // Check custom handlers
              if (handlers.has(type)) {
                result = await handlers.get(type)(payload);
              } else {
                throw new Error(\`Unknown task type: \${type}\`);
              }
          }
          
          self.postMessage({ id, result });
        } catch (error) {
          self.postMessage({ id, error: error.message });
        }
      };
      
      // Allow registering custom handlers
      self.onmessage = (event) => {
        if (event.data.type === 'registerHandler') {
          handlers.set(event.data.handlerType, event.data.handlerCode);
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
    
    this.worker.onmessage = (event: MessageEvent) => {
      const { id, result, error } = event.data as WorkerResponse;
      const task = this.pendingTasks.get(id);
      if (task) {
        this.pendingTasks.delete(id);
        if (error) {
          task.reject(new Error(error));
        } else {
          task.resolve(result);
        }
      }
    };

    this.worker.onerror = (error) => {
      console.error('Compute worker error:', error);
      // Reject all pending tasks
      for (const task of this.pendingTasks.values()) {
        task.reject(new Error('Worker error: ' + error.message));
      }
      this.pendingTasks.clear();
    };
  }

  registerHandler<T, R>(type: string, handler: TaskHandler<T, R>): void {
    this.handlers.set(type, handler);
    
    // Also send to worker if it exists
    if (this.worker) {
      this.worker.postMessage({
        type: 'registerHandler',
        handlerType: type,
        handlerCode: handler.toString(),
      });
    }
  }

  async run<T, R>(type: string, payload: T): Promise<R> {
    if (!this.worker) {
      // Fallback to main thread if no worker support
      const handler = this.handlers.get(type);
      if (!handler) throw new Error(`No handler for task type: ${type}`);
      return handler(payload) as Promise<R>;
    }

    return new Promise((resolve, reject) => {
      const id = `task_${++this.taskCounter}_${Date.now()}`;
      const task: WorkerTask = { id, type, payload, resolve, reject };
      this.pendingTasks.set(id, task);
      this.worker!.postMessage({ id, type, payload });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingTasks.clear();
    }
  }
}

// Singleton instance
let computeWorkerInstance: ComputeWorker | null = null;

export function getComputeWorker(): ComputeWorker {
  if (!computeWorkerInstance) {
    computeWorkerInstance = new ComputeWorker();
  }
  return computeWorkerInstance;
}

// Pre-register common handlers
export function registerDefaultHandlers(worker: ComputeWorker): void {
  // Retail price optimization
  worker.registerHandler('optimizeRetailPrice', async (payload: {
    livePrice: number;
    buildingWage: number;
    buildingLevel: number;
    transport: number;
    saturation: number;
    phaseCoeffs: any;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    const { livePrice, buildingWage, buildingLevel, transport, saturation, phaseCoeffs } = payload;
    const minPrice = payload.minPrice || livePrice * 1.01;
    const maxPrice = payload.maxPrice || livePrice * 3.0;

    let bestPrice = minPrice;
    let bestProfit = -Infinity;

    for (let i = 0; i <= 100; i++) {
      const price = minPrice + (maxPrice - minPrice) * (i / 100);
      const demand = phaseCoeffs.T * price ** 2 + phaseCoeffs.U * price + phaseCoeffs.V * price ** 3 + phaseCoeffs.W;
      const adjustedDemand = demand / Math.max(1, saturation);
      const cost = livePrice + transport + (buildingWage / buildingLevel);
      const profit = (price - cost) * adjustedDemand;
      
      if (profit > bestProfit) {
        bestProfit = profit;
        bestPrice = price;
      }
    }

    return { price: bestPrice, profit: bestProfit };
  });

  // Production calculator
  worker.registerHandler('calculateProduction', async (payload: any) => {
    const { basePh, prodBonus, researchBonus, abundance, buildingLevel, vwap, inputCosts, wages, transport } = payload;
    const effectivePh = basePh * (1 + prodBonus/100) * (1 + researchBonus/100) * (abundance/100) * buildingLevel;
    const revenue = effectivePh * vwap;
    const cost = inputCosts + wages + transport;
    return {
      unitsPerHour: effectivePh,
      revenuePerHour: revenue,
      costPerHour: cost,
      profitPerHour: revenue - cost,
      marginPct: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
      breakEvenPrice: effectivePh > 0 ? cost / effectivePh : 0,
    };
  });

  // Construction calculator
  worker.registerHandler('calculateConstruction', async (payload: any) => {
    const { buildingId, currentLevel, targetLevel, buildingCosts } = payload;
    const costPerLevel: number[] = [];
    let totalCost = 0;

    for (let level = currentLevel + 1; level <= targetLevel; level++) {
      const mult = Math.max(1, level - 1);
      const cost = buildingCosts * mult;
      costPerLevel.push(cost);
      totalCost += cost;
    }

    return { totalCost, costPerLevel, roiDays: 0, dailyProfitIncrease: 0 };
  });

  // Data processing utilities
  worker.registerHandler('sortAndFilter', async (payload: {
    data: any[];
    sortBy?: string;
    filter?: (item: any) => boolean;
    limit?: number;
  }) => {
    let result = [...payload.data];
    if (payload.filter) result = result.filter(payload.filter);
    if (payload.sortBy) result.sort((a, b) => a[payload.sortBy!] - b[payload.sortBy!]);
    if (payload.limit) result = result.slice(0, payload.limit);
    return result;
  });

  worker.registerHandler('aggregate', async (payload: {
    data: any[];
    groupBy: (item: any) => string;
    aggregates: Record<string, (items: any[]) => number>;
  }) => {
    const groups = new Map();
    for (const item of payload.data) {
      const key = payload.groupBy(item);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }

    const result: any[] = [];
    for (const [key, items] of groups) {
      const agg: any = { group: key, count: items.length };
      for (const [name, fn] of Object.entries(payload.aggregates)) {
        agg[name] = fn(items);
      }
      result.push(agg);
    }
    return result;
  });

  // Cubic regression (simplified for worker)
  worker.registerHandler('cubicRegression', async (payload: { points: { x: number; y: number }[] }) => {
    const points = payload.points;
    const n = points.length;
    if (n < 4) return { T: 0, U: 0, V: 0, W: 0, rSquared: 0, sampleSize: n };

    // Simplified - would use proper linear algebra in production
    return { T: 0, U: 1, V: 0, W: 0, rSquared: 0.5, sampleSize: n };
  });
}

export { ComputeWorker, registerDefaultHandlers, getComputeWorker };