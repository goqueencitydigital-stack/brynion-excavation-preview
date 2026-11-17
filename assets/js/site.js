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
      /* Delivery (same setup as our other client sites): FormSubmit AJAX to the owner's inbox, agency copied.
         Success is shown ONLY when FormSubmit answers success:"true". Timeout or error shows a prefilled email + phone. */
      var to = form.getAttribute('data-to'), cc = form.getAttribute('data-cc') || '';
      var f = function (id) { var el = d.getElementById(id); return el ? (el.value || '').trim() : ''; };
      var data = { name: f('f-name'), phone: f('f-phone'), project_location: f('f-loc'), service: f('f-svc'), description: f('f-desc'), email: f('f-email'), timeline: f('f-time') };
      var labels = { name: 'Name', phone: 'Phone', project_location: 'Project location', service: 'Service needed', description: 'Project description', email: 'Email', timeline: 'Timeline' };
      var lines = Object.keys(data).filter(function (k) { return data[k]; }).map(function (k) { return labels[k] + ': ' + data[k]; });
      var subj = 'New estimate request: ' + data.service + ' in ' + data.project_location;
      var payload = {}; Object.keys(data).forEach(function (k) { if (data[k]) payload[labels[k]] = data[k]; });
      payload['Page'] = location.pathname; payload._subject = subj; payload._template = 'table'; payload._captcha = 'false';
      if (cc) payload._cc = cc; if (data.email) payload._replyto = data.email;
      var btn = form.querySelector('[type="submit"]'), lbl = btn ? btn.textContent : '', fin = false, fb = form.querySelector('.f-fallback');
      if (fb) fb.hidden = true;
      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Sending…'; }
      status.hidden = false; status.classList.add('is-sending'); status.textContent = 'Sending your request…';
      var ac = window.AbortController ? new AbortController() : null;
      var tm = setTimeout(function () { if (ac) ac.abort(); finish(false); }, 10000);
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
      fetch(form.getAttribute('action'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload), signal: ac ? ac.signal : undefined })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && String(j.success) === 'true'; }); })
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
})();
