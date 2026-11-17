/* ChaLLengErs — master prompt builder. Works with any chat AI (ChatGPT, Claude, Gemini, Copilot, Le Chat). */
(function () {
  const CH = (window.CH = window.CH || {});

  CH.SCHEMA_EXAMPLE = `{
  "basics": {"name": "", "headline": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "", "workAuth": "", "nationality": "", "dob": ""},
  "summary": "",
  "experience": [{"title": "", "company": "", "location": "", "start": "MM/YYYY", "end": "MM/YYYY or Present", "bullets": [""]}],
  "education": [{"degree": "", "school": "", "location": "", "start": "", "end": "", "details": ""}],
  "skills": [{"category": "", "items": [""]}],
  "languages": [{"name": "", "level": "CEFR level or Native"}],
  "certifications": [{"name": "", "date": ""}],
  "projects": [{"name": "", "link": "", "bullets": [""]}],
  "interests": "",
  "coverLetter": "",
  "ats": {"targetTitle": "", "matchedKeywords": [""], "missingKeywords": [""], "questionsForCandidate": [""], "notes": [""]}
}`;

  CH.buildPrompt = function ({ profile, job, settings, instructions, output }) {
    const country = CH.COUNTRIES[settings.country] || CH.COUNTRIES.EU;
    const langName = CH.LANG_NAMES[settings.lang] || "English";
    const resume = CH.toResume(profile);
    const kws = CH.extractKeywords(job.text).slice(0, 25).map((k) => k.term + (k.required ? " (required)" : k.optional ? " (nice to have)" : ""));
    const wantCover = settings.coverLetter;

    const outputSpec = output === "text"
      ? `OUTPUT FORMAT
Return, in this order:
1. The finished CV as clean plain text (Markdown headings allowed, no tables, no columns, no emojis, no icons), ready to paste into a single-column document.
2. ${wantCover ? "A cover letter (max 250 words)." : "(no cover letter)"}
3. A short "ATS report": matched keywords, missing keywords the candidate should add ONLY if true, and up to 5 questions whose answers would make the CV stronger (for example, missing numbers).`
      : `OUTPUT FORMAT
Return ONLY one JSON object inside a single \`\`\`json code block, no text before or after. Use exactly this shape (omit nothing; use "" or [] when empty):
${CH.SCHEMA_EXAMPLE}
- "bullets" are arrays of strings without leading dashes.
- ${wantCover ? '"coverLetter": a tailored letter, max 250 words, in ' + langName + '.' : '"coverLetter": "".'}
- "ats.questionsForCandidate": up to 5 questions whose answers would make the CV stronger.`;

    return `You are CHALLENGERS, an elite European career strategist, senior technical recruiter and ATS (applicant tracking system) specialist. You have screened thousands of CVs for employers in ${country.name} and know exactly what ATS parsers (Workday, SAP SuccessFactors, Teamtailor, Greenhouse, Lever, Recruitee, Personio) and human recruiters reward.

MISSION
Write the strongest possible, 100% truthful CV for the job below, so that it (1) parses cleanly in any ATS, (2) ranks high on keyword match, and (3) convinces a human recruiter in 7 seconds.

NON-NEGOTIABLE RULES
1. Truth first. Never invent employers, titles, dates, degrees, certifications, skills, tools or numbers. You may rephrase, reorder, merge, sharpen and translate. If a metric would clearly help but is unknown, write the bullet without a number and ask about it in the questions list. Never use made-up placeholders inside the CV.
2. Mirror the job ad's exact wording for skills and tools the candidate really has (e.g. if the ad says "Power BI", write "Power BI", not "BI tools"). Place the most important keywords in the headline, summary, the first bullets of the most recent role and the skills section.
3. Do not list a skill from the ad that the candidate does not have. Put it in missingKeywords instead.
4. Bullets: start with a strong past-tense action verb (present tense for the current role), follow the formula "Accomplished X, measured by Y, by doing Z", 1–2 lines each, 3–6 bullets for recent roles and 1–3 for old or unrelated roles. Lead with results, not duties. No "responsible for", "helped", "worked on", no first-person pronouns, no clichés ("hard-working", "team player", "results-driven").
5. Summary: 2–4 lines and about 50–80 words: who the candidate is (matching the target title if truthful), years of experience or study level, 3–5 top matching skills, one proof point, and what they bring to this employer.
6. ATS-safe format: one column, standard headings, no tables, text boxes, graphics, icons or skill bars, contact details in the body. Dates as ${country.dateStyle === "word" ? "Mon YYYY (e.g. Jan 2024)" : "MM/YYYY"}. Reverse-chronological order.
7. Prioritise ruthlessly: what is most relevant to THIS job goes first. Cut what does not help. Target length: ${country.pages} page(s).
8. Language levels use CEFR (A1–C2) or "Native". If the ad requires a language, make the candidate's level easy to find.
9. Write the whole CV in ${langName}${settings.lang !== "en" ? " (translate the candidate's content faithfully)" : ""}. Use ${settings.country === "UK" || settings.country === "IE" ? "British" : "consistent"} spelling.

COUNTRY CONVENTIONS — ${country.name}
${country.notes.map((n) => "- " + n).join("\n")}
- Photo: ${country.photo === "no" ? "do not include" : "optional (the app handles it; do not mention it)"}.
${country.gdpr ? "- The app adds the GDPR consent clause automatically; do not add it yourself." : ""}

PROCESS (think step by step silently, output only the final result)
A. Analyse the job ad: exact job title, seniority, the must-have skills, nice-to-haves, soft skills, language and work-permit requirements, and the company's main problem this hire solves.
B. Map every requirement to evidence in the candidate data. Note gaps.
C. Write the CV following all rules above.
D. Self-check before answering: every keyword the candidate truly has appears at least once; no invented facts; every bullet starts with a verb; dates are consistent; nothing breaks ATS parsing. Fix anything that fails.

TARGET JOB
Title: ${job.title || "(see ad)"}
Company: ${job.company || "(see ad)"}
Country: ${country.name}
Top keywords detected by ChaLLengErs: ${kws.join(", ") || "(none detected)"}
Job ad:
"""
${(job.text || "").trim().slice(0, 12000)}
"""

CANDIDATE DATA (the only source of facts)
${JSON.stringify(resume, null, 1)}
${profile.rawResume ? `\nCandidate's existing CV / extra notes (also a source of facts):\n"""\n${profile.rawResume.trim().slice(0, 12000)}\n"""` : ""}

CANDIDATE'S OWN INSTRUCTIONS (follow them unless they break the truth rule)
${(instructions || "None.").trim()}

${outputSpec}`;
  };

  /* Parse an AI answer (JSON in a code block, or raw JSON) into a resume object. */
  CH.parseAIResult = function (txt) {
    let s = String(txt || "").trim();
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) s = fence[1];
    const a = s.indexOf("{"), z = s.lastIndexOf("}");
    if (a < 0 || z < a) throw new Error("No JSON object found. Ask the AI for the JSON format, or choose “Plain text” output.");
    const obj = JSON.parse(s.slice(a, z + 1));
    const arr = (x) => (Array.isArray(x) ? x : x ? [x] : []);
    const str = (x) => (x == null ? "" : String(x));
    const b = obj.basics || {};
    return {
      basics: { name: str(b.name), headline: str(b.headline), email: str(b.email), phone: str(b.phone), location: str(b.location), linkedin: str(b.linkedin), website: str(b.website), workAuth: str(b.workAuth), nationality: str(b.nationality), dob: str(b.dob) },
      summary: str(obj.summary),
      experience: arr(obj.experience).map((e) => ({ title: str(e.title), company: str(e.company), location: str(e.location), start: str(e.start), end: str(e.end), bullets: arr(e.bullets).map(str).filter(Boolean) })),
      education: arr(obj.education).map((e) => ({ degree: str(e.degree), school: str(e.school), location: str(e.location), start: str(e.start), end: str(e.end), details: str(e.details) })),
      skills: arr(obj.skills).map((s) => (typeof s === "string" ? { category: "", items: [s] } : { category: str(s.category), items: arr(s.items).map(str).filter(Boolean) })),
      languages: arr(obj.languages).map((l) => (typeof l === "string" ? { name: l, level: "" } : { name: str(l.name), level: str(l.level) })),
      certifications: arr(obj.certifications).map((c) => (typeof c === "string" ? { name: c, date: "" } : { name: str(c.name), date: str(c.date) })),
      projects: arr(obj.projects).map((p) => ({ name: str(p.name), link: str(p.link), bullets: arr(p.bullets).map(str).filter(Boolean) })),
      interests: str(obj.interests),
      coverLetter: str(obj.coverLetter),
      ats: obj.ats || {},
    };
  };

  /* Convert a resume object back into the editable profile form (so AI results can be edited). */
  CH.resumeToProfile = function (r, prev) {
    const j = (a) => (a || []).join("\n");
    return {
      basics: { ...(prev && prev.basics), ...r.basics },
      summary: r.summary || "",
      experience: r.experience.map((e) => ({ title: e.title, company: e.company, location: e.location, start: e.start, end: e.end, bullets: j(e.bullets) })),
      education: r.education.map((e) => ({ ...e })),
      skills: r.skills.map((s) => (s.category ? s.category + ": " : "") + s.items.join(", ")).join("\n"),
      languages: r.languages.map((l) => l.name + (l.level ? " — " + l.level : "")).join("\n"),
      certifications: r.certifications.map((c) => c.name + (c.date ? " | " + c.date : "")).join("\n"),
      projects: r.projects.map((p) => ({ name: p.name, link: p.link, bullets: j(p.bullets) })),
      interests: r.interests || "",
      rawResume: (prev && prev.rawResume) || "",
    };
  };
})();
