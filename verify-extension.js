#!/usr/bin/env node
/**
 * Cross-platform extension verification
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

const EXTENSION_DIR = resolve('extension');
const FILES_TO_CHECK = [
  'background.js',
  'content.js',
  'bridge.js',
  'popup.js',
];

async function verify() {
  console.log('🔍 Verifying extension files...\n');

  let allOk = true;

  // Check syntax for each JS file
  for (const file of FILES_TO_CHECK) {
    const filePath = resolve(EXTENSION_DIR, file);
    if (!existsSync(filePath)) {
      console.log(`❌ Missing: ${file}`);
      allOk = false;
      continue;
    }

    try {
      await import('node:child_process').then(({ spawnSync }) => {
        const result = spawnSync('node', ['--check', filePath], { cwd: EXTENSION_DIR, encoding: 'utf8' });
        if (result.status !== 0) {
          console.log(`❌ Syntax error in ${file}:`);
          console.log(result.stderr.toString());
          allOk = false;
        } else {
          console.log(`✅ ${file} - syntax OK`);
        }
      });
    } catch (err) {
      console.log(`❌ ${file} - check failed: ${err.message}`);
      allOk = false;
    }
  }

  // Check manifest.json
  const manifestPath = resolve(EXTENSION_DIR, 'manifest.json');
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(await import('fs/promises').then(fs => fs.readFile(manifestPath, 'utf8')));
      console.log(`✅ manifest.json - valid JSON`);
      console.log(`   Version: ${manifest.version}`);
      console.log(`   Name: ${manifest.name}`);
    } catch (err) {
      console.log(`❌ manifest.json - invalid: ${err.message}`);
      allOk = false;
    }
  } else {
    console.log(`❌ manifest.json - missing`);
    allOk = false;
  }

  // Check icons
  const iconSizes = [16, 32, 48, 128];
  for (const size of iconSizes) {
    const iconPath = resolve(EXTENSION_DIR, 'icons', `icon${size}.png`);
    if (existsSync(iconPath)) {
      console.log(`✅ icon${size}.png - exists`);
    } else {
      console.log(`❌ icon${size}.png - missing`);
      allOk = false;
    }
  }

  console.log(`\n${allOk ? '✅ All checks passed!' : '❌ Some checks failed!'}`);
  process.exit(allOk ? 0 : 1);
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});