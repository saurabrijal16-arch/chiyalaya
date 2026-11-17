/* ChaLLengErs — UI controller. Everything runs in the browser; nothing is sent anywhere unless you use an AI. */
(function () {
  const CH = window.CH;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const KEY = "challengers.v1";
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------- state ---------- */
  const defaults = () => ({
    job: clone(CH.SAMPLE_JOB),
    profile: clone(CH.SAMPLE_PROFILE),
    settings: { country: "FI", lang: "en", template: "modern", accent: "#1f3a5f", order: "auto", showPhoto: false, photo: "", showDob: false, showNationality: false, gdpr: false, coverLetter: true },
    instructions: "", output: "json", cover: "", tracker: [], isExample: true, tab: "job",
  });
  let state = defaults();
  let undoStack = null;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && saved.profile) state = { ...defaults(), ...saved, settings: { ...defaults().settings, ...saved.settings } };
  } catch (e) { /* storage unavailable: start with defaults */ }

  let saveTimer;
  const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }, 300); };

  /* ---------- platform: claude.ai viewer vs normal browser ---------- */
  const P = { downloads: null, sample: null, inClaude: !!(window.claude && window.claude.use) };
  async function initPlatform() {
    if (!P.inClaude) { $("#bookmarkletBox").hidden = false; buildBookmarklet(); return; }
    try { P.downloads = await window.claude.use("downloads"); } catch (e) { P.downloads = null; }
    try { P.sample = await window.claude.use("sample"); } catch (e) { P.sample = null; }
    $("#claudeHere").hidden = !P.sample;
  }
  async function saveFile(name, data, mime) {
    if (P.downloads) {
      try { await P.downloads.save({ filename: name, data }); toast("Saved " + name); }
      catch (e) { toast(e && e.code === "declined" ? "Download cancelled" : e && e.code === "rate_limited" ? "One moment, a save is already open" : "Download is not available here. Use Copy text instead."); }
      return;
    }
    if (P.inClaude) { toast("Download is not available in this view. Use Copy text instead."); return; }
    const url = URL.createObjectURL(new Blob([data], { type: mime }));
    const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast("Downloaded " + name);
  }
  async function copy(text, label) {
    try { await navigator.clipboard.writeText(text); toast((label || "Text") + " copied"); }
    catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (_) {}
      ta.remove();
      toast(ok ? (label || "Text") + " copied" : "Copy blocked. Select the text and press Ctrl+C.");
    }
  }
  let toastTimer;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2600); }

  /* ---------- init selects ---------- */
  Object.entries(CH.COUNTRIES).forEach(([k, c]) => $("#country").add(new Option(c.name, k)));
  Object.entries(CH.LANG_NAMES).forEach(([k, n]) => $("#lang").add(new Option(n, k)));

  /* ---------- tabs ---------- */
  function showTab(name) {
    state.tab = name;
    $$(".tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === name)));
    $$(".panel").forEach((p) => (p.hidden = p.dataset.panel !== name));
    if (name === "ai") $("#promptBox").value = currentPrompt();
    if (name === "apply") renderKit();
    save();
  }
  $$(".tab").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));

  /* ---------- bind form <-> state ---------- */
  const fields = {
    jobTitle: ["job", "title"], jobCompany: ["job", "company"], jobText: ["job", "text"],
    summary: ["profile", "summary"], skills: ["profile", "skills"], languages: ["profile", "languages"], certifications: ["profile", "certifications"],
    interests: ["profile", "interests"], rawResume: ["profile", "rawResume"], instructions: [null, "instructions"], outputFmt: [null, "output"], coverText: [null, "cover"],
    country: ["settings", "country"], lang: ["settings", "lang"], template: ["settings", "template"], accent: ["settings", "accent"], order: ["settings", "order"],
    showPhoto: ["settings", "showPhoto"], showDob: ["settings", "showDob"], showNationality: ["settings", "showNationality"], gdpr: ["settings", "gdpr"], coverLetter: ["settings", "coverLetter"],
  };
  const get = ([a, b]) => (a ? state[a][b] : state[b]);
  const set = ([a, b], v) => { if (a) state[a][b] = v; else state[b] = v; };

  function fillForm() {
    for (const [id, path] of Object.entries(fields)) {
      const el = document.getElementById(id);
      if (el.type === "checkbox") el.checked = !!get(path); else el.value = get(path) ?? "";
    }
    $$("[data-b]").forEach((el) => (el.value = state.profile.basics[el.dataset.b] || ""));
    renderCards("experience", "#expList", "#tplExp");
    renderCards("education", "#eduList", "#tplEdu");
    renderCards("projects", "#projList", "#tplProj");
    $("#exampleBanner").hidden = !state.isExample;
    $("#undoBtn").disabled = !undoStack;
  }

  for (const [id, path] of Object.entries(fields)) {
    const el = document.getElementById(id);
    el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" || el.type === "color" ? "change" : "input", () => {
      set(path, el.type === "checkbox" ? el.checked : el.value);
      if (id === "country") applyCountryDefaults();
      changed();
    });
  }
  $$("[data-b]").forEach((el) => el.addEventListener("input", () => { state.profile.basics[el.dataset.b] = el.value; changed(); }));

  function applyCountryDefaults() {
    const c = CH.COUNTRIES[state.settings.country];
    state.settings.lang = c.lang; // sensible default; many tech jobs accept English, so the user can switch back
    state.settings.gdpr = !!c.gdpr;
    if (c.photo === "no") { state.settings.showPhoto = false; state.settings.showDob = false; }
    $("#lang").value = state.settings.lang; $("#gdpr").checked = state.settings.gdpr;
    $("#showPhoto").checked = state.settings.showPhoto; $("#showDob").checked = state.settings.showDob;
  }

  /* repeatable cards */
  const blank = { experience: { title: "", company: "", location: "", start: "", end: "", bullets: "" }, education: { degree: "", school: "", location: "", start: "", end: "", details: "" }, projects: { name: "", link: "", bullets: "" } };
  function renderCards(key, listSel, tplSel) {
    const list = $(listSel);
    list.innerHTML = "";
    state.profile[key].forEach((item, i) => {
      const node = $(tplSel).content.firstElementChild.cloneNode(true);
      $$("[data-f]", node).forEach((el) => {
        el.value = item[el.dataset.f] || "";
        el.id = `${key}-${i}-${el.dataset.f}`;
        el.addEventListener("input", () => { state.profile[key][i][el.dataset.f] = el.value; changed(); });
      });
      $("[data-del]", node).addEventListener("click", () => { state.profile[key].splice(i, 1); renderCards(key, listSel, tplSel); changed(); });
      $("[data-up]", node).addEventListener("click", () => { if (i > 0) { const a = state.profile[key]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; renderCards(key, listSel, tplSel); changed(); } });
      $("[data-down]", node).addEventListener("click", () => { const a = state.profile[key]; if (i < a.length - 1) { [a[i + 1], a[i]] = [a[i], a[i + 1]]; renderCards(key, listSel, tplSel); changed(); } });
      list.appendChild(node);
    });
  }
  $$("[data-add]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.add;
    state.profile[k].push(clone(blank[k]));
    fillForm(); changed();
  }));

  $("#startBlank").addEventListener("click", () => {
    const keepTracker = state.tracker;
    state = defaults();
    state.tracker = keepTracker;
    state.isExample = false;
    state.job = { title: "", company: "", text: "" };
    state.profile = { basics: { name: "", headline: "", email: "", phone: "", location: "", linkedin: "", website: "", workAuth: "", nationality: "", dob: "" }, summary: "", experience: [clone(blank.experience)], education: [clone(blank.education)], skills: "", languages: "", certifications: "", projects: [], interests: "", rawResume: "" };
    state.cover = "";
    undoStack = null;
    fillForm(); changed(); showTab("job"); $("#jobText").focus();
  });

  /* ---------- render ---------- */
  let renderTimer;
  function changed() {
    if (state.isExample) { state.isExample = false; $("#exampleBanner").hidden = true; }
    clearTimeout(renderTimer); renderTimer = setTimeout(render, 150); save();
  }
  function settingsNow() { return state.settings; }
  function currentResume() { return CH.toResume(state.profile); }

  function render() {
    const r = currentResume();
    const s = settingsNow();
    $("#paper").innerHTML = CH.renderHTML(r, s);
    fitPaper();

    // country notes
    const c = CH.COUNTRIES[s.country];
    $("#countryNotes").innerHTML = `<strong>${CH.escapeHTML(c.name)} CV conventions</strong> · ${c.pages} page(s) · photo ${c.photo === "no" ? "not expected" : "optional"}<ul>${c.notes.map((n) => "<li>" + CH.escapeHTML(n) + "</li>").join("")}</ul>`;

    // job keywords
    const kws = CH.extractKeywords(state.job.text);
    $("#jobKeywords").innerHTML = kws.length ? kws.map((k) => `<span class="chip ${k.required ? "req" : k.optional ? "opt" : ""}">${CH.escapeHTML(CH.pretty(k.term))}</span>`).join("") : '<span class="empty">Paste a job ad to see its keywords.</span>';

    // analysis
    const a = CH.analyze(r, state.job, s);
    const score = Math.round(a.score);
    $("#scoreNum").textContent = score;
    const fg = $("#ringFg");
    fg.style.strokeDashoffset = String(326.7 * (1 - score / 100));
    fg.style.stroke = score >= 80 ? "var(--good)" : score >= 60 ? "var(--warn)" : "var(--bad)";
    $("#ring").setAttribute("aria-label", `ATS readiness ${score} out of 100`);
    $("#scoreLabel").textContent = score >= 85 ? "Strong: ready to send" : score >= 70 ? "Good, a few fixes left" : score >= 50 ? "Needs work" : "Weak match";
    $("#scoreSub").textContent = `${a.matched.length}/${a.keywords.length} job keywords · ${a.words} words · ${c.name}`;
    $("#kwMatched").innerHTML = a.matched.slice(0, 18).map((k) => `<span class="chip ok">${CH.escapeHTML(CH.pretty(k.term))}</span>`).join("") || '<span class="empty">none yet</span>';
    $("#kwMissing").innerHTML = a.missing.slice(0, 18).map((k) => `<button type="button" class="chip miss" data-kw="${CH.escapeHTML(k.term)}" title="Add to skills">${CH.escapeHTML(CH.pretty(k.term))}${k.required ? " *" : ""}</button>`).join("") || '<span class="empty">nothing missing</span>';
    $("#warnings").innerHTML = a.warnings.map((w) => `<div class="warn">${CH.escapeHTML(w)}</div>`).join("");
    $("#checkList").innerHTML = a.checks.map((ch) => `<li><span class="dot ${ch.status}"></span><span><strong>${CH.escapeHTML(ch.label)}</strong> · ${CH.escapeHTML(ch.detail)}${ch.status !== "pass" && ch.fix ? `<span class="fix">→ ${CH.escapeHTML(ch.fix)}</span>` : ""}</span><span class="pts">${ch.pts}/${ch.max}</span></li>`).join("");
    if (state.tab === "ai") $("#promptBox").value = currentPrompt();
  }

  function fitPaper() {
    const wrap = $("#paperWrap"), paper = $("#paper");
    const k = Math.min(1, wrap.clientWidth / 794);
    paper.style.transform = `scale(${k})`;
    wrap.style.height = paper.offsetHeight * k + "px";
  }
  window.addEventListener("resize", fitPaper);

  /* missing keyword -> add to skills (with honesty check, built into the page) */
  $("#kwMissing").addEventListener("click", (e) => {
    const b = e.target.closest("[data-kw]");
    if (!b) return;
    const term = CH.pretty(b.dataset.kw);
    const box = $("#addSkill");
    box.hidden = false;
    box.innerHTML = `<span>Add <strong>${CH.escapeHTML(term)}</strong> to your skills? Only if it's true and you can discuss it in an interview.</span><button type="button" class="btn tiny primary" id="addYes">Add</button><button type="button" class="btn tiny ghost" id="addNo">Cancel</button>`;
    $("#addYes").onclick = () => {
      const lines = CH.lines(state.profile.skills);
      const label = term.length > 1 ? term.charAt(0).toUpperCase() + term.slice(1) : term;
      if (lines.length && /:/.test(lines[0])) lines[0] = lines[0] + ", " + label; else lines.unshift(label);
      state.profile.skills = lines.join("\n");
      $("#skills").value = state.profile.skills;
      box.hidden = true; changed(); toast(label + " added to skills");
    };
    $("#addNo").onclick = () => (box.hidden = true);
  });

  /* ---------- tailoring ---------- */
  function showChanges(title, items) {
    const el = $("#changes");
    el.hidden = !items.length;
    el.innerHTML = `<strong>${CH.escapeHTML(title)}</strong><ul>${items.slice(0, 10).map((c) => "<li>" + CH.escapeHTML(c) + "</li>").join("")}</ul>`;
  }
  $("#tailorBtn").addEventListener("click", () => {
    if ((state.job.text || "").trim().length < 50) { toast("Paste the job ad first (step 1)"); showTab("job"); return; }
    if (!state.job.title) state.job.title = CH.guessJobTitle(state.job.text);
    undoStack = clone(state.profile);
    const before = Math.round(CH.analyze(currentResume(), state.job, state.settings).score);
    const { resume, changes } = CH.tailor(state.profile, state.job, state.settings);
    state.profile = CH.resumeToProfile(resume, state.profile);
    fillForm(); render();
    const after = Math.round(CH.analyze(currentResume(), state.job, state.settings).score);
    showChanges(`Tailored for ${state.job.title || "this job"}: score ${before} → ${after}`, changes.length ? changes : ["Your CV was already well ordered for this job."]);
    $("#undoBtn").disabled = false; save();
    toast("Tailored. Check the missing keywords next");
  });
  $("#undoBtn").addEventListener("click", () => {
    if (!undoStack) return;
    state.profile = undoStack; undoStack = null;
    fillForm(); render(); $("#changes").hidden = true; save(); toast("Undone");
  });

  /* ---------- prompts / AI ---------- */
  function currentPrompt(fmt) {
    return CH.buildPrompt({ profile: state.profile, job: state.job, settings: state.settings, instructions: state.instructions, output: fmt || state.output });
  }
  $("#copyPrompt").addEventListener("click", () => {
    if ((state.job.text || "").trim().length < 50) toast("Tip: paste the job ad first for a tailored result");
    const p = currentPrompt(); $("#promptBox").value = p; copy(p, "Master prompt");
  });

  function importResult(text) {
    const r = CH.parseAIResult(text);
    undoStack = clone(state.profile);
    state.profile = CH.resumeToProfile(r, state.profile);
    if (r.coverLetter) { state.cover = r.coverLetter; $("#coverText").value = r.coverLetter; }
    fillForm(); render(); save();
    const ats = r.ats || {};
    const notes = [];
    if (ats.missingKeywords && ats.missingKeywords.length) notes.push("<strong>Missing (add only if true):</strong> " + ats.missingKeywords.map(CH.escapeHTML).join(", "));
    if (ats.questionsForCandidate && ats.questionsForCandidate.length) notes.push("<strong>Answer these to make it stronger:</strong><ul>" + ats.questionsForCandidate.map((q) => "<li>" + CH.escapeHTML(q) + "</li>").join("") + "</ul>");
    if (ats.notes && ats.notes.length) notes.push("<strong>Notes:</strong><ul>" + ats.notes.map((q) => "<li>" + CH.escapeHTML(q) + "</li>").join("") + "</ul>");
    $("#aiNotes").innerHTML = notes.join("<br>");
    $("#undoBtn").disabled = false;
    showChanges("AI result loaded into your CV. Review every line before sending.", ["Edit anything in step 2 (You). Undo restores your previous version."]);
  }
  $("#importAI").addEventListener("click", () => {
    try { importResult($("#aiAnswer").value); toast("AI result loaded"); }
    catch (e) { toast("Could not read that answer"); $("#aiNotes").innerHTML = `<strong>Couldn't load it:</strong> ${CH.escapeHTML(e.message)} Make sure you pasted the whole reply, including the json block.`; }
  });

  let claudeCtl = null;
  const SAMPLE_ERR = { not_granted: "Claude access was not allowed. Use the copy-prompt option instead.", rate_limited: "Too many requests right now. Wait a minute and try again.", cancelled: "Stopped." };
  $("#claudeBtn").addEventListener("click", async () => {
    if (!P.sample) return;
    if ((state.job.text || "").trim().length < 50) { toast("Paste the job ad first (step 1)"); showTab("job"); return; }
    const out = $("#claudeOut");
    out.hidden = false; out.textContent = "Thinking… (this can take up to a minute)";
    $("#claudeBtn").disabled = true; $("#claudeStop").hidden = false;
    claudeCtl = new AbortController();
    try {
      const { text } = await P.sample(currentPrompt("json"), { modelTier: "complex", signal: claudeCtl.signal, onText: ({ text }) => { out.textContent = text; out.scrollTop = out.scrollHeight; } });
      importResult(text);
      out.textContent = "Done. Your CV was rewritten. Review it on the right.";
      toast("Claude rewrote your CV");
    } catch (e) {
      out.textContent = (e && SAMPLE_ERR[e.code]) || (e && e.message ? "Couldn't finish: " + e.message : "Couldn't finish. Try again or use the copy-prompt option.");
    } finally { $("#claudeBtn").disabled = false; $("#claudeStop").hidden = true; }
  });
  $("#claudeStop").addEventListener("click", () => claudeCtl && claudeCtl.abort());

  /* cover letter */
  $("#draftCover").addEventListener("click", () => { state.cover = CH.draftCoverLetter(currentResume(), state.job, state.settings); $("#coverText").value = state.cover; save(); toast("Draft ready. Fill in the [bracket] part"); });
  $("#copyCover").addEventListener("click", () => copy($("#coverText").value, "Cover letter"));
  $("#dlCover").addEventListener("click", () => saveFile(fileBase() + "_Cover_Letter.txt", $("#coverText").value || " ", "text/plain"));

  /* ---------- exports ---------- */
  const fileBase = () => ((state.profile.basics.name || "CV").trim().replace(/[^\p{L}\p{N}]+/gu, "_") + "_CV" + (state.job.company ? "_" + state.job.company.replace(/\(example\)/i, "").trim().replace(/[^\p{L}\p{N}]+/gu, "_") : "")).replace(/_+$/, "");
  function photoBytes() {
    const d = state.settings.photo;
    if (!d || !state.settings.showPhoto) return null;
    const m = d.match(/^data:image\/jpeg;base64,(.+)$/);
    if (!m) return null;
    return { bytes: atob(m[1]), w: state.settings.photoW || 300, h: state.settings.photoH || 360 };
  }
  $("#dlPdf").addEventListener("click", () => {
    const { bytes, pages } = CH.buildPDF(currentResume(), state.settings, photoBytes());
    saveFile(fileBase() + ".pdf", bytes, "application/pdf");
    if (pages > 2) toast(`Your CV is ${pages} pages. Aim for 1–2.`);
  });
  $("#dlDocx").addEventListener("click", () => saveFile(fileBase() + ".docx", CH.buildDOCX(currentResume(), state.settings), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
  $("#dlTxt").addEventListener("click", () => saveFile(fileBase() + ".txt", CH.renderText(currentResume(), state.settings), "text/plain"));
  $("#copyTxt").addEventListener("click", () => copy(CH.renderText(currentResume(), state.settings), "CV text"));

  $("#saveProfile").addEventListener("click", () => saveFile("challengers_profile.json", JSON.stringify({ app: "ChaLLengErs", version: 1, profile: state.profile, settings: { ...state.settings, photo: "" } }, null, 2), "application/json"));
  $("#loadProfile").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const o = JSON.parse(rd.result);
        if (!o.profile || !o.profile.basics) throw new Error("bad");
        undoStack = clone(state.profile);
        state.profile = o.profile; if (o.settings) state.settings = { ...state.settings, ...o.settings, photo: state.settings.photo };
        state.isExample = false; fillForm(); render(); save(); toast("Profile loaded");
      } catch (err) { toast("That file is not a ChaLLengErs profile"); }
    };
    rd.readAsText(f); e.target.value = "";
  });

  /* photo: resize to a small JPEG so it fits in the PDF and in storage */
  $("#photoFile").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const max = 360, k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      state.settings.photo = c.toDataURL("image/jpeg", 0.86); state.settings.photoW = c.width; state.settings.photoH = c.height;
      state.settings.showPhoto = true; $("#showPhoto").checked = true;
      URL.revokeObjectURL(url); changed(); toast("Photo added");
      if (CH.COUNTRIES[state.settings.country].photo === "no") toast("Note: photos are not expected in " + CH.COUNTRIES[state.settings.country].name);
    };
    img.onerror = () => toast("Could not read that image");
    img.src = url; e.target.value = "";
  });

  /* ---------- apply kit + tracker ---------- */
  function renderKit() {
    const r = currentResume(), b = r.basics;
    const items = [["Name", b.name], ["Email", b.email], ["Phone", b.phone], ["City", b.location], ["LinkedIn", b.linkedin], ["Website", b.website], ["Work authorization", b.workAuth], ["Headline", b.headline], ["Summary", r.summary],
      ...r.experience.map((e) => [`${e.title} @ ${e.company}`, `${e.title}, ${e.company} (${e.start} – ${e.end})\n` + e.bullets.map((x) => "• " + x).join("\n")]),
      ...r.education.map((e) => [e.degree || e.school, `${e.degree}, ${e.school} (${e.start} – ${e.end})`]),
      ["Skills", r.skills.map((s) => s.items.join(", ")).join(", ")], ["Languages", r.languages.map((l) => l.name + " " + l.level).join(", ")], ["Cover letter", state.cover], ["Whole CV (text)", CH.renderText(r, state.settings)]]
      .filter(([, v]) => v && String(v).trim());
    const kit = $("#kit");
    kit.innerHTML = "";
    items.forEach(([label, value]) => {
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "btn ghost"; btn.textContent = "⧉ " + label; btn.title = String(value).slice(0, 200);
      btn.addEventListener("click", () => copy(String(value), label));
      kit.appendChild(btn);
    });
    renderTracker();
  }
  const STATUSES = ["Saved", "Applied", "Interview", "Offer", "Rejected"];
  function renderTracker() {
    const list = $("#trackList");
    if (!state.tracker.length) { list.innerHTML = '<p class="empty">No applications yet. Add the jobs you apply to and keep track of where each one stands.</p>'; return; }
    list.innerHTML = "";
    state.tracker.forEach((t, i) => {
      const row = document.createElement("div");
      row.className = "track-row";
      row.innerHTML = `<div><strong>${CH.escapeHTML(t.company)}</strong> · ${CH.escapeHTML(t.role)} <span class="date">${CH.escapeHTML(t.date)}</span></div>`;
      const sel = document.createElement("select");
      sel.id = "track-status-" + i; sel.setAttribute("aria-label", "Status for " + t.company);
      STATUSES.forEach((s) => sel.add(new Option(s, s, false, s === t.status)));
      sel.addEventListener("change", () => { t.status = sel.value; save(); });
      const del = document.createElement("button");
      del.type = "button"; del.className = "btn tiny danger"; del.textContent = "Remove";
      del.addEventListener("click", () => { state.tracker.splice(i, 1); save(); renderTracker(); });
      row.append(sel, del); list.appendChild(row);
    });
  }
  const today = () => new Date().toISOString().slice(0, 10);
  $("#trackForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.tracker.unshift({ company: $("#tCompany").value.trim(), role: $("#tRole").value.trim(), status: $("#tStatus").value, date: today() });
    $("#tCompany").value = ""; $("#tRole").value = ""; save(); renderTracker();
  });
  $("#trackCurrent").addEventListener("click", () => {
    if (!state.job.company && !state.job.title) { toast("Add a job title or company in step 1 first"); return; }
    state.tracker.unshift({ company: (state.job.company || "—").replace(/\s*\(example\)/i, ""), role: state.job.title || "—", status: "Applied", date: today() });
    save(); renderTracker(); toast("Added to your applications");
  });

  /* ---------- bookmarklet + incoming jobs (normal web hosting only) ---------- */
  function buildBookmarklet() {
    const target = location.href.split("#")[0];
    const code = `(function(){var s=String(getSelection()).trim();var sel=['.jobs-description__content','.jobs-description','#job-details','#jobDescriptionText','[data-testid=jobsearch-JobComponent-description]','[data-at=job-ad-content]','[data-automation=jobAdDetails]','[class*=job-description]','[class*=JobDescription]','[class*=jobDescription]','article','main'];var t=s.length>150?s:'';for(var i=0;!t&&i<sel.length;i++){var e=document.querySelector(sel[i]);if(e&&e.innerText.trim().length>300)t=e.innerText.trim();}if(!t)t=document.body.innerText;var h=document.querySelector('h1');var d={title:h?h.innerText.trim().slice(0,120):document.title.slice(0,120),company:'',text:t.slice(0,7000),url:location.href};var j=btoa(unescape(encodeURIComponent(JSON.stringify(d)))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');window.open('${target}#job='+j,'_blank');})();`;
    $("#bookmarklet").setAttribute("href", "javascript:" + encodeURIComponent(code));
    $("#bookmarklet").addEventListener("click", (e) => { e.preventDefault(); toast("Drag this button to your bookmarks bar"); });
  }
  function takeIncoming() {
    let data = null;
    const m = location.hash.match(/^#job=([A-Za-z0-9_-]+)/);
    if (m) {
      try { data = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, "+").replace(/_/g, "/"))))); } catch (e) { data = null; }
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignore */ }
    }
    try { const inc = localStorage.getItem("challengers.incoming"); if (inc) { data = JSON.parse(inc); localStorage.removeItem("challengers.incoming"); } } catch (e) { /* ignore */ }
    if (data && data.text) {
      state.job = { title: data.title || CH.guessJobTitle(data.text), company: data.company || "", text: data.text };
      if (state.isExample) { state.isExample = false; }
      toast("Job ad received. Tailor your CV in step 3");
    }
  }

  /* ---------- boot ---------- */
  takeIncoming();
  fillForm();
  showTab(state.tab || "job");
  render();
  initPlatform();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPaper);
})();
