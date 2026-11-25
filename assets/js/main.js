/* Gennext — Version 3 behaviour. Plain JavaScript, no libraries. */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* Header state + mobile menu */
  const header = $('.header');
  const onScroll = () => header && header.classList.toggle('scrolled', scrollY > 10);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const menuBtn = $('.menu-btn'), links = $('.nav-links');
  menuBtn && menuBtn.addEventListener('click', () => { const o = links.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); });

  /* Smooth image arrival */
  $$('main img').forEach(img => {
    if (img.complete && img.naturalWidth) return;
    img.classList.add('fade');
    const ok = () => img.classList.add('ok');
    img.addEventListener('load', ok, { once: true }); img.addEventListener('error', ok, { once: true });
  });

  /* One observer drives every entrance */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    if (e.target.dataset.count !== undefined) countUp(e.target);
  }), { threshold: .18, rootMargin: '0px 0px -40px 0px' });
  $$('.rv, .tiles, .props, .chev-art.reveal-x, .leader, .bubbles, [data-count]').forEach(el => reduce ? el.classList.add('in') : io.observe(el));
  $$('.tiles .tile, .props .prop, .bubbles .bubble').forEach(el => el.style.setProperty('--i', [...el.parentNode.children].indexOf(el)));

  /* Count-up stat tiles */
  function countUp(el) {
    const end = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = end + suf; return; }
    const t0 = performance.now(), dur = 1500;
    const tick = t => { const k = Math.min((t - t0) / dur, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suf; if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  $$('[data-count]').forEach(el => { if (!reduce) el.textContent = '0' + (el.dataset.suffix || ''); });

  /* Gentle parallax on chevron art (desktop only) */
  const arts = $$('.chev-art[data-par]');
  if (arts.length && !reduce && matchMedia('(min-width: 961px)').matches) {
    let tk = false;
    const par = () => {
      arts.forEach(a => {
        const r = a.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        a.style.translate = `0 ${(k * -60).toFixed(1)}px`;
      });
      tk = false;
    };
    addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(par); } }, { passive: true });
    par();
  }

  /* Hero: landmarks revealed through the chevron, one after another */
  const slides = $('.slides');
  if (slides) {
    const figs = $$('figure', slides), dots = $$('.slide-dots button');
    let i = 0, timer;
    const go = n => {
      const prev = figs[i]; i = (n + figs.length) % figs.length;
      figs.forEach(f => f.classList.remove('off'));
      if (prev !== figs[i]) { prev.classList.remove('on'); prev.classList.add('off'); }
      figs[i].classList.add('on');
      dots.forEach((d, k) => d.setAttribute('aria-current', k === i));
    };
    const play = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => go(i + 1), 4800); };
    dots.forEach((d, k) => d.addEventListener('click', () => { go(k); play(); }));
    go(0); play();
    document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(timer) : play());
  }

  /* Solution portfolio explorer */
  const ex = $('.explorer');
  if (ex) {
    const DATA = JSON.parse($('#practices').textContent);
    const btns = $$('.p-list button', ex), body = $('.p-body', ex), arts2 = $$('.p-art img', ex);
    let cur = -1;
    const show = k => {
      if (k === cur) return;
      const prev = cur; cur = k; const d = DATA[k];
      btns.forEach((b, j) => b.setAttribute('aria-selected', j === k));
      arts2.forEach(a => a.classList.remove('off'));
      if (prev > -1) { arts2[prev].classList.remove('on'); arts2[prev].classList.add('off'); }
      arts2[k].classList.add('on');
      body.innerHTML = `<div class="swap"><div class="kick">${esc(d.kick)}</div><h3>${esc(d.title)}</h3><p>${esc(d.text)}</p>
        <ul class="caps">${d.caps.map((c, j) => `<li style="--i:${j}">${esc(c)}</li>`).join('')}</ul>
        ${d.logos.length ? `<div class="p-logos">${d.logos.map(l => `<img src="${l[0]}" alt="${esc(l[1])}" loading="lazy">`).join('')}</div>` : ''}
        <p style="margin-top:1.4rem"><a class="btn btn-ghost" href="solutions.html#${d.id}">More on ${esc(d.kick)}</a></p></div>`;
    };
    btns.forEach((b, k) => {
      b.addEventListener('click', () => show(k));
      b.addEventListener('keydown', e => {
        const n = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (n) { e.preventDefault(); const t = (k + n + btns.length) % btns.length; btns[t].focus(); show(t); }
      });
    });
    show(0);
  }


  /* ---------- Version 4: merged components ---------- */
  // Pause SVG signal animations off screen; stop them for reduced motion
  $$('svg').forEach(svg => {
    if (!svg.querySelector('animateMotion')) return;
    if (reduce) { svg.pauseAnimations(); return; }
    new IntersectionObserver(([e]) => e.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations()).observe(svg);
  });
  // Hero background drifts slower than the page
  const pbg = $('[data-parallax]');
  if (pbg && !reduce) {
    let on = true, tk = false;
    new IntersectionObserver(([e]) => on = e.isIntersecting).observe(pbg.parentElement);
    addEventListener('scroll', () => { if (!on || tk) return; tk = true; requestAnimationFrame(() => { pbg.style.transform = `translate3d(0,${scrollY * .22}px,0)`; tk = false; }); }, { passive: true });
  }
  // Generic "select one, or let it play" controller
  function cycler({ items, data, render, panelProg, dur, target }) {
    let idx = 0, auto = !reduce, seen = false, timer;
    const show = i => { idx = (i + data.length) % data.length; render(idx);
      if (panelProg) { panelProg.classList.remove('run'); void panelProg.offsetWidth; if (auto && seen) panelProg.classList.add('run'); } };
    const play = () => { clearInterval(timer); if (auto && seen) timer = setInterval(() => show(idx + 1), dur); };
    const pick = i => { auto = false; clearInterval(timer); panelProg && panelProg.classList.remove('run'); show(i); };
    items.forEach(list => list.forEach((el, k) => {
      el.addEventListener('click', () => pick(k));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(k); }
        const n = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (n) { e.preventDefault(); pick(idx + n); list[idx] && list[idx].focus(); }
      });
    }));
    panelProg && panelProg.style.setProperty('--dur', dur + 'ms');
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) { show(idx); play(); } else clearInterval(timer); }, { threshold: .3 }).observe(target);
    show(0);
  }
  // Service hub
  const hub = $('.hub');
  if (hub) {
    const D = JSON.parse($('#hubdata').textContent), nodes = $$('.node', hub), body = $('.hub-panel .body');
    cycler({ items: [nodes], data: D, dur: 5500, target: hub, panelProg: $('.hub-panel .progress'), render: k => {
      const d = D[k];
      nodes.forEach((n, j) => { n.classList.toggle('on', j === k); n.setAttribute('aria-selected', j === k); });
      $$('.trace', hub).forEach((t, j) => t.classList.toggle('on', j === k));
      $$('.packet', hub).forEach(p => p.classList.toggle('on', p.classList.contains('p' + k)));
      body.innerHTML = `<div class="fadein"><div class="pimg"><img src="${d.art}" alt=""><div class="k"><small>${esc(d.kick)}</small>${esc(d.title)}</div></div>
        <div class="txt"><p>${esc(d.text)}</p><ul class="caps">${d.caps.map((c, j) => `<li style="--i:${j}">${esc(c)}</li>`).join('')}</ul>
        <a class="btn btn-ghost" href="solutions.html#${d.id}">Explore ${esc(d.kick)}</a></div></div>`;
    }});
  }
  // Lifecycle wheel
  const ring = $('.ring');
  if (ring) {
    const S = JSON.parse($('#stages').textContent), segs = $$('.seg', ring), btns = $$('.stage-nav button');
    const body = $('.stage-panel .body'), num = $('.hub2 .num', ring), nm = $('.hub2 .nm', ring), runner = $('.runner', ring);
    cycler({ items: [segs, btns], data: S, dur: 6500, target: ring, panelProg: $('.stage-panel .progress'), render: k => {
      const s = S[k];
      segs.forEach((g, j) => { g.classList.toggle('on', j === k); g.setAttribute('aria-selected', j === k); });
      btns.forEach((b, j) => b.setAttribute('aria-selected', j === k));
      num.textContent = k + 1; nm.textContent = s.short;
      runner && runner.setAttribute('transform', `rotate(${k * 72 - 162} 260 260)`);
      body.innerHTML = `<div class="fadein"><span class="step">Stage ${k + 1} of ${S.length}</span><h3>${esc(s.name)}</h3><p>${esc(s.text)}</p>
        <ul>${s.do.map(d => `<li>${esc(d)}</li>`).join('')}</ul><div class="tags">${s.svc.map(v => `<a href="solutions.html#${v[0]}">${esc(v[1])}</a>`).join('')}</div></div>`;
    }});
  }
  // The Gennext line (solutions page): fill as you scroll, light up each stop, sync the sticky nav
  const lr = $('.line-route');
  if (lr) {
    const fill = $('.track .fill', lr), stops = $$('.practice', lr), navA = $$('.practice-nav a');
    let tk = false;
    const upd = () => {
      const r = lr.getBoundingClientRect(), head = innerHeight * .5;
      fill.style.height = Math.max(0, Math.min(r.height, head - r.top)) + 'px';
      let cur = -1;
      stops.forEach((s, i) => { const top = s.getBoundingClientRect().top + 60; const p = top < head; s.classList.toggle('passed', p); if (p) cur = i; });
      stops.forEach((s, i) => s.classList.toggle('here', i === cur));
      navA.forEach((a, i) => a.classList.toggle('on', i === cur));
      const act = navA[cur]; if (act) { const ul = act.closest('ul'); const x = act.offsetLeft - ul.clientWidth / 2 + act.clientWidth / 2; if (Math.abs(ul.scrollLeft - x) > 40) ul.scrollTo({ left: x, behavior: 'smooth' }); }
      tk = false;
    };
    addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
  }

  /* Leadership bios */
  $$('.bio-btn').forEach(b => b.addEventListener('click', () => {
    const l = b.closest('.leader'); const o = l.classList.toggle('open');
    b.setAttribute('aria-expanded', o); b.textContent = o ? 'Hide profile' : 'Read profile';
  }));

  /* Clientele tabs */
  $$('.tabs[data-wall]').forEach(tabs => {
    const wall = $(tabs.dataset.wall);
    const pick = b => {
      $$('button', tabs).forEach(x => x.setAttribute('aria-selected', x === b));
      let n = 0;
      $$('[data-g]', wall).forEach(d => {
        const show = b.dataset.g === 'all' || d.dataset.g === b.dataset.g;
        d.hidden = !show; d.classList.remove('pop');
        if (show && !reduce) { void d.offsetWidth; d.style.setProperty('--i', n++); d.classList.add('pop'); }
      });
    };
    tabs.addEventListener('click', e => { const b = e.target.closest('button'); b && pick(b); });
  });

  /* Partner bubbles: draw faint links between neighbours (desktop) */
  const bub = $('.bubbles');
  if (bub && matchMedia('(min-width: 961px)').matches) {
    const svg = $('svg.links', bub);
    const draw = () => {
      const R = bub.getBoundingClientRect();
      const pts = $$('.bubble', bub).map(b => { const r = b.getBoundingClientRect(); return [r.left - R.left + r.width / 2, r.top - R.top + r.height / 2]; });
      let out = '';
      pts.forEach((p, a) => {
        pts.map((q, b) => [b, Math.hypot(p[0] - q[0], p[1] - q[1])]).filter(x => x[0] > a).sort((x, y) => x[1] - y[1]).slice(0, 2)
          .forEach(([b]) => out += `<line x1="${p[0]}" y1="${p[1]}" x2="${pts[b][0]}" y2="${pts[b][1]}"/>`);
      });
      svg.innerHTML = out;
    };
    setTimeout(draw, 300); addEventListener('resize', () => setTimeout(draw, 200));
  }

  /* News (shared data file) */
  const NEWS = (window.GNX_NEWS || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const LINES = window.GNX_LINES || {};
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const badge = l => `<span class="badge"><b>${(LINES[l] || {}).code || ''}</b>${(LINES[l] || {}).name || ''}</span>`;
  const region = r => r === 'lk' ? 'Sri Lanka' : 'Global';
  const strip = $('#latest');
  if (strip && NEWS.length) strip.innerHTML = NEWS.slice(0, 3).map(n => `<li><a href="news.html#${n.date}-${n.line}">${badge(n.line)}<span class="region">${region(n.region)}</span>
      <h3>${esc(n.title)}</h3><p>${fmt(n.date)}, ${esc(n.source)}</p></a></li>`).join('');
  const board = $('#board');
  if (board) {
    const st = { line: 'all', region: 'all' };
    const render = () => {
      const items = NEWS.filter(n => (st.line === 'all' || n.line === st.line) && (st.region === 'all' || n.region === st.region));
      board.innerHTML = items.length ? items.map(n => `<li id="${n.date}-${n.line}"><div class="row"><time datetime="${n.date}">${fmt(n.date)}</time>
        <div>${badge(n.line)}<span class="region">${region(n.region)}</span><h3><a href="${n.url}" target="_blank" rel="noopener">${esc(n.title)}</a></h3>
        <p class="sum">${esc(n.summary)}</p><p class="src">Source: ${esc(n.source)}</p></div>
        <button class="take-btn" aria-expanded="false">What it means for you</button></div>
        <div class="take"><div><p><b>Gennext view</b>${esc(n.take)}</p></div></div></li>`).join('')
        : `<li class="empty">No stories for this filter yet. Try another, or subscribe and we'll send you the next one.</li>`;
      const c = $('#count'); c && (c.textContent = `${items.length} ${items.length === 1 ? 'story' : 'stories'}`);
    };
    $$('.filters [data-k]').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      $$('.chip', g).forEach(x => x.setAttribute('aria-pressed', x === b)); st[g.dataset.k] = b.dataset.v; render();
    }));
    board.addEventListener('click', e => {
      const b = e.target.closest('.take-btn'); if (!b) return;
      const li = b.closest('li'), o = li.classList.toggle('open');
      b.setAttribute('aria-expanded', o); b.textContent = o ? 'Hide Gennext view' : 'What it means for you';
    });
    render();
    if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) { t.classList.add('open'); t.scrollIntoView({ block: 'center' }); } }
  }
  const feeds = $$('[data-feed]'); let failed = 0;
  feeds.forEach(async ul => {
    try {
      const j = await (await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(ul.dataset.feed))).json();
      if (j.status !== 'ok' || !j.items.length) throw 0;
      ul.innerHTML = j.items.slice(0, 5).map(i => `<li><a href="${i.link}" target="_blank" rel="noopener">${esc(i.title)}</a><small>${fmt(i.pubDate.slice(0, 10))}</small></li>`).join('');
    } catch { ul.closest('.feed-col').hidden = true; if (++failed === feeds.length) { const w = $('.wire'); w && (w.hidden = true); } }
  });

  /* Forms (demo until connected to email / mailing service) */
  $$('form[data-subscribe]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const email = $('input[type=email]', f).value.trim();
    const lines = $$('input[name=line]:checked', f).map(i => (LINES[i.value] || {}).name);
    try { const all = JSON.parse(localStorage.getItem('gnx-subs') || '[]'); all.push({ email, lines, at: new Date().toISOString() }); localStorage.setItem('gnx-subs', JSON.stringify(all)); } catch {}
    $('.form-msg', f).textContent = `Subscribed: ${email}.${lines.length ? ' Topics: ' + lines.join(', ') + '.' : ''}`;
    f.reset();
  }));
  const cf = $('#contact-form');
  cf && cf.addEventListener('submit', e => {
    e.preventDefault();
    const picks = $$('input[name=sol]:checked', cf).map(i => i.parentElement.textContent.trim());
    $('.form-msg', cf).textContent = `Thanks. Our team will contact you about ${picks.join(', ') || 'your enquiry'} within one business day. (Demo form, not yet connected to email.)`;
    cf.reset();
  });

  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
