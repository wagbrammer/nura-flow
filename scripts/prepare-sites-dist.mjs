import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const distDir = resolve('dist');
const clientDir = join(distDir, 'client');

rmSync(clientDir, { recursive: true, force: true });
mkdirSync(clientDir, { recursive: true });

for (const entry of readdirSync(distDir)) {
  if (entry === '.openai' || entry === 'client') continue;
  renameSync(join(distDir, entry), join(clientDir, entry));
}
