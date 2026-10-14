import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

const [template, css] = await Promise.all([
  readFile('src/page.html', 'utf8'),
  readFile('src/styles.css', 'utf8')
]);
const result = await build({
  entryPoints: ['src/app.mjs'], bundle: true, write: false,
  format: 'iife', target: ['safari16.4', 'chrome109']
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = template
  .replace('<!-- INLINE_CSS -->', `<style>${css}</style>`)
  .replace('<!-- INLINE_JS -->', `<script>${js}</script>`);
if (html.includes('<!-- INLINE_')) throw new Error('HTML template markers remain.');
await writeFile('index.html', html, 'utf8');
