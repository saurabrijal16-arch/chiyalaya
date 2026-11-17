/* ChaLLengErs — layout model + exporters (HTML preview, text PDF, DOCX, TXT). Pure JS, no libraries. */
(function () {
  const CH = (window.CH = window.CH || {});
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function fmtDate(d, settings) {
    d = String(d || "").trim();
    if (!d) return "";
    const t = CH.I18N[settings.lang] || CH.I18N.en;
    if (/^(present|now|current|ongoing|today|heute|nyt|jatkuu)$/i.test(d)) return t.present;
    const country = CH.COUNTRIES[settings.country] || CH.COUNTRIES.EU;
    const m = d.match(/^(\d{1,2})[\/.-](\d{4})$/);
    if (m && country.dateStyle === "word" && settings.lang === "en") return MONTHS[+m[1] - 1] + " " + m[2];
    if (m) return m[1].padStart(2, "0") + "/" + m[2];
    return d;
  }
  const range = (a, b, s) => [fmtDate(a, s), fmtDate(b, s)].filter(Boolean).join(" – ");
  const join = (arr, sep) => arr.filter((x) => x && String(x).trim()).join(sep);

  /* Build an ordered list of layout blocks shared by every output format. */
  CH.layout = function (r, settings) {
    const t = CH.I18N[settings.lang] || CH.I18N.en;
    const country = CH.COUNTRIES[settings.country] || CH.COUNTRIES.EU;
    const b = r.basics || {};
    const out = [];
    out.push({ t: "name", text: b.name || "Your Name" });
    if (b.headline) out.push({ t: "headline", text: b.headline });
    out.push({ t: "contact", text: join([b.location, b.phone, b.email, b.linkedin, b.website], "  |  ") });
    if (b.workAuth) out.push({ t: "contact", text: t.workAuth + ": " + b.workAuth });

    const personal = [];
    if (settings.showDob && b.dob) personal.push([t.dob, b.dob]);
    if (settings.showNationality && b.nationality) personal.push([t.nationality, b.nationality]);

    const sec = {
      summary: () => { if (r.summary) { out.push({ t: "heading", text: t.summary }); out.push({ t: "para", text: r.summary }); } },
      experience: () => {
        if (!r.experience.length) return;
        out.push({ t: "heading", text: t.experience });
        r.experience.forEach((e) => {
          out.push({ t: "entry", left: join([e.title, e.company], ", "), right: range(e.start, e.end, settings), sub: e.location || "" });
          (e.bullets || []).forEach((x) => out.push({ t: "bullet", text: x }));
        });
      },
      education: () => {
        if (!r.education.length) return;
        out.push({ t: "heading", text: t.education });
        r.education.forEach((e) => {
          out.push({ t: "entry", left: join([e.degree, e.school], ", "), right: range(e.start, e.end, settings), sub: e.location || "" });
          if (e.details) out.push({ t: "para", text: e.details, small: true });
        });
      },
      skills: () => {
        if (!r.skills.length) return;
        out.push({ t: "heading", text: t.skills });
        r.skills.forEach((s) => (s.category ? out.push({ t: "kv", label: s.category, text: s.items.join(", ") }) : out.push({ t: "para", text: s.items.join(", ") })));
      },
      projects: () => {
        if (!r.projects.length) return;
        out.push({ t: "heading", text: t.projects });
        r.projects.forEach((p) => {
          out.push({ t: "entry", left: p.name, right: "", sub: p.link || "" });
          (p.bullets || []).forEach((x) => out.push({ t: "bullet", text: x }));
        });
      },
      certifications: () => {
        if (!r.certifications.length) return;
        out.push({ t: "heading", text: t.certifications });
        r.certifications.forEach((c) => out.push({ t: "bullet", text: join([c.name, c.date], " — ") }));
      },
      languages: () => {
        if (!r.languages.length) return;
        out.push({ t: "heading", text: t.languages });
        out.push({ t: "para", text: r.languages.map((l) => join([l.name, l.level], " ")).join("  |  ") });
      },
      personal: () => {
        if (!personal.length) return;
        out.push({ t: "heading", text: t.personal });
        personal.forEach(([k, v]) => out.push({ t: "kv", label: k, text: v }));
      },
      interests: () => { if (r.interests) { out.push({ t: "heading", text: t.interests }); out.push({ t: "para", text: r.interests }); } },
    };

    let order = ["summary", "experience", "education", "skills", "projects", "certifications", "languages", "personal", "interests"];
    const eduFirst = settings.order === "education" || (settings.order !== "experience" && !r.experience.length);
    if (eduFirst) order = ["summary", "education", "skills", "projects", "experience", "certifications", "languages", "personal", "interests"];
    order.forEach((k) => sec[k]());
    if (settings.gdpr) out.push({ t: "small", text: CH.GDPR[settings.lang] || CH.GDPR.en });
    return out;
  };

  /* ---------- HTML preview ---------- */
  const h = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  CH.escapeHTML = h;
  CH.renderHTML = function (r, settings) {
    const blocks = CH.layout(r, settings);
    let html = `<div class="cv cv-${h(settings.template)}" style="--cv-accent:${h(settings.accent)}">`;
    let inList = false;
    const close = () => { if (inList) { html += "</ul>"; inList = false; } };
    const photo = settings.showPhoto && settings.photo ? `<img class="cv-photo" src="${h(settings.photo)}" alt="Profile photo">` : "";
    blocks.forEach((b, i) => {
      if (b.t !== "bullet") close();
      switch (b.t) {
        case "name": html += `<header class="cv-head">${photo}<div><div class="cv-name">${h(b.text)}</div>`; break;
        case "headline": html += `<p class="cv-headline">${h(b.text)}</p>`; break;
        case "contact": html += `<p class="cv-contact">${h(b.text)}</p>`; if (!blocks[i + 1] || blocks[i + 1].t !== "contact") html += `</div></header>`; break;
        case "heading": html += `<div class="cv-h">${h(b.text)}</div>`; break;
        case "para": html += `<p class="cv-p${b.small ? " cv-small" : ""}">${h(b.text)}</p>`; break;
        case "entry": html += `<div class="cv-entry"><div class="cv-row"><strong>${h(b.left)}</strong><span>${h(b.right)}</span></div>${b.sub ? `<div class="cv-sub">${h(b.sub)}</div>` : ""}</div>`; break;
        case "bullet": if (!inList) { html += "<ul>"; inList = true; } html += `<li>${h(b.text)}</li>`; break;
        case "kv": html += `<p class="cv-p"><strong>${h(b.label)}:</strong> ${h(b.text)}</p>`; break;
        case "small": html += `<p class="cv-gdpr">${h(b.text)}</p>`; break;
      }
    });
    close();
    return html + "</div>";
  };

  /* ---------- Plain text ---------- */
  CH.renderText = function (r, settings) {
    const out = [];
    CH.layout(r, settings).forEach((b) => {
      switch (b.t) {
        case "name": out.push(b.text.toUpperCase()); break;
        case "headline": case "contact": out.push(b.text); break;
        case "heading": out.push("", b.text.toUpperCase(), "-".repeat(Math.min(40, b.text.length))); break;
        case "para": case "small": out.push(b.text); break;
        case "entry": out.push("", b.left + (b.right ? "  (" + b.right + ")" : "")); if (b.sub) out.push(b.sub); break;
        case "bullet": out.push("• " + b.text); break;
        case "kv": out.push(b.label + ": " + b.text); break;
      }
    });
    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  };

  /* ---------- PDF (real, selectable text — ATS readable) ---------- */
  const WIN = { 0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f };
  const EXTRA = { "ł": "l", "Ł": "L", "đ": "d", "Đ": "D", "ı": "i", "ő": "ö", "ű": "ü", "Ő": "Ö", "Ű": "Ü", "→": "->", "≥": ">=", "≤": "<=", "✓": "+", "−": "-" };
  function winAnsi(str) {
    let s = "";
    for (const ch of String(str)) {
      const c = ch.codePointAt(0);
      if (c >= 32 && c < 127) s += ch;
      else if (c >= 160 && c <= 255) s += String.fromCharCode(c);
      else if (WIN[c]) s += String.fromCharCode(WIN[c]);
      else if (EXTRA[ch]) s += EXTRA[ch];
      else if (c === 9 || c === 10) s += " ";
      else {
        const base = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        s += base && base.codePointAt(0) < 256 ? base : "?";
      }
    }
    return s;
  }
  function textWidth(s, bold, size) {
    const tbl = CH.FONT_W[bold ? "B" : "R"];
    let w = 0;
    for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); w += c >= 32 && c <= 255 ? tbl[c - 32] : 500; }
    return (w * size) / 1000;
  }
  function wrap(s, bold, size, maxW) {
    const words = s.split(/ +/);
    const lines = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (textWidth(t, bold, size) <= maxW || !cur) cur = t;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  const pdfStr = (s) => "(" + s.replace(/[\\()]/g, "\\$&").replace(/[\x80-\xff]/g, (c) => "\\" + c.charCodeAt(0).toString(8).padStart(3, "0")) + ")";
  function hexToRgb(hex) {
    const m = String(hex || "#1f3a5f").replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    return m ? [1, 2, 3].map((i) => (parseInt(m[i], 16) / 255).toFixed(3)).join(" ") : "0.122 0.227 0.373";
  }

  CH.buildPDF = function (r, settings, photoJpeg /* {bytes, w, h} | null */) {
    const W = 595.28, H = 841.89, M = settings.template === "compact" ? 42 : 50;
    const base = settings.template === "compact" ? 9.5 : 10.2;
    const lh = base * 1.38;
    const accent = hexToRgb(settings.accent);
    const centered = settings.template === "classic";
    const pages = [];
    let ops = [], y = H - M;
    const newPage = () => { pages.push(ops); ops = []; y = H - M; };
    const need = (hgt) => { if (y - hgt < M) newPage(); };
    const text = (s, x, size, bold, color) => { ops.push(`BT ${color || "0.08 0.08 0.1"} rg /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td ${pdfStr(s)} Tj ET`); };
    const maxW = W - 2 * M;
    const blocks = CH.layout(r, settings);
    let headerX = M, headerW = maxW, photoDrawn = false;

    blocks.forEach((b, i) => {
      if (b.t === "name") {
        if (photoJpeg && settings.showPhoto) {
          const ph = 78, pw = (photoJpeg.w / photoJpeg.h) * ph;
          ops.push(`q ${pw.toFixed(2)} 0 0 ${ph} ${(W - M - pw).toFixed(2)} ${(H - M - ph + 6).toFixed(2)} cm /Im1 Do Q`);
          headerW = maxW - pw - 14; photoDrawn = true;
        }
        const size = 22, s = winAnsi(b.text);
        y -= size * 0.8;
        const x = centered && !photoDrawn ? (W - textWidth(s, true, size)) / 2 : headerX;
        text(s, x, size, true, settings.template === "modern" ? accent : null);
        y -= 8;
        return;
      }
      if (b.t === "headline" || b.t === "contact") {
        const size = b.t === "headline" ? base + 2 : base - 0.6;
        wrap(winAnsi(b.text), b.t === "headline", size, headerW).forEach((ln) => {
          y -= size * 1.35;
          const x = centered && !photoDrawn ? (W - textWidth(ln, b.t === "headline", size)) / 2 : headerX;
          text(ln, x, size, b.t === "headline", b.t === "headline" ? accent : "0.25 0.25 0.3");
        });
        if (photoDrawn && blocks[i + 1] && !["headline", "contact"].includes(blocks[i + 1].t)) y = Math.min(y, H - M - 78);
        return;
      }
      if (b.t === "heading") {
        need(lh * 4);
        y -= base * 1.7;
        const s = winAnsi(settings.template === "classic" ? b.text.toUpperCase() : b.text);
        text(s, M, base + 2, true, accent);
        y -= 4;
        ops.push(`${accent} RG 0.7 w ${M} ${y.toFixed(2)} m ${(W - M).toFixed(2)} ${y.toFixed(2)} l S`);
        y -= 2;
        return;
      }
      if (b.t === "entry") {
        need(lh * 3);
        y -= lh + 2;
        const right = winAnsi(b.right || "");
        const rw = right ? textWidth(right, false, base) : 0;
        const leftLines = wrap(winAnsi(b.left), true, base, maxW - rw - 12);
        leftLines.forEach((ln, k) => { if (k) y -= lh; text(ln, M, base, true); if (!k && right) text(right, W - M - rw, base, false, "0.25 0.25 0.3"); });
        if (b.sub) { y -= lh * 0.95; text(winAnsi(b.sub), M, base - 0.8, false, "0.35 0.35 0.4"); }
        return;
      }
      if (b.t === "bullet") {
        const ind = 12;
        const lines = wrap(winAnsi(b.text), false, base, maxW - ind);
        need(lh * Math.min(lines.length, 2));
        lines.forEach((ln, k) => { need(lh); y -= lh; if (!k) text("\x95", M + 2, base, false); text(ln, M + ind, base, false); });
        return;
      }
      if (b.t === "para" || b.t === "kv" || b.t === "small") {
        const size = b.t === "small" ? base - 2.2 : b.small ? base - 0.5 : base;
        if (b.t === "kv") {
          const label = winAnsi(b.label + ": ");
          const lw = textWidth(label, true, size);
          const lines = wrap(winAnsi(b.text), false, size, maxW - lw);
          lines.forEach((ln, k) => { need(lh); y -= lh; if (!k) text(label, M, size, true); text(ln, M + lw, size, false); });
          return;
        }
        if (b.t === "small") y -= lh;
        wrap(winAnsi(b.text), false, size, maxW).forEach((ln) => { need(size * 1.38); y -= size * 1.38; text(ln, M, size, false, b.t === "small" ? "0.4 0.4 0.45" : null); });
      }
    });
    pages.push(ops);

    // Assemble PDF objects (latin1 string, 1 char = 1 byte)
    const objs = [];
    const add = (s) => { objs.push(s); return objs.length; };
    const catalog = add(""), pagesId = add("");
    const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    let img = 0;
    if (photoJpeg && settings.showPhoto) img = add(`<< /Type /XObject /Subtype /Image /Width ${photoJpeg.w} /Height ${photoJpeg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${photoJpeg.bytes.length} >>\nstream\n${photoJpeg.bytes}\nendstream`);
    const kids = [];
    pages.forEach((o, i) => {
      const content = o.join("\n");
      const cid = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
      const res = `<< /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >>${img && i === 0 ? ` /XObject << /Im1 ${img} 0 R >>` : ""} >>`;
      kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${W} ${H}] /Resources ${res} /Contents ${cid} 0 R >>`));
    });
    objs[catalog - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objs[pagesId - 1] = `<< /Type /Pages /Kids [${kids.map((k) => k + " 0 R").join(" ")}] /Count ${kids.length} >>`;
    const info = add(`<< /Title ${pdfStr(winAnsi((r.basics.name || "CV") + " - CV"))} /Author ${pdfStr(winAnsi(r.basics.name || ""))} /Producer (ChaLLengErs) >>`);
    let pdf = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
    const offs = [];
    objs.forEach((o, i) => { offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = pdf.length;
    pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
    pdf += `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
    return { bytes, pages: pages.length };
  };

  /* ---------- DOCX (Word, Google Docs, LibreOffice) ---------- */
  const x = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
  CH.buildDOCX = function (r, settings) {
    const accent = String(settings.accent || "#1f3a5f").replace("#", "");
    const sz = settings.template === "compact" ? 19 : 21; // half-points
    const run = (t, o = {}) => `<w:r><w:rPr>${o.b ? "<w:b/>" : ""}${o.color ? `<w:color w:val="${o.color}"/>` : ""}<w:sz w:val="${o.sz || sz}"/></w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
    const center = settings.template === "classic";
    const p = (inner, o = {}) => `<w:p><w:pPr>${o.style ? `<w:pStyle w:val="${o.style}"/>` : ""}${o.num ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : ""}${o.border ? `<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="${accent}"/></w:pBdr>` : ""}${o.tab ? '<w:tabs><w:tab w:val="right" w:pos="9638"/></w:tabs>' : ""}<w:spacing w:before="${o.before || 0}" w:after="${o.after == null ? 40 : o.after}"/>${o.center ? '<w:jc w:val="center"/>' : ""}</w:pPr>${inner}</w:p>`;
    const body = [];
    CH.layout(r, settings).forEach((b) => {
      switch (b.t) {
        case "name": body.push(p(run(b.text, { b: 1, sz: 44, color: settings.template === "modern" ? accent : null }), { center, after: 60, style: "Title" })); break;
        case "headline": body.push(p(run(b.text, { b: 1, sz: sz + 4, color: accent }), { center })); break;
        case "contact": body.push(p(run(b.text, { sz: sz - 1 }), { center })); break;
        case "heading": body.push(p(run(settings.template === "classic" ? b.text.toUpperCase() : b.text, { b: 1, sz: sz + 4, color: accent }), { border: 1, before: 220, after: 80, style: "Heading1" })); break;
        case "para": body.push(p(run(b.text, { sz: b.small ? sz - 1 : sz }))); break;
        case "small": body.push(p(run(b.text, { sz: sz - 4, color: "666666" }), { before: 200 })); break;
        case "kv": body.push(p(run(b.label + ": ", { b: 1 }) + run(b.text))); break;
        case "bullet": body.push(p(run(b.text), { num: 1, after: 20 })); break;
        case "entry":
          body.push(p(run(b.left, { b: 1 }) + (b.right ? `<w:r><w:tab/></w:r>` + run(b.right) : ""), { tab: 1, before: 120, after: 0 }));
          if (b.sub) body.push(p(run(b.sub, { sz: sz - 2, color: "555555" })));
          break;
      }
    });
    const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="${sz}"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="40" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:outlineLvl w:val="0"/></w:pPr></w:style></w:styles>`;
    const numbering = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering ${NS}><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="240"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;
    const files = {
      "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
      "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
      "docProps/core.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${x((r.basics.name || "CV") + " - CV")}</dc:title><dc:creator>${x(r.basics.name || "")}</dc:creator></cp:coreProperties>`,
      "word/document.xml": doc,
      "word/styles.xml": styles,
      "word/numbering.xml": numbering,
      "word/_rels/document.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>`,
    };
    return CH.zip(files);
  };

  /* Minimal ZIP writer (stored, no compression) */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u8) => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  CH.zip = function (files) {
    const enc = new TextEncoder();
    const chunks = [], central = [];
    let offset = 0;
    const u16 = (v) => [v & 0xff, (v >>> 8) & 0xff];
    const u32 = (v) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];
    for (const [name, content] of Object.entries(files)) {
      const nb = enc.encode(name), data = typeof content === "string" ? enc.encode(content) : content, crc = crc32(data);
      const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nb.length), ...u16(0)]);
      chunks.push(local, nb, data);
      central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nb.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), nb);
      offset += local.length + nb.length + data.length;
    }
    const cdSize = central.reduce((a, c) => a + c.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(Object.keys(files).length), ...u16(Object.keys(files).length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
    const all = [...chunks, ...central, end];
    const out = new Uint8Array(all.reduce((a, c) => a + c.length, 0));
    let p = 0; all.forEach((c) => { out.set(c, p); p += c.length; });
    return out;
  };
})();
