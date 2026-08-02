import { chromium, devices } from 'playwright';
const OUT = 'C:/Users/LENOVO/AppData/Local/Temp/claude/C--Users-LENOVO-Downloads-cowork/8bea6f7f-e48b-4f92-904a-fff25efadabe/scratchpad';
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'he-IL' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);

/* explore button visible above fold on mobile? */
const btn = await page.evaluate(() => {
  const b = document.querySelector('.sw-copy__explore');
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { top: Math.round(r.top), bottom: Math.round(r.bottom), inView: r.top > 0 && r.bottom < innerHeight };
});
console.log('explore button:', JSON.stringify(btn));
await page.screenshot({ path: OUT + '/vr_m_0_panel.png' });

/* open the room */
await page.click('.sw-copy__explore');
await page.waitForTimeout(6000);
const state = await page.evaluate(() => ({
  rxOn: document.querySelector('.rx')?.classList.contains('rx-on'),
  spots: [...document.querySelectorAll('.rx-spot')].filter(s => s.style.display !== 'none').length,
  loadHidden: document.querySelector('.rx-load')?.style.display === 'none',
  gyroBtn: !!document.querySelector('.rx-gyro'),
}));
console.log('room state:', JSON.stringify(state));
await page.screenshot({ path: OUT + '/vr_m_1_room.png' });

/* drag look-around */
await page.mouse.move(195, 400);
await page.mouse.down();
await page.mouse.move(80, 400, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(800);
await page.screenshot({ path: OUT + '/vr_m_2_dragged.png' });

/* tap a visible spot with an image card */
const clicked = await page.evaluate(() => {
  const s = [...document.querySelectorAll('.rx-spot')].find(x => x.style.display !== 'none');
  if (!s) return null;
  s.click();
  const c = document.querySelector('.rx-card');
  return { title: c.querySelector('h3').textContent, cardShown: !c.hidden };
});
console.log('card:', JSON.stringify(clicked));
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + '/vr_m_3_card.png' });

/* close room, back to tour */
await page.click('.rx-exit');
await page.waitForTimeout(800);
const back = await page.evaluate(() => !document.querySelector('.rx').classList.contains('rx-on'));
console.log('closed back to tour:', back);
console.log('JS errors:', errors.length ? errors : 'none');
await browser.close();
