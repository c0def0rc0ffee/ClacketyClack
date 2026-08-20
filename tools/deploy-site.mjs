/**
 * Deploy the game bundle to the webspace over SFTP.
 *
 *   node tools/deploy-site.mjs            upload, then delete remote strays
 *   node tools/deploy-site.mjs --dry-run  say what would happen, change nothing
 *   node tools/deploy-site.mjs --no-prune keep remote files we did not upload
 *
 * Uploads 'ClacketyClack Web' (run ./build-zip.sh first if the bundle is
 * stale; this never builds) into /clacketyclack on the webspace, the folder
 * mapped to clacketyclack.gamelabs.gg. Sibling folders belong to other sites
 * and are never touched; upload and prune both stay WITHIN /clacketyclack.
 */

import Client from 'ssh2-sftp-client';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'ClacketyClack Web');
const REMOTE_ROOT = '/clacketyclack';

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const PRUNE = !args.has('--no-prune');

// Credentials live in ../gamelabs-sftp, outside all repos, so no zip or
// upload can ever carry them. Only that account deploys to the area this
// game's subdomain serves; other SFTP accounts would publish nothing while
// reporting success, so nothing else is searched.
function findCredentials() {
  const candidates = [
    { path: join(ROOT, '..', 'gamelabs-sftp'), inRepo: false },
    { path: join(ROOT, '..', 'GameLabs.gg', 'gamelabs-sftp'), inRepo: true },
  ];
  for (const c of candidates) if (existsSync(c.path)) return c;
  console.error(
    'No SFTP credentials found. Create ../gamelabs-sftp (outside the repos) ' +
      'containing lines:  User: …  Pass: …  Host: …',
  );
  process.exit(1);
}

const cred = findCredentials();
if (cred.inRepo) {
  console.warn(
    `WARNING: credentials are inside a repo (${cred.path}).\n` +
      '         Move them to ../gamelabs-sftp so no zip can ever carry them.',
  );
}
const text = readFileSync(cred.path, 'utf8');
const field = (k) => {
  const m = text.match(new RegExp(`^${k}\\s*:\\s*(.+)$`, 'im'));
  if (!m) {
    console.error(`Credentials file is missing a '${k}:' line.`);
    process.exit(1);
  }
  return m[1].trim();
};

function localFiles(dir, base = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) localFiles(full, base, out);
    else out.push(relative(base, full).replace(/\\/g, '/'));
  }
  return out;
}

const sftp = new Client();
let uploaded = 0;
sftp.on('upload', () => {
  uploaded++;
  if (uploaded % 25 === 0) console.log(`  …${uploaded} files`);
});

await sftp.connect({
  host: field('Host'),
  username: field('User'),
  password: field('Pass'),
  readyTimeout: 30000,
  retries: 3,
});

const wanted = new Set(localFiles(SRC));
console.log(`local site: ${wanted.size} files`);

if (!DRY_RUN) {
  console.log(`uploading to ${REMOTE_ROOT}…`);
  await sftp.mkdir(REMOTE_ROOT, true).catch(() => {});
  await sftp.uploadDir(SRC, REMOTE_ROOT);
  console.log(`uploaded ${uploaded} files`);
} else {
  console.log('(dry run, nothing uploaded)');
}

async function remoteFiles(dir = REMOTE_ROOT, out = []) {
  for (const e of await sftp.list(dir)) {
    const full = `${dir}/${e.name}`;
    if (e.type === 'd') await remoteFiles(full, out);
    else out.push(relative(REMOTE_ROOT, full).replace(/\\/g, '/').replace(/^\//, ''));
  }
  return out;
}

const remote = await remoteFiles().catch(() => []);
const strays = remote.filter((f) => !wanted.has(f));

if (!PRUNE) {
  console.log(`prune skipped (--no-prune); ${strays.length} remote files are not in this deploy`);
} else if (strays.length === 0) {
  console.log('remote matches the local site, nothing to prune');
} else {
  console.log(`pruning ${strays.length} stale file(s):`);
  for (const f of strays) {
    console.log(`  - ${f}`);
    if (!DRY_RUN) await sftp.delete(`${REMOTE_ROOT}/${f}`);
  }
}

const finalCount = (await remoteFiles().catch(() => [])).length;
console.log(`\nremote ${REMOTE_ROOT} holds ${finalCount} files (local has ${wanted.size})`);
await sftp.end();
