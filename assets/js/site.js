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
      dots.forEach(function (b, k) { b.setAttribute('aria-current', String(k === cur)); });
      if (cap) cap.textContent = slides[cur].getAttribute('data-cap');
    }
    function play() { clearInterval(timer); if (!paused) timer = setInterval(function () { show(cur + 1); }, 6500); }
    dots.forEach(function (b) { b.addEventListener('click', function () { show(+b.getAttribute('data-i')); play(); }); });
    if (pause) {
      if (reduce) { pause.setAttribute('aria-pressed', 'true'); pause.textContent = 'Play slideshow'; }
      pause.addEventListener('click', function () { paused = !paused; pause.setAttribute('aria-pressed', String(paused)); pause.textContent = paused ? 'Play slideshow' : 'Pause slideshow'; play(); });
    }
    hero.addEventListener('focusin', function () { clearInterval(timer); });
    hero.addEventListener('focusout', play);
    d.addEventListener('visibilitychange', function () { if (d.hidden) clearInterval(timer); else play(); });
    /* load the other slides after the page settles, so the first photo stays fast */
    window.addEventListener('load', function () { setTimeout(function () { slides.forEach(function (s) { s.querySelectorAll('[data-srcset],[data-src]').forEach(function (el) { if (el.dataset.srcset) el.srcset = el.dataset.srcset; if (el.dataset.src) el.src = el.dataset.src; }); }); play(); }, 2500); });
  }

  /* Project carousel: centre-focused, swipe or arrows */
  d.querySelectorAll('[data-carousel]').forEach(function (car) {
    var track = car.querySelector('.car-track'), items = car.querySelectorAll('.car-slide'), num = car.querySelector('.car-i'), bar = car.querySelector('.car-bar i'), idx = 0, raf = 0;
    function centre() {
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bd = 1e9;
      items.forEach(function (it, k) { var c = it.offsetLeft + it.offsetWidth / 2, dd = Math.abs(c - mid); if (dd < bd) { bd = dd; best = k; } });
      if (best !== idx || !items[best].classList.contains('is-center')) {
        idx = best; items.forEach(function (it, k) { it.classList.toggle('is-center', k === idx); });
        if (num) num.textContent = String(idx + 1).padStart(2, '0');
        if (bar) bar.style.width = ((idx + 1) / items.length * 100) + '%';
      }
    }
    function go(k) { k = (k + items.length) % items.length; var it = items[k]; track.scrollTo({ left: it.offsetLeft - (track.clientWidth - it.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' }); }
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

  /* Gallery filter */
  var filters = d.querySelectorAll('.filter'), gcount = d.querySelector('.g-count');
  filters.forEach(function (f) {
    f.addEventListener('click', function () {
      var cat = f.getAttribute('data-filter'), n = 0;
      filters.forEach(function (x) { x.setAttribute('aria-pressed', String(x === f)); });
      d.querySelectorAll('.g-item').forEach(function (it) { var show = cat === 'all' || it.getAttribute('data-cat') === cat; it.hidden = !show; if (show) { n++; it.style.animation = 'none'; it.offsetHeight; it.style.animation = ''; } });
      if (gcount) gcount.textContent = cat === 'all' ? 'Showing all ' + n + ' photos' : 'Showing ' + n + ' ' + f.firstChild.textContent.trim().toLowerCase() + ' photos';
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
      var ph = d.getElementById('f-photos'), badPh = false;
      if (ph && ph.files) { var tot = 0; if (ph.files.length > 3) badPh = true; for (var i = 0; i < ph.files.length; i++) tot += ph.files[i].size; if (tot > 4000000) badPh = true; }
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
      /* Live: /api/estimate (Vercel function) validates again, emails the lead, and only redirects to /thank-you/
         after the email provider confirms delivery. On failure it returns to /contact/?sent=error.
         The flag below lets the thank-you page count one lead; it carries no personal data. */
      try { sessionStorage.setItem('bx_lead', '1'); } catch (x) {}
      var btn = form.querySelector('[type="submit"]'); if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      status.hidden = false; status.classList.add('is-sending'); status.textContent = 'Sending your request…';
    });
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) { var btn = form.querySelector('[type="submit"]'); if (btn) { btn.disabled = false; btn.textContent = 'Request my free estimate'; } status.hidden = true; }
    });
  }

  /* Delivery failure: the server sent the visitor back here; show an honest error and clear the lead flag */
  if (form && /[?&]sent=error/.test(location.search)) {
    try { sessionStorage.removeItem('bx_lead'); } catch (x) {}
    var st = form.querySelector('.f-status');
    if (st) { st.hidden = false; st.className = 'f-status is-error'; st.innerHTML = 'Sorry, your request did not go through. Please call or text <a href="tel:+13604856579">(360) 485-6579</a>, or try the form again.'; }
    track('form_error', { form_id: 'estimate' });
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
