/* The lobby assistant's brain.
 *
 * Scoped hard: it only answers questions about Corewise, this site, and what
 * the company does. The knowledge base is generated from tour-content.json at
 * cold start, so it is always exactly the facts the hall itself shows and can
 * never invent a capability that does not exist. Everything the visitor could
 * find by walking the whole campus is in here, so the assistant is a shortcut
 * through the building rather than a thinner version of it.
 *
 * It can also MOVE the visitor: when an answer is about one of the five
 * screens, the model appends [[open:<id>]] and the client flies the hall to
 * that screen and opens it. Answering and pointing are the same gesture.
 *
 * Gemini 2.5 Flash answers by default (GEMINI_API_KEY); Anthropic is kept as
 * a fallback so a key of either kind brings the bot to life. The key lives in
 * Vercel's environment, never in the browser.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/* the ids the model is allowed to steer to, and the room each one owns */
const AXES = ['ai', 'measure', 'vision', 'pedagogy', 'ar'];

function buildKnowledge() {
  const d = JSON.parse(readFileSync(join(here, '..', 'tour-content.json'), 'utf8'));
  const rooms = {};
  d.departments.forEach(r => { rooms[r.id] = r; });
  const L = [];

  L.push('# Corewise');
  L.push('An AI and technology company in Israel. Two founders who do the work themselves, no outsourcing.');
  L.push('Ariel Ohayon: founder and lead developer. Runs the Claude Israel community (18K+ members), speaks at conferences, builds AI products. BA in economics and business administration.');
  L.push('Lidor Dahan: CEO and founder. PhD in electrical and computer engineering, about six years developing AI for autonomous vehicles, founded ventures in computer vision and smart cities.');
  L.push('Contact: WhatsApp Lidor at 972507594477, link https://wa.me/972507594477. That is the only contact route; there is no phone number, email or contact form published on the site.');
  L.push('');
  L.push('## How this website works');
  L.push('It is a live 360 degree hall you stand inside and look around, not a page you scroll. The lobby has five big screens on the walls, one per business line, plus a Before/After film under the logo wall. Clicking a screen opens it in place: the film plays, a short summary sits beside it, and the specific capabilities appear as smaller tiles beneath. Each screen also leads to a full department room you can walk into, and to that department’s own dedicated site.');
  L.push('There is a "Show me everything" guided pass in the lobby that visits all five screens in turn. There is a campus map in the top bar, a language switch (Hebrew default, English optional), and background music that can be muted.');
  L.push('Every video and every image on the site was produced with Corewise’s own internal AI production skills, end to end. The site is itself the portfolio piece.');
  L.push('');

  L.push('# The five business lines');
  L.push('When an answer is about one of these, append its [[open:id]] tag. The ids are: ' + AXES.join(', ') + '.');
  (rooms.lobby?.hotspots || []).forEach(h => {
    if (h.kind !== 'axis') return;
    L.push('');
    L.push('## ' + h.title + ' (id: ' + h.id + ') | ' + (h.sub || ''));
    if (h.status) L.push('Status: ' + h.status);
    if (h.abstract) L.push(h.abstract);
    if (h.site) L.push('Dedicated site: https://corewise.co.il/' + h.site);
    if (h.room && rooms[h.room]) L.push('Walk-in room: "' + rooms[h.room].title + '"');
    (h.features || []).forEach(f => {
      L.push('- ' + f.title + (f.tag ? ' [' + f.tag + ']' : '') + ': ' + (f.text || ''));
    });
  });
  L.push('');

  /* every room in full: this is what a visitor would find by walking the
     entire campus, so the assistant is never thinner than the building */
  L.push('# Every room in detail');
  Object.values(rooms).forEach(r => {
    if (r.id === 'lobby') return;
    L.push('');
    L.push('## Room: ' + r.title + (r.sub ? ' | ' + r.sub : ''));
    if (r.body) L.push(r.body);
    (r.hotspots || []).forEach(h => {
      if (h.kind === 'tv' || h.kind === 'yt') return;   /* screens, not facts */
      const bits = [];
      if (h.text) bits.push(h.text);
      if (h.quote) bits.push('Quote: "' + h.quote + '"');
      if (Array.isArray(h.metrics)) bits.push('Numbers: ' + h.metrics.map(m => m.join(' ')).join(', '));
      if (Array.isArray(h.tech)) bits.push('Built with: ' + h.tech.join(', '));
      if (h.link && /^https?:/.test(h.link)) bits.push('Link: ' + h.link);
      L.push('- ' + h.title + ': ' + bits.join(' '));
    });
    if (Array.isArray(r.works)) {
      r.works.forEach(w => L.push('- Work: ' + w.title + '. ' + (w.desc || '')));
    }
  });

  L.push('');
  L.push('# Things to be careful about');
  L.push('Fall detection is an alert aid that complements human supervision. It is NOT a medical device and must never be described as life-saving or as a substitute for care.');
  L.push('The AR line is openly still being built. Do not promise delivery dates for it.');
  L.push('Conference photographs from the last event are not cleared for publication yet.');
  L.push('"From Caterpillar to Butterfly" (מהזחל אל הפרפר) is a registered code name of the Gefen youth programme, not a slogan.');
  L.push('There are no public prices, packages or client names on the site. If asked about cost, timelines or references, say that depends on scope and hand over the WhatsApp link.');
  return L.join('\n');
}

