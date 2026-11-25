/* Brynion Excavation — site behavior. No personal data is ever sent to analytics. */
(function () {
  'use strict';
  var d = document, mode = d.body.getAttribute('data-mode');
  function track(name, params) { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); }

  /* Mobile nav */
  var navToggle = d.querySelector('.nav-toggle'), navList = d.getElementById('nav-list');
  if (navToggle && navList) {
    navToggle.addEventListener('click', function () {
      var open = navToggle.getAttribute('aria-expanded') !== 'true';
      navToggle.setAttribute('aria-expanded', String(open));
      navList.classList.toggle('open', open);
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
    if (navToggle && navToggle.getAttribute('aria-expanded') === 'true') { navToggle.click(); navToggle.focus(); }
  });
  d.addEventListener('click', function (e) { if (!e.target.closest('.has-mega')) closeAll(false); });

  /* Phone click tracking (one event per click, location only) */
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="tel:"]');
    if (a) track('phone_click', { link_location: a.getAttribute('data-loc') || 'other' });
  });

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header shadow on scroll + back-to-top */
  var hdr = d.querySelector('.site-header'), top = d.querySelector('.to-top');
  function onScroll() {
    var y = window.scrollY || 0;
    if (hdr) hdr.classList.toggle('scrolled', y > 40);
    if (top) top.classList.toggle('show', y > 900);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); var m = d.getElementById('main'); if (m) { m.setAttribute('tabindex', '-1'); m.focus({ preventScroll: true }); } });

  /* Reveal on scroll */
  var rv = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* Count-up numbers (values are fixed facts already in the HTML) */
  var nums = d.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, end = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '', t0 = null;
        function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); }
        requestAnimationFrame(step);
      });
    }, { threshold: .6 });
    nums.forEach(function (n) { co.observe(n); });
  }

  /* Hero slideshow */
  var hero = d.querySelector('[data-hero]');
  if (hero) {
    var slides = hero.querySelectorAll('.hero-slide'), dots = hero.querySelectorAll('.hero-dot'), cap = hero.querySelector('.hero-cap'), pause = hero.querySelector('.hero-pause'), cur = 0, timer = null, paused = reduce;
    function show(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.add('kb'); s.classList.toggle('is-on', k === cur); });
      dots.forEach(function (b, k) { b.setAttribute('aria-current', String(k === cur)); }); var bar = dots[cur] && dots[cur].querySelector('.hd-bar i'); if (bar) { bar.style.animation = 'none'; bar.offsetHeight; bar.style.animation = ''; }
      if (cap) cap.textContent = slides[cur].getAttribute('data-cap');
    }
    function play() { clearInterval(timer); if (!paused) { hero.classList.add('is-running'); timer = setInterval(function () { show(cur + 1); }, 6500); } }
    dots.forEach(function (b) { b.addEventListener('click', function () { show(+b.getAttribute('data-i')); play(); }); });
    if (pause) {
      if (reduce) { pause.setAttribute('aria-pressed', 'true'); pause.setAttribute('aria-label', 'Play slideshow'); hero.classList.add('is-paused'); }
      pause.addEventListener('click', function () { paused = !paused; pause.setAttribute('aria-pressed', String(paused)); pause.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow'); hero.classList.toggle('is-paused', paused); if (!paused) show(cur); play(); });
    }
    hero.addEventListener('focusin', function () { clearInterval(timer); hero.classList.add('is-paused'); });
    hero.addEventListener('focusout', function () { if (!paused) { hero.classList.remove('is-paused'); show(cur); } play(); });
    d.addEventListener('visibilitychange', function () { if (d.hidden) clearInterval(timer); else play(); });
    /* load the other slides after the page settles, so the first photo stays fast */
    window.addEventListener('load', function () { setTimeout(function () { slides.forEach(function (s) { s.querySelectorAll('[data-srcset],[data-src]').forEach(function (el) { if (el.dataset.srcset) el.srcset = el.dataset.srcset; if (el.dataset.src) el.src = el.dataset.src; }); }); play(); }, 2500); });
  }

  /* Project carousel: left-aligned, swipe or arrows */
  d.querySelectorAll('[data-carousel]').forEach(function (car) {
    var track = car.querySelector('.car-track'), items = car.querySelectorAll('.car-slide'), num = car.querySelector('.car-i'), bar = car.querySelector('.car-bar i'), idx = 0, raf = 0;
    function centre() {
      var pl = parseFloat(getComputedStyle(track).paddingLeft) || 0, best = 0, bd = 1e9;
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4 && track.scrollLeft > 4) { var vis = track.scrollLeft + track.clientWidth - pl; items.forEach(function (it, k) { if (it.offsetLeft + it.offsetWidth / 2 < vis) best = k; }); bd = 0; }
      else items.forEach(function (it, k) { var dd = Math.abs(it.offsetLeft - pl - track.scrollLeft); if (dd < bd) { bd = dd; best = k; } });
      if (best !== idx || !items[best].classList.contains('is-center')) {
        idx = best; items.forEach(function (it, k) { it.classList.toggle('is-center', k === idx); });
        if (num) num.textContent = String(idx + 1).padStart(2, '0');
        if (bar) bar.style.width = ((idx + 1) / items.length * 100) + '%';
      }
    }
    function go(k) { k = (k + items.length) % items.length; var it = items[k]; var pl = parseFloat(getComputedStyle(track).paddingLeft) || 0; track.scrollTo({ left: it.offsetLeft - pl, behavior: reduce ? 'auto' : 'smooth' }); }
    track.addEventListener('scroll', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(centre); }, { passive: true });
    car.querySelector('.car-prev').addEventListener('click', function () { go(idx - 1); });
    car.querySelector('.car-next').addEventListener('click', function () { go(idx + 1); });
    track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); } });
    /* clicking a side photo brings it to the centre first */
    items.forEach(function (it, k) { it.querySelector('button').addEventListener('click', function (e) { if (k !== idx) { e.stopImmediatePropagation(); go(k); } }, true); });
    window.addEventListener('resize', function () { go(idx); });
    centre();
  });

  /* Testimonial slider */
  d.querySelectorAll('[data-tslider]').forEach(function (ts) {
    var track = ts.querySelector('.t-track'), cards = track.children, dotsBox = ts.querySelector('.t-dots'), dots = [];
    function per() { return Math.max(1, Math.round(track.clientWidth / cards[0].offsetWidth)); }
    function pages() { return Math.max(1, Math.ceil(cards.length - per() + 1)); }
    function build() {
      dotsBox.innerHTML = ''; dots = [];
      for (var i = 0; i < pages(); i++) { var b = d.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Show testimonial ' + (i + 1)); (function (k) { b.addEventListener('click', function () { goT(k); }); })(i); dotsBox.appendChild(b); dots.push(b); }
      sync();
    }
    function at() { var w = cards[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0); return Math.round(track.scrollLeft / w); }
    function goT(k) { var w = cards[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0); k = Math.max(0, Math.min(pages() - 1, k)); track.scrollTo({ left: k * w, behavior: reduce ? 'auto' : 'smooth' }); }
    function sync() { var k = at(); dots.forEach(function (b, i) { b.setAttribute('aria-current', String(i === k)); }); }
    track.addEventListener('scroll', function () { requestAnimationFrame(sync); }, { passive: true });
    ts.querySelector('.t-prev').addEventListener('click', function () { goT(at() - 1); });
    ts.querySelector('.t-next').addEventListener('click', function () { var k = at() + 1; goT(k >= pages() ? 0 : k); });
    window.addEventListener('resize', build); build();
  });

  /* Service-area map <-> list highlight */
  d.querySelectorAll('[data-areas]').forEach(function (box) {
    function hl(s, on) { box.querySelectorAll('[data-area="' + s + '"]').forEach(function (el) { el.classList.toggle('on', on); }); }
    box.querySelectorAll('[data-area]').forEach(function (el) {
      var s = el.getAttribute('data-area');
      ['mouseenter', 'focus'].forEach(function (ev) { el.addEventListener(ev, function () { hl(s, true); }); });
      ['mouseleave', 'blur'].forEach(function (ev) { el.addEventListener(ev, function () { hl(s, false); }); });
    });
  });

  /* Mobile quick-contact bar: on pages with the home hero, appear only after the hero buttons scroll away. */
  var mbar = d.querySelector('.mbar'), heroEl = d.querySelector('.hero');
  if (mbar) {
    if (!heroEl) mbar.classList.add('is-on');
    else { var mbT = function () { mbar.classList.toggle('is-on', window.scrollY > heroEl.offsetHeight * 0.6); }; mbT(); window.addEventListener('scroll', mbT, { passive: true }); }
  }

  /* Review cards: show "Read full review" only when the text is longer than the shared 5-line height. */
  function fitQuotes() {
    d.querySelectorAll('.quote').forEach(function (q) {
      var p = q.querySelector('blockquote p'), b = q.querySelector('.q-more'); if (!p || !b) return;
      if (q.classList.contains('is-open')) return;
      b.hidden = !(p.scrollHeight > p.clientHeight + 2);
    });
  }
  d.querySelectorAll('.q-more').forEach(function (b) {
    b.addEventListener('click', function () {
      var q = b.closest('.quote'), open = !q.classList.contains('is-open');
      q.classList.toggle('is-open', open); b.setAttribute('aria-expanded', String(open)); b.textContent = open ? 'Show less' : 'Read full review';
    });
  });
  fitQuotes(); if (d.fonts && d.fonts.ready) d.fonts.ready.then(fitQuotes);
  var fqT; window.addEventListener('resize', function () { clearTimeout(fqT); fqT = setTimeout(fitQuotes, 150); });

  /* Gallery packer: assigns explicit grid spots so every row is filled (no gaps), for any filter and column count. */
  var gal = d.querySelector('.gallery');
  function packGallery() {
    if (!gal) return;
    var all = gal.querySelectorAll('.g-item'), items = [];
    all.forEach(function (it) { it.style.gridColumn = ''; it.style.gridRow = ''; if (!it.hidden) items.push(it); });
    var C = getComputedStyle(gal).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
    function put(it, c, r, cs, rs) { it.style.gridColumn = c + ' / span ' + cs; it.style.gridRow = r + ' / span ' + rs; }
    var i = 0, n = items.length, row = 1, blk = 0;
    while (i < n) {
      var rem = n - i;
      if (C >= 3 && blk % 3 === 0 && rem >= 2 * C - 2) {
        /* 2-row block: one tall photo on alternating sides, one wide photo, singles fill the rest */
        var left = (blk / 3) % 2 === 0, tc = left ? 1 : C, s0 = left ? 2 : 1;
        put(items[i++], tc, row, 1, 2);
        put(items[i++], s0, row, 2, 1);
        for (var c = s0 + 2; c < s0 + C - 1; c++) put(items[i++], c, row, 1, 1);
        for (c = s0; c < s0 + C - 1; c++) put(items[i++], c, row + 1, 1, 1);
        row += 2;
      } else if (C >= 2 && blk % 3 === 1 && rem >= C - 1 && rem !== C) {
        /* row with one wide photo */
        var wpos = C === 2 ? 1 : ((blk % 2) ? C - 1 : 1);
        for (c = 1; c <= C; c++) { if (c === wpos) { put(items[i++], c, row, 2, 1); c++; } else put(items[i++], c, row, 1, 1); }
        row += 1;
      } else if (rem >= C) {
        for (c = 1; c <= C; c++) put(items[i++], c, row, 1, 1);
        row += 1;
      } else {
        /* last partial row: stretch the remaining photos to fill the full width */
        var base = Math.floor(C / rem), extra = C % rem, col = 1;
        for (var k = 0; k < rem; k++) { var w = base + (k < extra ? 1 : 0); put(items[i++], col, row, w, 1); col += w; }
        row += 1;
      }
      blk++;
    }
  }
  if (gal) { packGallery(); var pgT; window.addEventListener('resize', function () { clearTimeout(pgT); pgT = setTimeout(packGallery, 120); }); }

  /* Gallery filter */
  var filters = d.querySelectorAll('.filter'), gcount = d.querySelector('.g-count');
  filters.forEach(function (f) {
    f.addEventListener('click', function () {
      var cat = f.getAttribute('data-filter'), n = 0;
      filters.forEach(function (x) { x.setAttribute('aria-pressed', String(x === f)); });
      d.querySelectorAll('.g-item').forEach(function (it) { var show = cat === 'all' || it.getAttribute('data-cat') === cat; it.hidden = !show; if (show) { n++; it.style.animation = 'none'; it.offsetHeight; it.style.animation = ''; } }); packGallery();
      if (gcount) gcount.textContent = cat === 'all' ? 'Showing all ' + n + ' photos' : 'Showing ' + n + ' ' + f.firstChild.textContent.trim().toLowerCase() + ' photos';
    });
  });

  /* Projects showcase tabs + thumbnails */
  d.querySelectorAll('[data-showcase]').forEach(function (sc) {
    var tabs = sc.querySelectorAll('[role=tab]');
    function sel(t, focus) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; var pnl = d.getElementById(x.getAttribute('aria-controls')); if (pnl) pnl.hidden = !on; }); if (focus) t.focus(); }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(t); });
      t.addEventListener('keydown', function (e) { var k = e.key, n = k === 'ArrowRight' ? i + 1 : k === 'ArrowLeft' ? i - 1 : k === 'Home' ? 0 : k === 'End' ? tabs.length - 1 : null; if (n === null) return; e.preventDefault(); sel(tabs[(n + tabs.length) % tabs.length], true); });
    });
    sc.querySelectorAll('.sc-panel').forEach(function (pnl) {
      var main = pnl.querySelector('.sc-main img'), src = pnl.querySelector('.sc-main source'), cap = pnl.querySelector('.sc-cap span');
      pnl.querySelectorAll('.sc-thumb').forEach(function (b) {
        b.addEventListener('click', function () {
          pnl.querySelectorAll('.sc-thumb').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          if (src) src.remove(); src = null;
          main.removeAttribute('srcset'); main.src = b.getAttribute('data-src'); main.alt = b.getAttribute('data-alt'); if (cap) cap.textContent = b.getAttribute('data-alt');
        });
      });
    });
    sc.querySelectorAll('[data-goto]').forEach(function (b) {
      b.addEventListener('click', function () { var f = d.querySelector('.filter[data-filter="' + b.getAttribute('data-goto') + '"]'); if (f) f.click(); var g = d.getElementById('gallery'); if (g) g.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
    });
  });

  /* Service-area county filter */
  var afs = d.querySelectorAll('[data-afilter]');
  afs.forEach(function (f) {
    f.addEventListener('click', function () {
      var c = f.getAttribute('data-afilter');
      afs.forEach(function (x) { x.setAttribute('aria-pressed', String(x === f)); });
      d.querySelectorAll('[data-county]').forEach(function (it) { var show = c === 'all' || it.getAttribute('data-county') === c; it.hidden = !show; if (show) { it.style.animation = 'none'; it.offsetHeight; it.style.animation = ''; } });
    });
  });

  /* Lightbox with prev/next, keyboard, swipe and thumbnails */
  var lb = d.getElementById('lightbox');
  if (lb && typeof lb.showModal === 'function') {
    var lbImg = lb.querySelector('.lb-stage img'), capB = lb.querySelector('.lb-cap b'), capS = lb.querySelector('.lb-cap span'), lbN = lb.querySelector('.lb-n'), thumbs = lb.querySelector('.lb-thumbs'), opener = null, list = [], li = 0;
    function visible() { return Array.prototype.filter.call(d.querySelectorAll('.g-open'), function (b) { var it = b.closest('.g-item'); return !(it && it.hidden); }); }
    function render() {
      var b = list[li], src = b.querySelector('img');
      lbImg.style.animation = 'none'; lbImg.offsetHeight; lbImg.style.animation = '';
      lbImg.src = b.getAttribute('data-full'); lbImg.alt = src ? src.alt : '';
      if (src) { lbImg.width = src.naturalWidth || src.width; lbImg.height = src.naturalHeight || src.height; }
      capB.textContent = b.getAttribute('data-cat') || ''; capS.textContent = src ? src.alt : '';
      lbN.textContent = (li + 1) + ' / ' + list.length;
      Array.prototype.forEach.call(thumbs.children, function (t, k) { t.setAttribute('aria-current', String(k === li)); if (k === li && t.scrollIntoView) t.scrollIntoView({ block: 'nearest', inline: 'center' }); });
    }
    function open(b) {
      list = visible(); li = Math.max(0, list.indexOf(b)); opener = b;
      thumbs.innerHTML = '';
      list.forEach(function (x, k) { var im = x.querySelector('img'), t = d.createElement('button'); t.type = 'button'; t.setAttribute('aria-label', 'Show photo ' + (k + 1)); t.innerHTML = '<img alt="" src="' + (im.currentSrc || im.src) + '">'; t.addEventListener('click', function () { li = k; render(); }); thumbs.appendChild(t); });
      render(); lb.showModal();
    }
    function step(n) { li = (li + n + list.length) % list.length; render(); }
    d.querySelectorAll('.g-open').forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
    lb.querySelector('.lb-close').addEventListener('click', function () { lb.close(); });
    lb.querySelector('.lb-prev').addEventListener('click', function () { step(-1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { step(1); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); sx = null; });
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
      e.preventDefault();
      /* Honeypot: bots fill the hidden field; quietly stop. */
      var hp = d.getElementById('f-website'); if (hp && hp.value) return;
      /* Delivery: our Google Apps Script lead relay emails a branded notification to the owner (agency copied)
         and logs the lead to a Google Sheet. Success is shown ONLY when the relay answers ok:true.
         Timeout or error shows a prefilled email + phone fallback. */
      var to = form.getAttribute('data-to'), cc = form.getAttribute('data-cc') || '';
      var f = function (id) { var el = d.getElementById(id); return el ? (el.value || '').trim() : ''; };
      var data = { name: f('f-name'), phone: f('f-phone'), location: f('f-loc'), service: f('f-svc'), description: f('f-desc'), email: f('f-email'), timeline: f('f-time') };
      var labels = { name: 'Name', phone: 'Phone', location: 'Project location', service: 'Service needed', description: 'Project description', email: 'Email', timeline: 'Timeline' };
      var lines = Object.keys(data).filter(function (k) { return data[k]; }).map(function (k) { return labels[k] + ': ' + data[k]; });
      var subj = 'New estimate request: ' + data.service + ' in ' + data.location;
      var fsEl = form.querySelector('[name="form_start"]'), st0 = fsEl && Number(fsEl.value);
      var payload = { form: 'estimate', page: location.href.split('#')[0], title: d.title, website: hp ? hp.value : '', t: st0 ? Date.now() - st0 : 0 };
      Object.keys(data).forEach(function (k) { payload[k] = data[k]; });
      var btn = form.querySelector('[type="submit"]'), lbl = btn ? btn.textContent : '', fin = false, fb = form.querySelector('.f-fallback');
      if (fb) fb.hidden = true;
      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Sending…'; }
      status.hidden = false; status.classList.add('is-sending'); status.textContent = 'Sending your request…';
      var ac = window.AbortController ? new AbortController() : null;
      var tm = setTimeout(function () { if (ac) ac.abort(); finish(false); }, 15000);
      function finish(ok) {
        if (fin) return; fin = true; clearTimeout(tm);
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.textContent = lbl; }
        if (ok) {
          try { sessionStorage.setItem('bx_lead', '1'); } catch (x) {}
          status.className = 'f-status is-ok'; status.textContent = 'Sent. Taking you to the confirmation page…';
          var home = d.querySelector('a.brand'); location.href = new URL('thank-you/', home ? home.href : location.origin + '/').href;
          return;
        }
        status.className = 'f-status is-error'; status.hidden = true;
        if (fb) {
          var m = fb.querySelector('[data-mailto]');
          if (m) m.href = 'mailto:' + to + '?cc=' + encodeURIComponent(cc) + '&subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(lines.join('\n') + '\n\nSent from ' + location.href);
          fb.hidden = false; fb.setAttribute('tabindex', '-1'); fb.focus();
        }
        track('form_error', { form_id: 'estimate', form_delivery: 'fallback' });
      }
      fetch(form.getAttribute('action'), { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), signal: ac ? ac.signal : undefined })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && j.ok === true; }); })
        .then(finish).catch(function () { finish(false); });
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

  /* Footer: collapsible link groups on mobile, open on desktop */
  (function () {
    var cols = d.querySelectorAll('.ft-col'); if (!cols.length) return;
    var mq = window.matchMedia('(max-width:860px)');
    function set() { cols.forEach(function (c) { if (mq.matches) c.removeAttribute('open'); else c.setAttribute('open', ''); }); }
    cols.forEach(function (c) { c.querySelector('summary').addEventListener('click', function (e) { if (!mq.matches) e.preventDefault(); }); });
    set(); if (mq.addEventListener) mq.addEventListener('change', set);
  })();
  /* Home: dig a test hole game */
  (function () {
    var root = d.querySelector('[data-dig]'); if (!root) return;
    var cv = root.querySelector('.dig-canvas'), ctx = cv.getContext('2d'), fx = root.querySelector('.dig-fx'), fctx = fx.getContext('2d');
    var site = root.querySelector('.dig-site'), pit = root.querySelector('.dig-pit'), bucket = root.querySelector('.dig-bucket'), msg = root.querySelector('[data-dig-msg]');
    var elDepth = root.querySelector('[data-dig-depth]'), elBuckets = root.querySelector('[data-dig-buckets]'), elFound = root.querySelector('[data-dig-found]'), elBest = root.querySelector('[data-dig-best]');
    var det = root.querySelector('[data-dig-detector]'), heatTx = root.querySelector('[data-dig-heat]'), toast = root.querySelector('[data-dig-toast]');
    var done = root.querySelector('[data-dig-done]'), digBtn = root.querySelector('[data-dig-btn]'), chips = root.querySelectorAll('.dig-layers li');
    var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches, coarse = window.matchMedia('(pointer:coarse)').matches;
    var W = 600, H = 480, SURF = 60, FT = (H - SURF) / 8, CELL = 10, COLS = W / CELL, ROWS = H / CELL, PILE_X = 78;
    var LAYERS = [
      { top: SURF, bot: 130, c: '#5a3d26', s: '#4a3120', t: 'Topsoil. On a real job we strip this and stockpile it, so the good dirt can go back on your yard when we are done.' },
      { top: 130, bot: 250, c: '#8a6a4c', s: '#7a5c40', t: 'Clay and silt. It holds water, which is why drainage and compaction matter so much through a wet Northwest winter.' },
      { top: 250, bot: 370, c: '#9b8f7c', s: '#867a68', t: 'Gravel and sand. This drains well. For driveways and pads we bring in crushed rock to build a firm base like this.' },
      { top: 370, bot: H, c: '#6c7276', s: '#5a6064', t: 'Rock. Digging is slower down here. This is where heavy equipment earns its keep.' }
    ];
    var SVG = {
      truck: '<svg viewBox="0 0 64 40"><path d="M4 8h30l6 14H4z" fill="#c98a2b" stroke="#6b4310" stroke-width="2" stroke-linejoin="round"/><path d="M40 14h12l8 10v6H40z" fill="#b5762a" stroke="#6b4310" stroke-width="2" stroke-linejoin="round"/><path d="M45 17h6l4 6h-10z" fill="#8fb3c0"/><rect x="2" y="22" width="58" height="8" rx="2" fill="#7d5a2c"/><circle cx="14" cy="32" r="6" fill="#3a3a3a" stroke="#1f1f1f" stroke-width="2"/><circle cx="48" cy="32" r="6" fill="#3a3a3a" stroke="#1f1f1f" stroke-width="2"/><circle cx="14" cy="32" r="2" fill="#999"/><circle cx="48" cy="32" r="2" fill="#999"/><path d="M10 12l6 6M20 10l5 5" stroke="#8a4f12" stroke-width="2" opacity=".6"/></svg>',
      shoe: '<svg viewBox="0 0 40 40"><path d="M8 34V18a12 12 0 0 1 24 0v16h-7V18a5 5 0 0 0-10 0v16z" fill="#9aa3a8" stroke="#5b6468" stroke-width="2"/><circle cx="11.5" cy="22" r="1.4" fill="#5b6468"/><circle cx="28.5" cy="22" r="1.4" fill="#5b6468"/><circle cx="11.5" cy="29" r="1.4" fill="#5b6468"/><circle cx="28.5" cy="29" r="1.4" fill="#5b6468"/></svg>',
      pipe: '<svg viewBox="0 0 200 24" preserveAspectRatio="none"><rect x="0" y="4" width="200" height="16" rx="8" fill="#E8A23A" stroke="#9a6410" stroke-width="2"/><path d="M30 12h24M100 12h24M160 12h24" stroke="#9a6410" stroke-width="2" stroke-dasharray="4 4"/></svg>',
      bottle: '<svg viewBox="0 0 26 52"><path d="M9 2h8v12c0 2 6 6 6 12v20c0 3-2 4-4 4H7c-2 0-4-1-4-4V26c0-6 6-10 6-12z" fill="#4f9a7a" fill-opacity=".85" stroke="#2c5e48" stroke-width="2"/><rect x="8" y="0" width="10" height="5" rx="1" fill="#7a5a3a"/><path d="M8 26v16" stroke="#cfeee0" stroke-width="2.5" stroke-linecap="round" opacity=".7"/></svg>',
      rock: '<svg viewBox="0 0 80 60"><path d="M6 44c-4-14 6-30 22-34 14-4 32 0 42 12 8 10 6 24-4 30-12 6-34 8-48 4-6-2-10-6-12-12z" fill="#8a9196" stroke="#4d555a" stroke-width="2.5"/><path d="M22 20c8-4 18-4 26 0M18 34c10 4 26 4 38-2" stroke="#a9b0b4" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'
    };
    var DEFS = [
      { k: 'truck', name: 'Toy dump truck', w: 64, h: 40, y0: 72, y1: 86, need: .4, t: 'A rusty toy dump truck. Looks like somebody started this job before us.' },
      { k: 'shoe', name: 'Old horseshoe', w: 39, h: 41, y0: 140, y1: 200, need: .4, t: 'An old horseshoe. Lucky dig. A lot of land around here was farm ground first.' },
      { k: 'pipe', name: 'Utility line', w: 190, h: 24, y0: 150, y1: 220, need: .2, t: 'Whoa, a buried utility line. In Washington you call 811 at least two business days before digging so lines get marked first.' },
      { k: 'bottle', name: 'Old glass bottle', w: 26, h: 52, y0: 262, y1: 305, need: .4, t: 'An old glass bottle. Buried junk turns up more often than you would think. It leaves with the spoils.' },
      { k: 'rock', name: 'Big boulder', w: 84, h: 60, y0: 300, y1: 400, need: .4, t: 'A big boulder. We would set this aside for a boulder retaining wall instead of hauling it off.' }
    ];
    var N = DEFS.length, grid, cleared, buckets, maxDepth, found, nFound, reached, started, finished, cleared5, kx, ky, spoil, finds, els, best = 0;
    try { best = +localStorage.getItem('bx_dig_best') || 0; } catch (x) {}
    function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
    function layout() {
      finds = []; var tries = 0;
      DEFS.forEach(function (D) {
        var f, ok;
        do {
          f = { x: 20 + Math.random() * (W - 40 - D.w), y: D.y0 + Math.random() * (D.y1 - D.y0), w: D.w, h: D.h };
          ok = finds.every(function (o) { return f.x + f.w + 24 < o.x || o.x + o.w + 24 < f.x || f.y + f.h + 16 < o.y || o.y + o.h + 16 < f.y; });
        } while (!ok && ++tries < 400);
        finds.push(f);
      });
      pit.innerHTML = DEFS.map(function (D, i) { var f = finds[i]; return '<span class="dig-find f-' + D.k + '" style="left:' + (f.x / W * 100) + '%;top:' + (f.y / H * 100) + '%;width:' + (f.w / W * 100) + '%;height:' + (f.h / H * 100) + '%">' + SVG[D.k] + '</span>'; }).join('');
      els = pit.querySelectorAll('.dig-find');
    }
    function drawSky() {
      ctx.clearRect(0, 0, W, SURF);
      var g = ctx.createLinearGradient(0, 0, 0, SURF); g.addColorStop(0, '#bcd8e5'); g.addColorStop(1, '#e3eef3');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, SURF);
      var h = Math.min(46, Math.sqrt(spoil) * 3.2);
      if (h > 0) { ctx.fillStyle = '#6b4a2f'; ctx.beginPath(); ctx.moveTo(PILE_X - 60 - h * .4, SURF); ctx.quadraticCurveTo(PILE_X, SURF - h * 2, PILE_X + 64 + h, SURF); ctx.fill(); }
      ctx.fillStyle = '#4f8a3a'; ctx.fillRect(0, SURF - 2, W, 2);
      var r = rnd(11);
      for (var gx = 0; gx < W; gx += 5) { var bh = 4 + r() * 5; if (gx > PILE_X - 70 && gx < PILE_X + 70 && h > 8) continue; ctx.beginPath(); ctx.moveTo(gx, SURF); ctx.lineTo(gx + 2.5, SURF - bh); ctx.lineTo(gx + 5, SURF); ctx.fill(); }
    }
    function drawGround() {
      var r = rnd(7);
      LAYERS.forEach(function (L, i) {
        ctx.fillStyle = L.c; ctx.beginPath(); ctx.moveTo(0, L.top);
        for (var x = 0; x <= W; x += 20) ctx.lineTo(x, L.top + (i ? Math.sin(x / 60 + i) * 6 : 0));
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      });
      LAYERS.forEach(function (L, i) {
        ctx.fillStyle = L.s;
        for (var n = 0; n < 260; n++) {
          var x = r() * W, y = L.top + 8 + r() * (L.bot - L.top - 12), s = i === 2 ? 2 + r() * 4 : i === 3 ? 3 + r() * 8 : 1 + r() * 2.5;
          ctx.beginPath(); ctx.arc(x, y, s, 0, 6.3); ctx.fill();
        }
      });
      ctx.fillStyle = '#5f9a45'; ctx.fillRect(0, SURF, W, 9);
    }
    function reset(first) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = fx.width = W * dpr; cv.height = fx.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      grid = new Uint8Array(COLS * ROWS); cleared = 0; buckets = 0; maxDepth = 0; found = []; nFound = 0; reached = -1; started = finished = cleared5 = false; kx = W / 2; ky = SURF; spoil = 0; parts = [];
      ctx.globalCompositeOperation = 'source-over'; drawGround(); drawSky(); layout();
      chips.forEach(function (c) { c.classList.remove('on'); });
      done.hidden = true; digBtn.hidden = false; toast.classList.remove('show');
      say(first ? (coarse ? 'Drag your finger on the ground to start digging.' : 'Click and drag on the ground to start digging.') : 'New dig site. Everything is buried somewhere new this time.');
      heat(9999); stats();
      if (!first) track('dig_game_restart');
    }
    function say(t) { msg.textContent = t; }
    function stats() {
      elDepth.textContent = (maxDepth / FT).toFixed(1); elBuckets.textContent = buckets;
      elFound.textContent = nFound + '/' + N; elBest.textContent = best || '–';
    }
    function rank(b) { return b <= 45 ? 'Pro operator' : b <= 75 ? 'Seasoned operator' : 'Rookie operator'; }
    /* Detector: warmer as the bucket nears something still buried */
    function heat(dist) {
      var lv = nFound === N ? 'clear' : dist < 70 ? 'hot' : dist < 140 ? 'warm' : 'cold';
      det.className = 'dig-detector is-' + lv; heatTx.textContent = lv === 'clear' ? 'Detector: all clear' : 'Detector: ' + lv;
    }
    function nearest(x, y) {
      var m = 9999; finds.forEach(function (f, i) { if (found[i]) return; var dx = Math.max(f.x - x, 0, x - f.x - f.w), dy = Math.max(f.y - y, 0, y - f.y - f.h); m = Math.min(m, Math.hypot(dx, dy)); }); return m;
    }
    function layerAt(y) { for (var i = 0; i < LAYERS.length; i++) if (y < LAYERS[i].bot) return i; return 3; }
    function canDig(x, y, R) {
      if (y - R <= SURF + 4) return true;
      var reach = R + 10, c0 = Math.max(0, ((x - reach) / CELL) | 0), c1 = Math.min(COLS - 1, ((x + reach) / CELL) | 0);
      var r0 = Math.max(0, ((y - reach) / CELL) | 0), r1 = Math.min(ROWS - 1, ((y + reach) / CELL) | 0);
      for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) if (grid[r * COLS + c]) return true;
      return false;
    }
    var lastShake = 0;
    function stamp(x, y) {
      y = Math.max(y, SURF + 6); if (y > H - 4 || x < 0 || x > W) return false;
      var L = layerAt(y), R = L === 3 ? 13 : 22;
      if (!canDig(x, y, R)) return false;
      ctx.save(); ctx.beginPath(); ctx.rect(0, SURF + 1, W, H); ctx.clip();
      ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(x, Math.max(y, SURF + R * .3), R, 0, 6.3); ctx.fill();
      ctx.restore(); ctx.globalCompositeOperation = 'source-over';
      var fresh = 0, c0 = Math.max(0, ((x - R) / CELL) | 0), c1 = Math.min(COLS - 1, ((x + R) / CELL) | 0);
      var r0 = Math.max(0, ((y - R) / CELL) | 0), r1 = Math.min(ROWS - 1, ((y + R) / CELL) | 0);
      for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
        var cx = c * CELL + 5, cy = r * CELL + 5, i = r * COLS + c;
        if (cy > SURF && !grid[i] && (cx - x) * (cx - x) + (cy - y) * (cy - y) <= R * R) { grid[i] = 1; fresh++; if (cy + 5 - SURF > maxDepth) maxDepth = Math.min(H - SURF, cy + 5 - SURF); }
      }
      if (!fresh) return true;
      if (!started) { started = true; track('dig_game_start'); }
      if (L === 3 && !reduce && Date.now() - lastShake > 260) { lastShake = Date.now(); site.classList.remove('shake'); void site.offsetWidth; site.classList.add('shake'); }
      cleared += fresh; var nb = Math.floor(cleared / 14);
      if (nb > buckets) { buckets = nb; scoop(); fling(x, y, LAYERS[L].c); }
      var deep = layerAt(SURF + maxDepth - 1);
      if (deep > reached) { for (var k = reached + 1; k <= deep; k++) chips[k].classList.add('on'); reached = deep; say(LAYERS[deep].t); }
      checkFinds(); stats(); return true;
    }
    var tToast;
    function checkFinds() {
      finds.forEach(function (F, i) {
        if (found[i]) return;
        var tot = 0, hit = 0;
        for (var r = (F.y / CELL) | 0; r <= ((F.y + F.h) / CELL | 0); r++) for (var c = (F.x / CELL) | 0; c <= ((F.x + F.w) / CELL | 0); c++) { tot++; if (grid[r * COLS + c]) hit++; }
        if (hit / tot >= DEFS[i].need) {
          found[i] = 1; nFound++; say(DEFS[i].t); els[i].classList.add('found');
          toast.textContent = 'Found: ' + DEFS[i].name + ' (' + nFound + '/' + N + ')'; toast.classList.add('show');
          clearTimeout(tToast); tToast = setTimeout(function () { toast.classList.remove('show'); }, 2200);
          track('dig_game_find', { item: DEFS[i].k });
        }
      });
      if (!finished && (nFound === N || maxDepth >= H - SURF - 30)) { finished = true; done.hidden = false; digBtn.hidden = true; }
      if (!cleared5 && nFound === N) {
        cleared5 = true; var nb = buckets, isBest = !best || nb < best;
        if (isBest) { best = nb; try { localStorage.setItem('bx_dig_best', String(nb)); } catch (x) {} }
        heat(0);
        setTimeout(function () { say('All five found in ' + nb + ' buckets. Rank: ' + rank(nb) + '.' + (isBest ? ' That is your best round yet.' : ' Your best is ' + best + '.') + ' Ready for the real thing? Our crew brings the big bucket.'); }, 1800);
        track('dig_game_complete', { finds: N, buckets: nb });
      } else if (!cleared5 && finished && maxDepth >= H - SURF - 30 && nFound < N && !hitBottomSaid) { hitBottomSaid = true; say('You hit bottom. ' + (N - nFound) + ' more ' + (N - nFound === 1 ? 'thing is' : 'things are') + ' still buried. Check the detector and dig sideways.'); }
    }
    var hitBottomSaid = false;
    /* Dirt that flies from the bucket onto the spoil pile */
    var parts = [], raf = 0;
    function fling(x, y, col) {
      if (reduce) { spoil = buckets; drawSky(); return; }
      var now = performance.now();
      for (var i = 0; i < 6; i++) parts.push({ x0: x + (Math.random() - .5) * 16, y0: y, x1: PILE_X + (Math.random() - .5) * 60, y1: SURF - 4 - Math.random() * 8, t0: now + i * 25, dur: 520 + Math.random() * 220, s: 2.5 + Math.random() * 3, c: col, last: i === 5 });
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function tick(now) {
      fctx.clearRect(0, 0, W, H);
      parts = parts.filter(function (p) {
        var t = (now - p.t0) / p.dur; if (t < 0) return true;
        if (t >= 1) { if (p.last) { spoil = Math.max(spoil, Math.min(buckets, spoil + 1)); drawSky(); } return false; }
        var e = 1 - Math.pow(1 - t, 2), x = p.x0 + (p.x1 - p.x0) * e, y = p.y0 + (p.y1 - p.y0) * e - Math.sin(Math.PI * t) * Math.min(70, p.y0 - 14);
        fctx.fillStyle = p.c; fctx.beginPath(); fctx.arc(x, y, p.s, 0, 6.3); fctx.fill(); return true;
      });
      raf = parts.length ? requestAnimationFrame(tick) : 0;
      if (!raf && spoil < buckets) { spoil = buckets; drawSky(); }
    }
    var tScoop; function scoop() { if (reduce) return; bucket.classList.add('scoop'); clearTimeout(tScoop); tScoop = setTimeout(function () { bucket.classList.remove('scoop'); }, 140); }
    function pt(e) { var b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height, px: e.clientX - b.left, py: e.clientY - b.top }; }
    function moveBucket(px, py) { bucket.style.left = px + 'px'; bucket.style.top = py + 'px'; }
    var down = false, last = null;
    function line(a, b) { var dx = b.x - a.x, dy = b.y - a.y, n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 6)); for (var i = 1; i <= n; i++) stamp(a.x + dx * i / n, a.y + dy * i / n); }
    cv.addEventListener('pointerdown', function (e) { down = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} var p = pt(e); last = p; stamp(p.x, p.y); heat(nearest(p.x, p.y)); moveBucket(p.px, p.py); if (e.pointerType === 'mouse') bucket.classList.add('show'); e.preventDefault(); });
    cv.addEventListener('pointermove', function (e) { var p = pt(e); heat(nearest(p.x, p.y)); if (e.pointerType === 'mouse') { bucket.classList.add('show'); moveBucket(p.px, p.py); } if (!down) return; line(last, p); last = p; });
    function up() { down = false; last = null; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', function () { bucket.classList.remove('show'); });
    function deepestNear(x) { var best = SURF; for (var r = 0; r < ROWS; r++) for (var c = Math.max(0, ((x - 15) / CELL) | 0); c <= Math.min(COLS - 1, ((x + 15) / CELL) | 0); c++) if (grid[r * COLS + c]) best = Math.max(best, r * CELL + 5); return best; }
    function aim() { var b = cv.getBoundingClientRect(); moveBucket(kx * b.width / W, ky * b.height / H); bucket.classList.add('show'); heat(nearest(kx, ky)); }
    function digDown() { ky = Math.min(deepestNear(kx) + 16, H - 6); stamp(kx, ky); aim(); }
    digBtn.addEventListener('click', digDown);
    root.querySelector('[data-dig-reset]').addEventListener('click', function () { hitBottomSaid = false; reset(false); });
    cv.addEventListener('keydown', function (e) {
      var k = e.key, step = 16;
      if (k === 'ArrowLeft') kx = Math.max(10, kx - step); else if (k === 'ArrowRight') kx = Math.min(W - 10, kx + step);
      else if (k === 'ArrowDown') ky = Math.min(H - 6, ky + step); else if (k === 'ArrowUp') ky = Math.max(SURF, ky - step);
      else if (k === ' ' || k === 'Enter') { if (!stamp(kx, ky)) say('Dig from the surface or the edge of your hole. Use the arrow keys to aim.'); }
      else return;
      e.preventDefault(); aim();
    });
    cv.addEventListener('blur', function () { bucket.classList.remove('show'); });
    reset(true);
  })();

})();
