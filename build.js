#!/usr/bin/env node

/**
 * HIDDENEAGLE46 BUILD SCRIPT
 * Combines modular source files into single-file HTML bundle
 * 
 * Usage: node scripts/build.js [--output FILE] [--minify]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const distDir = path.join(projectRoot, 'dist');

// Parse CLI args
const args = process.argv.slice(2);
let outputFile = path.join(distDir, 'hiddeneagle46_BUNDLE.html');
let shouldMinify = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' && args[i + 1]) {
    outputFile = path.join(projectRoot, args[i + 1]);
    i++;
  }
  if (args[i] === '--minify') {
    shouldMinify = true;
  }
}

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

/**
 * Read and concatenate module files in dependency order
 */
function bundleModules() {
  const modules = [
    'src/cascade/CascadeAlgebra.js',
    'src/core/Clock.js',
    'src/core/VM.js',
    'src/core/Accumulator.js',
    'src/core/Translator.js',
    'src/input/Acceptor.js',
    'src/renderer/Renderer.js',
    'src/engine/Engine.js',
    'src/rom/LevelROM.js',
    'src/game/Game.js',
    'src/ui/UI.js',
    'src/app.js',
  ];

  let bundledCode = '';
  let comments = [];

  modules.forEach(modulePath => {
    const fullPath = path.join(projectRoot, modulePath);
    if (fs.existsSync(fullPath)) {
      const code = fs.readFileSync(fullPath, 'utf-8');
      bundledCode += `\n        // ============================================================================\n`;
      bundledCode += `        // MODULE: ${modulePath}\n`;
      bundledCode += `        // ============================================================================\n\n`;
      bundledCode += code;
      comments.push(`✓ ${modulePath}`);
    } else {
      console.warn(`⚠️  Module not found: ${modulePath}`);
    }
  });

  console.log('Bundled modules:');
  comments.forEach(c => console.log('  ' + c));

  return bundledCode;
}

/**
 * Read HTML template and inject bundled code
 */
function buildHTML(bundledCode) {
  const templatePath = path.join(srcDir, 'index.html');
  
  if (!fs.existsSync(templatePath)) {
    console.error('ERROR: index.html template not found at', templatePath);
    process.exit(1);
  }

  let html = fs.readFileSync(templatePath, 'utf-8');

  // Inject bundled JavaScript before closing </head> or </body>
  const scriptTag = `<script>\n${bundledCode}\n    </script>`;
  
  if (html.includes('<!-- INJECT_SCRIPTS -->')) {
    html = html.replace('<!-- INJECT_SCRIPTS -->', scriptTag);
  } else {
    html = html.replace('</body>', `${scriptTag}\n</body>`);
  }

  return html;
}

/**
 * Minify JavaScript (simple: remove comments and extra whitespace)
 */
function minifyCode(code) {
  if (!shouldMinify) return code;

  // Remove single-line comments
  code = code.replace(/\/\/.*?$/gm, '');
  // Remove multi-line comments
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove extra whitespace
  code = code.replace(/\s+/g, ' ');
  // Remove spaces around operators
  code = code.replace(/\s*([{};,=])\s*/g, '$1');

  return code;
}

/**
 * Main build process
 */
function build() {
  console.log('🔨 Building HIDDENEAGLE46...\n');

  try {
    const bundledCode = bundleModules();
    let html = buildHTML(bundledCode);

    if (shouldMinify) {
      console.log('\n📦 Minifying...');
      html = minifyCode(html);
    }

    fs.writeFileSync(outputFile, html, 'utf-8');

    const stats = fs.statSync(outputFile);
    const sizeKB = (stats.size / 1024).toFixed(2);

    console.log(`\n✓ Build complete!`);
    console.log(`  Output: ${outputFile}`);
    console.log(`  Size: ${sizeKB} KB`);
    console.log(`  Status: ${shouldMinify ? 'MINIFIED' : 'DEVELOPMENT'}\n`);
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

build();
