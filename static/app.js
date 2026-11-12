(function () {
  "use strict";
  var APP = window.APP;
  var SCHEMA = APP.schema, M = APP.metrics;

  var T = {
    id: {
      skip: "Lewati ke formulir",
      h1: "Periksa situs sebelum kamu mempercayainya",
      lead: "Jawab delapan pertanyaan tentang situs yang kamu curigai. Model Decision Tree akan menilai kemungkinan phishing dan menunjukkan alasannya.",
      formTitle: "Ciri-ciri situs", presetLabel: "Belum yakin? Coba contoh:", presetBad: "situs phishing", presetGood: "situs sah",
      submit: "Periksa situs", checking: "Memeriksa…", reset: "Kosongkan jawaban",
      vEmptyTitle: "Hasil pemeriksaan", vEmptyBody: "Isi semua pertanyaan di sebelah kiri, lalu tekan Periksa situs. Alasan model akan muncul di sini.",
      vKicker: "Penilaian model", gLegit: "Sah", gPhish: "Phishing", pathTitle: "Alur keputusan model",
      aboutTitle: "Cara model bekerja", cmpTitle: "Pohon bebas dan pohon yang dipangkas",
      impTitle: "Ciri yang paling menentukan", impText: "Semakin panjang batang, semakin besar peran ciri itu dalam memisahkan situs phishing dari situs sah.",
      footData: "Data: Phishing Websites, UCI Machine Learning Repository (Mohammad dan McCluskey, 2012), sampel {rows} baris tanpa duplikat.",
      footDisclaimer: "Alat belajar. Hasilnya bukan jaminan keamanan, jadi jangan jadikan satu-satunya dasar keputusan.",
      phishing: "Phishing", legitimate: "Kemungkinan sah", uncertain: "Belum pasti",
      sPhishing: "Situs ini kemungkinan besar phishing. Jangan masukkan kata sandi atau data pribadi.",
      sLegitimate: "Ciri-cirinya mirip situs sah. Tetap periksa alamat sebelum login.",
      sUncertain: "Ciri-cirinya bercampur, jadi model ragu. Anggap mencurigakan sampai terbukti aman.",
      conf: "Kemungkinan phishing menurut model: {p}%.",
      note: "{n} ciri lain memakai nilai default. Angka di atas adalah proporsi data latih pada daun pohon, bukan probabilitas terkalibrasi.",
      defaultStep: "Ciri lain ({f}) memakai nilai default",
      missing: "Jawab semua pertanyaan dulu. Masih kosong: {n}.",
      errInvalid: "Ada jawaban yang tidak valid. Muat ulang halaman lalu coba lagi.",
      errNet: "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.",
      cmpText: "Model A dibiarkan tumbuh tanpa batas (kedalaman {da}, {la} daun) sehingga nyaris menghafal data latih. Model B dibatasi sampai kedalaman {db} ({lb} daun) dan dipakai di aplikasi ini.",
      modelA: "Model A, tanpa batas", modelB: "Model B, dipangkas", train: "Latih", test: "Uji", gap: "Selisih latih dan uji: {g} poin"
    },
    en: {
      skip: "Skip to the form",
      h1: "Check a website before you trust it",
      lead: "Answer eight questions about the site you suspect. A Decision Tree model estimates the chance of phishing and shows its reasoning.",
      formTitle: "Site characteristics", presetLabel: "Not sure? Try an example:", presetBad: "phishing site", presetGood: "legitimate site",
      submit: "Check site", checking: "Checking…", reset: "Clear answers",
      vEmptyTitle: "Result", vEmptyBody: "Answer every question on the left, then press Check site. The model’s reasoning will appear here.",
      vKicker: "Model assessment", gLegit: "Legitimate", gPhish: "Phishing", pathTitle: "How the model decided",
      aboutTitle: "How the model works", cmpTitle: "Unrestricted tree versus pruned tree",
      impTitle: "What matters most", impText: "The longer the bar, the more that characteristic helps separate phishing sites from legitimate ones.",
      footData: "Data: Phishing Websites, UCI Machine Learning Repository (Mohammad and McCluskey, 2012), a sample of {rows} rows without duplicates.",
      footDisclaimer: "A learning tool. Its output is not a security guarantee, so never rely on it alone.",
      phishing: "Phishing", legitimate: "Likely legitimate", uncertain: "Inconclusive",
      sPhishing: "This site is very likely phishing. Do not enter passwords or personal data.",
      sLegitimate: "Its characteristics resemble legitimate sites. Still check the address before logging in.",
      sUncertain: "The characteristics are mixed, so the model is unsure. Treat it as suspicious until proven safe.",
      conf: "Chance of phishing according to the model: {p}%.",
      note: "{n} other characteristics use default values. The figure above is the share of training data in the tree leaf, not a calibrated probability.",
      defaultStep: "Other characteristic ({f}) uses a default value",
      missing: "Answer every question first. Still empty: {n}.",
      errInvalid: "Some answers are invalid. Reload the page and try again.",
      errNet: "Could not reach the server. Check your connection and try again.",
      cmpText: "Model A grew without limits (depth {da}, {la} leaves) and nearly memorised the training data. Model B is capped at depth {db} ({lb} leaves) and powers this app.",
      modelA: "Model A, unrestricted", modelB: "Model B, pruned", train: "Train", test: "Test", gap: "Train-to-test gap: {g} points"
    }
  };

  var lang = "id", last = null;
  try { var s = localStorage.getItem("phishlens-lang"); if (s === "en" || s === "id") lang = s; } catch (e) {}

  function t(k, vars) {
    var s = (T[lang][k] != null ? T[lang][k] : T.id[k]) || k;
    if (vars) Object.keys(vars).forEach(function (n) { s = s.replace("{" + n + "}", vars[n]); });
    return s;
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function num(x, d) {
    return x.toLocaleString(lang === "id" ? "id-ID" : "en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  }
  function optLabel(f, v) {
    for (var i = 0; i < f.options.length; i++) if (f.options[i].v === v) return f.options[i][lang];
    return String(v);
  }
  function findFeature(id) {
    for (var i = 0; i < SCHEMA.length; i++) if (SCHEMA[i].id === id) return SCHEMA[i];
    return null;
  }

  var $ = function (id) { return document.getElementById(id); };
  var form = $("form"), box = $("questions"), verdict = $("verdict"), errBox = $("formError"), submitBtn = $("submit");

  function buildQuestions() {
    SCHEMA.forEach(function (f) {
      var fs = el("fieldset", "q"); fs.dataset.feature = f.id;
      var lg = el("legend"); lg.dataset.k = "q";
      var hint = el("p", "hint"); hint.dataset.k = "hint";
      var seg = el("div", "seg");
      f.options.forEach(function (o) {
        var lab = el("label"), inp = el("input");
        inp.type = "radio"; inp.name = f.id; inp.value = String(o.v);
        inp.addEventListener("change", function () { fs.classList.remove("missing"); errBox.hidden = true; });
        var sp = el("span"); sp.dataset.v = String(o.v);
        lab.appendChild(inp); lab.appendChild(sp); seg.appendChild(lab);
      });
      fs.appendChild(lg); fs.appendChild(hint); fs.appendChild(seg); box.appendChild(fs);
    });
  }
  function labelQuestions() {
    SCHEMA.forEach(function (f) {
      var fs = box.querySelector('[data-feature="' + f.id + '"]');
      fs.querySelector('[data-k="q"]').textContent = f.q[lang];
      fs.querySelector('[data-k="hint"]').textContent = f.hint[lang];
      f.options.forEach(function (o) { fs.querySelector('span[data-v="' + o.v + '"]').textContent = o[lang]; });
    });
  }

  function renderResult() {
    var panel = verdict, empty = panel.querySelector(".v-empty"), res = panel.querySelector(".v-result");
    if (!last) { panel.dataset.state = "empty"; empty.hidden = false; res.hidden = true; return; }
    panel.dataset.state = last.label; empty.hidden = true; res.hidden = false;
    $("vWord").textContent = t(last.label);
    $("vSentence").textContent = t("s" + last.label.charAt(0).toUpperCase() + last.label.slice(1));
    var p = Math.round(last.p_phishing * 100);
    $("gaugeMark").style.left = Math.min(98, Math.max(2, p)) + "%";
    $("vConf").textContent = t("conf", { p: p });
    var ol = $("path"); ol.textContent = "";
    last.steps.forEach(function (s) {
      var f = findFeature(s.feature), li = el("li");
      var cls = s.value === 1 ? "good" : s.value === -1 ? "bad" : "mid";
      li.appendChild(el("span", "dot " + cls));
      var d = el("div");
      if (f && s.provided) { d.appendChild(document.createTextNode(f.short[lang] + ": " + optLabel(f, s.value))); }
      else { d.appendChild(document.createTextNode(t("defaultStep", { f: s.feature }))); }
      li.appendChild(d); ol.appendChild(li);
    });
    $("vNote").textContent = t("note", { n: M.dataset.features - SCHEMA.length });
  }

  function bar(label, value, pct, cls) {
    var row = el("div", "bar-row"), lab = el("div", "bar-label");
    lab.appendChild(el("span", null, label)); lab.appendChild(el("b", null, value));
    var tr = el("div", "bar-track"), fill = el("div", "bar-fill" + (cls ? " " + cls : ""));
    fill.style.width = pct + "%"; tr.appendChild(fill); row.appendChild(lab); row.appendChild(tr);
    return row;
  }
  function renderAbout() {
    var a = M.model_a, b = M.model_b;
    $("cmpText").textContent = t("cmpText", { da: a.depth, la: a.leaves, db: b.depth, lb: b.leaves });
    var cmp = $("cmpBars"); cmp.textContent = "";
    [["modelA", a, "alt"], ["modelB", b, ""]].forEach(function (m) {
      var g = el("div"), st = m[1];
      g.appendChild(el("p", null, t(m[0]))); g.firstChild.style.cssText = "font-weight:500;margin-bottom:8px";
      var inner = el("div", "bars"); inner.style.gap = "8px";
      inner.appendChild(bar(t("train"), num(st.train_accuracy * 100, 1) + "%", st.train_accuracy * 100, m[2]));
      inner.appendChild(bar(t("test"), num(st.test_accuracy * 100, 1) + "%", st.test_accuracy * 100, m[2]));
      g.appendChild(inner);
      var gapP = el("p", "muted", t("gap", { g: num((st.train_accuracy - st.test_accuracy) * 100, 1) }));
      gapP.style.cssText = "margin:8px 0 0;font-size:13.5px"; g.appendChild(gapP);
      cmp.appendChild(g);
    });
    var imp = $("impBars"); imp.textContent = "";
    var max = Math.max.apply(null, APP.ranked.map(function (r) { return r.value; }));
    APP.ranked.forEach(function (r) {
      var name = r.label ? r.label[lang] : r.id;
      imp.appendChild(bar(name, num(r.value * 100, 1) + "%", r.value / max * 100));
    });
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (n) {
      n.textContent = t(n.getAttribute("data-i18n"), { rows: num(M.dataset.rows) });
    });
    document.querySelectorAll("[data-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === lang)); });
    submitBtn.textContent = submitBtn.disabled ? t("checking") : t("submit");
    labelQuestions(); renderResult(); renderAbout();
    if (!errBox.hidden && errBox.dataset.k) errBox.textContent = t(errBox.dataset.k, { n: errBox.dataset.n });
  }

  function showError(k, n) { errBox.dataset.k = k; errBox.dataset.n = n || ""; errBox.textContent = t(k, { n: n }); errBox.hidden = false; }

  function collect() {
    var values = {}, missing = [];
    SCHEMA.forEach(function (f) {
      var c = form.querySelector('input[name="' + f.id + '"]:checked');
      if (c) values[f.id] = parseInt(c.value, 10); else missing.push(f.id);
    });
    return { values: values, missing: missing };
  }

  function check() {
    var c = collect();
    box.querySelectorAll(".q").forEach(function (q) { q.classList.toggle("missing", c.missing.indexOf(q.dataset.feature) > -1); });
    if (c.missing.length) {
      showError("missing", c.missing.length);
      var first = box.querySelector('[data-feature="' + c.missing[0] + '"]');
      first.scrollIntoView({ block: "center" });
      first.querySelector("input").focus({ preventScroll: true });
      return;
    }
    errBox.hidden = true; submitBtn.disabled = true; submitBtn.textContent = t("checking");
    fetch("/api/predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: c.values }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (r) {
        if (!r.ok) { showError("errInvalid"); return; }
        last = r.body; renderResult();
        if (window.matchMedia("(max-width: 960px)").matches) verdict.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch(function () { showError("errNet"); })
      .then(function () { submitBtn.disabled = false; submitBtn.textContent = t("submit"); });
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); check(); });
  $("reset").addEventListener("click", function () {
    form.querySelectorAll("input:checked").forEach(function (i) { i.checked = false; });
    box.querySelectorAll(".q").forEach(function (q) { q.classList.remove("missing"); });
    errBox.hidden = true; last = null; renderResult();
  });
  document.querySelectorAll("[data-preset]").forEach(function (b) {
    b.addEventListener("click", function () {
      var p = APP.presets[b.dataset.preset];
      Object.keys(p).forEach(function (k) {
        var i = form.querySelector('input[name="' + k + '"][value="' + p[k] + '"]'); if (i) i.checked = true;
      });
      check();
    });
  });
  document.querySelectorAll(".lang [data-lang]").forEach(function (b) {
    b.addEventListener("click", function () {
      lang = b.dataset.lang;
      try { localStorage.setItem("phishlens-lang", lang); } catch (e) {}
      applyLang();
    });
  });

  buildQuestions(); applyLang();
})();
