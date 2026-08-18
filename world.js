/* Corewise World — free-roam 360 campus.
   No scroll: you stand in a room, look around, and walk through doors. */
(() => {
  const THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.152.2/three.min.js';
  const WA = 'https://wa.me/972507594477';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  /* Drawn, not typed. 🧭 and 🗺️ rendered as full-colour OS clipart next to a
     hand-built equalizer and a hand-drawn WhatsApp glyph — three icon
     languages in one 3-button bar. These match the WhatsApp stroke weight. */
  const ICON = {
    gyro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="8.3"/><path d="M15.1 8.9 10.2 10.6 8.9 15.1 13.8 13.4z" fill="currentColor" stroke="none"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M9 4.7 3.7 7v12.3L9 17l6 2.3 5.3-2.3V4.7L15 7z"/><path d="M9 4.7V17M15 7v12.3"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M4 6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3.3V16.5H6a2 2 0 0 1-2-2z"/><circle cx="9" cy="10.3" r=".9" fill="currentColor" stroke="none"/><circle cx="12.5" cy="10.3" r=".9" fill="currentColor" stroke="none"/><circle cx="16" cy="10.3" r=".9" fill="currentColor" stroke="none"/></svg>',
  };
  /* A phone has no arrow keys. The old single string taught a desktop
     keyboard to a thumb, and at 390px it ran under the compass and clipped
     mid-word — the visitor's first read of the build quality. */

  /* ---------- language ----------
     Hebrew IS the hall: it ships in the markup and in tour-content.json, so a
     visitor with no JavaScript, a crawler or a slow phone gets the real thing
     and nothing ever flashes. English is a file beside it plus a table of the
     forty-odd strings the engine itself speaks. Never auto-detected — an
     Israeli visitor on an English-locale laptop still lands in Hebrew; only a
     click or an explicit ?lang=en moves the hall. */
  const UI = {
    he: {
      hint: 'גררו כדי להסתכל · הקישו על מסך כדי לפתוח',
      lookup: 'הרימו מבט', home: '← חזרה ללובי', homeAria: 'חזרה ללובי',
      snd: 'מוזיקת רקע', gyro: 'ג\'ירוסקופ', gyroAria: 'ניווט בתנועת המכשיר',
      map: 'מפת הקמפוס', mapClose: 'סגירה', close: 'סגירה',
      padL: 'שמאלה', padU: 'קדימה', padR: 'ימינה',
      tourGo: '▶ הראו לי הכל', tourStop: '⏸ עצרו', tourDone: 'ראיתם את כל חמשת הצירים',
      waTitle: 'השאירו פרטים בוואטסאפ', waLabel: 'השאירו פרטים', waLidor: 'לפניה בוואטסאפ',
      lounge: '☕ בואו נדבר', greet: 'היי', langBtn: 'EN', langAria: 'Switch to English',
      progA: 'גילית ', progB: ' מתוך ',
      sndOn: '🔇 הפעלת סאונד', sndOff: '🔊 השתקה',
      tvOn: '🔇 הקישו להפעלת סאונד', tvOff: '🔊 הקישו להשתקה',
      ytSnd: '🔇 סאונד', ytSndOn: '🔊 סאונד', ytMute: 'השתקה', ytUnmute: 'הפעלת סאונד',
      ytBig: '⤢ הגדלה', ytSmall: '⤡ הקטנה', ytWatch: '▶ צפייה בסדרה', ytShut: '⤡ סגירה',
      ytBigAria: 'הגדלת המסך', ytShutAria: 'סגירת המסך המוגדל',
      axisTap: 'הקישו לפתיחה', axisRoom: 'להיכנס למחלקה המלאה ↓', axisSite: 'האתר הייעודי ↗',
      axisWa: t => 'היי לידור, ראיתי את ' + t + ' בסיור באתר. אשמח לדבר.',
      cardCta: 'השאירו פרטים ונשלח לכם לינק',
      carPrev: 'המסך הקודם', carNext: 'המסך הבא', axisSiteShort: 'אתר ייעודי', axisTapSite: 'הקישו · יש אתר ייעודי',
      teamRoom: 'לחדר הצוות ↓', featOpen: 'לפתוח ↗', teamWa: 'היי לידור, ראיתי אתכם באתר. אשמח לדבר.',
      assistOpen: 'שאלו את קורוויז', assistTitle: 'עוזר קורוויז',
      assistGreet: 'שאלו אותי כל דבר על קורוויז, על חמשת התחומים או על מה שאנחנו עושים.',
      assistPlaceholder: 'כתבו הודעה', assistSend: 'שליחה', assistClose: 'סגירה',
      assistChips: ['מה זה זיהוי נפילה?', 'מה אתם מודדים עם לידאר?', 'יש לכם תוכנית לבית ספר?', 'איך מתחילים?'],
      assistThinking: 'חושב', assistError: 'ההודעה לא נשלחה. נסו שוב או כתבו ללידור בוואטסאפ.',
      finEyebrow: 'סוף הסיור', finTitle: 'נעים להכיר 👋',
      finLine: (r, f) => 'ביקרת ב-' + r + ' מחלקות וגילית ' + f + ' נקודות בקמפוס.',
      finAsk: ' מכאן זה כבר תלוי בכם - במה נתחיל?',
      finPaths: [
        ['💡', 'יש לי רעיון למוצר', 'היי, סיירתי בקמפוס Corewise ויש לי רעיון למוצר, אשמח לדבר'],
        ['🏫', 'אני מבית ספר', 'היי, סיירתי בקמפוס Corewise, אשמח לשמוע על תוכניות AI ואלקטרוניקה לבית הספר שלנו'],
        ['🎤', 'רוצה הרצאה/סדנה', 'היי, סיירתי בקמפוס Corewise, אשמח לפרטים על הרצאה או סדנה לארגון שלנו'],
      ],
    },
    en: {
      hint: 'Drag to look around · tap a screen to open it',
      lookup: 'Look up', home: '← Back to the hall', homeAria: 'Back to the hall',
      snd: 'Background music', gyro: 'Gyroscope', gyroAria: 'Move the device to look around',
      map: 'Campus map', mapClose: 'Close', close: 'Close',
      padL: 'Left', padU: 'Forward', padR: 'Right',
      tourGo: '▶ Show me everything', tourStop: '⏸ Stop', tourDone: 'That is all five lines of work',
      waTitle: 'Message us on WhatsApp', waLabel: 'Talk to us', waLidor: 'WhatsApp Lidor',
      lounge: '☕ Let\'s talk', greet: 'Hi', langBtn: 'עברית', langAria: 'החלפה לעברית',
      progA: 'Found ', progB: ' of ',
      sndOn: '🔇 Turn sound on', sndOff: '🔊 Mute',
      tvOn: '🔇 Tap for sound', tvOff: '🔊 Tap to mute',
      ytSnd: '🔇 Sound', ytSndOn: '🔊 Sound', ytMute: 'Mute', ytUnmute: 'Turn sound on',
      ytBig: '⤢ Expand', ytSmall: '⤡ Shrink', ytWatch: '▶ Watch the series', ytShut: '⤡ Close',
      ytBigAria: 'Expand the screen', ytShutAria: 'Close the expanded screen',
      axisTap: 'Tap to open', axisRoom: 'Step into the full department ↓', axisSite: 'Dedicated site ↗',
      axisWa: t => 'Hi Lidor, I saw ' + t + ' on the site tour. I would like to talk.',
      cardCta: 'Leave your details and we will send the link',
      carPrev: 'Previous screen', carNext: 'Next screen', axisSiteShort: 'own site', axisTapSite: 'tap · has its own site',
      teamRoom: 'Into the team room ↓', featOpen: 'Open ↗', teamWa: 'Hi Lidor, I saw you on the site. I would like to talk.',
      assistOpen: 'Ask Corewise', assistTitle: 'Corewise assistant',
      assistGreet: 'Ask me anything about Corewise, the five business lines, or what we do.',
      assistPlaceholder: 'Type a message', assistSend: 'Send', assistClose: 'Close',
      assistChips: ['What is fall detection?', 'What can you measure with LiDAR?', 'Do you run school programmes?', 'How do we start?'],
      assistThinking: 'Thinking', assistError: 'The message did not send. Try again or message Lidor on WhatsApp.',
      finEyebrow: 'End of the tour', finTitle: 'Good to meet you 👋',
      finLine: (r, f) => 'You walked ' + r + ' departments and found ' + f + ' points on campus.',
      finAsk: ' From here it is up to you - where do we start?',
      finPaths: [
        ['💡', 'I have a product idea', 'Hi, I toured the Corewise campus and I have a product idea, I would like to talk'],
        ['🏫', 'I am from a school', 'Hi, I toured the Corewise campus, I would like to hear about the AI and electronics programmes for our school'],
        ['🎤', 'I want a talk or workshop', 'Hi, I toured the Corewise campus, I would like details on a talk or workshop for our organisation'],
      ],
    },
  };
  const urlLang = new URL(location.href).searchParams.get('lang');
  let LANG = urlLang === 'en' || urlLang === 'he' ? urlLang
    : ((() => { try { return localStorage.getItem('cw-lang'); } catch (e) { return null; } })() || 'he');
  const T = k => UI[LANG][k] !== undefined ? UI[LANG][k] : UI.he[k];

  let CFG = null, ROOMS = {}, cur = null;
  let renderer, scene, camera, sphereA, sphereB, rafId;
  let lon = 0, lat = 0, fov = 78, drag = false, px = 0, py = 0;
  let gyro = false, gbase = null, spots = [], doors = [], busy = false;
  let el = {}, wake = () => {};

  /* ---------- framing ----------
     THREE's camera.fov is VERTICAL. Framing by it meant a 1440x900 desktop
     saw 104 degrees of the hall while a 390px phone saw FORTY-ONE — the same
     room, cropped to a keyhole. You arrive in a museum lobby; the first frame
     has to read as the whole room. So the rest value is stated as the
     HORIZONTAL angle and converted per aspect, with a vertical cap so a tall
     screen widens toward architecture and never tips into fisheye. */
  const H_REST = 116;          /* horizontal degrees at rest — a 15mm look */
  const V_CAP = 103;           /* vertical ceiling: past this the pano smears */
  const FOV_MIN = 64;          /* texel floor: the pano is 4096px around */
  let FOV_REST = 78, FOV_MAX = 92;
  const vFromH = (h, a) => 2 * Math.atan(Math.tan(deg(h) / 2) / a) * 180 / Math.PI;
  function reframe() {
    const a = innerWidth / innerHeight;
    FOV_REST = Math.min(V_CAP, vFromH(H_REST, a));
    FOV_MAX = Math.min(V_CAP + 7, vFromH(H_REST + 14, a));
    fov = Math.max(FOV_MIN, Math.min(FOV_MAX, fov));
  }

  const $ = (s, r = document) => r.querySelector(s);
  const deg = d => d * Math.PI / 180;

  /* ---------- boot ---------- */
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === 'en' ? 'ltr' : 'rtl';
  const CONTENT = l => 'tour-content' + (l === 'en' ? '.en' : '') + '.json?v=1786780000';
  fetch(CONTENT(LANG)).then(r => r.ok ? r.json() : Promise.reject())
    .catch(() => fetch(CONTENT('he')).then(r => r.json()))
    .then(cfg => {
    CFG = cfg;
    cfg.departments.forEach(d => ROOMS[d.id] = d);
    buildDOM();
    loadThree().then(() => { start(); mountAgent(); });
  });

  const loadThree = () => new Promise(res => {
    if (window.THREE) return res();
    const s = document.createElement('script'); s.src = THREE_SRC; s.onload = () => res(); document.head.appendChild(s);
  });

  /* ---------- DOM ---------- */
  function buildDOM() {
    const root = document.createElement('div');
    root.className = 'cw';
    root.innerHTML = `
      <canvas class="cw-canvas"></canvas>
      <div class="cw-spots"></div>
      <div class="cw-rail" hidden aria-label="Corewise" role="region"></div>
      <div class="cw-veil"></div>
      <div class="cw-grade" aria-hidden="true"></div>
      <div class="cw-motes"></div>
      <div class="cw-title"><span></span></div>
      <div class="cw-sky" aria-hidden="true"><div class="cw-sky__in"></div></div>
      <div class="cw-lookup"><i>⌃</i><span>${T('lookup')}</span></div>
      <header class="cw-top">
        <span class="cw-brand">corewise</span>
        <span class="cw-room"></span>
        <button class="cw-home" hidden aria-label="${T('homeAria')}">${T('home')}</button>
        <span class="cw-prog"></span>
        <span class="cw-tools">
          <button class="cw-lang" data-lang-toggle type="button" lang="${LANG === 'en' ? 'he' : 'en'}" dir="${LANG === 'en' ? 'rtl' : 'ltr'}" aria-label="${T('langAria')}">${T('langBtn')}</button>
          <button class="cw-snd" title="${T('snd')}" aria-label="${T('snd')}" aria-pressed="true"><i></i><i></i><i></i></button>
          <button class="cw-gyro" title="${T('gyro')}" aria-label="${T('gyroAria')}">${ICON.gyro}</button>
          <button class="cw-map" title="${T('map')}" aria-label="${T('map')}">${ICON.map}</button>
        </span>
      </header>
      <div class="cw-hint">${T('hint')}</div>
      <div class="cw-tour" hidden>
        <button class="cw-tour__go" aria-label="${T('tourGo')}"></button>
      </div>
      <div class="cw-pad">
        <button data-k="left" aria-label="${T('padL')}">←</button>
        <button data-k="up" class="cw-pad__up" aria-label="${T('padU')}">↑</button>
        <button data-k="right" aria-label="${T('padR')}">→</button>
      </div>
      <div class="cw-compass"><div class="cw-compass__ring"></div></div>
      <a class="cw-wa" href="${WA}" target="_blank" rel="noopener" title="${T('waTitle')}">
        <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.6 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.9.9.9-4.8-.3-.4C5 17.8 4.4 16 4.4 15 4.4 8.9 9.9 4.4 16 4.4S27.6 8.9 27.6 15 22.1 24.8 16 24.8zm6.5-8.3c-.4-.2-2.1-1-2.4-1.1-.3-.1-.6-.2-.8.2-.2.4-.9 1.1-1.1 1.3-.2.2-.4.2-.8.1-2.1-.9-3.5-2.7-3.7-3.1-.2-.4 0-.6.2-.8l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.5 0-.6-.1-.2-.8-2-1.1-2.7-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.5-.3.4-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.7 5.9 5.1 3.5 1.4 3.5.9 4.1.9.6-.1 2.1-.8 2.4-1.7.3-.8.3-1.6.2-1.7-.1-.2-.3-.3-.7-.5z"/></svg>
        <span>${T('waLabel')}</span>
      </a>
      <button class="cw-assist-open" hidden aria-label="${T('assistOpen')}" aria-expanded="false">
        <span class="cw-agent">${ICON.chat}</span><span class="cw-assist-open__l">${T('assistOpen')}</span>
      </button>
      <div class="cw-assist" hidden role="dialog" aria-modal="false" aria-label="${T('assistTitle')}">
        <div class="cw-assist__head">
          <span class="cw-assist__title">${T('assistTitle')}</span>
          <button class="cw-assist__x" aria-label="${T('assistClose')}">✕</button>
        </div>
        <div class="cw-assist__log"><p class="cw-assist__greet">${T('assistGreet')}</p></div>
        <form class="cw-assist__row">
          <input class="cw-assist__in" type="text" autocomplete="off" placeholder="${T('assistPlaceholder')}" maxlength="500">
          <button class="cw-assist__go" type="submit" aria-label="${T('assistSend')}">↑</button>
        </form>
      </div>
      <div class="cw-scrim" hidden></div>
      <div class="cw-axis" hidden aria-modal="true" role="dialog">
        <div class="cw-axis__wall">
          <button class="cw-axis__x">${T('home')}</button>
          <div class="cw-axis__media"></div>
          <div class="cw-axis__bubble"></div>
          <div class="cw-axis__feats"></div>
        </div>
      </div>
      <div class="cw-card" hidden></div>
      <div class="cw-finale" hidden></div>
      <div class="cw-mapui" style="display:none"><div class="cw-mapui__in"><h3>${T('map')}</h3><div class="cw-mapui__grid"></div><button class="cw-mapui__x">${T('mapClose')}</button></div></div>
      <div class="cw-load"><span></span></div>`;
    document.body.appendChild(root);
    el = {
      root, canvas: $('.cw-canvas', root), spots: $('.cw-spots', root), veil: $('.cw-veil', root), title: $('.cw-title', root), motes: $('.cw-motes', root), sky: $('.cw-sky', root), skyIn: $('.cw-sky__in', root), lookup: $('.cw-lookup', root),
      room: $('.cw-room', root), prog: $('.cw-prog', root), hint: $('.cw-hint', root), card: $('.cw-card', root), finale: $('.cw-finale', root), scrim: $('.cw-scrim', root), wa: $('.cw-wa', root),
 load: $('.cw-load', root), mapui: $('.cw-mapui', root), snd: $('.cw-snd', root),
      home: $('.cw-home', root), axis: $('.cw-axis', root), tour: $('.cw-tour', root),
      rail: $('.cw-rail', root),
      assistOpenBtn: $('.cw-assist-open', root), assist: $('.cw-assist', root), assistLog: $('.cw-assist__log', root),
      assistIn: $('.cw-assist__in', root), assistForm: $('.cw-assist__row', root),
    };
    $('.cw-tour__go', root).onclick = () => tourOn ? stopTour() : startTour();
    paintTourBtn();          /* the markup ships the button empty */
    /* the visitor taking the wheel ends the guided pass — any real input */
    ['pointerdown', 'keydown', 'wheel'].forEach(ev => addEventListener(ev, e => {
      if (!tourOn) return;
      if (e.target && e.target.closest && e.target.closest('.cw-tour')) return;
      stopTour();
    }, { passive: true }));
    /* "חזרה ללובי" is never something you look for: one button, top bar,
       whenever you are anywhere but the hall. It closes an open wall first,
       and only then walks you home. */
    el.home.onclick = () => { if (tourOn) stopTour(); if (!el.axis.hidden) closeAxis(); else if (cur !== 'lobby') go('lobby'); };
    $('.cw-axis__x', root).onclick = closeAxis;
    el.axis.addEventListener('click', e => { if (e.target === el.axis) closeAxis(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !el.axis.hidden) closeAxis(); });

    el.snd.classList.toggle('is-off', !sndOn);
    el.snd.setAttribute('aria-pressed', sndOn ? 'true' : 'false');
    el.snd.onclick = sndToggle;
    /* browsers refuse audio before a gesture — so the first touch starts it */
    addEventListener('pointerdown', sndBoot);
    addEventListener('keydown', sndBoot);

    $('.cw-scrim', root).onclick = closePanels;
    $('.cw-gyro', root).onclick = toggleGyro;
    $('.cw-lang', root).onclick = () => setLang(LANG === 'en' ? 'he' : 'en');
    $('.cw-map', root).onclick = () => openMap(true);
    $('.cw-mapui__x', root).onclick = () => openMap(false);
    $('.cw-assist-open', root).onclick = () => openAssist(el.assist.hidden);
    $('.cw-assist__x', root).onclick = () => openAssist(false);
    $('.cw-assist__row', root).addEventListener('submit', e => {
      e.preventDefault();
      const v = el.assistIn.value;
      el.assistIn.value = '';
      assistSend(v);
    });

    /* look controls */
    const c = el.canvas;
    c.addEventListener('pointerdown', e => { drag = true; establishing = false; px = e.clientX; py = e.clientY; lonVel = latVel = 0; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', e => {
      if (!drag) return;
      const dLon = (px - e.clientX) * 0.17, dLat = (e.clientY - py) * 0.17;
      lon += dLon; lat = Math.max(-70, Math.min(70, lat + dLat));
      /* remember how fast the hand was moving — release keeps that spin */
      lonVel = lonVel * 0.5 + dLon * 0.5;
      latVel = latVel * 0.5 + dLat * 0.5;
      px = e.clientX; py = e.clientY;
    });
    c.addEventListener('pointerup', () => { drag = false; });
    c.addEventListener('pointercancel', () => { drag = false; lonVel = latVel = 0; });
    /* FOV_MIN is 64, not 58: the pano is 4096px around — at 58 degrees on a
       desktop monitor the GPU upsamples it ~2.2x and the zoom goes soft. 64
       keeps the lean-in without ever showing the texture its own ceiling. */
    addEventListener('wheel', e => {
      establishing = false;
      fov = Math.max(FOV_MIN, Math.min(FOV_MAX, fov + e.deltaY * 0.04));
    }, { passive: true });
    const K = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
    addEventListener('keydown', e => {
      if (e.key === 'Escape') { closePanels(); openMap(false); return; }
      /* typing in the assistant is typing, not steering */
      if (e.target && e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
      /* In the lobby the left and right arrows step the rail: the row is
         the thing on screen, and a keyboard should turn through it the way
         a thumb does. Enter opens the focused card. Looking around still
         has A/D and the mouse. */
      if (cur === 'lobby' && axisScreens.length && el.axis.hidden) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          if (e.repeat) return;
          /* Purely physical, and deliberately NOT mirrored for Hebrew: the
             right arrow brings the card sitting on the right into focus. The
             row is a row of objects in space, not a line of text, so mirroring
             it by document direction just made the key disagree with the
             screen. */
          railTo(railAt + (e.key === 'ArrowRight' ? 1 : -1), 480);
          stopTour();
          return;
        }
        if (e.key === 'Enter' && document.activeElement === document.body) {
          const a = axisScreens[railAt];
          if (a && a.el) { e.preventDefault(); a.el.click(); return; }
        }
      }
      const k = K[e.key] || K[e.key.toLowerCase()];
      if (k) { keys[k] = true; keys.shift = e.shiftKey; e.preventDefault(); }
    });
    addEventListener('keyup', e => {
      const k = K[e.key] || K[e.key.toLowerCase()];
      if (k) { keys[k] = false; keys.shift = e.shiftKey; }
    });
    addEventListener('blur', () => { keys.left = keys.right = keys.up = keys.down = false; });
    /* on-screen pad (mobile + mouse) */
    const pad = $('.cw-pad', root);
    pad.querySelectorAll('button').forEach(b => {
      const k = b.dataset.k;
      const on = e => { e.preventDefault(); keys[k] = true; };
      const off = () => keys[k] = false;
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointerleave', off);
      b.addEventListener('pointercancel', off);
    });
    pump();
    addEventListener('resize', onResize);

    /* The chrome recedes when you stop touching it. A museum hall does not
       keep its signage lit in your face while you look at the room — and
       everything here is one gesture from coming back. */
    let wakeAt = 0;
    wake = () => {
      const t = performance.now();
      if (t - wakeAt < 400 && !el.root.classList.contains('is-idle')) return;
      wakeAt = t;
      el.root.classList.remove('is-idle');
      clearTimeout(wake._t);
      wake._t = setTimeout(() => el.root.classList.add('is-idle'), 4500);
    };
    ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'].forEach(e =>
      addEventListener(e, wake, { passive: true }));
    wake();

    /* The hint has one job: teach the drag. The moment it is obeyed it is
       clutter, so it leaves — and it never greets the same visitor twice. */
    addEventListener('pointerdown', taught); addEventListener('keydown', taught);
  }
  let hintDone = false, hintT = 0;
  function taught() {
    hintDone = true;
    clearTimeout(hintT);
    if (el.hint) el.hint.classList.remove('show');
    removeEventListener('pointerdown', taught); removeEventListener('keydown', taught);
  }

  function start() {
    seedMotes();
    initGL();
    go("lobby", true);
  }

  /* ---------- GL ---------- */
  function initGL() {
    renderer = new THREE.WebGLRenderer({ canvas: el.canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    scene = new THREE.Scene();
    reframe();
    fov = FOV_REST;
    camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.1, 120);
    const geo = new THREE.SphereGeometry(60, 72, 52); geo.scale(-1, 1, 1);
    sphereA = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true }));
    sphereB = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    scene.add(sphereA); scene.add(sphereB);
    tick();
  }
  function onResize() {
    if (!renderer) return;
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    const wasRest = Math.abs(fov - FOV_REST) < 0.6;
    reframe();
    if (wasRest) fov = FOV_REST;      /* a rotated phone re-frames, not re-crops */
    renderer.setSize(innerWidth, innerHeight);
  }
  let lonVel = 0, latVel = 0;
  function tick() {
    rafId = requestAnimationFrame(tick);
    /* flick inertia: the released spin decays instead of stopping dead —
       higher-value on touch, where the flick is the native gesture */
    if (!drag && (Math.abs(lonVel) > 0.02 || Math.abs(latVel) > 0.02)) {
      lon += lonVel; lat = Math.max(-70, Math.min(70, lat + latVel));
      lonVel *= 0.92; latVel *= 0.92;
    }
    /* a room with a TV keeps a STILL camera — the idle drift that makes
       the other rooms feel alive is exactly what crawls a film out of
       frame while you watch it */
    if (!drag && !gyro && !busy && !reduce && tvYaw == null) lon += 0.012;
    camera.fov += (fov - camera.fov) * 0.1; camera.updateProjectionMatrix();
    const phi = deg(90 - lat), th = deg(lon);
    camera.lookAt(Math.sin(phi) * Math.sin(th), Math.cos(phi), -Math.sin(phi) * Math.cos(th));
    renderer.render(scene, camera);
    project();
    paintSky();
    if (el.motes) el.motes.style.transform = 'translate3d(' + (-lon * 0.55 % 100).toFixed(1) + 'px,' + (lat * 0.5).toFixed(1) + 'px,0)';
    /* Seven doors ringed the lobby at identical weight, each with its own
       bouncing arrow — seven signs shouting the same volume. A hall does not
       do that: the doorway you are walking toward is the one you read. Weight
       follows the gaze, and only the faced door keeps its arrow. */
    doors.forEach((d, i) => {
      const rel = Math.abs(((doorYaws[i] - lon) % 360 + 540) % 360 - 180);
      d.el.classList.toggle('is-facing', rel < 26);
      d.el.classList.toggle('is-far', rel > 46);
    });
    tendScreens();
    if (cur === 'lobby' && axisScreens.length && !drag && !tourOn && el.axis.hidden) {
      /* the parallax is a fraction of the card's bearing, and the fraction
         has to respect the field of view: on a 116-degree desktop 19 degrees
         is a nod, on a 60-degree phone it walks the wordmark off the edge */
      const target = ((axisScreens[railAt] || {}).yaw || 0) * (innerWidth <= 860 ? 0.04 : 0.13);
      lon += (target - lon) * 0.05;
    }
    if (compassDots.length) {
      compassDots.forEach(c => {
        const rel = ((c.yaw - lon) % 360 + 540) % 360 - 180;
        c.el.style.transform = 'translate(-50%,-50%) rotate(' + rel + 'deg) translateY(-20px)';
        c.el.classList.toggle('near', Math.abs(rel) < 26);
      });
    }
  }
  let compassDots = [];
  let tvYaw = null;
  let axisScreens = [];
  /* the screen nearest to where you look plays; the rest hold their poster.
     Hysteresis so a screen at the edge does not stutter on/off. */
  function tendScreens() {
    if (!axisScreens.length) return;
    axisScreens.forEach((a, i) => {
      const on = i === railAt && el.axis.hidden && Math.abs(railPos - railAt) < 0.5;
      a.el.classList.toggle('is-focus', i === railAt);
      if (!a.v) return;
      if (on && a.v.paused) a.v.play().catch(() => {});
      else if (!on && !a.v.paused) a.v.pause();
    });
  }
  function buildCompass(id) {
    const ring = $('.cw-compass__ring', el.root);
    ring.innerHTML = '';
    compassDots = [];
    if (id !== 'lobby') { el.root.querySelector('.cw-compass').style.display = 'none'; return; }
    el.root.querySelector('.cw-compass').style.display = 'block';
    axisScreens.forEach(a => {
      const d = document.createElement('i');
      d.className = 'cw-compass__d';
      ring.appendChild(d);
      compassDots.push({ el: d, yaw: a.yaw });
    });
  }
  function project() {
    const hw = innerWidth / 2, hh = innerHeight / 2;
    for (const s of spots.concat(doors)) {
      const p = s.v.clone().project(camera);
      const back = p.z > 1;
      /* blank, not 'flex' — product windows are display:block and were being
         forced into a flex box by the old inline value */
      s.el.style.display = back ? 'none' : '';
      if (!back) { s.el.style.left = (p.x * hw + hw) + 'px'; s.el.style.top = (-p.y * hh + hh) + 'px'; }
    }
  }

  /* ---------- rooms ---------- */
  const ORDER = ['lobby', 'measure', 'vision', 'school', 'stage', 'ai', 'apps', 'video', 'ar', 'team'];
  /* THE 15.8 MODEL. The lobby is not a hub of doors any more — it is one
     hall with five big screens, one per business axis. A screen opens in
     place (film + abstract + features); the rooms behind it are the deeper
     dive, reached from inside the open wall. WINGS is the ring the in-room
     side doors walk around; it no longer feeds the lobby. */
  const WINGS = ['measure', 'vision', 'school', 'stage', 'ai', 'apps', 'video', 'ar', 'team'];
  /* accents alternating around the ring — terracotta and olive, so adjacent
     wings never light their windows the same way; the vision lab wears its
     own LiDAR teal, the one room whose light comes from the point-cloud */
  const ACCENT = { lobby: '#6E9B0E', video: '#B4530A', apps: '#6E9B0E', ai: '#B4530A', vision: '#26d07c', measure: '#26d07c', ar: '#B4530A', stage: '#6E9B0E', school: '#B4530A', team: '#6E9B0E' };
  /* room -> the lobby yaw of the SCREEN it belongs to, so coming back you
     face the wall you left through */
  const BEARING = { ai: -108, apps: -108, video: -108, measure: -36, vision: 36, school: 108, stage: 108, ar: 180, team: 180 };
  /* which axis wall opens each room's screen (for the "deeper dive" door) */
  const AXIS_OF = { ai: 'ai', apps: 'ai', video: 'ai', measure: 'measure', vision: 'vision', school: 'pedagogy', stage: 'pedagogy', ar: 'ar' };

  function doorsFor(id) {
    if (id === 'lobby') {
      /* the hall has screens, not doors. The one door left is PEOPLE — the
         lounge — under the Before/After screen on the back wall. */
      return [{ to: 'team', yaw: 180, pitch: -12, home: true, label: T('lounge') }];
    }
    /* inside a wing: the way back to the lobby sits opposite its own bearing,
       and the two neighbouring wings are reachable to either side. */
    const i = WINGS.indexOf(id);
    const prev = WINGS[(i - 1 + WINGS.length) % WINGS.length];
    const next = WINGS[(i + 1) % WINGS.length];
    return [
      { to: 'lobby', yaw: 180, pitch: -6, label: T('home'), home: true },
      { to: prev, yaw: -75, pitch: -6 },
      { to: next, yaw: 75, pitch: -6, next: true },
    ];
  }

  /* Walk toward a door: first TURN to face it, then walk straight ahead into it. */
  function walkTo(doorYaw, done) {
    if (reduce) { done(); return; }
    const lon0 = lon;
    const rel = ((doorYaw - lon0) % 360 + 540) % 360 - 180;   /* signed turn needed */
    /* Measured: 3.86s from clicking a door to standing in the next room —
       900ms turn, 2200ms walk, 700ms crossfade. The pano is already fetching
       in parallel, so every one of those milliseconds is choreography, and
       past about a second the walk stops reading as movement and starts
       reading as waiting. Halved. The turn still scales with how far you have
       to swing round, the stride sway still lands twice, the fov still creeps
       — same beats, played at a pace someone would actually sit through. */
    const TURN = Math.min(520, 170 + Math.abs(rel) * 2.2);   /* longer turn for wider angles */
    const WALK = 950;
    const easeIO = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const t0 = performance.now();

    /* phase 1: pivot the view to face the door */

    const turn = () => {
      const k = Math.min(1, (performance.now() - t0) / TURN);
      lon = lon0 + rel * easeIO(k);            /* face the door fully */
      if (k < 1) return requestAnimationFrame(turn);
      lon = lon0 + rel;
      const t1 = performance.now();
      const fov0 = fov, lat0 = lat;
      const fwd = () => {
        const k2 = Math.min(1, (performance.now() - t1) / WALK);
        fov = fov0 - 12 * easeIO(k2);          /* world creeps closer as he advances */
        /* footsteps: a ±1.2 degree sway, two strides across the walk — the
           one cue that turns a camera dolly into a person advancing */
        lat = lat0 + Math.sin(k2 * Math.PI * 4) * 1.2 * Math.sin(k2 * Math.PI);
        if (k2 < 1) return requestAnimationFrame(fwd);
        fov = fov0; lat = lat0;
        done();
      };
      requestAnimationFrame(fwd);
    };
    requestAnimationFrame(turn);
  }

  /* ---------- keyboard / on-screen movement (game style) ---------- */
  const keys = {};
  function nearestDoor() {
    let best = null, bestAbs = 999;
    doors.forEach((d, i) => {
      const yaw = doorYaws[i];
      const rel = Math.abs(((yaw - lon) % 360 + 540) % 360 - 180);
      if (rel < bestAbs) { bestAbs = rel; best = d; }
    });
    return bestAbs < 34 ? best : null;   /* only if you're actually facing it */
  }
  function pump() {
    requestAnimationFrame(pump);
    if (busy || !cur) return;
    const sp = (keys.shift ? 2.4 : 1.35);
    if (keys.left) lon += sp;
    if (keys.right) lon -= sp;
    if (keys.up) { establishing = false; fov = Math.max(FOV_MIN, fov - 0.55); }
    else if (keys.down) { establishing = false; fov = Math.min(FOV_MAX, fov + 0.55); }
    /* holding forward while facing a door walks you through it */
    if (keys.up) {
      const d = nearestDoor();
      if (d) { fwdHold += 1; if (fwdHold > 34) { fwdHold = 0; d.el.click(); } }
      else fwdHold = 0;
    } else fwdHold = 0;
  }
  let fwdHold = 0, doorYaws = [];

  /* Panos load ONCE and stay decoded. The old flow loaded reactively inside
     enter() — so the 2.5s walk animation played out entirely in the room you
     were leaving, then a hard stop and a spinner while the network finally
     started. Now the fetch fires the instant a door is clicked (in parallel
     with the walk), revisits hit the cache, and after each arrival the
     adjacent rooms prefetch on idle. Capped at 5 decoded panos so a long
     ring-walk doesn't hold ~200MB of textures on a phone. */
  const panoCache = new Map();               /* id -> Promise<THREE.Texture> */
  function loadPano(id) {
    let p = panoCache.get(id);
    if (p) return p;
    p = new Promise((res, rej) =>
      new THREE.TextureLoader().load('world2-build/pano_' + id + '.webp', tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        res(tex);
      }, undefined, rej));
    panoCache.set(id, p);
    /* 3 decoded panos on a phone, 5 on desktop: a 4096 texture is ~33MB of
       GPU memory, and five of them mid-ring-walk is real pressure on a
       2GB Android — context-loss territory */
    const CAP = matchMedia('(max-width: 860px)').matches ? 3 : 5;
    if (panoCache.size > CAP) {
      for (const [k, v] of panoCache) {
        if (k === cur || k === id) continue;
        panoCache.delete(k);
        v.then(t => t.dispose()).catch(() => {});
        break;
      }
    }
    return p;
  }
  function prefetchNeighbours(id) {
    /* Only the doors the visitor is actually FACING. Prefetching every
       door pulled the entire 2.6MB campus within seconds of landing on
       the lobby — most visitors see one or two rooms, and the cache cap
       then evicted and re-fetched on a full walk (4.85MB for a 2.6MB
       site). Two nearest bearings cover the likely next click; the click
       itself already loads in parallel with the walk either way. */
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 900));
    doorsFor(id)
      .map(dr => ({ dr, off: Math.abs(((dr.yaw - lon) % 360 + 540) % 360 - 180) }))
      .sort((a, b) => a.off - b.off)
      .slice(0, 2)
      .forEach(({ dr }) => idle(() => { if (!busy) loadPano(dr.to); }));
  }

  function go(id, first, doorYaw) {
    if (busy || !ROOMS[id]) return;
    busy = true;
    const d = ROOMS[id];
    closePanels();
    loadPano(id);                    /* the walk and the fetch share the wait */
    if (!first && doorYaw != null) { walkTo(doorYaw, () => enter(id, d, first)); return; }
    enter(id, d, first);
  }

  function enter(id, d, first) {
    el.load.hidden = false;
    loadPano(id).then(tex => {
      if (first) {
        sphereA.material.map = tex; sphereA.material.opacity = 1; sphereA.material.needsUpdate = true;
        finish(id, d, true);
      } else {
        sphereB.material.map = tex; sphereB.material.opacity = 0; sphereB.material.needsUpdate = true;
        el.veil.classList.add('on');           /* walk-forward feel */
        const t0 = performance.now(), dur = reduce ? 1 : 380;
        const step = () => {
          const k = Math.min(1, (performance.now() - t0) / dur);
          sphereB.material.opacity = k; sphereA.material.opacity = 1 - k;
          fov = FOV_REST - 14 * Math.sin(k * Math.PI);   /* push in, ease out */
          if (k < 1) requestAnimationFrame(step);
          else {
            const tmp = sphereA; sphereA = sphereB; sphereB = tmp;
            sphereB.material.map = null;
            el.veil.classList.remove('on');
            fov = FOV_REST;
            finish(id, d, false);
          }
        };
        requestAnimationFrame(step);
      }
    }).catch(() => {
      /* a failed fetch must not poison the cache for the next attempt */
      panoCache.delete(id);
      busy = false; el.load.hidden = true;
    });
  }

  function finish(id, d, first) {
    const from = cur;
    cur = id;
    el.load.hidden = true;
    el.room.textContent = d.title;
    /* the hall's horizon sits low in its pano — level with it you land on a
       floor. A few degrees up and the frame balances: marble at the bottom
       edge, the lit ceiling at the top, the wordmark wall whole in between. */
    lat = ENTRY_LAT[id] || 0;
    /* keep your bearings: entering a wing you face into it; returning to the
       lobby you arrive looking back at the door you came out of. */
    lon = (id === 'lobby' && from && BEARING[from] != null) ? BEARING[from] : 0;
    el.root.style.setProperty('--cw-acc', ACCENT[id] || ACCENT.lobby);
    /* The WhatsApp button follows you from room to room, so it should know
       which room it was pressed in. A message that already says what the
       visitor was looking at saves them writing the one sentence most people
       never bother to write — and it reaches Lidor with the context attached
       instead of a bare "היי". */
    el.wa.href = WA + (d.wa ? '?text=' + encodeURIComponent(d.wa) : '');
    el.home.hidden = id === 'lobby';
    el.tour.hidden = id !== 'lobby';
    /* the assistant only stands in the lobby for now; leaving the room
       closes it rather than leaving it orphaned open behind a screen */
    el.assistOpenBtn.hidden = id !== 'lobby';
    if (id !== 'lobby') openAssist(false);
    paintTourDots();
    visited.add(id);
    buildMarkers(d);
    buildSky(d);
    buildCompass(id);
    paintProgress();
    /* The finale is EARNED, not tripped. team is one door off the lobby, so
       a visitor could open it first and be told "סוף הסיור, ביקרת ב-1
       מחלקות" before seeing anything — a climax firing at the opening
       scene. Now it waits until most of the campus is genuinely seen, and
       plays once per session; walking back through team later just shows
       the room. */
    if (id === 'team' && !finaleShown && visited.size >= 5) {
      finaleShown = true;
      showFinale();
    }
    busy = false;
    el.hint.classList.toggle('show', id === 'lobby' && !hintDone);
    if (id === 'lobby' && !hintDone) { clearTimeout(hintT); hintT = setTimeout(taught, 9000); }
    /* the ceiling nudge waits its turn: at t=0 it was just one more thing
       moving in a frame that already had eleven */
    lookArm = false;
    clearTimeout(finish._la);
    finish._la = setTimeout(() => lookArm = true, 3200);
    announce(d.title);
    wake();                          /* the idle clock starts on arrival */
    if (first) establish();
    prefetchNeighbours(id);          /* the likely next hops warm on idle */
  }
  let finaleShown = false;
  const ENTRY_LAT = { lobby: 7 };

  /* The entrance breathes open. It arrives a touch wider than it rests and
     settles into frame over two seconds — a camera finding its shot, not a
     zoom that snatches the room back from you. It ENDS wide: the establishing
     frame is the entrance, not a trailer for it. Any input takes the wheel. */
  let establishing = false;
  function establish() {
    if (reduce) return;
    const rest = fov, OVER = 11, DUR = 2200;
    const t0 = performance.now();
    const ease = k => 1 - Math.pow(1 - k, 3);
    establishing = true;
    camera.fov = Math.min(FOV_MAX + OVER, rest + OVER);
    const step = () => {
      if (!establishing) { fov = rest; return; }
      const k = Math.min(1, (performance.now() - t0) / DUR);
      fov = rest + OVER * (1 - ease(k));
      if (k < 1) requestAnimationFrame(step);
      else { fov = rest; establishing = false; }
    };
    requestAnimationFrame(step);
  }

  const seen = new Set(), visited = new Set();   /* discovered hotspots + rooms walked */

  /* The last wing closes the loop: what you saw, then three ways to start talking. */
  function showFinale() {
    const rooms = visited.size, found = seen.size;
    const line = T('finLine')(rooms, found);
    const paths = T('finPaths');
    const box = el.finale;
    box.innerHTML =
      '<button class="cw-fin__x" aria-label="' + T('close') + '">✕</button>' +
      '<span class="cw-fin__eyebrow">' + T('finEyebrow') + '</span>' +
      '<h3>' + T('finTitle') + '</h3>' +
      '<p>' + line + T('finAsk') + '</p>' +
      '<div class="cw-fin__paths">' + paths.map(p =>
        '<a href="https://wa.me/972507594477?text=' + encodeURIComponent(p[2]) + '" target="_blank" rel="noopener">' +
        '<b>' + p[0] + '</b><span>' + p[1] + '</span></a>').join('') + '</div>';
    box.querySelector('.cw-fin__x').onclick = closePanels;
    el.scrim.hidden = false;
    box.hidden = false;
    duck(true);
  }
  function roomProgress(d) {
    const list = d.hotspots || [];
    const got = list.filter((h, i) => seen.has(d.id + '|' + i)).length;
    return { got, total: list.length };
  }
  function paintProgress() {
    const d = ROOMS[cur]; if (!d) return;
    const { got, total } = roomProgress(d);
    /* "גילית 0 מתוך 3" greeted every arrival with a score of nothing — a quiz
       the visitor never entered. The counter now earns its place: it appears
       the moment there is something to count. Narrow screens collapse it
       to "1/4" so the room name keeps its room. */
    el.prog.innerHTML = total && got
      ? '<span class="cw-prog__l">' + T('progA') + '</span>' + got +
        '<span class="cw-prog__l">' + T('progB') + '</span><span class="cw-prog__s">/</span>' + total
      : '';
    el.prog.classList.toggle('done', total > 0 && got === total);
    /* completing a room lights the way onward */
    el.root.classList.toggle('room-done', total > 0 && got === total);
  }

  /* the short latin handle for the chip: "TinkerLab — Workshop OS" → "TinkerLab" */
  const shortName = h => h.short || String(h.title).split(/\s+[—–-]\s+/)[0].trim();
  /* one line of teaser under the image — a full paragraph would drown the room */
  const teaser = h => {
    if (h.tagline) return h.tagline;
    const t = String(h.text || '').split(/(?<=[.!?])\s/)[0].trim();
    return t.length > 66 ? t.slice(0, 64).trim() + '…' : t;
  };

  function buildMarkers(d) {
    el.spots.innerHTML = '';
    spots = []; doors = []; tvYaw = null; axisScreens = [];
    railReset(d.id === 'lobby');
    let prod = 0;
    (d.hotspots || []).forEach((h, i) => {
      const kind = h.kind || 'story';
      const b = document.createElement('button');
      const key = d.id + '|' + i;          /* index, not title: titles change with language */
      b.className = 'cw-spot is-' + kind + (seen.has(key) ? ' is-seen' : '');
      b.style.setProperty('--ph', (Math.random() * 2).toFixed(2) + 's');   /* breathe out of sync */
      /* AN AXIS SCREEN. Five of these ring the hall. Each is a real screen
         on the wall — bezel, chip, glass — that shows its film only while it
         is the one you are facing (the others rest on a poster), so five
         screens cost the phone one video. Click: the wall opens. */
      if (kind === 'axis' || kind === 'team' || (kind === 'tv' && d.id === 'lobby' && h.video)) {
        railAdd(h, kind === 'tv');
        tvYaw = 0;                           /* screens want a still camera */
        return;
      }
      if (kind === 'tv' && h.video) {
        b.innerHTML =
          '<span class="cw-spot__frame">' +
            '<span class="cw-spot__chip">' + esc(h.title || 'COREWISE TV') + ' · LIVE</span>' +
            '<span class="cw-spot__glass">' +
              '<video src="' + h.video + '" autoplay muted loop playsinline></video>' +
              '<span class="cw-spot__tag">' + T('tvOn') + '</span>' +
            '</span>' +
            '<i class="cw-spot__anchor" aria-hidden="true"></i>' +
          '</span>';
        b.onclick = () => {
          const v = b.querySelector('video'), tag = b.querySelector('.cw-spot__tag');
          v.muted = !v.muted;
          if (!v.muted) { v.play().catch(() => {}); duck(true); } else duck(false);
          tag.textContent = v.muted ? T('tvOn') : T('tvOff');
        };
        el.spots.appendChild(b);
        spots.push({ el: b, v: vec(h.yaw, h.pitch) });
        tvYaw = h.yaw;
        return;
      }
      /* THE SIDE SCREEN — a 6-episode zapper with sound and a theatre mode.
         The tv branch plays a local file through <video>; YouTube needs its
         own player. Driven through the iframe API rather than a raw embed so
         the panel owns mute, volume and episode switching without reloading
         the video and losing your place mid-scene.
         Muted on load: browsers refuse autoplay with sound. */
      if (kind === 'yt' && (h.episodes || h.yt)) {
        const eps = h.episodes && h.episodes.length
          ? h.episodes
          : [{ n: 1, id: String(h.yt).replace(/^.*[?&]v=|^.*youtu\.be\//, '').slice(0, 11) }];
        /* a <button> cannot legally hold the episode buttons, so the panel
           itself is a group and every control inside it is its own button */
        const w = document.createElement('div');
        w.className = b.className;
        w.setAttribute('role', 'group');
        w.setAttribute('aria-label', h.title || 'video');
        w.style.setProperty('--ph', b.style.getPropertyValue('--ph'));
        w.innerHTML =
          '<span class="cw-spot__frame">' +
            '<span class="cw-spot__chip"></span>' +
            '<span class="cw-spot__glass"><span class="cw-yt-slot"></span></span>' +
            '<span class="cw-yt-zap">' +
              '<button class="cw-yt-nav" data-d="-1" aria-label="פרק קודם">‹</button>' +
              '<span class="cw-yt-dots">' +
                eps.map((e, k) => '<button class="cw-yt-dot" data-i="' + k + '" ' +
                  'aria-label="פרק ' + (e.n || k + 1) + '">' + (e.n || k + 1) + '</button>').join('') +
              '</span>' +
              '<button class="cw-yt-nav" data-d="1" aria-label="פרק הבא">›</button>' +
            '</span>' +
            '<span class="cw-yt-bar">' +
              '<button class="cw-yt-snd" aria-label="' + T('ytUnmute') + '">' + T('ytSnd') + '</button>' +
              '<button class="cw-yt-big" aria-label="' + T('ytBigAria') + '">' + (coarse ? T('ytWatch') : T('ytBig')) + '</button>' +
            '</span>' +
            (h.blurb ? '<span class="cw-yt-note">' + esc(h.blurb) + '</span>' : '') +
            '<i class="cw-spot__anchor" aria-hidden="true"></i>' +
          '</span>';
        const chip = w.querySelector('.cw-spot__chip');
        const dots = [...w.querySelectorAll('.cw-yt-dot')];
        const snd = w.querySelector('.cw-yt-snd'), big = w.querySelector('.cw-yt-big');
        let at = 0, player = null, loud = false;
        const label = () => {
          const e = eps[at];
          chip.textContent = (h.title || 'VIDEO') + ' · EP ' + (e.n || at + 1) + '/' + eps.length;
          dots.forEach((d, k) => d.classList.toggle('is-on', k === at));
        };
        const play = i => {
          at = (i + eps.length) % eps.length;
          label();
          if (player && player.loadVideoById) player.loadVideoById(eps[at].id);
        };
        label();
        ytAPI().then(() => {
          player = new YT.Player(w.querySelector('.cw-yt-slot'), {
            videoId: eps[0].id,
            playerVars: { autoplay: 1, mute: 1, rel: 0, modestbranding: 1, playsinline: 1 },
            events: { onReady: e => { e.target.mute(); e.target.playVideo(); } },
          });
          w.__player = player;                       /* QA handle */
        });
        w.querySelectorAll('.cw-yt-nav').forEach(n =>
          n.onclick = () => play(at + Number(n.dataset.d)));
        dots.forEach(d => d.onclick = () => play(Number(d.dataset.i)));
        /* sound is opt-in and it takes the room with it: the ambience ducks
           so the episode is the only thing talking */
        snd.onclick = () => {
          if (!player) return;
          loud = !loud;
          if (loud) { player.unMute(); player.setVolume(100); } else player.mute();
          snd.textContent = loud ? T('ytSndOn') : T('ytSnd');
          snd.classList.toggle('is-on', loud);
          snd.setAttribute('aria-label', loud ? T('ytMute') : T('ytUnmute'));
          duck(loud);
        };
        /* THEATRE MODE. project() rewrites left/top every frame, so the
           expanded panel pins itself with !important in the stylesheet and
           stops taking its position from the wall it hangs on. */
        /* The scrim CANNOT live inside the panel. The expanded panel is pinned
           with a transform, and a transform makes its element the containing
           block for fixed-position descendants — so a scrim nested in there
           sized itself to the panel and the room stayed brightly lit behind
           the video. It hangs off the spots layer instead, which has no
           transform, and buildMarkers clears that layer on every room change. */
        const scrim = el.spots.appendChild(document.createElement('span'));
        scrim.className = 'cw-yt-scrim';
        /* On a phone the wall panel is barely wider than a thumb: a six-button
           strip, a sound toggle and a caption crammed in there are all too
           small to hit and too small to read. So the phone gets ONE control on
           the wall — open it — and the whole deck lives in theatre mode, where
           there is room for it. The desktop keeps everything in place. */
        const size = on => {
          w.classList.toggle('is-big', on);
          scrim.classList.toggle('is-on', on);
          big.textContent = on ? (coarse ? T('ytShut') : T('ytSmall'))
                               : (coarse ? T('ytWatch') : T('ytBig'));
          big.setAttribute('aria-label', on ? T('ytShutAria') : T('ytBigAria'));
        };
        size(false);
        big.onclick = () => size(!w.classList.contains('is-big'));
        scrim.onclick = () => size(false);
        addEventListener('keydown', e => { if (e.key === 'Escape') size(false); });
        el.spots.appendChild(w);
        spots.push({ el: w, v: vec(h.yaw, h.pitch) });
        return;   /* the room's main TV owns tvYaw — a side screen must not steal the framing */
      }
      if (kind === 'product' && h.img) {
        /* windows lean away from each other so a wall of them never reads flat */
        b.style.setProperty('--tilt', (prod++ % 2 ? -8 : 9) + 'deg');
        const line = teaser(h);
        b.innerHTML =
          '<span class="cw-spot__frame">' +
            '<span class="cw-spot__chip">' + esc(shortName(h)) + ' · LIVE</span>' +
            '<span class="cw-spot__glass">' +
              '<img src="' + h.img + '" alt="' + esc(h.title) + '" decoding="async">' +
              (line ? '<span class="cw-spot__tag">' + esc(line) + '</span>' : '') +
            '</span>' +
            '<i class="cw-spot__anchor" aria-hidden="true"></i>' +
          '</span>';
        /* portrait shots get a narrower pane so they keep their proportions */
        const im = b.querySelector('img');
        const mark = () => { if (im.naturalHeight > im.naturalWidth * 1.15) b.classList.add('is-portrait'); };
        if (im.complete && im.naturalWidth) mark(); else im.addEventListener('load', mark, { once: true });
      } else {
        /* A WALL PLAQUE, not a floating tag. The spec's rule: nothing hangs
           in the air with a label on it — content sits on the room's
           surfaces. So the story marker is a mounted plate: title, one
           line, and the same anchor stem the product windows use, which is
           what makes it read as fixed to the wall rather than pinned to
           the camera. */
        b.classList.add('is-plaque');
        const line = teaser(h);
        b.innerHTML =
          '<span class="cw-plaque">' +
            '<b>' + esc(h.title) + '</b>' +
            (line ? '<small>' + esc(line) + '</small>' : '') +
          '</span>' +
          '<i class="cw-spot__anchor" aria-hidden="true"></i>';
      }
      b.onclick = () => { seen.add(key); b.classList.add('is-seen'); paintProgress(); card(h); };
      el.spots.appendChild(b);
      spots.push({ el: b, v: vec(h.yaw, h.pitch) });
    });
    doorYaws = [];
    doorsFor(d.id).forEach(dr => {
      doorYaws.push(dr.yaw);
      const t = ROOMS[dr.to];
      const b = document.createElement('button');
      b.className = 'cw-door' + (dr.next ? ' is-next' : '') + (dr.home ? ' is-home' : '');
      b.innerHTML = '<span class="cw-door__l">' + (dr.label || t.title) + '</span><i class="cw-door__a">' + (dr.home ? '⌂' : '↓') + '</i>';
      b.onclick = () => go(dr.to, false, dr.yaw);
      el.spots.appendChild(b);
      doors.push({ el: b, v: vec(dr.yaw, dr.pitch) });
    });
  }
  /* loaded lazily: most rooms never hang a YouTube screen, and the tour
     should not pay for a player it does not show */
  let _yt = null;
  const ytAPI = () => _yt || (_yt = new Promise(res => {
    if (window.YT && window.YT.Player) return res();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); res(); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }));

  const vec = (yaw, pitch) => {
    const y = deg(yaw || 0), p = deg(pitch || 0);
    return new THREE.Vector3(Math.cos(p) * Math.sin(y), Math.sin(p), -Math.cos(p) * Math.cos(y)).multiplyScalar(52);
  };

  /* THE GUIDED PASS. "Show me everything": the camera glides screen to
     screen around the hall, each wall opens for a few seconds with its film
     and abstract, closes, and the pass moves on — finishing at the lounge.
     Nobody has to know how to look around to see all five axes. Any real
     input hands the wheel back. */
  let tourOn = false, tourStep = 0, tourT = 0, tourRaf = 0;
  const seenAxes = new Set();
  function paintTourDots() {
    const box = $('.cw-tour__dots', el.root); if (!box) return;
    const at = tourOn ? tourStep % Math.max(1, axisScreens.length) : carIndex();
    box.innerHTML = axisScreens.map((a, i) =>
      '<i class="' + (seenAxes.has(a.yaw) ? 'on' : '') + (i === at ? ' now' : '') + '"></i>').join('');
  }
  /* ---------- the rail ----------
     Six screens hung round a sphere were six screens you met edge-on, at
     different angles and apparent sizes, with two of them always half off a
     phone. So they came off the wall. They live in a rail now: one card in
     focus, whole and centred, the neighbours receding in real perspective
     behind it. The room stays a room. The wall stays a wall with a name on
     it and nothing else. That is the whole fix. */
  let railAt = 0, railPos = 0, railRaf = 0, railW = 0, railGap = 0;
  const railCards = () => axisScreens;

  function railReset(on) {
    el.rail.innerHTML = '';
    el.rail.hidden = !on;
    railAt = 0; railPos = 0;
    cancelAnimationFrame(railRaf);
  }
  function railAdd(h, isFilm) {
    const b = document.createElement('button');
    b.className = 'cw-card3' + (isFilm ? ' is-film' : '');
    b.type = 'button';
    const isTeam = h.kind === 'team';
    if (isTeam) b.classList.add('is-team');
    const media = isTeam
      ? '<span class="cw-card3__pair">' + (h.people || []).map(pp =>
          '<img src="' + pp.img + '" alt="' + esc(pp.name) + '" decoding="async">').join('') + '</span>'
      : h.video
      ? '<video src="' + h.video + '" poster="' + (h.poster || '') + '" preload="' + (isFilm ? 'metadata' : 'none') + '" muted loop playsinline></video>'
      : '<img src="' + h.still + '" alt="" decoding="async" class="cw-kb">';
    b.innerHTML =
      '<span class="cw-card3__glass">' + media +
        '<span class="cw-card3__chip">' + esc(h.title) + (h.status ? ' \u00b7 ' + esc(h.status) : (isFilm ? ' \u00b7 LIVE' : '')) + '</span>' +
        (h.site ? '<span class="cw-card3__site">' + T('axisSiteShort') + '</span>' : '') +
        '<span class="cw-card3__tag">' + esc(isFilm ? (h.text || '') : (h.sub || '')) + '</span>' +
      '</span>';
    const i = axisScreens.length;
    b.onclick = () => {
      if (i !== railAt) { railTo(i, 560); return; }
      if (isTeam) return openTeam(h);
      openAxis(isFilm ? Object.assign({}, h, { abstract: h.text, features: [] }) : h);
    };
    el.rail.appendChild(b);
    axisScreens.push({ el: b, yaw: h.yaw, v: b.querySelector('video'), h, film: isFilm });
    railLayout();
    paintRail();
  }
  function railLayout() {
    const W = innerWidth, H = innerHeight, mob = W <= 860, short = !mob && H < 760;
    /* The wordmark owns the upper half of the frame. The rail may take what
       is left below it and above the controls, and never more: on a wide
       short monitor a width-only rule climbed straight over the name. */
    /* 52px lighter than it was: the carousel pill (34px of button plus the
       column gap) used to sit between the rail and the pass button. The
       short layout is unchanged, because there the pill sat beside the
       button rather than above it and cost no height. */
    const reserve = mob ? 180 : (short ? 104 : 126);
    const maxH = H - reserve - 30 - H * 0.5;
    let w = mob ? W * 0.76 : Math.max(300, Math.min(W * 0.34, 520));
    w = Math.min(w, Math.max(220, maxH * 16 / 9));
    railW = Math.round(w);
    railGap = Math.round(railW * (mob ? 0.86 : 0.74));
    el.rail.style.setProperty('--cw', railW + 'px');
    el.rail.style.height = Math.round(railW * 9 / 16 + 30) + 'px';
    el.rail.style.bottom = 'calc(max(20px, env(safe-area-inset-bottom)) + ' + reserve + 'px)';
    el.root.classList.toggle('is-short', short);
  }
  addEventListener('resize', () => { if (axisScreens.length) { railLayout(); paintRail(); } });
  function paintRail() {
    const n = axisScreens.length;
    axisScreens.forEach((a, i) => {
      /* shortest signed distance round the loop, so card 6 sits just left of
         card 0 instead of six places to its right */
      let d = i - railPos;
      if (d > n / 2) d -= n; else if (d < -n / 2) d += n;
      const ad = Math.abs(d);
      const far = ad > 2.7;
      a.el.style.transform = 'translate3d(' + (d * railGap).toFixed(1) + 'px,0,' + (-ad * 230).toFixed(1) + 'px) rotateY(' + (-d * 9).toFixed(2) + 'deg) scale(' + (1 - Math.min(ad, 2) * 0.09).toFixed(3) + ')';
      a.el.style.opacity = far ? '0' : (1 - Math.min(ad, 2) * 0.34).toFixed(3);
      a.el.style.zIndex = String(100 - Math.round(ad * 10));
      a.el.style.pointerEvents = far ? 'none' : '';
      a.el.setAttribute('aria-hidden', far ? 'true' : 'false');
    });
    paintTourDots();
  }
  function railTo(i, ms) {
    if (!axisScreens.length) return;
    railAt = ((i % axisScreens.length) + axisScreens.length) % axisScreens.length;
    /* go the short way round on a loop of seven */
    let from = railPos;
    const n = axisScreens.length;
    while (railAt - from > n / 2) from += n;
    while (from - railAt > n / 2) from -= n;
    cancelAnimationFrame(railRaf);
    const t0 = performance.now(), ease = k => 1 - Math.pow(1 - k, 3);
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / (ms || 560));
      railPos = from + (railAt - from) * ease(k);
      paintRail();
      if (k < 1) railRaf = requestAnimationFrame(step);
      else { railPos = railAt; paintRail(); tendScreens(); }
    };
    railRaf = requestAnimationFrame(step);
  }
  /* swipe and drag on the rail itself; the canvas underneath keeps its own
     look-around drag, the two never fight */
  (function railDrag() {
    let x0 = null, p0 = 0, moved = false;
    addEventListener('pointerdown', e => {
      if (!e.target.closest || !e.target.closest('.cw-rail')) return;
      x0 = e.clientX; p0 = railPos; moved = false;
      cancelAnimationFrame(railRaf);
    });
    addEventListener('pointermove', e => {
      if (x0 == null) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 6) moved = true;
      railPos = p0 - dx / railGap;
      paintRail();
    }, { passive: true });
    const up = e => {
      if (x0 == null) return;
      x0 = null;
      if (moved) {
        /* a card click that turned into a drag must not also open */
        const kill = ev => { ev.stopPropagation(); ev.preventDefault(); removeEventListener('click', kill, true); };
        addEventListener('click', kill, true);
        setTimeout(() => removeEventListener('click', kill, true), 0);
      }
      railTo(Math.round(railPos), 420);
    };
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
    addEventListener('wheel', e => {
      if (cur !== 'lobby' || !axisScreens.length || !e.target.closest || !e.target.closest('.cw-rail')) return;
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      e.preventDefault();
      clearTimeout(railDrag._w);
      railDrag._w = setTimeout(() => railTo(railAt + Math.sign(e.deltaX), 480), 40);
    }, { passive: false });
  })();

  /* The carousel pill (arrows, the focused card's name, the position dots) is
     gone. It restated what the rail already shows: the centre card carries its
     own title, and its neighbours are visible on both sides, so the pill was a
     second, smaller copy of the row sitting on top of the row. What it used to
     do is all still here: arrow keys, drag, swipe, horizontal wheel, and
     clicking a neighbour to bring it forward. */
  const carIndex = () => railAt;

  function glideTo(yaw, ms, done) {
    const lon0 = lon, rel = ((yaw - lon0) % 360 + 540) % 360 - 180, t0 = performance.now();
    const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const step = () => {
      if (!tourOn) return;
      const k = Math.min(1, (performance.now() - t0) / ms);
      lon = lon0 + rel * ease(k); lat += (14 - lat) * 0.08;
      if (k < 1) tourRaf = requestAnimationFrame(step); else done();
    };
    tourRaf = requestAnimationFrame(step);
  }
  function startTour() {
    if (cur !== 'lobby' || !axisScreens.length) return;
    tourOn = true; tourStep = 0;
    el.root.classList.add('tour-on');
    paintTourBtn();
    closeAxis();
    tourStep = railAt;
    tourNext(0);
  }
  function tourNext(count) {
    if (!tourOn) return;
    if (count >= axisScreens.length) {
      /* done: everything seen — glide to the lounge door and hand over */
      stopTour();
      const home = doors.find(d => d.el.classList.contains('is-home'));
      const yaw = 180;
      const lon0 = lon, rel = ((yaw - lon0) % 360 + 540) % 360 - 180, t0 = performance.now();
      const fin = () => { const k = Math.min(1, (performance.now() - t0) / 900); lon = lon0 + rel * k; if (k < 1) requestAnimationFrame(fin); };
      requestAnimationFrame(fin);
      announce(T('tourDone'));
      if (home) home.el.classList.add('is-facing');
      return;
    }
    const a = axisScreens[tourStep % axisScreens.length];
    paintTourDots();
    railTo(tourStep, 700);
    tourT = setTimeout(() => {
      if (!tourOn) return;
      const h = a.h;
      if (h) openAxis(a.film ? Object.assign({}, h, { abstract: h.text, features: [] }) : h);
      seenAxes.add(a.yaw); paintTourDots();
      tourT = setTimeout(() => {
        if (!tourOn) return;
        closeAxis();
        tourStep = (tourStep + 1) % axisScreens.length;
        tourT = setTimeout(() => tourNext(count + 1), 350);
      }, 7000);
    }, 780);
  }
  /* The pass button is a round icon now, so the words move to the accessible
     name and only the glyph stays on screen. The strings already lead with
     their glyph ("▶ הראו לי הכל"), so one split keeps both in one place. */
  function paintTourBtn() {
    const b = $('.cw-tour__go', el.root); if (!b) return;
    const s = tourOn ? T('tourStop') : T('tourGo');
    const i = s.indexOf(' ');
    b.textContent = i < 0 ? s : s.slice(0, i);
    b.setAttribute('aria-label', i < 0 ? s : s.slice(i + 1));
  }
  function stopTour() {
    tourOn = false; clearTimeout(tourT); cancelAnimationFrame(tourRaf);
    el.root.classList.remove('tour-on');
    paintTourBtn();
    paintTourDots();
  }

  /* THE OPEN WALL. A screen you click does not take you anywhere — it comes
     to you. The film on one side, the abstract on the other, the features
     as a row of smaller screens beneath, and the way onward (the room, the
     dedicated site, Lidor) at the bottom. "חזרה ללובי" closes it. The film
     is the same element the wall screen was playing, so there is no second
     download and no restart — the tag line simply gets sound. */
  /* The people wall. Same wall as the screens, but no film: two portraits
     where the media goes, and the founders' full profiles as the tiles. */
  function openTeam(h) {
    axisOpen = h;
    const m = $('.cw-axis__media', el.axis), bb = $('.cw-axis__bubble', el.axis), ff = $('.cw-axis__feats', el.axis);
    el.axis.style.setProperty('--acc', ACCENT.lobby);
    el.axis.classList.add('is-team');
    m.innerHTML = '<span class="cw-team__pair">' + (h.people || []).map(pp =>
      '<img src="' + pp.img + '" alt="' + esc(pp.name) + '" decoding="async">').join('') + '</span>';
    bb.innerHTML =
      '<span class="cw-axis__eyebrow">' + esc(h.sub || '') + '</span>' +
      '<h2>' + esc(h.title) + '</h2>' +
      '<p>' + esc(h.abstract || '') + '</p>' +
      '<div class="cw-axis__go">' +
        (h.room && ROOMS[h.room] ? '<button class="cw-axis__room">' + T('teamRoom') + '</button>' : '') +
        '<a class="cw-axis__wa" href="' + WA + '?text=' + encodeURIComponent(T('teamWa')) + '" target="_blank" rel="noopener">' + T('waLidor') + '</a>' +
      '</div>';
    const rb = bb.querySelector('.cw-axis__room');
    if (rb) rb.onclick = () => { closeAxis(); go(h.room, false, 180); };
    ff.innerHTML = (h.people || []).map(pp =>
      '<article class="cw-person">' +
        '<img src="' + pp.img + '" alt="" decoding="async">' +
        '<div class="cw-person__b">' +
          '<h3>' + esc(pp.name) + '</h3>' +
          '<span class="cw-person__role">' + esc(pp.role || '') + '</span>' +
          '<p>' + esc(pp.text || '') + '</p>' +
          ((pp.tags || []).length ? '<div class="cw-tech">' + pp.tags.map(t => '<span>' + esc(t) + '</span>').join('') + '</div>' : '') +
          (pp.wa ? '<a class="cw-person__wa" href="' + WA + '?text=' + encodeURIComponent(pp.wa) + '" target="_blank" rel="noopener">' + T('waLidor') + '</a>' : '') +
        '</div>' +
      '</article>').join('');
    el.axis.hidden = false;
    el.root.classList.add('axis-open');
    el.home.hidden = false;
    duck(true);
  }

  let axisOpen = null;
  function openAxis(h) {
    el.axis.classList.remove('is-team');
    axisOpen = h;
    const m = $('.cw-axis__media', el.axis), bb = $('.cw-axis__bubble', el.axis), ff = $('.cw-axis__feats', el.axis);
    el.axis.style.setProperty('--acc', ACCENT[h.room] || ACCENT.lobby);
    /* no sound toggle: the wall film is ambience behind the words, and a
       button offering to make it talk over them was one box too many */
    m.innerHTML = h.video
      ? '<video src="' + h.video + '" poster="' + (h.poster || '') + '" autoplay muted loop playsinline></video>'
      : '<img src="' + h.still + '" alt="" class="cw-kb">';
    const v = m.querySelector('video');
    if (v) {
      const wallV = (axisScreens.find(a => a.h === h || (a.h && a.h.id && a.h.id === h.id)) || {}).v;
      if (wallV && wallV.currentTime) v.currentTime = wallV.currentTime;
    }
    bb.innerHTML =
      '<span class="cw-axis__eyebrow">' + esc(h.sub || '') + '</span>' +
      '<h2>' + esc(h.title) + (h.status ? ' <em>' + esc(h.status) + '</em>' : '') + '</h2>' +
      '<p>' + esc(h.abstract || '') + '</p>' +
      '<div class="cw-axis__go">' +
        (h.room && ROOMS[h.room] ? '<button class="cw-axis__room">' + T('axisRoom') + '</button>' : '') +
        (h.site ? '<a class="cw-axis__site" href="' + h.site + (LANG === 'en' ? '?lang=en' : '') + '">' + T('axisSite') + '</a>' : '') +
        '<a class="cw-axis__wa" href="' + WA + '?text=' + encodeURIComponent(T('axisWa')(h.title)) + '" target="_blank" rel="noopener">' + T('waLidor') + '</a>' +
      '</div>' +
      '<small class="cw-axis__made">' + esc((ROOMS.lobby && ROOMS.lobby.note) || '') + '</small>';
    const rb = bb.querySelector('.cw-axis__room');
    if (rb) rb.onclick = () => { closeAxis(); go(h.room, false, h.yaw); };
    ff.innerHTML = (h.features || []).map((f, i) =>
      '<div class="cw-axis__feat">' +
        /* every tile is numbered, image or not, so the row counts 1..n from
           the left instead of starting with a blank where a thumbnail is */
        '<span class="cw-axis__feat-mark' + (f.img ? ' has-img' : '') + '">' +
          (f.img ? '<img src="' + f.img + '" alt="" loading="lazy" decoding="async">' : '') +
          '<i>' + (i + 1) + '</i>' +
        '</span>' +
        '<span class="cw-axis__feat-t"><b>' + esc(f.title) + '</b>' + (f.tag ? '<i>' + esc(f.tag) + '</i>' : '') + '</span>' +
        '<span class="cw-axis__feat-x">' + esc(f.text) +
          (f.link ? ' <a class="cw-axis__feat-go" href="' + f.link + '" target="_blank" rel="noopener">' + T('featOpen') + '</a>' : '') +
        '</span>' +
      '</div>').join('');
    el.axis.hidden = false;
    el.home.hidden = false;
    el.root.classList.add('axis-open');
    seenAxes.add(h.yaw); paintTourDots();
    duck(true);
    tendScreens();
  }
  function closeAxis() {
    if (el.axis.hidden) return;
    const v = $('.cw-axis__media video', el.axis);
    if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    el.axis.hidden = true;
    el.root.classList.remove('axis-open');
    el.home.hidden = cur === 'lobby';
    duck(false);
    axisOpen = null;
    tendScreens();
  }

  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  function closePanels() {
    el.card.hidden = true; el.finale.hidden = true; el.scrim.hidden = true;
    duck(false);
  }

  /* ---------- ambience ----------
     Decoded through WebAudio rather than <audio loop> so the loop is gapless:
     an mp3 carries encoder padding that a plain loop plays as a click. */
  const SND_KEY = 'cw-snd', VOL = .26, DUCK = .1;
  let actx, snd, sndSrc, sndBusy = 0, ducked = 0;
  let sndOn = localStorage.getItem(SND_KEY) !== 'off';

  function sndRamp(sec) {
    if (!snd) return;
    const now = actx.currentTime, to = sndOn ? (ducked ? DUCK : VOL) : 0;
    snd.gain.cancelScheduledValues(now);
    snd.gain.setValueAtTime(snd.gain.value, now);
    snd.gain.linearRampToValueAtTime(to, now + sec);
  }

  function sndBoot() {
    removeEventListener('pointerdown', sndBoot); removeEventListener('keydown', sndBoot);
    if (sndBusy || !sndOn) return;
    sndBusy = 1;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    actx = new AC();
    snd = actx.createGain(); snd.gain.value = 0; snd.connect(actx.destination);
    fetch('audio/lobby.mp3')
      .then(r => r.arrayBuffer())
      .then(b => new Promise((ok, no) => actx.decodeAudioData(b, ok, no)))
      .then(buf => {
        sndSrc = actx.createBufferSource();
        sndSrc.buffer = buf; sndSrc.loop = true;
        sndSrc.connect(snd); sndSrc.start(0);
        sndRamp(4);                       /* fades up as you settle into the lobby */
      })
      .catch(() => { sndBusy = 0; });
  }

  function sndToggle() {
    sndOn = !sndOn;
    try { localStorage.setItem(SND_KEY, sndOn ? 'on' : 'off'); } catch (e) {}
    el.snd.classList.toggle('is-off', !sndOn);
    el.snd.setAttribute('aria-pressed', sndOn ? 'true' : 'false');
    if (sndOn && !sndSrc) { sndBoot(); return; }
    if (sndOn && actx && actx.state === 'suspended') actx.resume();
    sndRamp(sndOn ? 1.2 : .5);
  }

  /* a panel is something to read — pull the music back under it */
  function duck(on) {
    const v = on ? 1 : 0;
    if (v === ducked) return;
    ducked = v; sndRamp(.4);
  }

  addEventListener('visibilitychange', () => {
    if (!actx) return;
    if (document.hidden) { sndRamp(.25); setTimeout(() => document.hidden && actx.suspend(), 300); }
    else if (sndOn) { actx.resume(); sndRamp(1.2); }
  });

  function card(h) {
    const c = el.card, kind = h.kind || 'story';
    c.className = 'cw-card is-' + kind;
    c.innerHTML =
      '<button class="cw-card__x" aria-label="' + T('close') + '">✕</button>' +
      '<span class="cw-card__grab" aria-hidden="true"></span>' +
      (h.img ? '<img src="' + h.img + '" alt="" decoding="async">' : '') +
      '<div class="cw-card__body">' +
        (kind === 'product' ? '<span class="cw-card__kind">מוצר שבנינו</span>' : '') +
        '<h3>' + esc(h.title) + '</h3>' +
        (h.text ? '<p>' + esc(h.text) + '</p>' : '') +
        (h.metrics && h.metrics.length ? '<div class="cw-metrics">' + h.metrics.map(m =>
          '<div><b>' + esc(m[0]) + '</b><span>' + esc(m[1]) + '</span></div>').join('') + '</div>' : '') +
        (h.tech && h.tech.length ? '<div class="cw-tech">' + h.tech.map(t =>
          '<span>' + esc(t) + '</span>').join('') + '</div>' : '') +
        (h.quote ? '<blockquote class="cw-quote">' + esc(h.quote) + '</blockquote>' : '') +
        (h.link ? '<a class="cw-card__cta" href="' + h.link + '" target="_blank" rel="noopener">' +
          '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.6 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.9.9.9-4.8-.3-.4C5 17.8 4.4 16 4.4 15 4.4 8.9 9.9 4.4 16 4.4S27.6 8.9 27.6 15 22.1 24.8 16 24.8z"/></svg>' +
          esc(h.linkLabel || T('cardCta')) + '</a>' : '') +
      '</div>';
    c.querySelector('.cw-card__x').onclick = closePanels;
    el.scrim.hidden = false;
    c.hidden = false;
    duck(true);
    /* mobile: allow swipe-down dismiss like a native sheet */
    let sy = null;
    c.addEventListener('pointerdown', e => { if (e.target.closest('a,button')) return; sy = e.clientY; });
    c.addEventListener('pointerup', e => { if (sy != null && e.clientY - sy > 70) closePanels(); sy = null; });
  }

  let skyPeak = 0;
  function buildSky(d) {
    const s = d.sky;
    skyPeak = 0;
    if (!s) { el.sky.innerHTML = ''; return; }
    el.skyIn.innerHTML =
      '<span class=cw-sky__icon>' + s.icon + '</span>' +
      '<h4>' + esc(s.title) + '</h4>' +
      (s.lines || []).map(l => '<p>' + esc(l) + '</p>').join('') +
      (s.stat ? '<div class=cw-sky__stat><b>' + esc(s.stat[0]) + '</b><span>' + esc(s.stat[1]) + '</span></div>' : '');
  }
  /* the reward for looking up: fades in with how high you tilt */
  function paintSky() {
    const k = Math.max(0, Math.min(1, (lat - 22) / 34));      /* starts at 22deg, full by 56 */
    el.sky.style.opacity = k.toFixed(2);
    el.sky.style.transform = 'translateY(' + ((1 - k) * 26).toFixed(1) + 'px) scale(' + (0.94 + k * 0.06).toFixed(3) + ')';
    if (k > 0.55 && !skyPeak) { skyPeak = 1; el.sky.classList.add('seen'); }
    /* nudge: hint to look up once per room, only while they haven't */
    el.lookup.classList.toggle('show', lookArm && !skyPeak && lat < 12 && !busy);
  }
  let lookArm = false;

  function announce(name) {
    const t = el.title, s = t.firstElementChild;
    s.textContent = name;
    t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
    clearTimeout(announce._t);
    announce._t = setTimeout(() => t.classList.remove('on'), 2400);
  }
  function seedMotes() {
    if (reduce) return;
    /* 26 was snow, not dust — 26 independent drifts in a frame that already
       had a dozen other things moving */
    const n = innerWidth < 861 ? 6 : 10;
    el.motes.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const m = document.createElement('i');
      m.style.left = (Math.random() * 100).toFixed(1) + '%';
      m.style.top = (Math.random() * 100).toFixed(1) + '%';
      m.style.setProperty('--s', (Math.random() * 2 + 1.4).toFixed(1) + 'px');
      m.style.setProperty('--d', (Math.random() * 9 + 9).toFixed(1) + 's');
      m.style.animationDelay = '-' + (Math.random() * 10).toFixed(1) + 's';
      el.motes.appendChild(m);
    }
  }

  /* ---------- the lobby assistant ----------
     Scoped hard on the server: it only answers questions about Corewise, and
     the knowledge it draws from is generated from this same tour-content.json
     so it can never claim a feature the hall itself does not show. It stands
     in the lobby only, next to the WhatsApp button it hands off to when a
     visitor wants a human instead of an answer. */
  let assistHistory = [], assistBusy = false, agent3d = null;
  const agentNod = () => { if (agent3d) agent3d.nod(); };
  function mountAgent() {
    const host = $('.cw-agent', el.root);
    if (!host || !window.cwAgent3D || !window.THREE) return;
    try { agent3d = window.cwAgent3D.mount(host, window.THREE); } catch (e) {}
  }
  function paintAssistChips() {
    const log = el.assistLog;
    const old = $('.cw-assist__chips', el.root); if (old) old.remove();
    if (assistHistory.length) return;   /* only before the first question */
    const box = document.createElement('div');
    box.className = 'cw-assist__chips';
    T('assistChips').forEach(q => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'cw-assist__chip'; b.textContent = q;
      b.onclick = () => assistSend(q);
      box.appendChild(b);
    });
    log.appendChild(box);
  }
  function openAssist(show) {
    el.assist.hidden = !show;
    el.assistOpenBtn.setAttribute('aria-expanded', String(show));
    el.assistOpenBtn.classList.toggle('is-on', show);
    if (show) { paintAssistChips(); agentNod(); duck(true); setTimeout(() => el.assistIn.focus(), 260); }
    else duck(false);
  }
  function assistBubble(role, text) {
    const p = document.createElement('p');
    p.className = 'cw-assist__msg is-' + role;
    p.textContent = text;
    el.assistLog.appendChild(p);
    el.assistLog.scrollTop = el.assistLog.scrollHeight;
    return p;
  }
  /* Answering and pointing are the same gesture: when the reply is about one
     of the five screens, the hall turns to it and opens it while the visitor
     reads. Its own glide, because the guided pass's one bails when the tour
     is off. */
  function assistGoTo(id) {
    const i = axisScreens.findIndex(a => a.h && a.h.id === id);
    if (i < 0 || cur !== 'lobby') return;
    railTo(i, 700);
    setTimeout(() => { const a = axisScreens[i]; if (a) { openAxis(a.h); seenAxes.add(a.yaw); paintTourDots(); } }, 780);
  }

  async function assistSend(text) {
    if (assistBusy || !text.trim()) return;
    assistBusy = true;
    const chips = $('.cw-assist__chips', el.root);
    if (chips) chips.remove();          /* the openers have done their job */
    assistBubble('user', text);
    assistHistory.push({ role: 'user', content: text });
    const wait = assistBubble('bot', T('assistThinking'));
    wait.classList.add('is-wait');
    try {
      const r = await fetch('/api/assistant', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text, history: assistHistory.slice(0, -1) }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.reply) throw new Error('bad response');
      wait.classList.remove('is-wait');
      wait.textContent = j.reply;
      assistHistory.push({ role: 'assistant', content: j.reply });
      assistHistory = assistHistory.slice(-16);
      agentNod();
      if (j.go) assistGoTo(j.go);
    } catch (e) {
      wait.classList.remove('is-wait'); wait.classList.add('is-err');
      wait.textContent = T('assistError');
    } finally {
      assistBusy = false;
      el.assistLog.scrollTop = el.assistLog.scrollHeight;
    }
  }

  function openMap(show) {
    if (!show) { el.mapui.style.display = 'none'; return; }
    if (!cur) return;
    const g = $('.cw-mapui__grid', el.root);
    /* the map answers "what's left unseen", not just "where am I" — the
       engine tracked visited all along and the map never read it */
    g.innerHTML = ORDER.map(id => {
      const cls = (id === cur ? 'on' : '') + (visited.has(id) && id !== cur ? ' seen' : '');
      const tick = visited.has(id) && id !== cur ? ' ✓' : '';
      return `<button data-r="${id}"${cls.trim() ? ` class="${cls.trim()}"` : ''}>${ROOMS[id].title}${tick}</button>`;
    }).join('');
    g.querySelectorAll('button').forEach(b => b.onclick = () => { openMap(false); go(b.dataset.r); });
    el.mapui.style.display = 'grid';
  }

  /* ---------- the language switch ----------
     Everything the visitor has EARNED survives the flip: the room they are
     standing in, where they are looking, which rooms they walked and which
     points they found. Only the words are replaced, and the panorama is never
     re-fetched — it has no language. */
  function paintChrome() {
    const q = (sel, fn) => { const e = $(sel, el.root); if (e) fn(e); };
    q('.cw-lookup span', e => e.textContent = T('lookup'));
    q('.cw-home', e => { e.textContent = T('home'); e.setAttribute('aria-label', T('homeAria')); });
    q('.cw-hint', e => e.textContent = T('hint'));
    q('.cw-snd', e => { e.title = T('snd'); e.setAttribute('aria-label', T('snd')); });
    q('.cw-gyro', e => { e.title = T('gyro'); e.setAttribute('aria-label', T('gyroAria')); });
    q('.cw-map', e => { e.title = T('map'); e.setAttribute('aria-label', T('map')); });
    q('.cw-mapui__in h3', e => e.textContent = T('map'));
    q('.cw-mapui__x', e => e.textContent = T('mapClose'));
    paintTourBtn();
    q('.cw-axis__x', e => e.textContent = T('home'));
    q('.cw-wa', e => e.title = T('waTitle'));
    q('.cw-wa span', e => e.textContent = T('waLabel'));
    q('.cw-assist-open__l', e => e.textContent = T('assistOpen'));
    q('.cw-assist-open', e => e.setAttribute('aria-label', T('assistOpen')));
    q('.cw-assist__title', e => e.textContent = T('assistTitle'));
    q('.cw-assist__x', e => e.setAttribute('aria-label', T('assistClose')));
    q('.cw-assist__greet', e => e.textContent = T('assistGreet'));
    if (!el.assist.hidden) paintAssistChips();
    q('.cw-assist__in', e => e.placeholder = T('assistPlaceholder'));
    q('.cw-assist__go', e => e.setAttribute('aria-label', T('assistSend')));
    q('.cw-pad [data-k=left]', e => e.setAttribute('aria-label', T('padL')));
    q('.cw-pad [data-k=up]', e => e.setAttribute('aria-label', T('padU')));
    q('.cw-pad [data-k=right]', e => e.setAttribute('aria-label', T('padR')));
    q('.cw-lang', e => {
      e.textContent = T('langBtn');
      e.setAttribute('aria-label', T('langAria'));
      e.lang = LANG === 'en' ? 'he' : 'en';
      e.dir = LANG === 'en' ? 'rtl' : 'ltr';
    });
  }

  let langBusy = false;
  function setLang(next) {
    if (langBusy || next === LANG) return;
    langBusy = true;
    const keepLon = lon, keepLat = lat, keepCur = cur, wasOpen = axisOpen;
    fetch(CONTENT(next)).then(r => r.ok ? r.json() : Promise.reject()).then(cfg => {
      LANG = next;
      try { localStorage.setItem('cw-lang', next); } catch (e) {}
      const u = new URL(location.href);
      if (next === 'en') u.searchParams.set('lang', 'en'); else u.searchParams.delete('lang');
      history.replaceState(null, '', u);          /* a shared link keeps the language */
      CFG = cfg; ROOMS = {};
      cfg.departments.forEach(d => ROOMS[d.id] = d);
      document.documentElement.lang = next;
      document.documentElement.dir = next === 'en' ? 'ltr' : 'rtl';
      paintChrome();
      const d = ROOMS[keepCur];
      if (d) {
        el.room.textContent = d.title;
        el.title.classList.remove('on');
        el.title.querySelector('span').textContent = '';   /* the banner is stale the moment the words change */
        el.wa.href = WA + (d.wa ? '?text=' + encodeURIComponent(d.wa) : '');
        buildMarkers(d); buildSky(d); buildCompass(keepCur); paintProgress(); paintTourDots();
        lon = keepLon; lat = keepLat;               /* you do not get spun around */
        if (wasOpen) {
          const same = (d.hotspots || []).find(x => x.kind === 'axis' && x.yaw === wasOpen.yaw);
          if (same) openAxis(same);
        }
      }
    }).catch(() => {}).finally(() => { langBusy = false; });
  }

  function toggleGyro() {
    const btn = $('.cw-gyro', el.root);
    if (gyro) { gyro = false; gbase = null; btn.classList.remove('on'); removeEventListener('deviceorientation', onGyro); return; }
    const on = () => { gyro = true; btn.classList.add('on'); addEventListener('deviceorientation', onGyro); };
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission)
      DeviceOrientationEvent.requestPermission().then(s => s === 'granted' && on()).catch(() => {});
    else on();
  }
  function onGyro(e) {
    if (!gyro || e.alpha == null) return;
    if (!gbase) gbase = { a: e.alpha, b: e.beta };
    lon = gbase.a - e.alpha;
    lat = Math.max(-70, Math.min(70, -(e.beta - gbase.b)));
  }
})();
