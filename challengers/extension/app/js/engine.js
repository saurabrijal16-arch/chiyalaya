/* ChaLLengErs — local engine: parse profile, extract job keywords, score ATS, tailor. No network. */
(function () {
  const CH = (window.CH = window.CH || {});

  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lines = (s) => String(s || "").split(/\r?\n/).map((l) => l.replace(/^\s*[-•*·▪●]\s*/, "").trim()).filter(Boolean);
  const uniq = (a) => [...new Set(a)];

  /* ---------- term matching ---------- */
  function termRegex(term) {
    return new RegExp("(^|[^a-z0-9äöåüéß+#])" + esc(term) + "(?=$|[^a-z0-9äöåüéß+#])", "g");
  }
  function variants(term) {
    const v = [term];
    if (/yse/.test(term)) v.push(term.replace(/yse/g, "yze"));
    if (/yze/.test(term)) v.push(term.replace(/yze/g, "yse"));
    if (/isation/.test(term)) v.push(term.replace(/isation/g, "ization"));
    if (/ization/.test(term)) v.push(term.replace(/ization/g, "isation"));
    if (/s$/.test(term) && term.length > 4) v.push(term.slice(0, -1));
    else if (term.length > 3 && !/[^a-z ]/.test(term.slice(-1))) v.push(term + "s");
    if (term === "problem solving") v.push("problem-solving");
    if (term === "problem-solving") v.push("problem solving");
    return uniq(v);
  }
  function countTerm(textLower, term, original) {
    if (term === "r") return (original.match(/(^|[^A-Za-z])R(?=[,./ )]|$)/g) || []).length;
    if (term === "go") return (original.match(/\bGo\b(?!-)/g) || []).length;
    let n = 0;
    for (const v of variants(term)) n += (textLower.match(termRegex(v)) || []).length;
    return n;
  }
  CH.hasTerm = (textLower, term, original) => countTerm(textLower, term, original || textLower) > 0;

  /* ---------- keyword extraction ---------- */
  CH.extractKeywords = function (jd, limit = 30) {
    const original = String(jd || "");
    const text = original.toLowerCase();
    if (text.trim().length < 30) return [];
    const map = new Map();
    const add = (term, w, kind) => {
      const cur = map.get(term) || { term, weight: 0, count: 0, kind, required: false, optional: false };
      cur.weight += w; cur.count += 1; map.set(term, cur);
    };
    for (const s of CH.SKILLS) {
      if (s === "rest" ) continue;
      const c = countTerm(text, s, original);
      if (c) { add(s, 3 + c * 1.5, CH.LANG_WORDS.includes(s) ? "language" : "skill"); map.get(s).count = c; }
    }
    // frequent words and phrases
    const toks = text.match(/[a-zäöåüéß][a-z0-9äöåüéß+#.\/-]*[a-z0-9+#]|[a-z]/g) || [];
    const clean = toks.map((t) => t.replace(/[.\/-]+$/, ""));
    const uni = new Map(), bi = new Map();
    for (let i = 0; i < clean.length; i++) {
      const a = clean[i];
      const okA = a.length > 2 && !CH.STOPWORDS.has(a) && !/^\d/.test(a);
      if (okA) uni.set(a, (uni.get(a) || 0) + 1);
      const b = clean[i + 1];
      if (okA && b && b.length > 2 && !CH.STOPWORDS.has(b) && !/^\d/.test(b)) {
        const k = a + " " + b; bi.set(k, (bi.get(k) || 0) + 1);
      }
    }
    for (const [k, c] of bi) if (c >= 2 && !map.has(k)) add(k, 2 + c, "phrase");
    for (const [k, c] of uni) if (c >= 2 && !map.has(k)) add(k, c, "word");

    // required vs nice-to-have context
    const sentences = original.split(/[\n.;!?]+/);
    let section = "";
    for (const s of sentences) {
      const sl = s.toLowerCase();
      if (/(requirement|qualification|what we expect|you have|you bring|must|required|essential|we expect|your profile|who you are)/.test(sl)) section = "req";
      if (/(nice to have|bonus|a plus|is a plus|advantage|preferred|desirable|good to have)/.test(sl)) section = "opt";
      if (/(we offer|benefits|what we offer|why join)/.test(sl)) section = "";
      for (const kw of map.values()) {
        if (CH.hasTerm(sl, kw.term, s)) {
          if (section === "req" || /(must|required|essential)/.test(sl)) { if (!kw.required) { kw.required = true; kw.weight += 2; } }
          if (/(nice to have|plus|bonus|advantage|desirable)/.test(sl) || section === "opt") kw.optional = true;
        }
      }
    }
    // drop words already covered by a stronger phrase/skill containing them
    const all = [...map.values()].sort((a, b) => b.weight - a.weight);
    const strong = all.filter((k) => k.kind !== "word").map((k) => k.term);
    const out = all.filter((k) => k.kind !== "word" || !strong.some((s) => s !== k.term && s.split(" ").includes(k.term)));
    return out.slice(0, limit).map((k) => ({ ...k, optional: k.optional && !k.required }));
  };

  CH.guessJobTitle = function (jd) {
    const first = lines(jd)[0] || "";
    return first.length < 80 ? first.split(/[—–|(-]/)[0].trim() : "";
  };

  /* ---------- profile -> resume ---------- */
  CH.toResume = function (p) {
    const skills = lines(p.skills).map((l) => {
      const m = l.match(/^([^:]{2,40}):\s*(.+)$/);
      const items = (m ? m[2] : l).split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
      return { category: m ? m[1].trim() : "", items };
    });
    const languages = lines(p.languages).map((l) => {
      const parts = l.split(/\s+[—–\-:|]\s+|\s*[—–:|]\s*|\s+-\s+/);
      return { name: (parts[0] || "").trim(), level: (parts.slice(1).join(" ") || "").trim() };
    });
    const certifications = lines(p.certifications).map((l) => {
      const [name, date] = l.split("|").map((s) => s.trim());
      return { name, date: date || "" };
    });
    return {
      basics: { ...p.basics },
      summary: (p.summary || "").trim(),
      experience: (p.experience || []).filter((e) => e.title || e.company).map((e) => ({ ...e, bullets: lines(e.bullets) })),
      education: (p.education || []).filter((e) => e.degree || e.school).map((e) => ({ ...e })),
      skills, languages, certifications,
      projects: (p.projects || []).filter((x) => x.name).map((x) => ({ ...x, bullets: lines(x.bullets) })),
      interests: (p.interests || "").trim(),
    };
  };

  CH.resumeText = function (r) {
    const b = r.basics || {};
    const parts = [b.name, b.headline, b.email, b.phone, b.location, b.linkedin, b.website, b.workAuth, r.summary];
    (r.experience || []).forEach((e) => parts.push(e.title, e.company, e.location, e.start, e.end, ...(e.bullets || [])));
    (r.education || []).forEach((e) => parts.push(e.degree, e.school, e.details));
    (r.skills || []).forEach((s) => parts.push(s.category, s.items.join(", ")));
    (r.languages || []).forEach((l) => parts.push(l.name + " " + l.level));
    (r.certifications || []).forEach((c) => parts.push(c.name));
    (r.projects || []).forEach((x) => parts.push(x.name, x.description, ...(x.bullets || [])));
    parts.push(r.interests);
    return parts.filter(Boolean).join("\n");
  };

  /* ---------- bullet helpers ---------- */
  const firstWord = (s) => (s.trim().split(/\s+/)[0] || "").toLowerCase().replace(/[^a-zäöåü-]/g, "");
  CH.startsWithVerb = (s) => CH.ACTION_VERBS.includes(firstWord(s));
  CH.hasMetric = (s) => /\d|%|€|\$|£/.test(s);
  const REWRITES = [
    [/^responsible for\s+/i, "Owned "], [/^in charge of\s+/i, "Led "], [/^tasked with\s+/i, "Delivered "],
    [/^helped (with|to)?\s*/i, "Supported "], [/^assisted (with|in)?\s*/i, "Supported "],
    [/^worked on\s+/i, "Contributed to "], [/^involved in\s+/i, "Contributed to "], [/^participated in\s+/i, "Contributed to "],
    [/^duties include[d]?:?\s*/i, ""],
  ];
  function strengthen(b) {
    for (const [re, rep] of REWRITES) if (re.test(b)) { const out = b.replace(re, rep); return out.charAt(0).toUpperCase() + out.slice(1); }
    return b;
  }

  /* ---------- instant tailoring (no AI) ---------- */
  CH.tailor = function (profile, job, settings) {
    const r = CH.toResume(profile);
    const kws = CH.extractKeywords(job.text);
    const profLower = CH.resumeText(r).toLowerCase();
    const changes = [];
    const kwHits = (s) => kws.filter((k) => CH.hasTerm(s.toLowerCase(), k.term, s)).reduce((a, k) => a + (k.required ? 2 : 1), 0);

    r.experience.forEach((e) => {
      e.bullets = e.bullets.map((b) => { const nb = strengthen(b); if (nb !== b) changes.push(`Rewrote weak opener: “${b.slice(0, 40)}…” → “${nb.slice(0, 40)}…”`); return nb; });
      const scored = e.bullets.map((b, i) => ({ b, i, s: kwHits(b) * 2 + (CH.hasMetric(b) ? 1 : 0) + (CH.startsWithVerb(b) ? 0.5 : 0) }));
      scored.sort((a, z) => z.s - a.s || a.i - z.i);
      const nb = scored.map((x) => x.b);
      if (nb.join() !== e.bullets.join()) changes.push(`Reordered bullets at ${e.company || e.title} so job-relevant ones come first`);
      e.bullets = nb;
    });
    r.projects.forEach((x) => { x.bullets = x.bullets.map(strengthen); });

    // Skills: matched first, categories with most matches first. Never adds skills you did not list.
    const isHit = (item) => kws.some((k) => CH.hasTerm(item.toLowerCase(), k.term, item) || CH.hasTerm(k.term, item.toLowerCase(), item));
    r.skills.forEach((s) => { s.items.sort((a, b) => isHit(b) - isHit(a)); s._hits = s.items.filter(isHit).length; });
    r.skills.sort((a, b) => b._hits - a._hits);
    r.skills.forEach((s) => delete s._hits);

    if (!r.summary) {
      r.summary = CH.draftSummary(r, job, kws, profLower);
      r._summaryDraft = true;
      changes.push("Wrote a draft summary from your real skills. Edit it in “You → Summary” to make it yours.");
    }
    return { resume: r, keywords: kws, changes };
  };

  CH.draftSummary = function (r, job, kws, profLower) {
    const have = kws.filter((k) => k.kind !== "word" && k.kind !== "language" && CH.hasTerm(profLower, k.term)).map((k) => pretty(k.term)).slice(0, 4);
    const role = r.basics.headline || "Professional";
    const title = job.title || "this role";
    const metric = r.experience.flatMap((e) => e.bullets).find(CH.hasMetric);
    let s = `${role} with hands-on experience in ${list(have.length ? have : r.skills.flatMap((x) => x.items).slice(0, 3))}.`;
    if (metric) s += ` ${metric.replace(/\.$/, "")}.`;
    s += ` Ready to bring analytical, reliable work to the ${title} role${job.company ? " at " + job.company.replace(/\s*\(example\)/, "") : ""}.`;
    return s;
  };
  function list(a) { a = a.filter(Boolean); return a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
  function pretty(t) {
    const caps = { sql: "SQL", "power bi": "Power BI", python: "Python", excel: "Excel", "a/b testing": "A/B testing", aws: "AWS", gcp: "GCP", api: "API", "ci/cd": "CI/CD", ux: "UX", ui: "UI", seo: "SEO", crm: "CRM", dbt: "dbt", tableau: "Tableau", "google analytics": "Google Analytics", r: "R", postgresql: "PostgreSQL", javascript: "JavaScript", typescript: "TypeScript", react: "React", "node.js": "Node.js", docker: "Docker", kubernetes: "Kubernetes", gdpr: "GDPR", sap: "SAP", hr: "HR", qa: "QA", agile: "Agile", scrum: "Scrum", pandas: "pandas", "github actions": "GitHub Actions", gitlab: "GitLab", mongodb: "MongoDB", mysql: "MySQL", graphql: "GraphQL", bigquery: "BigQuery", hubspot: "HubSpot", pytorch: "PyTorch", tensorflow: "TensorFlow", "next.js": "Next.js", ".net": ".NET", "c#": "C#", "c++": "C++", "scikit-learn": "scikit-learn", llm: "LLM", "generative ai": "generative AI", nlp: "NLP" };
    if (caps[t]) return caps[t];
    if (CH.LANG_WORDS.includes(t)) return t.charAt(0).toUpperCase() + t.slice(1);
    if (ACRO.has(t)) return t.toUpperCase();
    if (PROPER.has(t)) return t.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return t;
  }
  const ACRO = new Set("api etl nlp llm css html aws gcp seo sem crm ux ui qa hr iam siem itil b2b b2c vba ga4 php sap ifrs pmp rest api tcp/ip haccp".split(" ").concat(["rest api", "iso 9001", "ci/cd"]));
  const PROPER = new Set("django flask fastapi spring java rust kotlin swift ruby scala angular vue linux git kafka spark hadoop airflow snowflake bigquery databricks mongodb mysql redis elasticsearch jira confluence figma salesforce hubspot pytorch tensorflow terraform ansible jenkins azure unity blender autocad solidworks revit laravel rails graphql docker kubernetes selenium cypress scrum kanban photoshop illustrator indesign matlab golang typescript javascript python excel tableau looker lean prince2 bash powershell".split(" ").concat(["spring boot", "react native", "github actions", "google cloud", "unreal engine", "premiere pro", "after effects", "advanced excel", "six sigma", "active directory"]));
  CH.pretty = pretty;

  /* ---------- ATS analysis ---------- */
  CH.analyze = function (r, job, settings) {
    const kws = CH.extractKeywords(job.text);
    const textOrig = CH.resumeText(r);
    const text = textOrig.toLowerCase();
    const checks = [];
    const push = (label, pts, max, detail, fix) => checks.push({ label, pts: Math.max(0, Math.min(max, Math.round(pts))), max, status: pts >= max * 0.85 ? "pass" : pts >= max * 0.5 ? "warn" : "fail", detail, fix });

    // 1. keywords (40)
    const matched = [], missing = [];
    let totalW = 0, gotW = 0;
    kws.forEach((k) => { const w = k.required ? 2 : k.optional ? 0.6 : 1; totalW += w; if (CH.hasTerm(text, k.term, textOrig)) { gotW += w; matched.push(k); } else missing.push(k); });
    const kwRatio = totalW ? gotW / totalW : 0;
    push("Job keyword match", kws.length ? kwRatio * 40 : 0, 40,
      kws.length ? `${matched.length} of ${kws.length} key terms found (${Math.round(kwRatio * 100)}% weighted).` : "Paste a job ad to measure keyword match.",
      missing.length ? "Add missing terms you genuinely have, using the exact wording of the ad." : "");

    // 2. title alignment (6)
    const t = (job.title || "").toLowerCase().trim();
    const titleHit = t && (text.includes(t) || t.split(/\s+/).filter((w) => w.length > 3 && !CH.STOPWORDS.has(w)).every((w) => text.includes(w)));
    push("Job title appears in CV", titleHit ? 6 : 0, 6, titleHit ? "The target title appears in your headline or summary." : "The exact job title is missing from your CV.", t ? `Mention “${job.title}” in your headline or summary if it truthfully fits.` : "");

    // 3. contact (8)
    const b = r.basics || {};
    const c = [b.name, b.email && /@/.test(b.email), b.phone, b.location, b.linkedin];
    push("Contact details", (c.filter(Boolean).length / 5) * 8, 8, `Name, email, phone, city and LinkedIn: ${c.filter(Boolean).length}/5 present.`, "Put contact details in the main body (not a header/footer). ATS often skips headers.");

    // 4. sections (8)
    const secs = [!!r.summary, r.experience.length > 0 || r.projects.length > 0, r.education.length > 0, r.skills.length > 0];
    push("Standard sections", (secs.filter(Boolean).length / 4) * 8, 8, `Summary, Experience, Education, Skills: ${secs.filter(Boolean).length}/4.`, "Use standard headings so the ATS can map each section.");

    // 5/6. bullets (10 + 10)
    const bullets = [...r.experience.flatMap((e) => e.bullets || []), ...r.projects.flatMap((x) => x.bullets || [])];
    const verbR = bullets.length ? bullets.filter(CH.startsWithVerb).length / bullets.length : 0;
    const metR = bullets.length ? bullets.filter(CH.hasMetric).length / bullets.length : 0;
    push("Bullets start with action verbs", Math.min(1, verbR / 0.8) * 10, 10, `${Math.round(verbR * 100)}% of bullets start with a strong verb.`, "Start each bullet with a verb like Built, Reduced, Led, Automated.");
    push("Measurable results", Math.min(1, metR / 0.5) * 10, 10, `${Math.round(metR * 100)}% of bullets contain a number.`, "Add real numbers: %, €, time saved, users, volume. Never invent them.");

    // 7. weak phrases (6)
    const weak = CH.WEAK_PHRASES.filter((w) => termRegex(w).test(text));
    push("No weak or cliché phrases", 6 - weak.length * 1.5, 6, weak.length ? `Found: ${weak.map((w) => "“" + w + "”").join(", ")}.` : "No weak phrases found.", "Replace with what you did and the result.");

    // 8. length (6)
    const words = text.split(/\s+/).filter(Boolean).length;
    const lenPts = words < 200 ? 2 : words < 350 ? 4.5 : words <= 900 ? 6 : words <= 1100 ? 4 : 2;
    push("Length", lenPts, 6, `${words} words. Aim for about 350–900 (1–2 pages).`, words < 350 ? "Add more evidence: projects, results, coursework." : words > 900 ? "Cut older or less relevant bullets." : "");

    // 9. pronouns (3)
    const pron = (text.match(/(^|[^a-z])(i|me|my)(?=[^a-z])/g) || []).length;
    push("No first-person pronouns", pron ? 3 - pron : 3, 3, pron ? `${pron} uses of I/me/my.` : "None found.", "Write “Built…”, not “I built…”.");

    // 10. dates (3)
    const dated = r.experience.filter((e) => e.start && e.end).length;
    push("Dates on every role", r.experience.length ? (dated / r.experience.length) * 3 : 3, 3, `${dated}/${r.experience.length} roles have start and end dates.`, "Use MM/YYYY – MM/YYYY.");

    const placeholders = (textOrig.match(/\[[^\]]{1,40}\]/g) || []);
    const warnings = [];
    if (placeholders.length) warnings.push(`Unfilled placeholders: ${uniq(placeholders).slice(0, 5).join(" ")}. Replace them with real numbers or delete them.`);
    const country = CH.COUNTRIES[settings.country] || CH.COUNTRIES.EU;
    if (settings.showPhoto && country.photo === "no") warnings.push(`Photos are not expected in ${country.name}. Turn the photo off.`);
    if (settings.showDob && country.photo === "no") warnings.push(`Date of birth is not expected in ${country.name}.`);
    const langReq = kws.filter((k) => k.kind === "language");
    langReq.forEach((k) => { if (!r.languages.some((l) => l.name.toLowerCase().includes(k.term))) warnings.push(`The ad mentions ${pretty(k.term[0].toUpperCase() + k.term.slice(1))}. List your level (even A1/A2) if you have any.`); });
    if (/right to work|work permit|eligib|residence permit|visa/i.test(job.text || "") && !b.workAuth) warnings.push("The ad mentions right to work. Add your work authorization status.");

    const score = checks.reduce((a, c) => a + c.pts, 0);
    return { score, checks, matched, missing, keywords: kws, warnings, words };
  };

  /* ---------- cover letter draft (no AI) ---------- */
  CH.draftCoverLetter = function (r, job, settings) {
    const kws = CH.extractKeywords(job.text);
    const text = CH.resumeText(r).toLowerCase();
    const have = kws.filter((k) => k.kind === "skill" && CH.hasTerm(text, k.term)).map((k) => pretty(k.term)).slice(0, 5);
    const best = r.experience.flatMap((e) => (e.bullets || []).map((b) => ({ b, e }))).filter((x) => CH.hasMetric(x.b)).slice(0, 2);
    const company = (job.company || "your company").replace(/\s*\(example\)/, "");
    const name = r.basics.name || "";
    const p = [];
    p.push(`Dear Hiring Team at ${company},`);
    p.push(`I am applying for the ${job.title || "advertised"} position. ${r.basics.headline ? "As a " + r.basics.headline.toLowerCase() : "With my background"}${have.length ? ", I work with " + list(have) : ""}, and your role matches what I do best.`);
    if (best.length) p.push(best.map((x) => `At ${x.e.company}, I ${x.b.charAt(0).toLowerCase() + x.b.slice(1).replace(/\.$/, "")}.`).join(" ") + " I would bring the same focus on measurable results to your team.");
    p.push(`[One or two sentences on why ${company} specifically: a product, value or project you genuinely like.]`);
    if (r.basics.workAuth) p.push(`${r.basics.workAuth}.`);
    p.push(`I would welcome the chance to discuss how I can contribute. Thank you for your time.`);
    p.push(`Kind regards,\n${name}${r.basics.phone ? "\n" + r.basics.phone : ""}${r.basics.email ? "\n" + r.basics.email : ""}`);
    return p.join("\n\n");
  };

  CH.lines = lines;
  CH.list = list;
})();
