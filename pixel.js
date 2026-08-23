/* Meta Pixel, one file for every page.
 *
 * The task sheet says to paste the base snippet into all pages, and also that
 * the site must not go live with the placeholder ID still in it. This repo
 * deploys on every push, so those two rules meet in the middle here: the ID
 * lives on the next line, and while it is empty this file does nothing at
 * all — no request leaves the page. Filling it in is the entire launch.
 *
 * One file rather than ten pasted copies for the same reason the sheet warns
 * about mismatched IDs: ten copies is ten chances for them to drift.
 */
(function () {
  'use strict';

  var PIXEL_ID = '1063707116175844';   /* Corewise Web */

  if (!PIXEL_ID) return;

  /* base code, as issued by Meta */
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window,document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');

  /* There is no contact form on the site: the one action that produces a
   * lead is a WhatsApp click, so that click is the Lead event. The listener
   * sits on the document in the capture phase because the campus builds some
   * of its WhatsApp links in JavaScript after load — a per-link listener
   * would miss those. This is the only fbq('track','Lead') on the site;
   * adding another anywhere would count leads that never happened. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest(
      'a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href^="whatsapp:"]'
    );
    if (!a || typeof window.fbq !== 'function') return;

    window.fbq('track', 'Lead', {
      content_name: 'whatsapp_click',
      content_category: location.pathname
    });
  }, true);
})();
