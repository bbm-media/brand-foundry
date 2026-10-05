// Windows refuses to rename a directory while any process has its working
// directory inside it. This reproduces the transient lock that antivirus scans
// cause on freshly written builds, and checks both outcomes:
//   1. a short lock is waited out and the build succeeds;
//   2. a lock that outlasts the retries fails cleanly, keeping the old build.
// On other platforms the lock does not exist, so both builds simply succeed.
import { readFileSync, mkdtempSync, cpSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = mkdtempSync(path.join(tmpdir(), 'brand-foundry-lock-'));
for (const file of ['generate.mjs', 'brand.mjs', 'studio.config.json', 'templates']) cpSync(path.join(root, file), path.join(fixture, file), { recursive: true });
const build = () => spawnSync(process.execPath, ['generate.mjs'], { cwd: fixture, encoding: 'utf8' });
const holders = [];
const holdBuildDir = (ms) => holders[holders.length] = spawn(process.execPath, ['-e', `setTimeout(() => {}, ${ms})`], { cwd: path.join(fixture, 'build') });
const leftovers = () => readdirSync(fixture).filter(f => f.startsWith('.build-'));
// A killed child reports signalCode, not exitCode, so check both or a second wait never resolves.
const exited = (child) => new Promise(resolve => child.exitCode !== null || child.signalCode !== null ? resolve() : child.once('exit', resolve));

try {
  assert.equal(build().status, 0, 'initial build');

  // 1. Short lock: must be retried through.
  let holder = holdBuildDir(1500);
  await new Promise(r => setTimeout(r, 300));
  let started = Date.now(), result = build();
  assert.equal(result.status, 0, `build under a 1.5s lock should retry and succeed:\n${result.stderr}`);
  assert.deepEqual(leftovers(), [], 'no temporary build folders after a retried build');
  await exited(holder);
  const waited = Date.now() - started;

  // 2. Lock that outlasts the retry window: must fail cleanly.
  const before = readFileSync(path.join(fixture, 'build/manifest.json'));
  holder = holdBuildDir(20000);
  await new Promise(r => setTimeout(r, 300));
  result = build();
  holder.kill();
  await exited(holder);
  if (process.platform === 'win32') {
    assert.notEqual(result.status, 0, 'a lock that never clears must fail');
    assert.match(result.stderr, /EPERM|EBUSY|EACCES/, 'the real lock error is reported, not a cleanup error');
    assert.deepEqual(readFileSync(path.join(fixture, 'build/manifest.json')), before, 'the previous build is kept');
  } else {
    assert.equal(result.status, 0);
  }
  assert.deepEqual(leftovers(), [], 'no temporary build folders after a failed build');

  console.log(`PASS short lock retried (build took ${waited} ms); lasting lock fails cleanly with the previous build kept and no leftovers`);
} finally {
  // Release any lock first, and never let cleanup hide the real failure.
  for (const h of holders) { h.kill(); await exited(h); }
  try { rmSync(fixture, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); }
  catch { console.warn(`Could not remove test fixture: ${fixture}`); }
}
