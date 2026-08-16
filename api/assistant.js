/* The lobby assistant's brain.
 *
 * Scoped hard: this only answers questions about Corewise, this site, and
 * what the company does. The knowledge base below is built from
 * tour-content.json at cold start, so it is always the same facts the hall
 * itself shows and never drifts into inventing a feature that does not
 * exist. The model is told to decline anything outside that scope and hand
 * the visitor to WhatsApp instead of guessing.
 *
 * The key lives in Vercel's environment (ANTHROPIC_API_KEY), never in the
 * browser.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

function buildKnowledge() {
  const d = JSON.parse(readFileSync(join(here, '..', 'tour-content.json'), 'utf8'));
  const rooms = {};
  d.departments.forEach(r => { rooms[r.id] = r; });
  const L = [];
  L.push('Corewise: an AI and technology company based in Israel.');
  L.push('Founders: Ariel Ohayon, lead developer, runs the Claude Israel community (18K+ members). Lidor Dahan, CEO, PhD in electrical and computer engineering, about six years working on autonomous vehicle algorithms.');
  L.push('The corewise.co.il website is itself a live 360 degree walk-in hall, not a scrolling page. The lobby has five big screens, one per business line. Clicking a screen opens it in place with a film, a short summary, and the specific capabilities as smaller tiles beneath.');
  L.push('Every video shown on the site was produced with Corewise’s own internal AI production skills, end to end.');
  L.push('To talk to a real person: WhatsApp Lidor at 972507594477 (link https://wa.me/972507594477).');
  L.push('');
  L.push('=== The five business lines ===');
  (rooms.lobby?.hotspots || []).forEach(h => {
    if (h.kind !== 'axis') return;
    L.push('## ' + h.title + ' | ' + (h.sub || ''));
    if (h.abstract) L.push(h.abstract);
    if (h.site) L.push('Its own site: https://corewise.co.il/' + h.site);
    (h.features || []).forEach(f => {
      L.push('- ' + f.title + (f.tag ? ' (' + f.tag + ')' : '') + ': ' + (f.text || ''));
    });
    L.push('');
  });
  L.push('=== Talks and workshops ===');
  (rooms.stage?.hotspots || []).forEach(h => { if (h.text) L.push(h.title + ': ' + h.text); });
  L.push('');
  L.push('=== The team ===');
  (rooms.team?.hotspots || []).forEach(h => { if (h.kind === 'story' && h.text) L.push(h.title + ': ' + h.text); });
  return L.join('\n');
}

let KNOWLEDGE = null;   /* built once per warm function instance */

const SYSTEM = know => `You are the assistant standing in the lobby of the Corewise website, a company AI and technology campus that visitors walk through in 3D.

Answer ONLY questions about Corewise: its five business lines, its features, the team, how to get in touch, or how the site itself works. If asked anything else (general knowledge, other companies, coding help, personal advice, anything unrelated to Corewise), politely decline in one short sentence and steer back: say you can only help with questions about Corewise, and suggest what you can answer instead.

Reply in the same language the visitor just wrote in: Hebrew or English. Keep answers short, two to four sentences, plain conversational text with no markdown headers, no bullet lists, no em dashes (use a comma or a period instead). If a fact is not in the knowledge base below, say you are not sure and offer the WhatsApp link rather than guessing. If the visitor wants a human, a quote, or to book something, give the WhatsApp link.

Knowledge base:
${know}`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'no key configured' });

  const body = req.body || {};
  const text = String(body.message || '').slice(0, 500).trim();
  if (!text) return res.status(400).json({ error: 'empty' });
  /* last few turns only, capped, so one visitor cannot balloon the prompt */
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  const messages = history
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 500) }))
    .concat([{ role: 'user', content: text }]);

  try {
    if (!KNOWLEDGE) KNOWLEDGE = buildKnowledge();
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SYSTEM(KNOWLEDGE),
        messages,
      }),
    });
    if (!r.ok) return res.status(502).json({ error: 'upstream ' + r.status });
    const j = await r.json();
    const reply = (j.content && j.content[0] && j.content[0].text) || '';
    if (!reply) return res.status(502).json({ error: 'empty reply' });
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(502).json({ error: 'upstream failed' });
  }
}