let KNOWLEDGE = null;   /* built once per warm function instance */

const SYSTEM = know => `You are the assistant standing in the lobby of the Corewise website, an AI and technology company whose site is a 3D hall visitors walk through.

Your job is to be the fastest way to find anything about Corewise. You know the whole campus, so answer the actual question directly instead of telling people where to click.

SCOPE. Only Corewise: its five business lines, its capabilities, its projects, the team, how to get in touch, and how this site works. If asked anything else (general knowledge, other companies, coding help, personal advice, current events), decline warmly in one short sentence and offer what you can help with instead. Never answer the off-topic question even partially.

STYLE. Reply in the same language the visitor just used, Hebrew or English. In Hebrew refer to yourself in the masculine ("אני מצטער", "אני לא בטוח"), never the feminine: the assistant is introduced as עוזר קורוויז. Two to four sentences, conversational, concrete. No markdown, no headers, no bullet lists, no bold. Never use an em dash; use a comma or a full stop. Lead with the answer, not with preamble. When a capability has a number or a limit attached, give it.

HONESTY. If a fact is not in the knowledge base, say plainly that you are not sure and give the WhatsApp link (https://wa.me/972507594477). Never invent a feature, a price, a timeline or a client name. Prices and schedules always depend on scope, so hand those to Lidor.

NAVIGATION. When your answer is about one of the five business lines, end your message with a tag on its own, exactly like [[open:vision]], choosing from: ai, measure, vision, pedagogy, ar. The visitor's view will fly to that screen and open it, so write the sentence before it as if you are showing them something ("here it is", "opening it for you"). Use at most one tag, and only when it genuinely matches. Never mention the tag itself.

Knowledge base:
${know}`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const gem = process.env.GEMINI_API_KEY;
  const claude = process.env.ANTHROPIC_API_KEY;
  if (!gem && !claude) return res.status(503).json({ error: 'no key configured' });

  const body = req.body || {};
  const text = String(body.message || '').slice(0, 500).trim();
  if (!text) return res.status(400).json({ error: 'empty' });
  /* last few turns only, capped, so one visitor cannot balloon the prompt */
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  const turns = history
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 800) }))
    .concat([{ role: 'user', content: text }]);

  try {
    if (!KNOWLEDGE) KNOWLEDGE = buildKnowledge();
    const system = SYSTEM(KNOWLEDGE);
    let reply = '';

    if (gem) {
      /* Gemini calls the assistant's own turns "model", not "assistant", and
         takes the system prompt in its own field rather than in the thread.
         Thinking is switched off: this is retrieval from a fixed brief, and
         the latency it buys back is worth more than the deliberation. */
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': gem },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: turns.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          generationConfig: { maxOutputTokens: 600, temperature: 0.6, thinkingConfig: { thinkingBudget: 0 } },
        }),
      });
      if (!r.ok) return res.status(502).json({ error: 'upstream ' + r.status });
      const j = await r.json();
      const parts = j?.candidates?.[0]?.content?.parts || [];
      reply = parts.map(p => p.text || '').join('').trim();
    } else {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': claude, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 500,
          system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
          messages: turns,
        }),
      });
      if (!r.ok) return res.status(502).json({ error: 'upstream ' + r.status });
      const j = await r.json();
      reply = (j.content && j.content[0] && j.content[0].text) || '';
    }

    if (!reply) return res.status(502).json({ error: 'empty reply' });

    /* pull the steering tag out of the prose before it reaches the visitor */
    let go = null;
    reply = reply.replace(/\[\[open:([a-z]+)\]\]/gi, (_, id) => {
      const k = String(id).toLowerCase();
      if (!go && AXES.includes(k)) go = k;
      return '';
    }).replace(/—/g, ',').trim();

    return res.status(200).json({ reply, go });
  } catch (e) {
    return res.status(502).json({ error: 'upstream failed' });
  }
}
