/**
 * Data export/import utilities for data portability.
 * Supports multiple formats and compression.
 */

// import { createMockResponse } from './cooperincDataJob.test';
// Mock for testing - replace with actual import when available
const createMockResponse = (data: any) => ({ ok: true, json: async () => data, text: async () => JSON.stringify(data) });

type ExportFormat = 'json' | 'csv' | 'tsv' | 'msgpack' | 'yaml' | 'yml';
type CompressionType = 'none' | 'gzip' | 'deflate';

interface ExportOptions {
  format: ExportFormat;
  compression?: CompressionType;
  includeMetadata?: boolean;
  dateRange?: { start: Date; end: Date };
  filter?: (record: any) => boolean;
  filename?: string;
}

interface ImportOptions {
  format?: ExportFormat;
  compression?: CompressionType;
  validate?: boolean;
  schema?: { parse: (data: any) => any }; // Zod-like schema
  onProgress?: (progress: number) => void;
  mergeStrategy?: 'replace' | 'merge' | 'append';
}

interface ExportResult {
  blob: Blob;
  filename: string;
  size: number;
  recordCount: number;
  format: ExportFormat;
  metadata: ExportMetadata;
}

interface ExportMetadata {
  exportedAt: string;
  version: string;
  source: string;
  recordCount: number;
  filters?: string;
  dateRange?: { start: string; end: string };
  schema?: string;
}

interface ImportResult<T = any> {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  data?: T[];
}

const EXPORT_VERSION = '1.0.0';
const EXPORT_SOURCE = 'simcointel-web';

/**
 * Export data to various formats
 */
export async function exportData<T>(
  data: T[],
  options: ExportOptions = { format: 'json' }
): Promise<ExportResult> {
  const {
    format = 'json',
    compression = 'none',
    includeMetadata = true,
    dateRange,
    filter,
    filename,
  } = options;

  // Filter data
  let filteredData = data;
  if (filter) {
    filteredData = data.filter(filter);
  }
  if (dateRange) {
    filteredData = filteredData.filter(item => {
      const date = new Date((item as any).generatedAt || (item as any).timestamp || Date.now());
      return date >= dateRange.start && date <= dateRange.end;
    });
  }

  // Generate content based on format
  let content: string;
  const mimeType = getMimeType(format);
  
  switch (format) {
    case 'json':
      content = JSON.stringify(filteredData, null, 2);
      break;
    case 'csv':
      content = toCSV(filteredData);
      break;
    case 'tsv':
      content = toTSV(filteredData);
      break;
    case 'yaml':
      content = toYAML(filteredData);
      break;
    case 'msgpack':
      content = toMsgPack(filteredData);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  // Apply compression
  let blobContent: string | ArrayBuffer = content;
  if (compression !== 'none') {
    blobContent = await compress(content, compression);
  }

  // Create blob
  const blob = new Blob([blobContent], { type: mimeType });

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const defaultFilename = `simcointel-export-${format}-${timestamp}`;
  const finalFilename = filename || `${defaultFilename}.${format}${compression !== 'none' ? `.${compression}` : ''}`;

  // Create metadata
  const metadata: ExportMetadata = {
    exportedAt: new Date().toISOString(),
    version: EXPORT_VERSION,
    source: EXPORT_SOURCE,
    recordCount: filteredData.length,
    filters: filter ? 'custom' : 'none',
    dateRange: dateRange ? { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() } : undefined,
    schema: 'simcointel/v1',
  };

  // Include metadata in export if requested
  let finalBlob: Blob;
  if (includeMetadata) {
    const metadataBlob = new Blob([JSON.stringify({ metadata, data: filteredData }, null, 2)], { type: 'application/json' });
    finalBlob = new Blob([metadataBlob], { type: 'application/json' });
  } else {
    finalBlob = new Blob([blobContent], { type: mimeType });
  }

  return {
    blob: finalBlob,
    filename: finalFilename,
    size: finalBlob.size,
    recordCount: filteredData.length,
    format,
    metadata,
  };
}

/**
 * Import data from file
 */
export async function importData(
  file: File | Blob,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const startTime = Date.now();
  const {
    format: explicitFormat,
    compression = 'none',
    validate = true,
    schema,
    onProgress,
    mergeStrategy = 'replace',
  } = options;

  const result: ImportResult = {
    success: false,
    imported: 0,
    failed: 0,
    errors: [],
    warnings: [],
    durationMs: 0,
  };

  try {
    // Read file
    let content: string | ArrayBuffer;
    if (file instanceof File) {
      content = await file.text();
    } else {
      content = await file.text();
    }

    // Decompress if needed
    if (compression !== 'none') {
      content = await decompress(content as string, compression);
    }

    // Detect format
    const format = explicitFormat || detectFormat(content as string, (file as File).name || 'unknown');
    
    // Parse data
    let data: any[];
    try {
      data = parseData(content as string, format);
    } catch (e) {
      result.errors.push(`Parse error: ${(e as Error).message}`);
      result.failed = 1;
      result.durationMs = Date.now() - Date.now();
      return result;
    }

    // Validate if schema provided
    if (validate && schema) {
      const validData: any[] = [];
      
      for (let i = 0; i < data.length; i++) {
        try {
          schema.parse(data[i]);
          validData.push(data[i]);
        } catch (e) {
          result.errors.push(`Record ${i}: ${(e as Error).message}`);
          result.failed++;
        }
      }
      
      if (onProgress) onProgress(100);
      result.imported = validData.length;
      result.success = result.failed === 0;
      result.durationMs = Date.now() - Date.now();
      return { ...result, data: validData };
    }

    result.imported = data.length;
    result.success = true;
    result.durationMs = Date.now() - startTime;
    return { ...result, data };
  } catch (error) {
    result.errors.push(`Import failed: ${(error as Error).message}`);
    result.durationMs = Date.now() - startTime;
    return result;
  }
}

/**
 * Download export as file
 */
export function downloadExport(result: ExportResult): void {
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Create file input for import
 */
export function createFileInput(accept: string[] = ['.json', '.csv', '.tsv', '.yaml', '.yml']): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept.join(',');
  input.style.display = 'none';
  return input;
}

/**
 * Trigger file import dialog
 */
export function promptFileImport(options: ImportOptions = {}): Promise<ImportResult> {
  return new Promise((resolve) => {
    const input = createFileInput();
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const result = await importData(file, options);
        resolve(result);
      } else {
        resolve({ success: false, imported: 0, failed: 0, errors: ['No file selected'], warnings: [], durationMs: 0 });
      }
    };
    input.click();
  });
}

