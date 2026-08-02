// scroll-world — kie.ai backend (replaces Higgsfield).
// Builds the full seamless fly-through chain with kie: GPT-Image-2 stills +
// Seedance 2 first/last-frame morph legs, then encodes for scroll-scrubbing.
//
// WHY still-to-still morph (the key difference from the Higgsfield SKILL):
//   kie Seedance-2 honours BOTH first_frame_url + last_frame_url strongly, so
//   each leg = a forward flight FROM scene i INTO scene i+1, anchored on the two
//   real stills. Every seam is frame-identical BY CONSTRUCTION — section i's clip
//   ends on still_{i+1}, section i+1's clip starts on the SAME still_{i+1}. No
//   frame extraction, no connectors, no reversal stutter, and legs render in
//   PARALLEL (each is independent). This is architecture "A" done the kie way.
//
// Run:
//   node --env-file=<path-to>/.env scripts/kie-pipeline.mjs \
//     --sections sections.json --out ./build [--tier fast|standard] \
//     [--aspect 16:9] [--dur 6] [--stills-only] [--skip-stills]
//
// sections.json = [{ "id":"farm", "prompt":"<scene still prompt>",
//                    "leg":"<optional per-leg camera prompt>" }, ...]
// Needs: KIE_API_KEY in env (educational-shorts/.env has it), ffmpeg + ffprobe on PATH.

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const KIE = "https://api.kie.ai";
const KIE_UPLOAD = "https://kieai.redpandaai.co";
const KEY = process.env.KIE_API_KEY;

const A = Object.fromEntries(process.argv.slice(2).flatMap((v, i, a) =>
  v.startsWith("--") ? [[v.slice(2), a[i + 1] && !a[i + 1].startsWith("--") ? a[i + 1] : true]] : []));

const SECTIONS_FILE = A.sections;
const OUT = A.out || "./build";
const ASPECT = A.aspect || "16:9";
const TIER = A.tier === "standard" ? "bytedance/seedance-2" : "bytedance/seedance-2-fast";
const DUR = Number(A.dur || 6);
const STILLS_ONLY = !!A["stills-only"];
const SKIP_STILLS = !!A["skip-stills"];
const [W, H] = ASPECT === "9:16" ? [1080, 1920] : [1920, 1080];

if (!SECTIONS_FILE) { console.error("--sections <file.json> required"); process.exit(1); }
if (!KEY) { console.error("KIE_API_KEY missing (node --env-file=.../.env ...)"); process.exit(1); }

const sections = JSON.parse(readFileSync(SECTIONS_FILE, "utf8"));
if (sections.length < 2) { console.error("need >=2 sections"); process.exit(1); }

const VID = join(OUT, "vid");
mkdirSync(VID, { recursive: true });

const sh = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) { console.error(r.stderr?.slice(-800)); throw new Error(`${cmd} failed`); }
  return r.stdout;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- kie primitives ----
