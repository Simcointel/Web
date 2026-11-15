/**
 * Data pipeline utilities for validation and transformation.
 */

export interface PipelineStep {
  name: string;
  transform: (data: any) => any;
}

export interface DataPipeline {
  steps: PipelineStep[];
  schema?: any;
  validate(schema: any): DataPipeline;
  addStep(step: PipelineStep): DataPipeline;
}

export function createPipeline(): DataPipeline {
  const pipeline: DataPipeline = {
    steps: [],
    validate(schema: any) {
      this.schema = schema;
      return this;
    },
    addStep(step: PipelineStep) {
      this.steps.push(step);
      return this;
    },
  };
  return pipeline;
}

export const schemas = {
  profitMargins: {
    type: 'object',
    properties: {
      t: { type: 'string' },
      r: { type: 'number' },
      sr: { type: 'string' },
      rs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            i: { type: 'number' },
            n: { type: 'string' },
            c: { type: 'string' },
            cn: { type: 'string' },
            ph: { type: 'number' },
            rv: { type: 'number' },
            ic: { type: 'number' },
            wg: { type: 'number' },
            tr: { type: 'number' },
            np: { type: 'number' },
            mg: { type: 'number' },
            m1: { type: ['number', 'null'] },
            n1: { type: ['number', 'null'] },
            md: { type: ['string', 'null'] },
            fp: { type: ['number', 'null'] },
            td: { type: ['string', 'null'] },
            vw: { type: 'number' },
            ir: { type: 'boolean' },
          },
        },
      },
    },
    required: ['t', 'r', 'sr', 'rs'],
  },
  retailData: {
    type: 'object',
    properties: {
      lastUpdated: { type: 'string' },
      retailIndexes: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            index: { type: 'number' },
            trend: { type: 'string' },
          },
        },
      },
    },
    required: ['lastUpdated', 'retailIndexes'],
  },
  phaseCoefficients: {
    type: 'object',
    properties: {
      derivedAt: { type: 'string' },
      realm: { type: 'number' },
      dataWindowDays: { type: 'number' },
      coefficients: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            productId: { type: 'number' },
            quality: { type: 'number' },
            phase: { type: 'string', enum: ['Boom', 'Normal', 'Recession'] },
            T: { type: 'number' },
            U: { type: 'number' },
            V: { type: 'number' },
            W: { type: 'number' },
            rSquared: { type: 'number' },
            sampleSize: { type: 'number' },
            derivedAt: { type: 'string' },
          },
          required: ['productId', 'quality', 'phase', 'T', 'U', 'V', 'W', 'rSquared', 'sampleSize', 'derivedAt'],
        },
      },
    },
    required: ['derivedAt', 'realm', 'dataWindowDays', 'coefficients'],
  },
};

export const dataPipeline = {
  phaseCoefficients: () => {
    const pipeline = createPipeline();
    pipeline.validate(schemas.phaseCoefficients);
    pipeline.addStep({
      name: 'filterLowQuality',
      transform: (coeffs: any[]) => coeffs.filter((c) => c.rSquared >= 0.7 && c.sampleSize >= 50),
    });
    return pipeline;
  },

  profitMargins: () => {
    const pipeline = createPipeline();
    pipeline.validate(schemas.profitMargins);
    pipeline.addStep({
      name: 'filterValidMargins',
      transform: (data: any) => ({
        ...data,
        resources: data.resources.filter((r: any) => r.marginPct > -100 && r.marginPct < 1000 && r.outputVwap > 0),
      }),
    });
    return pipeline;
  },

  retailData: () => {
    const pipeline = createPipeline();
    pipeline.validate(schemas.retailData);
    return pipeline;
  },
};

export const dataQuality = {
  calculateFreshness: (generatedAt: string, maxAgeHours = 24): number => {
    const ageHours = (Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60);
    return Math.max(0, 1 - ageHours / maxAgeHours);
  },

  detectOutliersIQR: (values: number[], multiplier = 1.5): { outliers: number[]; clean: number[] } => {
    if (values.length < 4) return { outliers: [], clean: values };

    const sorted = [...values].sort((a, b) => a - b);
    const q1Idx = Math.floor(sorted.length * 0.25);
    const q3Idx = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Idx];
    const q3 = sorted[q3Idx];
    const iqr = q3 - q1;
    const lower = q1 - multiplier * iqr;
    const upper = q3 + multiplier * iqr;

    const outliers = values.filter((v) => v < lower || v > upper);
    const clean = values.filter((v) => v >= lower && v <= upper);

    return { outliers, clean };
  },
};