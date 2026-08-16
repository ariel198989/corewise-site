/* Corewise bilingual switch — Hebrew is the site, English is the option.
   Shared verbatim by every department site; copy, do not fork.

   The page ships in Hebrew: the markup IS the Hebrew, so a visitor with no
   JavaScript, a crawler, or a slow phone gets the real site immediately and
   nothing ever flashes. English lives in data-en* attributes beside it and is
   swapped in on demand.

   Mark up whatever needs to change:
     data-en="..."            textContent
     data-en-html="..."       innerHTML — only where Hebrew carries markup (<mark>, <br>)
     data-en-href / -alt / -aria-label / -title / -placeholder / -content
   The Hebrew original is captured on first switch, so a return trip is exact.

   Deliberately NOT auto-detecting the browser language: an Israeli visitor
   with an English-locale laptop must still land in Hebrew. Only an explicit
   click, or an explicit ?lang=en in the URL, moves the page. */
(() => {
  const KEY = 'cw-lang';
  const ATTRS = ['href', 'alt', 'aria-label', 'title', 'placeholder', 'content'];
  const root = document.documentElement;

  const store = {
    get() { try { return localStorage.getItem(KEY); } catch { return null; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch {} },
  };

  /* remember the Hebrew once, the first time an element is asked to change */
  function stash(el) {
    if (el.dataset.heCached) return;
    el.dataset.heCached = '1';
    if (el.hasAttribute('data-en-html')) el.dataset.heHtml = el.innerHTML;
    else if (el.hasAttribute('data-en')) el.dataset.he = el.textContent;
    for (const a of ATTRS) {
      if (el.hasAttribute('data-en-' + a)) el.dataset['he' + a.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())] = el.getAttribute(a) || '';
    }
  }

  function apply(lang) {
    const en = lang === 'en';
    document.querySelectorAll('[data-en],[data-en-html],' + ATTRS.map(a => '[data-en-' + a + ']').join(',')).forEach(el => {
      stash(el);
      const camel = a => 'he' + a.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
      if (el.hasAttribute('data-en-html')) el.innerHTML = en ? el.dataset.enHtml : el.dataset.heHtml;
      else if (el.hasAttribute('data-en')) el.textContent = en ? el.dataset.en : el.dataset.he;
      for (const a of ATTRS) {
        if (!el.hasAttribute('data-en-' + a)) continue;
        const v = en ? el.getAttribute('data-en-' + a) : el.dataset[camel(a)];
        if (v != null) el.setAttribute(a, v);
      }
    });

    /* the whole document turns around: dir drives every logical property,
       so a stylesheet written with inline-start/inline-end needs nothing else */
    root.lang = en ? 'en' : 'he';
    root.dir = en ? 'ltr' : 'rtl';
    root.classList.toggle('is-en', en);

    document.querySelectorAll('[data-lang-toggle]').forEach(b => {
      b.textContent = en ? 'עברית' : 'EN';
      b.setAttribute('aria-label', en ? 'החלפה לעברית' : 'Switch to English');
      b.setAttribute('lang', en ? 'he' : 'en');
      b.dir = en ? 'rtl' : 'ltr';
    });

    dispatchEvent(new CustomEvent('cw:langchange', { detail: { lang } }));
  }

  function set(lang, remember) {
    if (remember) store.set(lang);
    const u = new URL(location.href);
    if (lang === 'en') u.searchParams.set('lang', 'en'); else u.searchParams.delete('lang');
    history.replaceState(null, '', u);          /* a shared link keeps the language */
    apply(lang);
  }

  const urlLang = new URL(location.href).searchParams.get('lang');
  const start = urlLang === 'en' || urlLang === 'he' ? urlLang : (store.get() || 'he');
  if (start === 'en') apply('en');              /* Hebrew is already in the markup */

  addEventListener('click', e => {
    const b = e.target.closest('[data-lang-toggle]');
    if (!b) return;
    e.preventDefault();
    set(root.lang === 'en' ? 'he' : 'en', true);
  });

  window.cwLang = { get: () => root.lang, set: l => set(l, true) };
})();
