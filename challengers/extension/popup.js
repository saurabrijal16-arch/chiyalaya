/* ChaLLengErs popup: read the job ad on the current tab, show ATS keywords, open the builder or copy/insert the AI prompt. */
(async function () {
  const CH = window.CH;
  const $ = (s) => document.querySelector(s);
  const CHAT_HOSTS = /(^|\.)((chatgpt\.com)|(chat\.openai\.com)|(claude\.ai)|(gemini\.google\.com)|(chat\.mistral\.ai)|(copilot\.microsoft\.com)|(perplexity\.ai))$/;
  let job = { title: "", company: "", text: "", url: "" };
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem("challengers.v1") || "null"); } catch (e) { saved = null; }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const host = (() => { try { return new URL(tab.url).hostname; } catch (e) { return ""; } })();
  const onChat = CHAT_HOSTS.test(host);

  function grab() {
    const sel = String(getSelection()).trim();
    const sels = [".jobs-description__content", ".jobs-description", "#job-details", ".jobs-box__html-content", "#jobDescriptionText",
      "[data-testid='jobsearch-JobComponent-description']", "[data-at='job-ad-content']", "[data-automation='jobAdDetails']", ".listing-content",
      "[class*='job-description']", "[class*='JobDescription']", "[class*='jobDescription']", "[id*='job-description']", ".description__text", "article", "main"];
    let text = sel.length > 150 ? sel : "";
    for (let i = 0; !text && i < sels.length; i++) { const el = document.querySelector(sels[i]); if (el && el.innerText.trim().length > 300) text = el.innerText.trim(); }
    if (!text) text = document.body.innerText;
    const h1 = document.querySelector("h1");
    const og = document.querySelector("meta[property='og:site_name']");
    const comp = document.querySelector(".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, [data-testid='inlineHeader-companyName'], [data-company-name], [class*='companyName'], [class*='company-name']");
    return { title: h1 ? h1.innerText.trim().slice(0, 120) : document.title.slice(0, 120), company: comp ? comp.innerText.trim().slice(0, 80) : og ? og.content : "", text: text.slice(0, 15000), url: location.href };
  }

  if (onChat) {
    // On an AI chat: offer to insert the prompt for the last job saved in ChaLLengErs.
    $("#insert").hidden = false;
    job = (saved && saved.job) || job;
    $("#meta").textContent = job.text ? "Using the job you last opened in ChaLLengErs." : "Open a job page first, then come back here.";
  } else {
    try {
      const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: grab });
      job = res.result;
    } catch (e) {
      $("#meta").textContent = "This page can't be read (browser pages and the Chrome Web Store are protected). Open a job ad.";
    }
  }
  $("#title").value = job.title || "";
  $("#company").value = job.company || "";
  $("#title").addEventListener("input", () => (job.title = $("#title").value));
  $("#company").addEventListener("input", () => (job.company = $("#company").value));

  if (job.text) {
    const kws = CH.extractKeywords(job.text, 18);
    if (!onChat) $("#meta").textContent = `${job.text.length.toLocaleString()} characters read · ${kws.length} keywords`;
    let matchedSet = new Set();
    if (saved && saved.profile) {
      const r = CH.toResume(saved.profile);
      const a = CH.analyze(r, job, saved.settings || {});
      matchedSet = new Set(a.matched.map((k) => k.term));
      $("#match").hidden = false;
      $("#match").textContent = `Your saved CV matches ${a.matched.length}/${a.keywords.length} keywords · ATS readiness ${Math.round(a.score)}/100`;
    }
    $("#kws").innerHTML = "";
    kws.forEach((k) => {
      const s = document.createElement("span");
      s.className = "chip" + (saved && saved.profile ? (matchedSet.has(k.term) ? " ok" : " miss") : "");
      s.textContent = CH.pretty(k.term);
      $("#kws").appendChild(s);
    });
  }

  function promptText() {
    const profile = (saved && saved.profile) || CH.SAMPLE_PROFILE;
    const settings = (saved && saved.settings) || { country: "EU", lang: "en", coverLetter: true };
    return CH.buildPrompt({ profile, job, settings, instructions: (saved && saved.instructions) || "", output: "json" });
  }

  $("#open").addEventListener("click", () => {
    if (job.text) localStorage.setItem("challengers.incoming", JSON.stringify(job));
    chrome.tabs.create({ url: chrome.runtime.getURL("app/index.html") });
  });
  if (onChat) { $("#autofill").hidden = true; $("#save").hidden = true; }

  $("#save").addEventListener("click", () => {
    if (!job.text) { $("#save").textContent = "No job text found on this page"; return; }
    const inbox = JSON.parse(localStorage.getItem("challengers.inbox") || "[]");
    inbox.push({ title: job.title, company: job.company, text: job.text, url: job.url });
    localStorage.setItem("challengers.inbox", JSON.stringify(inbox));
    $("#save").textContent = "Saved. It's in Jobs → pipeline, with a match score";
  });

  $("#autofill").addEventListener("click", async () => {
    if (!saved || !saved.profile || !saved.profile.basics || !saved.profile.basics.email) {
      $("#fillNote").hidden = false;
      $("#fillNote").textContent = "Fill in your profile in the ChaLLengErs builder first (Tailor my CV → step 2).";
      return;
    }
    const b = saved.profile.basics;
    const parts = (b.name || "").trim().split(/\s+/);
    const data = {
      first: parts.slice(0, -1).join(" ") || parts[0] || "", last: parts.length > 1 ? parts[parts.length - 1] : "", name: b.name || "",
      email: b.email || "", phone: b.phone || "", linkedin: b.linkedin ? (/^https?:/.test(b.linkedin) ? b.linkedin : "https://" + b.linkedin) : "",
      website: b.website ? (/^https?:/.test(b.website) ? b.website : "https://" + b.website) : "", city: (b.location || "").split(",")[0].trim(),
      location: b.location || "", headline: b.headline || "", cover: saved.cover || "",
    };
    let pdf = null;
    try {
      const { bytes } = CH.buildPDF(CH.toResume(saved.profile), saved.settings || {}, null);
      let bin = ""; bytes.forEach((x) => (bin += String.fromCharCode(x)));
      pdf = { b64: btoa(bin), name: ((b.name || "CV").replace(/[^\p{L}\p{N}]+/gu, "_") + "_CV.pdf") };
    } catch (e) { pdf = null; }
    try {
      let results;
      try { results = await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, args: [data, pdf], func: autofillPage }); }
      catch (e) { results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, args: [data, pdf], func: autofillPage }); }
      const total = results.reduce((a, r) => a + ((r.result && r.result.filled) || 0), 0);
      const files = results.reduce((a, r) => a + ((r.result && r.result.files) || 0), 0);
      $("#fillNote").hidden = false;
      $("#fillNote").textContent = total || files
        ? `Filled ${total} field(s)${files ? " and attached your CV" : ""} (highlighted in yellow). Check everything, answer the remaining questions, then submit yourself.`
        : "No matching fields found on this page. Open the application form step first.";
    } catch (e) {
      $("#fillNote").hidden = false; $("#fillNote").textContent = "This page can't be filled automatically.";
    }
  });

  $("#copy").addEventListener("click", async () => {
    if (!saved || !saved.profile) $("#tip").textContent = "No saved profile yet. The prompt uses the example profile. Fill in yours in the builder first.";
    await navigator.clipboard.writeText(promptText());
    $("#copy").textContent = "Copied! Paste it into any AI chat";
  });
  $("#insert").addEventListener("click", async () => {
    const text = promptText();
    try {
      const [res] = await chrome.scripting.executeScript({
        target: { tabId: tab.id }, args: [text],
        func: (t) => {
          const el = document.querySelector("#prompt-textarea, div.ProseMirror[contenteditable='true'], rich-textarea [contenteditable='true'], div[contenteditable='true'], textarea");
          if (!el) return false;
          el.focus();
          if (el.tagName === "TEXTAREA") {
            const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
            setter.call(el, t); el.dispatchEvent(new Event("input", { bubbles: true }));
          } else { document.execCommand("insertText", false, t); }
          return true;
        },
      });
      if (res.result) { $("#insert").textContent = "Inserted. Press Enter in the chat"; return; }
    } catch (e) { /* fall through */ }
    await navigator.clipboard.writeText(text);
    $("#insert").textContent = "Couldn't find the chat box. Copied instead";
  });
})();


