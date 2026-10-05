import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// Run against a running studio: STUDIO_URL defaults to the standard local port.
const base = process.env.STUDIO_URL || 'http://127.0.0.1:4800';
const hashes = [];
for (let i = 0; i < 3; i++) {
  const response = await fetch(`${base}/api/export/png`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      id: 'video/overlays/starter-headline', suffix: 'wide', scale: 1,
      variables: { line1: 'QA HEADLINE', line2: 'SECOND LINE VISIBLE', caption: 'CAPTION VISIBLE' },
    }),
  });
  const result = await response.json();
  assert(response.ok, JSON.stringify(result));
  const image = await fetch(new URL(result.url, base));
  assert(image.ok, 'Export file must be available');
  hashes.push(createHash('sha256').update(Buffer.from(await image.arrayBuffer())).digest('hex'));
  console.log(result.url);
}
assert.equal(new Set(hashes).size, 1, 'Repeated motion PNGs must be identical');
console.log(`PASS three identical PNG exports: ${hashes[0]}`);