// Format detection
function detectFormat(content: string, filename?: string): ExportFormat {
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext && ['json', 'csv', 'tsv', 'yaml', 'yml', 'msgpack'].includes(ext)) {
      return ext as ExportFormat;
    }
  }

  // Try to detect from content
  const trimmed = content.trimStart();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (trimmed.includes('\t') && trimmed.includes('\n')) return 'tsv';
  if (trimmed.includes(',') && trimmed.includes('\n')) return 'csv';
  if (trimmed.startsWith('---') || trimmed.includes(':')) return 'yaml';
  return 'json';
}

// Data parsing
function parseData(content: string, format: ExportFormat): any[] {
  switch (format) {
    case 'json':
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [parsed];
    case 'csv':
      return parseCSV(content);
    case 'tsv':
      return parseTSV(content);
    case 'yaml':
    case 'yml':
      return parseYAML(content);
    case 'msgpack':
      return parseMsgPack(content);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

function parseCSV(content: string): any[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const rows: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;
    const row: any = {};
    headers.forEach((h, j) => { row[h] = values[j]; });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseTSV(content: string): any[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split('\t');
  const rows: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    if (values.length !== headers.length) continue;
    const row: any = {};
    headers.forEach((h, j) => { row[h] = values[j]; });
    rows.push(row);
  }
  return rows;
}

function parseYAML(content: string): any[] {
  // Simple YAML parser for arrays of objects
  // In production, use a proper YAML library like js-yaml
  try {
    // Simple implementation - assumes YAML array of objects
    const lines = content.trim().split('\n');
    const objects: any[] = [];
    let current: any = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        if (Object.keys(current).length > 0) {
          objects.push(current);
        }
        current = {};
        continue;
      }
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim();
        current[key] = value;
      }
    }
    if (Object.keys(current).length > 0) objects.push(current);
    return objects;
  } catch {
    return [];
  }
}

function parseMsgPack(content: string): any[] {
  // Placeholder - would need msgpack library
  return [];
}

// Formatters
function toCSV(data: any[]): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function toTSV(data: any[]): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(h => String(row[h] ?? '')).join('\t')
  );
  return [headers.join('\t'), ...rows].join('\n');
}

function toYAML(data: any[]): string {
  if (!data.length) return '';
  return data.map(obj => 
    Object.entries(obj).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')
  ).map(obj => `- ${obj}`).join('\n');
}

function toMsgPack(data: any[]): string {
  // Placeholder - would use msgpack library
  return JSON.stringify(data);
}

// Compression
async function compress(content: string, type: CompressionType): Promise<string | ArrayBuffer> {
  const stream = new CompressionStream(type === 'gzip' ? 'gzip' : 'deflate');
  const writer = stream.writable.getWriter();
  await writer.write(new TextEncoder().encode(content));
  await writer.close();
  
  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return btoa(String.fromCharCode(...result));
}

async function decompress(content: string, type: CompressionType): Promise<string> {
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  
  const stream = new DecompressionStream(type === 'gzip' ? 'gzip' : 'deflate');
  const writer = stream.writable.getWriter();
  await writer.write(bytes);
  await writer.close();
  
  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return new TextDecoder().decode(result);
}

function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'json': return 'application/json';
    case 'csv': return 'text/csv';
    case 'tsv': return 'text/tab-separated-values';
    case 'yaml':
    case 'yml': return 'application/x-yaml';
    case 'msgpack': return 'application/msgpack';
    default: return 'application/octet-stream';
  }
}

export type { ExportOptions, ImportOptions, ExportResult, ImportResult, ExportMetadata };