/* Runs inside the job page (each frame). Fills only empty, visible fields; never submits. */
function autofillPage(d, pdf) {
  const RULES = [
    ["email", /e-?mail|sähköposti|courriel|correo/i],
    ["linkedin", /linked\s?in/i],
    ["first", /first.?name|given.?name|fname|forename|vorname|etunimi|förnamn|fornavn|prénom|nombre(?!.*apellido)|voornaam|imię|nome(?!.*cognome)/i],
    ["last", /last.?name|family.?name|surname|lname|nachname|sukunimi|efternamn|etternavn|nom de famille|apellido|achternaam|nazwisko|cognome/i],
    ["name", /full.?name|^name$|your.?name|candidate.?name|^nimi$|vollständiger name|ditt namn/i],
    ["phone", /phone|mobile|tel(e|ef)?|puhelin|telefon|handy|téléphone|teléfono/i],
    ["website", /website|portfolio|github|personal.?(site|url)|homepage|web.?site/i],
    ["city", /\bcity\b|town|kaupunki|stadt|wohnort|\bort\b|ville|ciudad|città|location|paikkakunta/i],
    ["headline", /current.?(job.?)?title|headline|nykyinen tehtävä/i],
    ["cover", /cover.?letter|motivation|hakemus|anschreiben|personligt brev|lettre de motivation|carta de presentación|why (do )?you want|message to (the )?(hiring|recruiter)/i],
  ];
  const labelOf = (el) => {
    let t = [el.name, el.id, el.placeholder, el.getAttribute("aria-label"), el.getAttribute("autocomplete"), el.getAttribute("data-automation-id"), el.getAttribute("data-qa")].join(" ");
    if (el.id) { const l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]'); if (l) t += " " + l.innerText; }
    const pl = el.closest("label"); if (pl) t += " " + pl.innerText;
    const lb = el.getAttribute("aria-labelledby"); if (lb) lb.split(/\s+/).forEach((id) => { const n = document.getElementById(id); if (n) t += " " + n.innerText; });
    if (t.trim().length < 3) { const box = el.closest("div,li,fieldset"); if (box) t += " " + (box.innerText || "").slice(0, 80); }
    return t.replace(/\s+/g, " ").trim();
  };
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
  const setVal = (el, v) => {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); el.dispatchEvent(new Event("blur", { bubbles: true }));
    el.style.outline = "3px solid #facc15"; el.style.outlineOffset = "1px";
  };
  let filled = 0, files = 0;
  document.querySelectorAll("input, textarea").forEach((el) => {
    const type = (el.type || "text").toLowerCase();
    if (el.disabled || el.readOnly) return;
    if (type === "file") {
      const lbl = labelOf(el);
      if (pdf && /resume|cv|curriculum|lebenslauf|ansioluettelo|meritförteckning|attach/i.test(lbl) && !/cover|motivation|anschreiben|photo|picture|image/i.test(lbl) && (!el.files || !el.files.length) && files === 0) {
        try {
          const bin = atob(pdf.b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
          const dt = new DataTransfer(); dt.items.add(new File([u8], pdf.name, { type: "application/pdf" }));
          el.files = dt.files; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
          files++;
        } catch (e) { /* site blocks programmatic files */ }
      }
      return;
    }
    if (!["text", "email", "tel", "url", "search", ""].includes(type) && el.tagName !== "TEXTAREA") return;
    if (el.value && el.value.trim()) return;
    if (!visible(el)) return;
    const lbl = labelOf(el);
    const ac = (el.getAttribute("autocomplete") || "").toLowerCase();
    let key = ac === "given-name" ? "first" : ac === "family-name" ? "last" : ac === "email" ? "email" : ac === "tel" ? "phone" : ac === "name" ? "name" : null;
    if (!key) { const r = RULES.find(([, re]) => re.test(lbl)); key = r && r[0]; }
    if (key === "cover" && el.tagName !== "TEXTAREA") key = null;
    if (key === "city" && /country|maa|land|pays|país/i.test(lbl)) key = null;
    if (key && d[key]) { setVal(el, d[key]); filled++; }
  });
  return { filled, files };
}
