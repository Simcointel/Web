var DataPipeline = (function() {
  function DataPipeline() {
    this.steps = [];
  }
  DataPipeline.prototype.validate = function(schema) {
    this.schema = schema;
    return this;
  };
  DataPipeline.prototype.addStep = function(step) {
    this.steps.push(step);
    return this;
  };
  return DataPipeline;
})();

export var schemas = {
  profitMargins: {
    type: "object",
    properties: {
      t: { type: "string" },
      r: { type: "number" },
      sr: { type: "string" },
      rs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            i: { type: "number" },
            n: { type: "string" },
            c: { type: "string" },
            cn: { type: "string" },
            ph: { type: "number" },
            rv: { type: "number" },
            ic: { type: "number" },
            wg: { type: "number" },
            tr: { type: "number" },
            np: { type: "number" },
            mg: { type: "number" },
            m1: { type: ["number", "null"] },
            n1: { type: ["number", "null"] },
            md: { type: ["string", "null"] },
            fp: { type: ["number", "null"] },
            td: { type: ["string", "null"] },
            vw: { type: "number" },
            ir: { type: "boolean" },
          },
        },
      },
    },
    required: ["t", "r", "sr", "rs"],
  },
  retailData: {
    type: "object",
    properties: {
      lastUpdated: { type: "string" },
      retailIndexes: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            index: { type: "number" },
            trend: { type: "string" },
          },
        },
      },
    },
    required: ["lastUpdated", "retailIndexes"],
  },
  phaseCoefficients: {
    type: "object",
    properties: {
      derivedAt: { type: "string" },
      realm: { type: "number" },
      dataWindowDays: { type: "number" },
      coefficients: {
        type: "array",
        items: {
          type: "object",
          properties: {
            productId: { type: "number" },
            quality: { type: "number" },
            phase: { type: "string", enum: ["Boom", "Normal", "Recession"] },
            T: { type: "number" },
            U: { type: "number" },
            V: { type: "number" },
            W: { type: "number" },
            rSquared: { type: "number" },
            sampleSize: { type: "number" },
            derivedAt: { type: "string" },
          },
          required: ["productId", "quality", "phase", "T", "U", "V", "W", "rSquared", "sampleSize", "derivedAt"],
        },
      },
    },
    required: ["derivedAt", "realm", "dataWindowDays", "coefficients"],
  },
};

var dataPipeline = {
  phaseCoefficients: function() {
    var pipeline = new DataPipeline();
    pipeline.validate(schemas.phaseCoefficients);
    pipeline.addStep({
      name: 'filterLowQuality',
      transform: function(coeffs) {
        return coeffs.filter(function(c) { return c.rSquared >= 0.7 && c.sampleSize >= 50; });
      },
    });
    return pipeline;
  },

  profitMargins: function() {
    var pipeline = new DataPipeline();
    pipeline.validate(schemas.profitMargins);
    pipeline.addStep({
      name: 'filterValidMargins',
      transform: function(data) {
        return {
          ...data,
          resources: data.resources.filter(function(r) {
            return r.marginPct > -100 && r.marginPct < 1000 && r.outputVwap > 0;
          }),
        };
      },
    });
    return pipeline;
  },

  retailData: function() {
    var pipeline = new DataPipeline();
    pipeline.validate(schemas.retailData);
    return pipeline;
  },
};

var dataQuality = {
  calculateFreshness: function(generatedAt, maxAgeHours) {
    if (maxAgeHours === void 0) { maxAgeHours = 24; }
    var ageHours = (Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60);
    return Math.max(0, 1 - ageHours / maxAgeHours);
  },

  detectOutliersIQR: function(values, multiplier) {
    if (multiplier === void 0) { multiplier = 1.5; }
    if (values.length < 4) return { outliers: [], clean: values };

    var sorted = values.slice().sort(function(a, b) { return a - b; });
    var q1Idx = Math.floor(sorted.length * 0.25);
    var q3Idx = Math.floor(sorted.length * 0.75);
    var q1 = sorted[q1Idx];
    var q3 = sorted[q3Idx];
    var iqr = q3 - q1;
    var lower = q1 - multiplier * iqr;
    var upper = q3 + multiplier * iqr;

    var outliers = values.filter(function(v) { return v < lower || v > upper; });
    var clean = values.filter(function(v) { return v >= lower && v <= upper; });

    return { outliers: outliers, clean: clean };
  },
};

export { dataPipeline, schemas, dataQuality };