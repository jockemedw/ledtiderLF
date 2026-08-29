#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * CLI-wrapper för pptx-genereringen. Själva renderingen ligger i
 * lib/pptx-builder.js så att API-endpointen kan dela samma logik.
 *
 * Användning:
 *   npm run pptx                          # alla slides
 *   npm run pptx -- titel,kostnad-80      # bara valda slide-id:n
 *   npm run pptx -- --sections=oversikt,kostnad  # via sektion-id:n
 *   npm run pptx -- --out=foo.pptx        # eget filnamn (under dist/)
 */

const fs = require('fs');
const path = require('path');
const { writePptxToFile, allSlideIds } = require('../lib/pptx-builder');

const ROOT = path.join(__dirname, '..');

function parseArgs(argv) {
  const args = { slideIds: null, sectionIds: null, out: 'dist/lokalforsorjning-popular.pptx' };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--out=')) {
      args.out = a.slice('--out='.length);
    } else if (a.startsWith('--sections=')) {
      args.sectionIds = a.slice('--sections='.length).split(',').map(s => s.trim()).filter(Boolean);
    } else if (!a.startsWith('-')) {
      args.slideIds = a.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const outPath = path.join(ROOT, args.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  try {
    const result = await writePptxToFile({
      slideIds: args.slideIds,
      sectionIds: args.sectionIds,
      outPath,
    });
    const rel = path.relative(ROOT, outPath);
    console.log(`✓ Genererade ${result.slideIds.length} slide(s) → ${rel}`);
    console.log('  Slides:', result.slideIds.join(', '));
    if (result.missingSections.length) {
      console.warn('  Varning, sektioner utan kurerad slide:', result.missingSections.join(', '));
    }
  } catch (err) {
    if (err.code === 'UNKNOWN_SLIDE_IDS') {
      console.error('Okända slide-id:', err.unknown.join(', '));
      console.error('Tillgängliga:', allSlideIds().join(', '));
      process.exit(1);
    }
    console.error('Fel vid generering:', err);
    process.exit(1);
  }
}

main();
