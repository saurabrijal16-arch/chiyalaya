# ChaLLengErs

**A free CV builder for European jobs.** Paste a job ad, and ChaLLengErs tailors your CV to it, scores it against ATS rules, follows the CV conventions of the country, and exports a real text PDF, a Word file or plain text. No account, no subscription, no server: your data never leaves your browser.

## What it does

| Feature | How |
|---|---|
| Job keyword analysis | Pulls required and nice-to-have skills from any job ad |
| ATS readiness score (0–100) | 10 checks: keyword match, job title, contact info, standard sections, action verbs, metrics, weak phrases, length, pronouns, dates |
| Instant tailor (free, offline) | Reorders bullets and skills by relevance, fixes weak openers ("Responsible for" → "Owned"), drafts a summary. Never invents skills |
| Master AI prompt | One click copies a strong prompt for ChatGPT, Claude, Gemini or Le Chat. Paste the answer back to load it |
| Claude inside the page | When opened as a claude.ai Artifact, "Write my CV with Claude" runs on your own claude.ai account |
| 18 European countries | Finland, Sweden, Norway, Denmark, Germany, Austria, Switzerland, Netherlands, Belgium, France, Ireland, UK, Spain, Italy, Portugal, Poland, Estonia + general Europass. Photo, date-of-birth and GDPR-clause rules per country |
| 10 CV languages | Headings in EN, DE, FR, FI, SV, NL, ES, IT, PT, PL |
| Exports | Text-based PDF (ATS can read it), DOCX, TXT, copy text |
| Cover letter | Free draft from your CV, or written by AI |
| Apply kit + tracker | Copy fields into application forms; track Saved → Applied → Interview → Offer |
| Browser extension | Reads the job ad on LinkedIn, Indeed, StepStone, Duunitori etc.; inserts the prompt into ChatGPT/Claude/Gemini |

## Why not an auto-apply bot?

Tools like AIApply, LazyApply or Sonara mass-submit applications. They cost about $30–70/month. Many recruiters filter or blacklist bot traffic, and LinkedIn's User Agreement forbids automation, so accounts can be restricted. ChaLLengErs does the opposite: one strong, honest, tailored application at a time, and you click Submit yourself.

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
3. On a job page click the red **C** icon, or right-click → *Tailor my CV to this job*.

## Develop

```
node challengers/build.mjs          # rebuild dist/ and extension/app after editing web/
cd challengers/web && python3 -m http.server 8000   # then open http://localhost:8000
```

Files: `web/js/data.js` (country rules, headings, skills), `engine.js` (keywords, scoring, tailoring), `prompt.js` (master prompt), `exporters.js` (PDF, DOCX, TXT), `app.js` (UI).

## Honest limits

- The ATS score is an estimate built from widely used rules. No tool can guarantee a pass on every ATS.
- Country notes describe common practice, not law. The job ad always wins.
- The PDF uses the standard Helvetica font: Western and Nordic letters (ä, ö, å, é, ü, ß) work; some Central European letters (ł, ő) are simplified. Use DOCX for those languages.
- Everything you type is stored only in your browser's local storage. Use "Save profile file" as a backup.
