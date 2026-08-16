/* Corewise accessibility preferences, per IS 5568 / תקנה 35.
   Shared verbatim by the hall and by every department site; copy, do not fork.

   What this is: a user-preference comfort tool. The visitor asks for larger
   text, more contrast, no motion, and gets it. That is all it does.

   What this deliberately is NOT: an accessibility overlay. It never touches
   the content DOM. It does not invent alt text, does not rewrite ARIA, does
   not reorder nodes, does not claim the site is compliant. Overlays that make
   that claim have been fined for it (FTC v. accessiBe, April 2025), and the
   Israeli commission has never endorsed one. Compliance lives in the markup:
   semantic landmarks, real labels, keyboard operability, honest contrast. This
   file only lets a visitor tune what is already there.

   Loaded BLOCKING from <head>, not deferred, and on purpose: preferences live
   in localStorage, so if this ran after first paint a visitor who needs 150%
   text or inverted colour would watch the page flash the wrong way on every
   navigation. The file is small enough that the cost is a rounding error and
   the flash is not.

   Bilingual with no dependency on i18n.js: the labels come from the table
   below, keyed off documentElement.lang, and a MutationObserver on that
   attribute re-renders them. That way the same file works on the department
   sites (where i18n.js flips lang) and inside the hall (where world.js does),
   without either one having to know this exists. */
