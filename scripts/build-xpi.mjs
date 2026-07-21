// Packages the MV2 `.out/mv2/` build into a Firefox-installable XPI at
// `.out/gentlemonkey-<version>[b].xpi`, matching the AMO release naming
// in amo-upload.mjs. Run via `pnpm build:xpi` (which builds first).
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getVersion, isBeta } = require('./version-helper');
const { DIST } = require('./common');

const fileName = `gentlemonkey-${getVersion()}${isBeta() ? 'b' : ''}.xpi`;
const xpiDir = join(process.cwd(), '.out');
const xpiPath = join(xpiDir, fileName);

mkdirSync(xpiDir, { recursive: true });
rmSync(xpiPath, { force: true });
execFileSync('zip', ['--recurse-paths', '--quiet', xpiPath, '.'], {
  cwd: DIST,
  stdio: 'inherit',
});
console.log(xpiPath);
