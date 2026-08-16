/* Exercise the assistant's real brain from this machine, using the key in
 * .env. Runs the same handler the site runs, so what passes here is what the
 * lobby will say.
 *
 *   node assistant-test.mjs
 *   node assistant-test.mjs "your own question"
 */
import { readFileSync } from 'node:fs';
import handler from './api/assistant.mjs';

for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
  if (m && m[2].trim()) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
if (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
  console.error('No key in .env yet. Paste one after GEMINI_API_KEY= and run again.');
  process.exit(1);
}
console.log('key: ' + (process.env.GEMINI_API_KEY ? 'Gemini' : 'Anthropic') + ' (value never printed)\n');

const ask = (message, history = []) => new Promise(res => {
  const req = { method: 'POST', body: { message, history } };
  const out = { status(c) { this._c = c; return this; }, json(b) { res({ code: this._c, body: b }); }, setHeader() {}, end() { res({ code: this._c }); } };
  handler(req, out);
});

const CASES = process.argv[2] ? [['custom', process.argv[2]]] : [
  ['HE in scope',      'מה זה זיהוי נפילה?'],
  ['HE navigation',    'ספר לי על הלידאר שלכם'],
  ['EN in scope',      'What can you do with a normal security camera?'],
  ['EN navigation',    'Do you run programmes for schools?'],
  ['HE off topic',     'מה מזג האוויר מחר בתל אביב?'],
  ['EN off topic',     'Write me a python function that sorts a list'],
  ['HE no such fact',  'כמה עולה פרויקט לידאר?'],
  ['HE contact',       'איך אני מדבר עם מישהו אמיתי?'],
];

let bad = 0;
for (const [label, q] of CASES) {
  const t0 = Date.now();
  const r = await ask(q);
  const ms = Date.now() - t0;
  const txt = r.body?.reply || JSON.stringify(r.body);
  console.log(`[${label}] ${q}`);
  console.log(`  ${r.code} ${ms}ms  go=${r.body?.go ?? '-'}`);
  console.log('  ' + String(txt).replace(/\n/g, ' '));
  const flags = [];
  if (r.code !== 200) flags.push('NOT 200');
  if (/—/.test(txt)) flags.push('EM DASH');
  if (/\[\[/.test(txt)) flags.push('LEAKED TAG');
  if (String(txt).length > 700) flags.push('TOO LONG');
  if (label.includes('off topic') && r.body?.go) flags.push('STEERED ON OFF-TOPIC');
  if (flags.length) { bad++; console.log('  !! ' + flags.join(', ')); }
  console.log();
}
console.log(bad ? `${bad} case(s) need a look` : 'all clean');
