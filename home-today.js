/* Home sign-up + Today page add-on (test pages: home-test.html, today.html).
   Uses only data the site already has: Supabase auth, subscribers, game_stats,
   favourites, blog_posts, and the proverb list on proverbs.html.
   Audio stays hidden until a file exists at audio/proverb-<id>.mp3. */
(function () {
  'use strict';
  var SB_URL = 'https://kgbmdazcupgyypfvvqbv.supabase.co';
  var SB_KEY = 'sb_publishable_wU4B6n7leK-r1kcrhuOzJw_pUAkC4Mm';
  var sb = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(SB_URL, SB_KEY) : null;
  var page = document.body.getAttribute('data-gws-page') || 'home';
  var homeHref = document.body.getAttribute('data-gws-home') || 'index.html';
  var GAMES = [
    { key: 'wordle', local: 'sf_local_streak_wordle', href: 'geama.html' },
    { key: 'bee', local: 'sf_local_streak_bee_gd', href: 'seillean.html' },
    { key: 'wordle-sco', local: 'sf_local_streak_wordle_sco', href: 'wurd.html' },
    { key: 'bee-sco', local: 'sf_local_streak_bee_sco', href: 'bumbee.html' }
  ];
  var T = {
    suLabel: { en: 'Free daily proverb', gd: 'Seanfhacal làitheil an-asgaidh' },
    suH: { en: 'Get a proverb in your inbox every morning', gd: 'Faigh seanfhacal nad bhogsa-puist gach madainn' },
    suS: { en: 'Gaelic, Scots and English. No password: we email you a code.', gd: 'Gàidhlig, Albais is Beurla. Gun fhacal-faire: cuiridh sinn còd thugad air post-d.' },
    suBtn: { en: 'Sign me up', gd: 'Clàraich mi' },
    sending: { en: 'Sending…', gd: 'Ga chur…' },
    codeSent: { en: 'Check your email and enter the code we sent.', gd: 'Thoir sùil air do phost-d agus cuir a-steach an còd.' },
    codeBtn: { en: 'Confirm', gd: 'Dearbh' },
    errSend: { en: 'Could not send the code. Please try again.', gd: 'Cha b’ urrainn dhuinn an còd a chur. Feuch a-rithist.' },
    errCode: { en: 'That code did not work. Please try again.', gd: 'Cha do dh’obraich an còd sin. Feuch a-rithist.' },
    inLabel: { en: 'You are logged in', gd: 'Tha thu air clàradh a-steach' },
    inH: { en: 'Welcome back', gd: 'Fàilte air ais' },
    goToday: { en: 'Go to your Today page →', gd: 'Rach gu duilleag An-diugh →' },
    saveStreak: { en: 'Nice one! Sign up to save your streak', gd: 'Math thu! Clàraich gus do shreath a ghlèidheadh' },
    newIn: { en: 'New puzzles in', gd: 'Tòimhseachain ùra ann an' },
    done: { en: '✓ Done today', gd: '✓ Dèanta an-diugh' },
    tdTitle: { en: 'Today', gd: 'An-diugh' },
    tdLabel: { en: 'Your day', gd: 'An latha agad' },
    hello: { en: 'Welcome back', gd: 'Fàilte air ais' },
    helloOut: { en: 'Your games today', gd: 'Na geamannan agad an-diugh' },
    sumLeft: { en: '{n} of 4 games left today', gd: '{n} à 4 geamannan air fhàgail an-diugh' },
    sumDone: { en: 'All four games done today. Math thu!', gd: 'Na ceithir geamannan dèanta an-diugh. Math thu!' },
    streak: { en: '{n}-day streak', gd: 'Sreath {n} latha' },
    soH: { en: 'Log in to keep your streak', gd: 'Clàraich a-steach gus do shreath a chumail' },
    soS: { en: 'Until you log in, your games are counted on this device only.', gd: 'Gus an clàraich thu a-steach, chan eil na geamannan agad gan cunntadh ach air an inneal seo.' },
    login: { en: 'Log in', gd: 'Clàraich a-steach' },
    weekH: { en: 'This week’s proverbs', gd: 'Seanfhaclan na seachdain' },
    today: { en: 'Today', gd: 'An-diugh' },
    blogL: { en: 'Latest from the blog', gd: 'As ùire bhon bhlog' },
    blogRead: { en: 'Read it →', gd: 'Leugh e →' },
    savedH: { en: 'Your saved proverbs', gd: 'Na seanfhaclan a shàbhail thu' },
    savedN: { en: '{n} saved', gd: '{n} air an sàbhaladh' },
    savedOut: { en: 'Log in to save favourites across devices.', gd: 'Clàraich a-steach gus annsachdan a shàbhaladh eadar innealan.' },
    savedBtn: { en: 'Open my list', gd: 'Fosgail mo liosta' },
    listen: { en: '▶ Listen', gd: '▶ Èist' },
    tabHome: { en: 'Home', gd: 'Dachaigh' },
    tabProverbs: { en: 'Proverbs', gd: 'Seanfhaclan' },
    tabPlay: { en: 'Play', gd: 'Cluich' },
    tabMenu: { en: 'Menu', gd: 'Clàr-taice' },
    tabToday: { en: 'Today', gd: 'An-diugh' }
  };
  function lang() { try { var r = localStorage.getItem('sf-ui-lang'); return (r && r.indexOf('gd') >= 0) ? 'gd' : 'en'; } catch (e) { return 'en'; } }
  function t(k, n) { var s = T[k] ? (T[k][lang()] || T[k].en) : k; return n == null ? s : s.replace('{n}', n); }
  function $(id) { return document.getElementById(id); }
  function show(el, on) { if (el) el.style.display = on ? '' : 'none'; }
  function dayIdx() { var n = new Date(); return Math.floor((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - Date.UTC(2026, 0, 1)) / 86400000); }
  function localGame(g) { try { var raw = localStorage.getItem(g.local); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }

  var state = { user: null, rows: null, proverbs: null, saved: null, post: null, pendingEmail: '', audio: {} };

  // ---------- styles ----------
  var css = '' +
    '.gt-h{margin:6px 0 4px;font-family:Georgia,"Iowan Old Style",serif;font-size:1.3rem;line-height:1.25}' +
    '.gt-form{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}' +
    '.gt-form input{flex:1;min-width:180px;border:1px solid rgba(142,108,156,.45);border-radius:10px;padding:11px 12px;font:inherit;background:#fff;color:#2b2320}' +
    'html[data-gws-theme="dark"] .gt-form input{background:#1d2039;color:#f0f1f8;border-color:#4a4e6a}' +
    '.gt-status{margin:8px 0 0;min-height:1.2em;font-size:.9rem}' +
    '.gt-status.err{color:#c0392b}' +
    '.gt-today{display:flex;gap:18px;align-items:center}' +
    '.gt-ring{flex:none;width:76px;height:76px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#3d8a5c calc(var(--p,0)*1%),rgba(142,108,156,.28) 0)}' +
    '.gt-ring i{font-style:normal;font-weight:800;width:60px;height:60px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#2b2320}' +
    'html[data-gws-theme="dark"] .gt-ring i{background:#27242c;color:#f3eee6}' +
    '.gt-miles{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap}' +
    '.gt-miles span{font-size:.7rem;border:1px solid rgba(142,108,156,.45);border-radius:999px;padding:1px 8px;font-weight:700}' +
    '.gt-miles span.hit{background:#a3691f;border-color:#a3691f;color:#fff}' +
    '.hp-game.gt-done{border-color:#3d8a5c}' +
    '.gt-donetag{display:block;margin-top:4px;color:#3d8a5c;font-weight:700;font-size:.8rem}' +
    '.gt-week{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin-bottom:18px}' +
    '.gt-week a{text-decoration:none;color:inherit;background:#fff;border:1px solid rgba(142,108,156,.28);border-radius:12px;padding:10px 12px;font-size:.84rem;font-family:Georgia,serif}' +
    'html[data-gws-theme="dark"] .gt-week a{background:#27242c}' +
    '.gt-week a small{display:block;font-family:system-ui,sans-serif;color:#a3691f;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:.64rem;margin-bottom:2px}' +
    '.gt-week a.now{border:2px solid #5b2a86}' +
    '.gt-tabbar{display:none;position:fixed;left:0;right:0;bottom:0;z-index:9990;background:#fff;border-top:1px solid rgba(142,108,156,.3);grid-template-columns:repeat(5,1fr);padding:6px 4px calc(6px + env(safe-area-inset-bottom))}' +
    'html[data-gws-theme="dark"] .gt-tabbar{background:#27242c}' +
    '.gt-tabbar a{text-align:center;text-decoration:none;font-size:.68rem;font-weight:700;color:rgba(43,35,32,.65);padding:4px 0}' +
    'html[data-gws-theme="dark"] .gt-tabbar a{color:rgba(243,238,230,.7)}' +
    '.gt-tabbar a i{display:block;font-style:normal;font-size:1.15rem;line-height:1.2}' +
    '.gt-tabbar a.on{color:#5b2a86}' +
    'html[data-gws-theme="dark"] .gt-tabbar a.on{color:#b48ad6}' +
    '.gt-tabbar a.pl i{background:#f4c430;color:#2b2320;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;margin:-16px auto 0;box-shadow:0 3px 8px rgba(0,0,0,.2)}' +
    '@media(max-width:700px){.gt-tabbar{display:grid}body{padding-bottom:72px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------- phone tab bar ----------
  var bar = document.createElement('nav'); bar.className = 'gt-tabbar';
  bar.innerHTML =
    '<a href="' + homeHref + '" class="' + (page === 'home' ? 'on' : '') + '"><i>⌂</i><span data-gt="tabHome"></span></a>' +
    '<a href="proverbs.html"><i>❝</i><span data-gt="tabProverbs"></span></a>' +
    '<a href="games.html" class="pl"><i>▶</i><span data-gt="tabPlay"></span></a>' +
    '<a href="#" id="gt-tab-menu"><i>☰</i><span data-gt="tabMenu"></span></a>' +
    '<a href="today.html" class="' + (page === 'today' ? 'on' : '') + '"><i>☺</i><span data-gt="tabToday"></span></a>';
  document.body.appendChild(bar);
  $('gt-tab-menu').addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation(); window.scrollTo(0, 0);
    var b = $('nav-menu-btn'); if (b) setTimeout(function () { b.click(); }, 50);
  });

  // ---------- games played today + streak ----------
  function gameStatus() {
    var d = dayIdx(), done = [], streak = 0;
    GAMES.forEach(function (g) {
      var row = null;
      if (state.rows) state.rows.forEach(function (r) { if (r.game === g.key) row = r; });
      var loc = localGame(g);
      var isDone = !!((row && row.last_played_day === d) || (loc && loc.day === d));
      done.push(isDone);
      if (row && row.last_played_day >= d - 1) streak = Math.max(streak, row.current_streak || 0);
      if (loc && loc.day >= d - 1) streak = Math.max(streak, loc.current || 0);
    });
    return { done: done, n: done.filter(Boolean).length, streak: streak };
  }
  function paintGames() {
    var s = gameStatus();
    GAMES.forEach(function (g, i) {
      var a = document.querySelector('.hp-game[href="' + g.href + '"]'); if (!a) return;
      a.classList.toggle('gt-done', s.done[i]);
      var tag = a.querySelector('.gt-donetag');
      if (s.done[i]) { if (!tag) { tag = document.createElement('span'); tag.className = 'gt-donetag'; a.appendChild(tag); } tag.textContent = t('done'); }
      else if (tag) tag.remove();
    });
    if (page === 'today') {
      var ring = $('gt-ring'); if (ring) ring.style.setProperty('--p', s.n * 25);
      if ($('gt-ringn')) $('gt-ringn').textContent = s.n + '/4';
      if ($('gt-hello')) $('gt-hello').textContent = t(state.user ? 'hello' : 'helloOut');
      if ($('gt-sum')) $('gt-sum').textContent = (s.n === 4 ? t('sumDone') : t('sumLeft', 4 - s.n)) + (s.streak ? ' · ' + t('streak', s.streak) + ' 🔥' : '');
      var m = $('gt-miles');
      if (m) m.innerHTML = [3, 7, 30, 100].map(function (x) { return '<span class="' + (s.streak >= x ? 'hit' : '') + '">' + x + '</span>'; }).join('');
      show($('gt-signedout'), !state.user);
    } else if (!state.user && s.n > 0 && $('gt-su-h')) {
      $('gt-su-h').textContent = t('saveStreak');
    }
    return s;
  }

  // ---------- countdown ----------
  function tick() {
    var el = $('gt-count'); if (!el) return;
    var n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0);
    var s = Math.floor((m - n) / 1000);
    function p(x) { return (x < 10 ? '0' : '') + x; }
    el.textContent = p(Math.floor(s / 3600)) + ':' + p(Math.floor(s % 3600 / 60)) + ':' + p(s % 60);
  }

  // ---------- sign-up (home) ----------
  function setStatus(msg, err) { var s = $('gt-status'); if (s) { s.textContent = msg || ''; s.classList.toggle('err', !!err); } }
  function paintSignup() {
    if (page !== 'home' || !$('gt-signup')) return;
    var inn = !!state.user;
    show($('gt-email-form'), !inn && !state.pendingEmail);
    show($('gt-code-form'), !inn && !!state.pendingEmail);
    show($('gt-in'), inn);
    $('gt-su-label').textContent = inn ? t('inLabel') : t('suLabel');
    $('gt-su-h').textContent = inn ? t('inH') : t('suH');
    show($('gt-su-s'), !inn);
    if (inn) setStatus('');
  }
  function wireSignup() {
    var ef = $('gt-email-form'), cf = $('gt-code-form'); if (!ef || !cf) return;
    ef.addEventListener('submit', function (e) {
      e.preventDefault(); if (!sb) { setStatus(t('errSend'), true); return; }
      var email = ($('gt-email').value || '').trim(); if (!email) return;
      var btn = ef.querySelector('button'); btn.disabled = true; setStatus(t('sending'));
      sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + '/my-account.html' } }).then(function (res) {
        btn.disabled = false;
        if (res.error) { setStatus(t('errSend'), true); return; }
        state.pendingEmail = email; paintSignup(); setStatus(t('codeSent')); $('gt-code').focus();
      });
    });
    cf.addEventListener('submit', function (e) {
      e.preventDefault(); if (!sb) return;
      var code = ($('gt-code').value || '').replace(/\s+/g, ''); if (!code) return;
      var btn = cf.querySelector('button'); btn.disabled = true;
      sb.auth.verifyOtp({ email: state.pendingEmail, token: code, type: 'email' }).then(function (res) {
        btn.disabled = false;
        if (res.error || !res.data || !res.data.user) { setStatus(t('errCode'), true); return; }
        var u = res.data.user; state.user = u; state.pendingEmail = '';
        sb.from('subscribers').upsert({ user_id: u.id, email: u.email, newsletter_opt_in: true }, { onConflict: 'user_id' }).then(function () {});
        paintSignup(); loadUserData();
      });
    });
  }

  // ---------- data ----------
  function loadUserData() {
    if (!sb || !state.user) { paintGames(); paintSaved(); return; }
    sb.from('game_stats').select('game,current_streak,last_played_day').eq('user_id', state.user.id).then(function (res) {
      state.rows = (res && res.data) || []; paintGames();
    });
    sb.from('favourites').select('proverb_id').eq('user_id', state.user.id).then(function (res) {
      state.saved = (res && res.data) ? res.data.length : null; paintSaved();
    });
  }
  function paintSaved() {
    var el = $('gt-saved'); if (!el) return;
    el.textContent = state.user ? (state.saved == null ? '' : t('savedN', state.saved)) : t('savedOut');
  }
  function loadBlog() {
    if (!sb || !$('gt-blog')) return;
    sb.from('blog_posts').select('slug,title_en,title_gd,excerpt_en,excerpt_gd,published_at').order('published_at', { ascending: false }).limit(1).then(function (res) {
      if (res && res.data && res.data[0]) { state.post = res.data[0]; paintBlog(); }
    });
  }
  function paintBlog() {
    var p = state.post, box = $('gt-blog'); if (!p || !box) return;
    var gd = lang() === 'gd';
    $('gt-blog-title').textContent = (gd && p.title_gd) || p.title_en || p.title_gd || '';
    $('gt-blog-ex').textContent = (gd && p.excerpt_gd) || p.excerpt_en || p.excerpt_gd || '';
    $('gt-blog-link').setAttribute('href', 'blog.html#post=' + encodeURIComponent(p.slug));
    show(box, true);
  }
  function loadProverbs() {
    return fetch('proverbs.html').then(function (r) { return r.ok ? r.text() : ''; }).then(function (h) {
      var m = h.match(/<script[^>]*id="proverb-data"[^>]*>([\s\S]*?)<\/script>/);
      if (m) { try { state.proverbs = JSON.parse(m[1]); } catch (e) {} }
      paintWeek(); checkAudio();
    }).catch(function () {});
  }
  function paintWeek() {
    var box = $('gt-week'), P = state.proverbs; if (!box || !P || !P.length) return;
    var html = '', loc = lang() === 'gd' ? 'gd' : 'en-GB';
    for (var k = 6; k >= 0; k--) {
      var d = new Date(); d.setDate(d.getDate() - k);
      var seed = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
      var e = P[seed % P.length] || {};
      var txt = (e.gaelic && e.gaelic.text) || (e.scots && e.scots.text) || (e.english && e.english.text) || '';
      var label = k === 0 ? t('today') : d.toLocaleDateString(loc, { weekday: 'short' });
      var a = document.createElement('a'); a.href = 'proverbs.html'; if (k === 0) a.className = 'now';
      var sm = document.createElement('small'); sm.textContent = label; a.appendChild(sm);
      a.appendChild(document.createTextNode(txt));
      html += a.outerHTML;
    }
    box.innerHTML = html;
  }

  // ---------- audio: hidden until a recording exists ----------
  function checkAudio() {
    var main = $('hp-main'), P = state.proverbs, btns = document.querySelector('#hp-potd .hp-btns');
    if (!main || !P || !btns) return;
    var old = $('gt-listen'); if (old) old.remove();
    var txt = main.textContent, id = null;
    P.forEach(function (e) { ['gaelic', 'scots', 'english'].forEach(function (k) { if (id == null && e[k] && e[k].text === txt) id = e.id; }); });
    if (id == null) return;
    var url = 'audio/proverb-' + id + '.mp3';
    function add() {
      if ($('gt-listen') || main.textContent !== txt) return;
      var b = document.createElement('button'); b.className = 'hp-btn pri'; b.id = 'gt-listen'; b.type = 'button'; b.textContent = t('listen');
      b.onclick = function () { try { new Audio(url).play(); } catch (e) {} };
      btns.insertBefore(b, btns.firstChild);
    }
    if (state.audio[id] === true) { add(); return; }
    if (state.audio[id] === false) return;
    fetch(url, { method: 'HEAD' }).then(function (r) { state.audio[id] = r.ok; if (r.ok) add(); }).catch(function () { state.audio[id] = false; });
  }

  // ---------- text ----------
  function paintText() {
    document.querySelectorAll('[data-gt]').forEach(function (e) { e.textContent = t(e.getAttribute('data-gt')); });
    if (page === 'today') {
      var loc = lang() === 'gd' ? 'gd' : 'en-GB';
      var h = $('page-title'); if (h) h.textContent = t('tdTitle');
      var s = $('page-subtitle'); if (s) s.textContent = new Date().toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
      document.title = t('tdTitle') + ' — Sean-fhaclan & Auld Sayins';
    }
    paintSignup(); paintGames(); paintSaved(); paintBlog(); paintWeek();
    var l = $('gt-listen'); if (l) l.textContent = t('listen');
  }
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('#ui-lang-en,#ui-lang-gd,#gws-qstab-lang-en,#gws-qstab-lang-gd')) setTimeout(paintText, 120);
  });

  // ---------- start ----------
  wireSignup(); paintText(); tick(); setInterval(tick, 1000);
  var hm = $('hp-main');
  if (hm && window.MutationObserver) new MutationObserver(function () { checkAudio(); }).observe(hm, { childList: true, characterData: true, subtree: true });
  loadProverbs(); loadBlog();
  if (sb) {
    sb.auth.getSession().then(function (res) {
      state.user = (res && res.data && res.data.session) ? res.data.session.user : null;
      paintSignup(); loadUserData();
    });
    sb.auth.onAuthStateChange(function (ev, session) {
      var u = session ? session.user : null;
      if ((u && u.id) !== (state.user && state.user.id)) { state.user = u; paintSignup(); loadUserData(); }
    });
  } else { paintGames(); paintSaved(); }
})();
