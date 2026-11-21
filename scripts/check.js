import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${item.name}`;
    if (item.isDirectory()) await walk(path);
    else if (path.endsWith('.js')) {
      const check = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
      if (check.status) throw new Error(check.stderr);
      const source = await readFile(path, 'utf8');
      if (/-----BEGIN [A-Z ]+PRIVATE KEY-----|ghp_[A-Za-z0-9]{36}|AKIA[A-Z0-9]{16}/.test(source)) throw new Error(`Possible secret: ${path}`);
    }
  }
}
await walk('src/scripts'); await walk('src/config'); await walk('scripts');
console.log('First-party JavaScript syntax and secret signature checks passed (not a style lint or full secret audit).');
