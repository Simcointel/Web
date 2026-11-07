#!/usr/bin/env node
/**
 * Cross-platform extension zip builder
 * Runs on Windows, macOS, Linux without PowerShell dependency
 */

import { createWriteStream, unlinkSync } from 'fs';
import { readdirSync, existsSync } from 'fs';
import { join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiverModule = require('archiver');

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const EXTENSION_DIR = resolve(__dirname, 'extension');
const OUTPUT_ZIP = join(EXTENSION_DIR, 'simcointel-extension.zip');

const INCLUDE_PATTERNS = [
  'manifest.json',
  'background.js',
  'content.js',
  'bridge.js',
  'popup.html',
  'popup.js',
  'content.css',
  'icons/**',
];

const EXCLUDE_PATTERNS = [
  '*.zip',
  '*.md',
  '*.ts',
  '*.map',
  'node_modules/**',
  '.git/**',
  '.gitignore',
  '*.log',
  '*.tmp',
  '*.ps1',
  '*.sh',
  'build*',
  'dist*',
  '.vscode/**',
  '.idea/**',
  '*.orig',
  '*.bak',
];

function matchPattern(filepath, patterns) {
  const relPath = relative(EXTENSION_DIR, filepath).replace(/\\/g, '/');
  return patterns.some(pattern => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return regex.test(relPath);
  });
}

function getAllFiles(dir, prefix = '') {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = join(prefix, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, relPath));
    } else if (entry.isFile()) {
      files.push({ fullPath, relPath });
    }
  }
  return files;
}

async function buildZip() {
  console.log('📦 Building SimcoIntel extension zip...');
  console.log(`   Source: ${EXTENSION_DIR}`);
  console.log(`   Output: ${OUTPUT_ZIP}`);

  // Get all files
  const allFiles = getAllFiles(EXTENSION_DIR);
  console.log(`   Found ${allFiles.length} total files`);

  // Filter files
  const includedFiles = allFiles.filter(f => {
    const excluded = matchPattern(f.fullPath, EXCLUDE_PATTERNS);
    const included = matchPattern(f.fullPath, INCLUDE_PATTERNS) ||
                     INCLUDE_PATTERNS.some(p => f.relPath.startsWith(p.replace('/**', '')));
    return !excluded && included;
  });

  console.log(`   Including ${includedFiles.length} files:`);
  includedFiles.forEach(f => console.log(`     ${f.relPath}`));

  // Remove existing zip
  if (existsSync(OUTPUT_ZIP)) {
    unlinkSync(OUTPUT_ZIP);
    console.log('   Removed existing zip');
  }

  // Create zip using Archiver class directly
  const output = createWriteStream(OUTPUT_ZIP);
  const archive = new archiverModule.ZipArchive({ zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const size = (archive.pointer() / 1024).toFixed(1);
      console.log(`\n✅ Created: ${OUTPUT_ZIP} (${size} KB)`);
      resolve();
    });

    archive.on('error', err => reject(err));
    archive.pipe(output);

    for (const file of includedFiles) {
      archive.file(file.fullPath, { name: file.relPath });
    }

    archive.finalize();
  });
}

buildZip().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});