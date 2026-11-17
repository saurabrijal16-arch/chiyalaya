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
