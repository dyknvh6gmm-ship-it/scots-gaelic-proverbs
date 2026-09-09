(function(){
  var btn = document.getElementById("gws-fbtab-btn");
  var overlay = document.getElementById("gws-fbtab-overlay");
  var panel = document.getElementById("gws-fbtab-panel");
  var closeBtn = document.getElementById("gws-fbtab-close");
  var form = document.getElementById("gws-fbtab-form");
  var statusEl = document.getElementById("gws-fbtab-status");
  var submitBtn = document.getElementById("gws-fbtab-submit");
  if (!btn || !panel || !form) return;
  function openPanel(){
    panel.classList.add("gws-fbtab-open");
    overlay.classList.add("gws-fbtab-open");
    btn.setAttribute("aria-expanded","true");
    setTimeout(function(){ var m = document.getElementById("gws-fbtab-message"); if (m) m.focus(); }, 260);
  }
  function closePanel(){
    panel.classList.remove("gws-fbtab-open");
    overlay.classList.remove("gws-fbtab-open");
    btn.setAttribute("aria-expanded","false");
  }
  btn.addEventListener("click", function(){
    if (panel.classList.contains("gws-fbtab-open")) { closePanel(); } else { openPanel(); }
  });
  if (closeBtn) closeBtn.addEventListener("click", closePanel);
  if (overlay) overlay.addEventListener("click", closePanel);
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape") closePanel();
  });
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var msgEl = document.getElementById("gws-fbtab-message");
    var nameEl = document.getElementById("gws-fbtab-name");
    var emailEl = document.getElementById("gws-fbtab-email");
    var message = msgEl ? msgEl.value.trim() : "";
    var name = nameEl ? nameEl.value.trim() : "";
    var email = emailEl ? emailEl.value.trim() : "";
    if (!message) return;
    submitBtn.disabled = true;
    statusEl.textContent = "Sending...";
    statusEl.className = "";
    fetch("https://kgbmdazcupgyypfvvqbv.supabase.co/functions/v1/send-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message, name: name, email: email, page: window.location.pathname + window.location.search })
    }).then(function(r){
      return r.json().then(function(d){ return { ok: r.ok, data: d }; });
    }).then(function(res){
      if (res.ok) {
        statusEl.textContent = "Thanks \u2014 feedback sent!";
        statusEl.className = "gws-fbtab-ok";
        form.reset();
        setTimeout(closePanel, 1800);
      } else {
        statusEl.textContent = (res.data && res.data.error) || "Something went wrong \u2014 please try again.";
        statusEl.className = "gws-fbtab-err";
      }
    }).catch(function(){
      statusEl.textContent = "Network error \u2014 please try again.";
      statusEl.className = "gws-fbtab-err";
    }).finally(function(){
      submitBtn.disabled = false;
    });
  });
})();
