/* ChaLLengErs — read an existing CV file (PDF, DOCX, TXT) into plain text, in the browser. */
(function () {
  const CH = (window.CH = window.CH || {});

  async function inflateRaw(u8) {
    const ds = new DecompressionStream("deflate-raw");
    const stream = new Blob([u8]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function unzipEntry(buf, wanted) {
    const u8 = new Uint8Array(buf), dv = new DataView(buf);
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error("Not a valid .docx file");
    let p = dv.getUint32(eocd + 16, true);
    const count = dv.getUint16(eocd + 10, true);
    const dec = new TextDecoder();
    for (let n = 0; n < count; n++) {
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      if (name === wanted) {
        const lnlen = dv.getUint16(off + 26, true), lelen = dv.getUint16(off + 28, true);
        const data = u8.subarray(off + 30 + lnlen + lelen, off + 30 + lnlen + lelen + csize);
        return dec.decode(method === 0 ? data : await inflateRaw(data));
      }
      p += 46 + nlen + elen + clen;
    }
    throw new Error("No document text found in this .docx");
  }

  async function docxText(buf) {
    if (typeof DecompressionStream === "undefined") throw new Error("This browser can't read .docx files. Paste the text instead.");
    const xml = await unzipEntry(buf, "word/document.xml");
    return xml
      .replace(/<w:tab\/>/g, "\t").replace(/<w:br\/>/g, "\n").replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&")
      .replace(/\n{3,}/g, "\n\n").trim();
  }

  const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("Could not load the PDF reader (are you offline?). Paste the text instead.")); document.head.appendChild(s); });
  }
  async function pdfText(buf) {
    if (!window.pdfjsLib) {
      await loadScript(PDFJS + "pdf.worker.min.js"); // runs the parser on the page (no separate worker needed)
      await loadScript(PDFJS + "pdf.min.js");
    }
    const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise;
    const out = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      let line = "", lastY = null;
      tc.items.forEach((it) => {
        const y = Math.round(it.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 2) { out.push(line.trim()); line = ""; }
        line += it.str + (it.hasEOL ? "" : "");
        lastY = y;
      });
      if (line.trim()) out.push(line.trim());
      out.push("");
    }
    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  CH.readCVFile = async function (file) {
    const name = (file.name || "").toLowerCase();
    const buf = await file.arrayBuffer();
    if (name.endsWith(".docx")) return docxText(buf);
    if (name.endsWith(".pdf") || file.type === "application/pdf") return pdfText(buf);
    if (name.endsWith(".doc")) throw new Error("Old .doc files can't be read. Save it as .docx or PDF, or paste the text.");
    return new TextDecoder().decode(buf);
  };
})();
