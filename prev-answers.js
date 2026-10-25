/* Previous days' answers for the four daily games (Am Facal, Wurd, Seillean, Bumbee).
   Reads the same data + date rotation the page uses, and shows the last few days
   with meanings under the game. Safe to include on any game page. */
(function () {
  'use strict';
  var DAYS_BACK = 7;
  var EPOCH = Date.UTC(2026, 0, 1);

  function jsonFrom(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }
  var words = jsonFrom('wordle-words');
  var puzzles = jsonFrom('bee-puzzles');
  if (!words && !puzzles) return;

  function isGd() {
    var b = document.getElementById('ui-lang-gd');
    if (b && b.classList.contains('active')) return true;
    return (document.documentElement.lang || '').toLowerCase().indexOf('gd') === 0;
  }
  var isScots = /wurd|bumbee/i.test(location.pathname);

  function todayDays() {
    var n = new Date();
    return Math.floor((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - EPOCH) / 86400000);
  }
  function dateLabel(back) {
    var d = new Date(); d.setDate(d.getDate() - back);
    return d.toLocaleDateString(isGd() ? 'gd' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var card = document.createElement('div');
  card.className = 'card';
  card.id = 'prev-answers-card';
  var main = document.querySelector('main') || document.body;
  var anchor = document.getElementById('game-card');
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(card, anchor.nextSibling);
  else main.appendChild(card);

  function render() {
    var gd = isGd();
    var days = todayDays();
    var h = '<h2>' + (gd ? 'Freagairtean nan làithean roimhe' : 'Previous answers') + '</h2>' +
      '<p class="hint">' + (gd ? 'Ionnsaich às na faclan o chionn goirid.' : 'Learn from the last few days’ words.') + '</p>' +
      '<div class="prev-list" style="display:grid;gap:10px;">';
    var rows = 0;
    for (var k = 1; k <= DAYS_BACK; k++) {
      var idx = days - k;
      if (words) {
        var n = words.length, w = words[((idx % n) + n) % n];
        if (!w) continue;
        h += row(dateLabel(k), '<strong style="letter-spacing:.12em;font-size:1.05rem;">' + esc(w.word) + '</strong>',
                 '<span>' + esc(w.en) + '</span>');
        rows++;
      } else {
        if (idx < 0) continue;
        var p = puzzles[idx % puzzles.length];
        if (!p) continue;
        var list = (p.words || []).map(function (x) {
          return '<li><strong>' + esc(x.word) + '</strong> — ' + esc(x.en) + '</li>';
        }).join('');
        h += row(dateLabel(k),
          '<strong style="letter-spacing:.12em;">' + esc((p.letters || []).join(' ')) + '</strong>' +
            ' <span style="opacity:.7;">(' + (gd ? 'meadhan' : 'centre') + ': ' + esc(p.center) + ')</span>',
          '<ul style="margin:6px 0 0;padding-left:18px;font-size:.9rem;">' + list + '</ul>');
        rows++;
      }
    }
    h += '</div>';
    card.innerHTML = rows ? h : '';
    card.style.display = rows ? '' : 'none';
  }
  function row(date, main, detail) {
    return '<div style="border:1px solid rgba(142,108,156,0.25);border-radius:10px;padding:10px 14px;">' +
      '<div style="font-size:.78rem;opacity:.65;margin-bottom:2px;">' + esc(date) + '</div>' +
      '<div>' + main + '</div><div style="font-size:.9rem;margin-top:2px;">' + detail + '</div></div>';
  }

  render();
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('[data-lang], #ui-lang-en, #ui-lang-gd')) {
      setTimeout(render, 50);
    }
  });
})();
