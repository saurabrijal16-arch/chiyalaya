# ChaLLengErs

**A free CV builder for European jobs.** Paste a job ad, and ChaLLengErs tailors your CV to it, scores it against ATS rules, follows the CV conventions of the country, and exports a real text PDF, a Word file or plain text. No account, no subscription, no server: your data never leaves your browser.

## What it does

### ChaLLengErs vs. AI Apply

| | AI Apply (paid, ~$30–70/month per reviews) | ChaLLengErs (free) |
|---|---|---|
| AI CV builder | ✓ | ✓ Tailored per job, with Europe-specific rules for 18 countries |
| CV score / checker | ✓ | ✓ 10-check ATS readiness score + live keyword match |
| Cover letter generator | ✓ | ✓ Free draft offline, or AI-written |
| Interview Buddy | ✓ | ✓ Likely questions from your CV + the ad, STAR story builder, AI mock interview with scored feedback |
| CV translator | ✓ | ✓ AI translation + headings in 10 languages |
| LinkedIn → CV | ✓ | ✓ Upload PDF/DOCX/TXT or paste LinkedIn text; fills the form without AI |
| Job search | Built-in job board | ✓ One-click searches on 30+ European boards (Duunitori, StepStone, Platsbanken, FINN, Jobindex, InfoJobs…) |
| Auto-apply | Bot submits for you | ✓ **1-click autofill** in the extension: fills the form and attaches your tailored PDF. You review and submit, so no bot bans or wrong answers |
| Job pipeline | – | ✓ Every saved job ranked by how well your CV fits it |
| LinkedIn headline/About, recruiter message, follow-up emails, skill-gap plan | partly | ✓ AI toolkit (8 tools) |
| Works offline / no account / data stays on your device | – | ✓ |

### All features

| Feature | How |
|---|---|
| Job keyword analysis | Pulls required and nice-to-have skills from any job ad |
| ATS readiness score (0–100) | Keyword match, job title, contact info, standard sections, action verbs, metrics, weak phrases, length, pronouns, dates |
| Instant tailor (free, offline) | Reorders bullets and skills by relevance, fixes weak openers, drafts a summary. Never invents skills |
| CV import | Upload PDF, DOCX or TXT (or paste LinkedIn) and the form fills itself |
| Master AI prompt | Copy into ChatGPT, Claude, Gemini or Le Chat; paste the answer back to load it |
| Claude inside the page | As a claude.ai Artifact, CV writing, the AI toolkit and the mock interview run on your own claude.ai account |
| AI toolkit | Import, translate, cover letter, interview Q&A, LinkedIn profile, recruiter message, follow-ups, skill-gap plan |
| Interview coach | Generated questions with tips, STAR story bank, AI mock interview |
| Jobs | Search links for each country, pipeline with job-fit score and status |
| Exports | Text-based PDF (ATS can read it), DOCX, TXT, copy text |
| Browser extension | Reads job ads, saves them to the pipeline, autofills applications with your CV attached, inserts prompts into AI chats |

## Use it

1. **Online:** open the deployed page (GitHub Pages, see below) or the claude.ai Artifact link.
2. **Offline:** download `dist/challengers.html` and double-click it. Everything works except the AI chat links.
3. **In ChatGPT / Claude / Gemini only:** copy `prompts/challengers-instructions.md` into a Custom GPT, Claude Project or Gemini Gem.

## Deploy for free (GitHub Pages)

1. Merge this branch into `main`.
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. The workflow `.github/workflows/challengers-pages.yml` publishes the site at `https://<your-user>.github.io/<repo>/`. It also serves `offline.html` and `challengers-extension.zip`.

Any static host also works (Netlify Drop, Cloudflare Pages, Vercel): upload the `challengers/web` folder.

## Install the browser extension (Chrome, Edge, Brave)

1. Run `node challengers/build.mjs` (copies the app into `extension/app`). The repository already contains a built copy.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, choose `challengers/extension`.
3. On a job page click the red **C** icon: *Tailor my CV*, *Save job to my pipeline*, or on an application form *Autofill this application form*. Right-click → *Tailor my CV to this job* also works.

Autofill fills only empty, visible fields, highlights them in yellow and never clicks Submit. Forms inside third-party frames may need you to click inside the form first.

## Develop

```
node challengers/build.mjs          # rebuild dist/ and extension/app after editing web/
cd challengers/web && python3 -m http.server 8000   # then open http://localhost:8000
```

Files: `web/js/data.js` (country rules, headings, skills, job boards), `engine.js` (keywords, scoring, tailoring, interview questions, CV import), `prompt.js` (master prompt, AI toolkit), `importers.js` (PDF/DOCX reading), `exporters.js` (PDF, DOCX, TXT), `app.js` (UI).

## Honest limits

- The ATS score is an estimate built from widely used rules. No tool can guarantee a pass on every ATS.
- Country notes describe common practice, not law. The job ad always wins.
- The PDF uses the standard Helvetica font: Western and Nordic letters (ä, ö, å, é, ü, ß) work; some Central European letters (ł, ő) are simplified. Use DOCX for those languages.
- PDF import loads pdf.js from cdnjs the first time it is used (online only). Scanned image PDFs have no text; paste the text instead.
- Everything you type is stored only in your browser's local storage. Use "Save profile file" as a backup.
