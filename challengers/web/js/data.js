/* ChaLLengErs — static data: European CV conventions, headings, skills, verbs.
   Country notes describe common practice, not law. Always check the job ad. */
(function () {
  const CH = (window.CH = window.CH || {});

  CH.COUNTRIES = {
    EU: { name: "Europe (general / Europass)", lang: "en", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: false,
      notes: [
        "Reverse-chronological order, most recent role first.",
        "Use MM/YYYY dates and give a CEFR level for every language (A1–C2, or Native).",
        "Photo, date of birth and marital status are optional. Leaving them out is safest for ATS and fairness.",
        "Non-EU candidates: state your work permit or residence status clearly." ] },
    FI: { name: "Finland", lang: "en", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: false,
      notes: [
        "Finnish CVs (ansioluettelo) are factual and modest. Cut hype words and let numbers speak.",
        "Give your Finnish and Swedish level honestly (e.g. Finnish B1). Many roles ask for Finnish, so show any level you have.",
        "A professional photo is fairly common but never required.",
        "Non-EU candidates: state residence permit / right to work (e.g. 'Residence permit for work, no sponsorship needed').",
        "A short personal profile and a one-line interests section are often appreciated." ] },
    SE: { name: "Sweden", lang: "en", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: false,
      notes: [
        "Keep it concise and team-oriented. Swedish recruiters value collaboration and results equally.",
        "Photo optional. Personal number, age and marital status should be left out.",
        "Show Swedish level (CEFR) if the role is customer-facing." ] },
    NO: { name: "Norway", lang: "en", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: false,
      notes: [ "Direct, factual tone. 1–2 pages.", "Show Norwegian/Scandinavian language level if you have it.", "Photo optional." ] },
    DK: { name: "Denmark", lang: "en", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: false,
      notes: [ "Short, honest, personal profile at the top is common.", "Photo optional but fairly common.", "Show Danish level if any." ] },
    DE: { name: "Germany", lang: "de", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: false,
      notes: [
        "Lebenslauf: tabular, complete and precise. Use exact MM/YYYY dates and explain gaps over 3 months.",
        "Photo is traditional but optional and cannot legally be required (AGG anti-discrimination law).",
        "Date of birth and nationality are optional; many candidates now leave them out.",
        "Add place and date at the bottom only if the employer expects a signed CV." ] },
    AT: { name: "Austria", lang: "de", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: false,
      notes: [ "Similar to Germany: precise dates, complete timeline.", "Photo still common but optional." ] },
    CH: { name: "Switzerland", lang: "de", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: false,
      notes: [ "Very complete and precise. State your work permit type (B, C, G) if you are not Swiss.", "Photo common but optional.", "Mention German/French/Italian levels clearly." ] },
    NL: { name: "Netherlands", lang: "en", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: false,
      notes: [ "Direct and concrete. Results over adjectives.", "Photo optional.", "English CVs are widely accepted, especially in tech." ] },
    BE: { name: "Belgium", lang: "en", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: false,
      notes: [ "Show French/Dutch/German language levels: multilingualism is a big plus.", "Photo optional." ] },
    FR: { name: "France", lang: "fr", photo: "optional", pages: "1", dateStyle: "num", gdpr: false,
      notes: [ "One page is the norm for juniors, two for experienced profiles.", "Photo is optional and becoming less common.", "Add a short 'Langues' section with levels." ] },
    IE: { name: "Ireland", lang: "en", photo: "no", pages: "2", dateStyle: "word", gdpr: false,
      notes: [ "No photo, date of birth or marital status.", "Two pages is standard. 'CV', not 'résumé'." ] },
    UK: { name: "United Kingdom", lang: "en", photo: "no", pages: "2", dateStyle: "word", gdpr: false,
      notes: [
        "No photo, date of birth or marital status (Equality Act 2010 makes this standard practice).",
        "Two pages is normal. Use UK spelling (organise, analyse, programme).",
        "Non-UK candidates: state visa / right-to-work status." ] },
    ES: { name: "Spain", lang: "es", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: false,
      notes: [ "Photo still common but optional.", "Show Spanish level clearly.", "1–2 pages." ] },
    IT: { name: "Italy", lang: "it", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: true,
      notes: [ "A GDPR consent line at the bottom is widely expected in Italy (added automatically).", "Europass format is very common.", "Photo optional." ] },
    PT: { name: "Portugal", lang: "pt", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: false,
      notes: [ "Europass is common.", "Photo optional." ] },
    PL: { name: "Poland", lang: "pl", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: true,
      notes: [ "A GDPR (RODO) consent clause is commonly expected at the bottom (added automatically).", "Photo optional." ] },
    EE: { name: "Estonia", lang: "en", photo: "optional", pages: "1–2", dateStyle: "num", gdpr: false,
      notes: [ "English CVs are common in tech. Concise and results-focused.", "Photo optional." ] },
  };

  // Section headings per output language
  CH.I18N = {
    en: { summary: "Professional Summary", experience: "Work Experience", education: "Education", skills: "Skills", languages: "Languages", certifications: "Certifications", projects: "Projects", personal: "Personal Details", present: "Present", workAuth: "Work authorization", dob: "Date of birth", nationality: "Nationality", interests: "Interests" },
    de: { summary: "Profil", experience: "Berufserfahrung", education: "Ausbildung", skills: "Kenntnisse und Fähigkeiten", languages: "Sprachen", certifications: "Zertifikate", projects: "Projekte", personal: "Persönliche Daten", present: "heute", workAuth: "Arbeitserlaubnis", dob: "Geburtsdatum", nationality: "Staatsangehörigkeit", interests: "Interessen" },
    fr: { summary: "Profil", experience: "Expérience professionnelle", education: "Formation", skills: "Compétences", languages: "Langues", certifications: "Certifications", projects: "Projets", personal: "Informations personnelles", present: "aujourd'hui", workAuth: "Autorisation de travail", dob: "Date de naissance", nationality: "Nationalité", interests: "Centres d'intérêt" },
    fi: { summary: "Profiili", experience: "Työkokemus", education: "Koulutus", skills: "Osaaminen", languages: "Kielitaito", certifications: "Sertifikaatit", projects: "Projektit", personal: "Henkilötiedot", present: "jatkuu", workAuth: "Työlupa", dob: "Syntymäaika", nationality: "Kansalaisuus", interests: "Harrastukset" },
    sv: { summary: "Profil", experience: "Arbetslivserfarenhet", education: "Utbildning", skills: "Kompetenser", languages: "Språk", certifications: "Certifieringar", projects: "Projekt", personal: "Personuppgifter", present: "pågående", workAuth: "Arbetstillstånd", dob: "Födelsedatum", nationality: "Medborgarskap", interests: "Intressen" },
    nl: { summary: "Profiel", experience: "Werkervaring", education: "Opleiding", skills: "Vaardigheden", languages: "Talen", certifications: "Certificeringen", projects: "Projecten", personal: "Persoonlijke gegevens", present: "heden", workAuth: "Werkvergunning", dob: "Geboortedatum", nationality: "Nationaliteit", interests: "Interesses" },
    es: { summary: "Perfil profesional", experience: "Experiencia profesional", education: "Formación académica", skills: "Competencias", languages: "Idiomas", certifications: "Certificaciones", projects: "Proyectos", personal: "Datos personales", present: "actualidad", workAuth: "Permiso de trabajo", dob: "Fecha de nacimiento", nationality: "Nacionalidad", interests: "Intereses" },
    it: { summary: "Profilo professionale", experience: "Esperienza professionale", education: "Istruzione e formazione", skills: "Competenze", languages: "Lingue", certifications: "Certificazioni", projects: "Progetti", personal: "Dati personali", present: "oggi", workAuth: "Permesso di lavoro", dob: "Data di nascita", nationality: "Nazionalità", interests: "Interessi" },
    pt: { summary: "Perfil profissional", experience: "Experiência profissional", education: "Formação académica", skills: "Competências", languages: "Idiomas", certifications: "Certificações", projects: "Projetos", personal: "Dados pessoais", present: "presente", workAuth: "Autorização de trabalho", dob: "Data de nascimento", nationality: "Nacionalidade", interests: "Interesses" },
    pl: { summary: "Podsumowanie zawodowe", experience: "Doświadczenie zawodowe", education: "Wykształcenie", skills: "Umiejętności", languages: "Języki obce", certifications: "Certyfikaty", projects: "Projekty", personal: "Dane osobowe", present: "obecnie", workAuth: "Pozwolenie na pracę", dob: "Data urodzenia", nationality: "Obywatelstwo", interests: "Zainteresowania" },
  };
  CH.LANG_NAMES = { en: "English", de: "German", fr: "French", fi: "Finnish", sv: "Swedish", nl: "Dutch", es: "Spanish", it: "Italian", pt: "Portuguese", pl: "Polish" };

  CH.GDPR = {
    it: "Autorizzo il trattamento dei dati personali contenuti nel mio curriculum vitae in base al Regolamento UE 2016/679 (GDPR).",
    pl: "Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO).",
    en: "I consent to the processing of my personal data for recruitment purposes in accordance with Regulation (EU) 2016/679 (GDPR).",
  };

  // Multi-word and special skills recognised in job ads. Lower-case.
  CH.SKILLS = (
    "python|java|javascript|typescript|c++|c#|.net|go|golang|rust|kotlin|swift|php|ruby|scala|r|matlab|sql|nosql|bash|powershell|" +
    "html|css|react|react native|angular|vue|next.js|node.js|express|django|flask|fastapi|spring|spring boot|laravel|rails|graphql|rest|rest api|api|microservices|" +
    "aws|azure|gcp|google cloud|docker|kubernetes|terraform|ansible|jenkins|github actions|gitlab|ci/cd|devops|linux|git|serverless|" +
    "postgresql|mysql|mongodb|redis|elasticsearch|kafka|spark|hadoop|airflow|dbt|snowflake|bigquery|databricks|etl|data warehouse|data modeling|" +
    "power bi|tableau|looker|excel|advanced excel|vba|google analytics|ga4|sap|salesforce|hubspot|jira|confluence|figma|adobe|photoshop|illustrator|indesign|premiere pro|after effects|blender|unity|unreal engine|autocad|solidworks|revit|" +
    "machine learning|deep learning|nlp|computer vision|pytorch|tensorflow|scikit-learn|pandas|numpy|llm|generative ai|prompt engineering|data analysis|data science|statistics|a/b testing|" +
    "testing|unit testing|test automation|selenium|cypress|qa|agile|scrum|kanban|lean|six sigma|prince2|pmp|project management|product management|stakeholder management|" +
    "ux|ui|user research|wireframing|prototyping|accessibility|seo|sem|content marketing|social media|digital marketing|email marketing|copywriting|crm|b2b|b2c|sales|account management|business development|negotiation|" +
    "customer service|customer success|customer support|logistics|supply chain|procurement|inventory management|warehouse|forklift|lean manufacturing|quality assurance|iso 9001|haccp|" +
    "accounting|bookkeeping|financial analysis|financial modeling|budgeting|forecasting|ifrs|audit|payroll|tax|controlling|" +
    "recruitment|onboarding|hr|human resources|training|coaching|teaching|nursing|patient care|first aid|cleaning|food safety|hospitality|cooking|barista|" +
    "cybersecurity|network security|penetration testing|siem|iam|gdpr|compliance|risk management|itil|it support|troubleshooting|networking|tcp/ip|active directory|" +
    "communication|teamwork|leadership|problem solving|problem-solving|time management|attention to detail|analytical skills|critical thinking|presentation skills|mentoring|cross-functional|" +
    "english|finnish|swedish|german|french|spanish|italian|dutch|polish|portuguese|norwegian|danish|estonian|russian|arabic|chinese|hindi|nepali|driving licence|driver's license"
  ).split("|");

  CH.LANG_WORDS = ["english","finnish","swedish","german","french","spanish","italian","dutch","polish","portuguese","norwegian","danish","estonian","russian","arabic","chinese","hindi","nepali"];

  CH.ACTION_VERBS = (
    "accelerated achieved administered analysed analyzed architected automated boosted built championed coached collaborated completed configured consolidated " +
    "coordinated created cut debugged decreased defined delivered deployed designed developed devised directed doubled drove enabled engineered established " +
    "evaluated exceeded executed expanded facilitated forecasted founded generated grew guided handled headed identified implemented improved increased " +
    "initiated innovated installed integrated introduced launched led maintained managed maximised maximized mentored migrated minimised minimized modernised modernized " +
    "monitored negotiated optimised optimized orchestrated organised organized oversaw owned partnered pioneered planned prepared presented prioritised prioritized " +
    "produced programmed published raised rebuilt recruited redesigned reduced refactored remodelled renegotiated reorganised resolved restructured revamped " +
    "saved scaled secured served shipped simplified sold solved spearheaded standardised standardized streamlined strengthened supervised supported " +
    "taught tested trained transformed translated tripled troubleshot upgraded won wrote"
  ).split(" ");

  CH.WEAK_PHRASES = ["responsible for", "duties included", "duties include", "helped", "helped with", "worked on", "assisted with", "involved in", "tasked with", "in charge of", "participated in", "various", "etc", "hard-working", "hardworking", "team player", "go-getter", "think outside the box", "synergy", "results-driven", "detail-oriented", "dynamic"];

  CH.STOPWORDS = new Set((
    "a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing " +
    "down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my " +
    "myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves " +
    "then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself " +
    "yourselves able across within without would must may might shall us etc e.g i.e via per new well one two three good great strong excellent plus based " +
    "work working job role position team company candidate candidates looking seeking join opportunity opportunities apply application experience years year " +
    "skills skill knowledge ability abilities including include includes required requirements preferred responsibilities responsibility offer offers benefits " +
    "salary environment day days week weeks month months time full part please contact information related relevant need needs want help make making use using " +
    "ensure support provide providing within across get like help also other own will help us our we're you'll you're it's what's who's that's let's junior senior mid-level hybrid remote onsite on-site intern internship trainee helsinki espoo")
    .split(/\s+/));

  CH.SAMPLE_JOB = {
    title: "Junior Data Analyst",
    company: "Nordlys Analytics Oy (example)",
    text:
`Junior Data Analyst — Helsinki (hybrid)

Nordlys Analytics helps Nordic retailers make better decisions with data. We are looking for a Junior Data Analyst to join our analytics team.

What you will do
- Build and maintain dashboards in Power BI for retail clients
- Write SQL queries to clean, join and analyse sales data from PostgreSQL
- Automate recurring reports with Python (pandas)
- Run A/B testing analysis and present findings to stakeholders
- Work in an agile team with data engineers and product managers

What we expect
- Degree in business, economics, statistics, computer science or similar (or final-year student)
- Good SQL skills and experience with Python or R
- Experience with Power BI or Tableau
- Strong analytical skills and attention to detail
- Fluent English; Finnish is a plus
- Right to work in Finland

Nice to have: dbt, Excel (advanced), Google Analytics, basic statistics.`,
  };

  CH.SAMPLE_PROFILE = {
    basics: {
      name: "Alex Example",
      headline: "Business Analytics Student",
      email: "alex.example@email.com",
      phone: "+358 40 123 4567",
      location: "Helsinki, Finland",
      linkedin: "linkedin.com/in/alex-example",
      website: "github.com/alex-example",
      workAuth: "Residence permit for studies (right to work in Finland)",
      nationality: "", dob: "",
    },
    summary: "",
    experience: [
      { title: "Data & Reporting Intern", company: "Kauppa Retail Oy", location: "Espoo, Finland", start: "05/2025", end: "08/2025",
        bullets: "Responsible for weekly sales reports in Excel\nBuilt a Power BI dashboard used by 12 store managers to track daily sales\nWrote SQL queries to combine sales and inventory data\nHelped the team with data cleaning" },
      { title: "Customer Service Assistant", company: "Café Aalto", location: "Helsinki, Finland", start: "09/2023", end: "Present",
        bullets: "Served 150+ customers per shift in a fast-paced café\nTrained 4 new team members on cash handling and food safety" },
    ],
    education: [
      { degree: "BBA, Business Analytics", school: "Haaga-Helia University of Applied Sciences", location: "Helsinki", start: "08/2023", end: "05/2027", details: "Courses: Statistics, Databases (SQL), Data Visualisation, Python for Business" },
    ],
    skills: "Data: SQL, Python, pandas, Excel, Power BI\nTools: Git, Jira, Google Sheets\nSoft skills: Communication, Teamwork",
    languages: "English — C1\nFinnish — A2\nNepali — Native",
    certifications: "Microsoft PL-300: Power BI Data Analyst (in progress) | 2026",
    projects: [
      { name: "Helsinki bike-share analysis", link: "github.com/alex-example/bikes", bullets: "Analysed 1.2M trips with Python and pandas to find peak demand by station\nPublished an interactive Tableau dashboard" },
    ],
    interests: "",
    rawResume: "",
  };
})();
