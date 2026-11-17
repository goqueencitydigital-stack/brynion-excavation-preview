/* Brynion Excavation — site behavior. No personal data is ever sent to analytics. */
(function () {
  'use strict';
  var d = document, mode = d.body.getAttribute('data-mode');
  function track(name, params) { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); }

  /* Mobile nav */
  var toggle = d.querySelector('.nav-toggle'), list = d.getElementById('nav-list');
  if (toggle && list) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      list.classList.toggle('open', open);
    });
  }
  /* Mega menu */
  d.querySelectorAll('.mega-toggle').forEach(function (btn) {
    var panel = d.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('open', open);
    });
  });
  function closeAll(focusBack) {
    d.querySelectorAll('.mega-toggle[aria-expanded="true"]').forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      d.getElementById(btn.getAttribute('aria-controls')).classList.remove('open');
      if (focusBack && btn.closest('.has-mega').contains(d.activeElement)) btn.focus();
    });
  }
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeAll(true);
    if (toggle && toggle.getAttribute('aria-expanded') === 'true') { toggle.click(); toggle.focus(); }
  });
  d.addEventListener('click', function (e) { if (!e.target.closest('.has-mega')) closeAll(false); });

  /* Phone click tracking (one event per click, location only) */
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="tel:"]');
    if (a) track('phone_click', { link_location: a.getAttribute('data-loc') || 'other' });
  });

  /* Gallery filter + lightbox */
  var filters = d.querySelectorAll('.filter');
  filters.forEach(function (f) {
    f.addEventListener('click', function () {
      var cat = f.getAttribute('data-filter');
      filters.forEach(function (x) { x.setAttribute('aria-pressed', String(x === f)); });
      d.querySelectorAll('.g-item').forEach(function (it) { it.hidden = !(cat === 'all' || it.getAttribute('data-cat') === cat); });
    });
  });
  var lb = d.getElementById('lightbox');
  if (lb && typeof lb.showModal === 'function') {
    var lbImg = lb.querySelector('img'), opener = null;
    d.querySelectorAll('.g-open').forEach(function (b) {
      b.addEventListener('click', function () {
        opener = b;
        var src = b.querySelector('img');
        lbImg.src = b.getAttribute('data-full');
        lbImg.alt = src ? src.alt : '';
        if (src) { lbImg.width = src.naturalWidth || src.width; lbImg.height = src.naturalHeight || src.height; }
        lb.showModal();
      });
    });
    lb.querySelector('.lb-close').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', function () { if (opener) opener.focus(); });
  } else if (lb) {
    d.querySelectorAll('.g-open').forEach(function (b) { b.addEventListener('click', function () { window.open(b.getAttribute('data-full'), '_blank'); }); });
  }

  /* Estimate form */
  var form = d.getElementById('estimate-form');
  if (form) {
    var started = false, status = form.querySelector('.f-status');
    form.addEventListener('focusin', function () {
      if (started) return; started = true;
      var fs = form.querySelector('[name="form_start"]'); if (fs) fs.value = String(Date.now());
      track('form_start', { form_id: 'estimate' });
    });
    function setErr(input, errId, bad) {
      var err = d.getElementById(errId); if (!err) return;
      err.hidden = !bad;
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      var ids = (input.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return x && x !== errId; });
      if (bad) ids.push(errId);
      if (ids.length) input.setAttribute('aria-describedby', ids.join(' ')); else input.removeAttribute('aria-describedby');
    }
    function v(id) { return (d.getElementById(id).value || '').trim(); }
    function validate() {
      var checks = [
        ['f-name', 'e-name', v('f-name').length < 2],
        ['f-phone', 'e-phone', !/^1?\d{10}$/.test(v('f-phone').replace(/\D/g, ''))],
        ['f-loc', 'e-loc', v('f-loc').length < 2],
        ['f-svc', 'e-svc', !v('f-svc')],
        ['f-desc', 'e-desc', v('f-desc').length < 5],
        ['f-email', 'e-email', v('f-email') !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('f-email'))]
      ];
      var ph = d.getElementById('f-photos'), badPh = false;
      if (ph && ph.files) { if (ph.files.length > 5) badPh = true; for (var i = 0; i < ph.files.length; i++) if (ph.files[i].size > 10485760) badPh = true; }
      checks.push(['f-photos', 'e-photos', badPh]);
      var first = null;
      checks.forEach(function (c) { var el = d.getElementById(c[0]); if (!el) return; setErr(el, c[1], c[2]); if (c[2] && !first) first = el; });
      if (first) { if (first.closest('details')) first.closest('details').open = true; first.focus(); }
      return !first;
    }
    form.addEventListener('submit', function (e) {
      status.hidden = true; status.className = 'f-status';
      if (!validate()) {
        e.preventDefault();
        status.hidden = false; status.classList.add('is-error');
        status.textContent = 'Please fix the highlighted fields and try again.';
        return;
      }
      if (mode === 'review') {
        e.preventDefault();
        status.hidden = false; status.classList.add('is-review');
        status.textContent = 'Review copy: submissions are turned off, so nothing was sent. Your entries passed validation.';
        return;
      }
      /* Live: the server (Gravity Forms) validates again and only redirects to /thank-you/ after a successful entry.
         The flag below lets the thank-you page count one lead; it carries no personal data. */
      try { sessionStorage.setItem('bx_lead', '1'); } catch (x) {}
      var btn = form.querySelector('[type="submit"]'); if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      status.hidden = false; status.classList.add('is-sending'); status.textContent = 'Sending your request…';
    });
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) { var btn = form.querySelector('[type="submit"]'); if (btn) { btn.disabled = false; btn.textContent = 'Request my free estimate'; } status.hidden = true; }
    });
  }

  /* Lead conversion: only on the thank-you page, once per successful submission */
  if (d.body.classList.contains('is-thanks')) {
    try {
      if (sessionStorage.getItem('bx_lead') === '1') {
        sessionStorage.removeItem('bx_lead');
        track('generate_lead', { form_id: 'estimate' });
      }
    } catch (x) {}
  }
})();
