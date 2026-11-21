import { readdir, readFile, mkdir, cp, writeFile, rm } from 'node:fs/promises';
export async function renderPage(name) {
  let html = await readFile(`src/pages/${name}`, 'utf8');
  for (const match of html.matchAll(/<!-- include:([\w.-]+) -->/g)) {
    html = html.replace(match[0], await readFile(`src/components/${match[1]}`, 'utf8'));
  }
  return html;
}
export async function build() {
  await rm('dist', { recursive: true, force: true });
  await mkdir('dist', { recursive: true });
  await cp('assets', 'dist/assets', { recursive: true, filter: s => !s.endsWith('.DS_Store') });
  for (const folder of ['scripts', 'styles', 'config']) await cp(`src/${folder}`, `dist/src/${folder}`, { recursive: true });
  for (const name of await readdir('src/pages')) {
    if (name.endsWith('.html')) await writeFile(`dist/${name}`, await renderPage(name));
  }
  await writeFile('dist/404.html', '<!doctype html><html lang="en"><meta charset="utf-8"><title>Page not found</title><h1>Page not found</h1><a href="./index.html">Home</a></html>');
  console.log('Built all HTML entry points into dist/');
}
if (process.argv[1]?.endsWith('/build.js')) await build();