async function createTask(model, input, tries = 3) {
  for (let a = 0; a < tries; a++) {
    const cr = await fetch(`${KIE}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input }) }).then((r) => r.json());
    const id = cr?.data?.taskId;
    if (id) return id;
    await sleep(3000); // 503 / credits race — retry
  }
  throw new Error("createTask failed after retries");
}
async function poll(id, label = "") {
  for (let t = 0; t < 240; t++) {
    await sleep(5000);
    const inf = await fetch(`${KIE}/api/v1/jobs/recordInfo?taskId=${id}`, {
      headers: { Authorization: `Bearer ${KEY}` } }).then((r) => r.json());
    const d = inf?.data, st = d?.state;
    if (st === "success") {
      const j = typeof d.resultJson === "string" ? JSON.parse(d.resultJson) : d.resultJson;
      return j.resultUrls[0];
    }
    if (st === "fail") throw new Error(`${label} failed: ${d?.failMsg || ""}`);
    process.stderr.write(".");
  }
  throw new Error(`${label} timed out`);
}
async function download(url, path) {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(path, buf);
  return path;
}
async function kieUpload(path) {
  const buf = readFileSync(path);
  const name = path.split(/[\\/]/).pop();
  const form = new FormData();
  form.append("file", new Blob([buf], { type: "image/png" }), name);
  form.append("uploadPath", "images/scroll-world");
  form.append("fileName", name);
  const r = await fetch(`${KIE_UPLOAD}/api/file-stream-upload`, {
    method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form });
  const j = await r.json();
  const url = j?.data?.downloadUrl;
  if (!url) throw new Error("kie upload: no url " + JSON.stringify(j).slice(0, 200));
  return url;
}

// ---- step 1: stills (GPT-Image-2, text-to-image), concurrent ----
async function makeStill(sec, i) { for (let attempt=1; attempt<=3; attempt++) { try { return await makeStillOnce(sec,i); } catch(e){ console.error(`still ${sec.id} attempt ${attempt} failed: ${e.message}`); if(attempt===3) throw e; await sleep(5000);} } }
async function makeStillOnce(sec, i) {
  const path = join(OUT, `still_${i}_${sec.id}.png`);
  if (SKIP_STILLS && existsSync(path)) return path;
  const id = await createTask("gpt-image-2-text-to-image",
    { prompt: sec.prompt, aspect_ratio: ASPECT, resolution: "2K" });
  const url = await poll(id, `still ${sec.id}`);
  return download(url, path);
}

// ---- step 2: legs (Seedance first+last morph), concurrent ----
const LEG_TAIL = " Single continuous cinematic camera move, no cuts, no flashes. " +
  "The camera only ever glides smoothly FORWARD, never pulling back. It settles into " +
  "a slow steady forward drift in the final second. Seamless, graceful slow motion. No text.";
async function makeLeg(firstUrl, lastUrl, i, prompt) { for (let attempt=1; attempt<=3; attempt++) { try { return await makeLegOnce(firstUrl,lastUrl,i,prompt); } catch(e){ console.error(`leg ${i} attempt ${attempt} failed: ${e.message}`); if(attempt===3) throw e; await sleep(5000);} } }
async function makeLegOnce(firstUrl, lastUrl, i, prompt) {
  const input = { prompt: (prompt || "Fly forward through the connected world.") + LEG_TAIL,
    first_frame_url: firstUrl, aspect_ratio: ASPECT, resolution: "720p",
    duration: DUR, generate_audio: false };
  if (lastUrl) input.last_frame_url = lastUrl; // omitted on the final hero push-in
  const id = await createTask(TIER, input);
  const url = await poll(id, `leg ${i}`);
  return download(url, join(VID, `leg_${i}.raw.mp4`));
}

// ---- step 3: encode for scroll-scrubbing (blob-seek friendly: -g 8 + faststart) ----
function encode(src, out, mobile = false) {
  const g = mobile ? "4" : "8";
  const scale = mobile ? "1280:720" : `${W}:${H}`;
  const crf = mobile ? "23" : "20";
  sh("ffmpeg", ["-y", "-i", src, "-an",
    "-vf", `scale=${scale},unsharp=5:5:0.8:5:5:0.0`,
    "-c:v", "libx264", "-preset", "slow", "-crf", crf, "-pix_fmt", "yuv420p",
    "-g", g, "-keyint_min", g, "-sc_threshold", "0", "-profile:v", "high", "-level", "4.0",
    "-movflags", "+faststart", out]);
  return out;
}

// ================= run =================
(async () => {
  console.error(`${sections.length} sections · ${ASPECT} · ${TIER.split("/").pop()} · ${DUR}s/leg`);

  console.error("stills (gpt-image-2, concurrent)…");
  const stills = await Promise.all(sections.map((s, i) => makeStill(s, i)));
  stills.forEach((p) => console.error("  ✓ " + p.split(/[\\/]/).pop()));
  if (STILLS_ONLY) { console.error("--stills-only: review stills, then re-run with --skip-stills"); return; }

  console.error("uploading stills to kie…");
  const urls = [];
  for (const p of stills) urls.push(await kieUpload(p));

  // legs 0..N-2 = morph still_i -> still_{i+1}; final leg = hero push-in on last still.
  console.error("legs (seedance first+last morph, concurrent)…");
  const legJobs = [];
  for (let i = 0; i < sections.length - 1; i++)
    legJobs.push(makeLeg(urls[i], urls[i + 1], i, sections[i].leg));
  legJobs.push(makeLeg(urls[urls.length - 1], null, sections.length - 1,
    "Slow gentle push-in on the hero scene, holding steady.")); // final section clip
  const rawLegs = await Promise.all(legJobs);

  console.error("\nencoding…");
  const clips = rawLegs.map((src, i) => {
    const out = encode(src, join(VID, `leg_${i}.mp4`));
    if (A.mobile) encode(src, join(VID, `leg_${i}-m.mp4`), true);
    return out;
  });

  // emit the mountScrollWorld sections config, wired for architecture A (connectors: []).
  const cfg = sections.map((s, i) => ({
    id: s.id, label: s.label || s.id,
    still: `still_${i}_${s.id}.png`,
    clip: `vid/leg_${i}.mp4`,
    ...(A.mobile ? { clipMobile: `vid/leg_${i}-m.mp4` } : {}),
    eyebrow: s.eyebrow || "", title: s.title || "", body: s.body || "",
    tags: s.tags || [], accent: s.accent || undefined,
    ...(s.cta ? { cta: s.cta } : {}),
  }));
  writeFileSync(join(OUT, "sections.config.json"),
    JSON.stringify({ diveScroll: 1.3, connScroll: 0.9, sections: cfg, connectors: [] }, null, 2));

  console.error(`\nDONE → ${OUT}`);
  console.error(`  ${clips.length} clips, ${stills.length} stills`);
  console.error(`  sections.config.json → feed into mountScrollWorld() (connectors: [] = architecture A)`);
})();
