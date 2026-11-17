# Get ChaLLengErs found on Google

**Be realistic about the target.** The single word "challengers" is dominated by the 2024 Zendaya film, Wikipedia, the ATP Challenger tennis tour and Valorant Challengers. A new site will not beat those for that word. The searches you *can* win are:

- **Brand + category:** "challengers cv", "challengers cv builder", "challengers resume", "ChaLLengErs"
- **Long-tail:** "free ATS CV builder Finland", "free CV maker Europe", "AI Apply free alternative", "CV tailor to job ad free"

The site already has what Google needs on the page: title, description, canonical URL, structured data (WebApplication + FAQ), sitemap, robots.txt, social preview image, and readable text. What is left is outside the code.

## Day 1 (30 minutes)

1. **Make the site live:** merge PR #1, then Settings → Pages → Source: GitHub Actions.
2. **Google Search Console** (free): https://search.google.com/search-console
   - Add property → *URL prefix* → `https://saurabrijal16-arch.github.io/chiyalaya/`
   - Choose **HTML tag**, copy the `<meta name="google-site-verification" …>` tag, and paste it into `challengers/web/index.html` where the comment says *paste the Search Console meta tag here* (or send it to Claude). Push, wait for the deploy, click Verify.
   - Sitemaps → submit `sitemap.xml`.
   - URL Inspection → paste the home URL → **Request indexing**.
3. **Bing Webmaster Tools** (free, also feeds DuckDuckGo, Ecosia and ChatGPT search): https://www.bing.com/webmasters → *Import from Google Search Console*.

Indexing usually takes a few days to two weeks. Check with a search for `site:saurabrijal16-arch.github.io`.

## Week 1: links (this is what moves rankings)

Every honest mention on a real site with a link helps. Post where job seekers in Europe actually are:

- LinkedIn post (draft below), your university's career-service group or Discord
- Reddit: r/cscareerquestionsEU, r/Finland (check each subreddit's self-promotion rules first)
- Product Hunt launch, Hacker News "Show HN", AlternativeTo (as an alternative to AI Apply, Teal, Rezi)
- A dev.to or Medium article: "I built a free ATS CV builder for European jobs"
- Put the link in your GitHub profile README and LinkedIn "Featured" section

### LinkedIn post draft

> I built **ChaLLengErs**, a free CV builder for jobs in Europe. 🇪🇺
>
> Paste a job ad and it tailors your CV to it, shows an ATS score, follows each country's CV rules (photo or no photo, GDPR clause, dates), and exports PDF or Word. It also writes cover letters, translates your CV, runs a mock interview and ranks the jobs you save by how well you fit.
>
> No sign-up, no subscription, and your data stays in your browser.
>
> Try it: https://saurabrijal16-arch.github.io/chiyalaya/
> Feedback very welcome, especially from recruiters!

### Reddit / Show HN title

> Show HN: ChaLLengErs – a free, private ATS CV builder for European jobs (no sign-up)

## Optional upgrades

- **Own domain** (about €10/year), e.g. `challengerscv.com` or `challengers-cv.eu`. A branded domain looks more trustworthy and is easier to remember. GitHub Pages supports custom domains for free (Settings → Pages → Custom domain). Update the canonical URL, sitemap and `og:` tags afterwards.
- **Nicer free URL:** move the app into its own repository named `challengers`, giving `https://saurabrijal16-arch.github.io/challengers/`.
- **Chrome Web Store** listing for the extension (one-time $5 developer fee): store pages rank well and bring installs.

## In Chrome itself

After your first visit, typing "chal…" in Chrome's address bar suggests the site from your history. On the site, click the **install** icon in the address bar (or ⋮ → *Cast, save and share → Install page as app*) to get ChaLLengErs as an app on your desktop and Start menu. It also works offline after that.
