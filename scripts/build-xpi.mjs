// Packages the MV2 `dist/` build into a Firefox-installable XPI at
// `assets/gentlemonkey-<version>[b].xpi`, matching the AMO release naming
// in amo-upload.mjs. Run via `pnpm build:xpi` (which builds first).
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getVersion, isBeta } = require('./version-helper');

const fileName = `gentlemonkey-${getVersion()}${isBeta() ? 'b' : ''}.xpi`;
const assetsDir = join(process.cwd(), 'assets');
const xpiPath = join(assetsDir, fileName);

mkdirSync(assetsDir, { recursive: true });
rmSync(xpiPath, { force: true });
execFileSync('zip', ['--recurse-paths', '--quiet', xpiPath, '.'], {
  cwd: 'dist',
  stdio: 'inherit',
});
console.log(xpiPath);
