(function(){
  var LANG = {
    en: {
      title: "Quick settings",
      sub: "Change the site language, switch to dark mode, or jump straight to your notification preferences.",
      langLabel: "LANGUAGE",
      english: "English",
      gaelic: "Gàidhlig",
      themeLabel: "APPEARANCE",
      light: "Light",
      dark: "Dark",
      notifLabel: "NOTIFICATIONS",
      notifDesc: "Manage your daily proverb and games email/push preferences on My Account.",
      notifBtn: "Manage notifications →",
      launcher: "Settings"
    },
    gd: {
      title: "Roghainnean luath",
      sub: "Atharraich cànan an làraich, gluais gu modh dorcha, no rach dìreach gu na roghainnean brath agad.",
      langLabel: "CÀNAN",
      english: "Beurla",
      gaelic: "Gàidhlig",
      themeLabel: "COLTAS",
      light: "Soilleir",
      dark: "Dorcha",
      notifLabel: "BRATHAN",
      notifDesc: "Stiùirich na roghainnean puist-d is putaidh agad airson an t-seanfhacail làitheil agus nan geamannan sa Chunntas Agam.",
      notifBtn: "Stiùirich brathan →",
      launcher: "Roghainnean"
    }
  };
  var btn = document.getElementById("gws-qstab-btn");
  var overlay = document.getElementById("gws-qstab-overlay");
  var panel = document.getElementById("gws-qstab-panel");
  var closeBtn = document.getElementById("gws-qstab-close");
  var langEnBtn = document.getElementById("gws-qstab-lang-en");
  var langGdBtn = document.getElementById("gws-qstab-lang-gd");
  var realEn = document.getElementById("ui-lang-en");
  var realGd = document.getElementById("ui-lang-gd");
  var themeLightBtn = document.getElementById("gws-qstab-theme-light");
  var themeDarkBtn = document.getElementById("gws-qstab-theme-dark");
  if (!btn || !panel) return;

  function currentLang(){ return (realGd && realGd.classList.contains("active")) ? "gd" : "en"; }
  function setText(id, val){ var e = document.getElementById(id); if (e) e.textContent = val; }
  function applyTexts(){
    var L = LANG[currentLang()];
    setText("gws-qstab-title", L.title);
    setText("gws-qstab-sub", L.sub);
    setText("gws-qstab-lang-label", L.langLabel);
    setText("gws-qstab-theme-label", L.themeLabel);
    setText("gws-qstab-notif-label", L.notifLabel);
    setText("gws-qstab-notif-desc", L.notifDesc);
    setText("gws-qstab-notif-link", L.notifBtn);
    setText("gws-qstab-theme-light-label", L.light);
    setText("gws-qstab-theme-dark-label", L.dark);
    setText("gws-qstab-label", L.launcher);
    if (langEnBtn) langEnBtn.textContent = L.english;
    if (langGdBtn) langGdBtn.textContent = L.gaelic;
  }
  function syncLangButtons(){
    if (!realEn || !realGd) return;
    var enActive = realEn.classList.contains("active");
    langEnBtn.classList.toggle("gws-qstab-active", enActive);
    langGdBtn.classList.toggle("gws-qstab-active", !enActive);
    applyTexts();
  }
  function openPanel(){
    panel.classList.add("gws-qstab-open");
    overlay.classList.add("gws-qstab-open");
    btn.setAttribute("aria-expanded","true");
    syncLangButtons();
  }
  function closePanel(){
    panel.classList.remove("gws-qstab-open");
    overlay.classList.remove("gws-qstab-open");
    btn.setAttribute("aria-expanded","false");
  }
  btn.addEventListener("click", function(){
    if (panel.classList.contains("gws-qstab-open")) closePanel(); else openPanel();
  });
  if (closeBtn) closeBtn.addEventListener("click", closePanel);
  if (overlay) overlay.addEventListener("click", closePanel);
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") closePanel(); });
  if (langEnBtn && realEn) langEnBtn.addEventListener("click", function(){ realEn.click(); syncLangButtons(); });
  if (langGdBtn && realGd) langGdBtn.addEventListener("click", function(){ realGd.click(); syncLangButtons(); });
  if (realEn && realGd && window.MutationObserver) {
    var langMo = new MutationObserver(function(){ syncLangButtons(); });
    langMo.observe(realEn, { attributes:true, attributeFilter:["class"] });
    langMo.observe(realGd, { attributes:true, attributeFilter:["class"] });
  }
  applyTexts();

  function positionUnderFeedback(){
    var fb = document.getElementById("gws-fbtab-launcher");
    var launcher = document.getElementById("gws-qstab-launcher");
    if (!launcher) return;
    if (!fb) { launcher.style.top = "62%"; return; }
    var r = fb.getBoundingClientRect();
    var overlapPx = 14;
    launcher.style.transform = "none";
    launcher.style.top = Math.max(8, r.bottom - overlapPx) + "px";
  }
  positionUnderFeedback();
  window.addEventListener("resize", positionUnderFeedback);
  window.addEventListener("orientationchange", positionUnderFeedback);
  setTimeout(positionUnderFeedback, 300);

  var THEME_KEY = "gwsTheme";
  var darkTouched = [];
  function brightness(r,g,b){ return (r*299+g*587+b*114)/1000; }
  function parseColor(str){
    if (!str) return null;
    var m = str.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var p = m[1].split(",").map(function(s){ return parseFloat(s); });
    return { r:p[0], g:p[1], b:p[2], a: p[3] === undefined ? 1 : p[3] };
  }
  function shouldSkip(el){
    return !!el.closest("header.app-header, #gws-fbtab-launcher, #gws-fbtab-panel, #gws-fbtab-overlay, #gws-qstab-launcher, #gws-qstab-panel, #gws-qstab-overlay");
  }
  function darkenElement(el){
    if (el.nodeType !== 1 || shouldSkip(el)) return;
    var cs = getComputedStyle(el);
    var rec = null;
    var bg = parseColor(cs.backgroundColor);
    if (bg && bg.a >= 0.5) {
      var bri = brightness(bg.r, bg.g, bg.b);
      if (bri > 244) { rec = rec || {}; rec.bg = el.style.backgroundColor; el.style.backgroundColor = "#22242b"; }
      else if (bri > 195) { rec = rec || {}; rec.bg = el.style.backgroundColor; el.style.backgroundColor = "#15161b"; }
    }
    var fg = parseColor(cs.color);
    if (fg) {
      var briF = brightness(fg.r, fg.g, fg.b);
      if (briF < 90) { rec = rec || {}; rec.fg = el.style.color; el.style.color = "#e9e9ee"; }
    }
    var bw = parseFloat(cs.borderTopWidth) || 0;
    if (bw > 0) {
      var bc = parseColor(cs.borderTopColor);
      if (bc && bc.a >= 0.3) {
        var briB = brightness(bc.r, bc.g, bc.b);
        if (briB > 195) { rec = rec || {}; rec.border = el.style.borderColor; el.style.borderColor = "#34363f"; }
      }
    }
    if (rec) { darkTouched.push({ el: el, rec: rec }); }
  }
  function applyDark(root){
    darkenElement(root);
    var all = root.querySelectorAll ? root.querySelectorAll("*") : [];
    for (var i=0; i<all.length; i++) darkenElement(all[i]);
  }
  function removeDark(){
    for (var i=0; i<darkTouched.length; i++) {
      var t = darkTouched[i];
      if (t.rec.bg !== undefined) { if (t.rec.bg) t.el.style.backgroundColor = t.rec.bg; else t.el.style.removeProperty("background-color"); }
      if (t.rec.fg !== undefined) { if (t.rec.fg) t.el.style.color = t.rec.fg; else t.el.style.removeProperty("color"); }
      if (t.rec.border !== undefined) { if (t.rec.border) t.el.style.borderColor = t.rec.border; else t.el.style.removeProperty("border-color"); }
    }
    darkTouched = [];
  }
  var isDark = false;
  function syncThemeButtons(){
    if (themeLightBtn) themeLightBtn.classList.toggle("gws-qstab-active", !isDark);
    if (themeDarkBtn) themeDarkBtn.classList.toggle("gws-qstab-active", isDark);
  }
  function setTheme(dark){
    isDark = dark;
    document.documentElement.setAttribute("data-gws-theme", dark ? "dark" : "light");
    try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch(e){}
    if (dark) applyDark(document.body); else removeDark();
    syncThemeButtons();
  }
  if (themeLightBtn) themeLightBtn.addEventListener("click", function(){ setTheme(false); });
  if (themeDarkBtn) themeDarkBtn.addEventListener("click", function(){ setTheme(true); });
  if (window.MutationObserver) {
    var contentObserver = new MutationObserver(function(muts){
      if (!isDark) return;
      for (var i=0;i<muts.length;i++){
        var added = muts[i].addedNodes;
        for (var j=0;j<added.length;j++){ if (added[j].nodeType === 1) applyDark(added[j]); }
      }
    });
    contentObserver.observe(document.body, { childList:true, subtree:true });
  }
  try {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark") setTheme(true);
    else syncThemeButtons();
  } catch(e){ syncThemeButtons(); }
})();
