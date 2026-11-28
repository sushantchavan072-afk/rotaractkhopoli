// Run: npm test. Checks the encryption of private records and the money rules applied before a save.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCipheriv, createHash, randomBytes } from 'node:crypto';

process.env.FINANCE_KEY = 'test-key-for-unit-tests';
const { encrypt, decrypt, cleanFinance, LockedError } = await import('./finance.js');
const { InvalidError } = await import('./validate.js');

test('records are written as v2 (scrypt) and read back', () => {
  const box = encrypt({ hello: 'club' });
  assert.equal(JSON.parse(box.toString()).v, 2);
  assert.deepEqual(decrypt(box.toString()), { hello: 'club' });
});

test('older v1 files (SHA-256 key) still open', () => {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', createHash('sha256').update('rck-finance:test-key-for-unit-tests').digest(), iv);
  const data = Buffer.concat([c.update(JSON.stringify({ old: true })), c.final()]);
  const v1 = JSON.stringify({ v: 1, iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') });
  assert.deepEqual(decrypt(v1), { old: true });
});

test('a changed key cannot open the records', () => {
  const box = encrypt({ secret: 1 }).toString();
  process.env.FINANCE_KEY = 'a-different-key-entirely';
  assert.throws(() => decrypt(box), LockedError);
  process.env.FINANCE_KEY = 'test-key-for-unit-tests';
});

const entry = { id: '20261128-abc', date: '2026-11-28', type: 'expense', amount: '450', category: 'Venue', description: 'Hall' };
const sheet = (patch) => ({ openingBalances: {}, entries: [entry], ...patch });

test('money rules: good sheet passes, bad amounts, fees and receipts are refused', () => {
  assert.equal(cleanFinance(sheet()).entries[0].amount, 450);
  assert.throws(() => cleanFinance(sheet({ entries: [{ ...entry, amount: '-5' }] })), InvalidError);
  assert.throws(() => cleanFinance(sheet({ entries: [{ ...entry, date: '2026-02-30' }] })), InvalidError);
  assert.throws(() => cleanFinance(sheet({ dues: { '2026–27': { fee: '1.500.00', paid: {} } } })), InvalidError);
  const claim = { id: 'r-1', date: '2026-11-20', person: 'Priya', amount: '300', description: 'Courier', status: 'pending' };
  assert.equal(cleanFinance(sheet({ claims: [{ ...claim, receipt: 'rc-abc123-ff00' }] })).claims[0].receipt, 'rc-abc123-ff00');
  assert.throws(() => cleanFinance(sheet({ claims: [{ ...claim, receipt: '../../secrets' }] })), InvalidError);
  assert.throws(() => cleanFinance(sheet({ claims: [{ ...claim, status: 'stolen' }] })), InvalidError);
});