(() => {
  const KEY = 'cw_a11y_prefs_v1';
  const VERSION = 1;
  const root = document.documentElement;

  const DEFAULTS = {
    version: VERSION,
    links: false,        /* underline and box every link */
    contrast: 'off',     /* off | high | invert | mono */
    textSize: 100,       /* 100 | 115 | 130 | 150 */
    lines: 'normal',     /* normal | 16 | 20 */
    readableFont: false,
    headings: false,
    cursorBlack: false,
    cursorBig: false,
    reduceMotion: false,
  };

  /* ---------- the single source of truth for what class means what ----------
     Both the immediate first-paint application and every later toggle read
     this same table, so the two can never drift apart and reintroduce the
     flash this file exists to prevent. */
  const CLASS_RULES = [
    ['a11y-links',           p => p.links],
    ['a11y-contrast-high',   p => p.contrast === 'high'],
    ['a11y-contrast-invert', p => p.contrast === 'invert'],
    ['a11y-contrast-mono',   p => p.contrast === 'mono'],
    ['a11y-text-115',        p => p.textSize === 115],
    ['a11y-text-130',        p => p.textSize === 130],
    ['a11y-text-150',        p => p.textSize === 150],
    ['a11y-lines-16',        p => p.lines === '16'],
    ['a11y-lines-20',        p => p.lines === '20'],
    ['a11y-font-readable',   p => p.readableFont],
    ['a11y-headings',        p => p.headings],
    ['a11y-cursor-black',    p => p.cursorBlack],
    ['a11y-cursor-big',      p => p.cursorBig],
    ['a11y-reduce-motion',   p => p.reduceMotion],
  ];

  let prefs = load();
  applyClasses();                       /* before first paint, see note above */

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULTS };
      const p = JSON.parse(raw);
      /* a schema bump throws the old shape away rather than half-reading it */
      if (p.version !== VERSION) return { ...DEFAULTS };
      return { ...DEFAULTS, ...p };
    } catch { return { ...DEFAULTS }; }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {}
  }

  function applyClasses() {
    const c = root.classList;
    for (const [cls, on] of CLASS_RULES) c.toggle(cls, !!on(prefs));
    c.toggle('a11y-on', isDirty());
  }

  /* a declaration, not a const arrow: applyClasses() runs at parse time to
     beat the first paint, and a const here would still be in its temporal
     dead zone when that call reaches it */
  function isDirty() { return CLASS_RULES.some(([, on]) => on(prefs)); }

  /* ---------- copy ----------
     Hebrew is the site. English is the option. Same rule as everywhere else. */
  const STR = {
    he: {
      open: 'הגדרות נגישות',
      title: 'הגדרות נגישות',
      close: 'סגירת הגדרות הנגישות',
      hint: 'ההעדפות נשמרות במכשיר שלך ונשארות גם בעמודים הבאים.',
      shortcut: 'קיצור מקלדת: Alt ועוד A',
      reset: 'איפוס כל ההגדרות',
      didReset: 'כל הגדרות הנגישות אופסו',
      statement: 'הצהרת נגישות',
      links: 'הדגשת קישורים',
      contrast: 'ניגודיות',
      textSize: 'גודל טקסט',
      lines: 'מרווח שורות',
      readableFont: 'גופן קריא',
      headings: 'הדגשת כותרות',
      cursorBlack: 'סמן שחור',
      cursorBig: 'סמן גדול',
      reduceMotion: 'עצירת אנימציות',
      on: 'פעיל', off: 'כבוי',
      contrastVals: { off: 'רגילה', high: 'גבוהה', invert: 'הפוכה', mono: 'גווני אפור' },
      linesVals: { normal: 'רגיל', 16: 'מוגדל', 20: 'מוגדל מאוד' },
      note: 'הכלי הזה משנה את התצוגה בלבד, לפי בקשתך. הוא אינו משנה את תוכן העמוד.',
    },
    en: {
      open: 'Accessibility settings',
      title: 'Accessibility settings',
      close: 'Close accessibility settings',
      hint: 'Your preferences are saved on this device and carry across pages.',
      shortcut: 'Keyboard shortcut: Alt plus A',
      reset: 'Reset all settings',
      didReset: 'All accessibility settings were reset',
      statement: 'Accessibility statement',
      links: 'Highlight links',
      contrast: 'Contrast',
      textSize: 'Text size',
      lines: 'Line spacing',
      readableFont: 'Readable font',
      headings: 'Highlight headings',
      cursorBlack: 'Black cursor',
      cursorBig: 'Large cursor',
      reduceMotion: 'Stop animations',
      on: 'on', off: 'off',
      contrastVals: { off: 'normal', high: 'high', invert: 'inverted', mono: 'greyscale' },
      linesVals: { normal: 'normal', 16: 'wide', 20: 'widest' },
      note: 'This tool changes presentation only, at your request. It does not alter page content.',
    },
  };
  const L = () => (root.lang === 'en' ? STR.en : STR.he);

  /* Where the accessibility statement lives, from wherever we are now. The
     department sites sit one level down from the hall, so a root-relative
     path is correct in both places. */
  const STATEMENT = '/negishut/';

  /* ---------- the controls ----------
     Two kinds, and the distinction matters to a screen reader. A binary
     toggle gets aria-pressed. A cycling control must NOT: announcing
     "pressed" for a control with four states is a lie, so the value goes
     into the accessible name instead. */
  const CONTROLS = [
    { key: 'links',        type: 'bin',   icon: '🔗' },
    { key: 'contrast',     type: 'cycle', icon: '◐', vals: ['off', 'high', 'invert', 'mono'], valKey: 'contrastVals' },
    { key: 'textSize',     type: 'cycle', icon: 'A', vals: [100, 115, 130, 150], suffix: '%' },
    { key: 'lines',        type: 'cycle', icon: '☰', vals: ['normal', '16', '20'], valKey: 'linesVals' },
    { key: 'readableFont', type: 'bin',   icon: 'ℱ' },
    { key: 'headings',     type: 'bin',   icon: 'H' },
    { key: 'cursorBlack',  type: 'bin',   icon: '➤' },
    { key: 'cursorBig',    type: 'bin',   icon: '⬆' },
    { key: 'reduceMotion', type: 'bin',   icon: '⏸' },
  ];

  let trigger, panel, live, cards = [], open = false, lastFocus = null;

  function build() {
    if (trigger) return;

    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = 'cw-a11y-trigger';
    trigger.className = 'cw-a11y-trigger';
    trigger.setAttribute('aria-controls', 'cw-a11y-panel');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-keyshortcuts', 'Alt+A');
    trigger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
      + '<circle cx="12" cy="4.2" r="2.1"/>'
      + '<path d="M3.6 8.1h16.8M12 8.1v6.4m0 0-3.3 6.9m3.3-6.9 3.3 6.9"/></svg>';

    panel = document.createElement('div');
    panel.id = 'cw-a11y-panel';
    panel.className = 'cw-a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'cw-a11y-title');
    panel.hidden = true;

    /* The live region sits outside the panel on purpose. Announcements fired
       as the panel closes would otherwise be thrown away with it. */
    live = document.createElement('div');
    live.className = 'cw-a11y-live';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');

    document.body.append(trigger, panel, live);
    render();

    trigger.addEventListener('click', () => toggle());
    panel.addEventListener('click', e => {
      const btn = e.target.closest('[data-a11y-key]');
      if (btn) return hit(btn.dataset.a11yKey);
      if (e.target.closest('[data-a11y-reset]')) return reset();
      if (e.target.closest('[data-a11y-close]')) return toggle(false);
    });

    addEventListener('keydown', e => {
      /* e.code, not e.key: on a Mac, Alt+A produces the dead key "å", so the
         obvious e.key === 'a' check silently fails for every Mac visitor. */
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === 'KeyA') {
        e.preventDefault();
        toggle();
        return;
      }
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); toggle(false); return; }
      if (e.key === 'Tab') trap(e);
    });

    /* whoever owns the language switch on this page, we follow it */
    new MutationObserver(() => render()).observe(root, { attributes: true, attributeFilter: ['lang'] });
  }

  function valueLabel(c) {
    const t = L();
    if (c.type === 'bin') return prefs[c.key] ? t.on : t.off;
    if (c.valKey) return t[c.valKey][prefs[c.key]];
    return prefs[c.key] + (c.suffix || '');
  }

  function render() {
    const t = L();
    trigger.setAttribute('aria-label', t.open);
    trigger.title = t.open + ' (Alt+A)';

    panel.innerHTML =
      '<div class="cw-a11y-head">'
      + '<h2 id="cw-a11y-title">' + t.title + '</h2>'
      + '<button type="button" class="cw-a11y-x" data-a11y-close aria-label="' + t.close + '">&#10005;</button>'
      + '</div>'
      + '<div class="cw-a11y-grid">'
      + CONTROLS.map(c => {
          const on = c.type === 'bin' ? !!prefs[c.key]
            : prefs[c.key] !== DEFAULTS[c.key];
          const name = t[c.key] + ': ' + valueLabel(c);
          return '<button type="button" class="cw-a11y-card' + (on ? ' is-on' : '') + '"'
            + ' data-a11y-key="' + c.key + '"'
            + (c.type === 'bin' ? ' aria-pressed="' + (prefs[c.key] ? 'true' : 'false') + '"' : '')
            + ' aria-label="' + name + '">'
            + '<span class="cw-a11y-ico" aria-hidden="true">' + c.icon + '</span>'
            + '<span class="cw-a11y-lbl">' + t[c.key] + '</span>'
            + '<span class="cw-a11y-val" aria-hidden="true">' + valueLabel(c) + '</span>'
            + '</button>';
        }).join('')
      + '</div>'
      + '<button type="button" class="cw-a11y-reset" data-a11y-reset>' + t.reset + '</button>'
      + '<p class="cw-a11y-note">' + t.note + '</p>'
      + '<p class="cw-a11y-hint">' + t.hint + '<br>' + t.shortcut + '</p>'
      + '<a class="cw-a11y-link" href="' + STATEMENT + '">' + t.statement + '</a>';

    cards = [...panel.querySelectorAll('button, a[href]')];
  }

  function hit(key) {
    const c = CONTROLS.find(x => x.key === key);
    if (!c) return;
    if (c.type === 'bin') prefs[key] = !prefs[key];
    else {
      const i = c.vals.indexOf(prefs[key]);
      prefs[key] = c.vals[(i + 1) % c.vals.length];
    }
    commit(L()[key] + ': ' + valueLabel(c));
  }

  function reset() {
    prefs = { ...DEFAULTS };
    commit(L().didReset);
  }

  function commit(msg) {
    save();
    applyClasses();
    render();
    announce(msg);
    /* render() rebuilt the panel, so focus has to be put back somewhere real */
    if (open) (panel.querySelector('.cw-a11y-x') || trigger).focus();
  }

  function announce(msg) {
    live.textContent = '';
    setTimeout(() => { live.textContent = msg; }, 60);
  }

  function toggle(force) {
    open = force === undefined ? !open : force;
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    root.classList.toggle('a11y-panel-open', open);
    if (open) {
      lastFocus = document.activeElement;
      cards = [...panel.querySelectorAll('button, a[href]')];
      (cards[0] || panel).focus();
    } else if (lastFocus && document.contains(lastFocus)) {
      lastFocus.focus();
    } else {
      trigger.focus();
    }
  }

  function trap(e) {
    const f = cards.filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', build);
  else build();

  window.cwA11y = { get: () => ({ ...prefs }), reset, open: () => toggle(true) };
})();
