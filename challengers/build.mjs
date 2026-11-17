// ChaLLengErs build: node challengers/build.mjs
// Produces:
//   dist/challengers.html  – one self-contained file (works offline, double-click to open)
//   dist/artifact.html     – same app as page content for claude.ai Artifacts
//   extension/app/         – copy of the web app bundled into the browser extension
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const web = join(root, "web");
const html = readFileSync(join(web, "index.html"), "utf8");
const css = readFileSync(join(web, "styles.css"), "utf8");

const inlined = html
  .replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${css}\n</style>`)
  .replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, src) => {
    const js = readFileSync(join(web, src), "utf8");
    if (/<\/script/i.test(js)) throw new Error(`${src} contains </script>`);
    return `<script>\n${js}\n</script>`;
  });

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "challengers.html"), inlined);

// Artifact: page content only (the host adds doctype/html/head/body), <title> first.
const head = inlined.match(/<head>([\s\S]*?)<\/head>/)[1]
  .replace(/<meta charset="utf-8">\s*/i, "")
  .replace(/<meta name="viewport"[^>]*>\s*/i, "");
const body = inlined.match(/<body>([\s\S]*?)<\/body>/)[1];
writeFileSync(join(root, "dist", "artifact.html"), head.trim() + "\n" + body.trim() + "\n");

// Extension copy
const appDir = join(root, "extension", "app");
rmSync(appDir, { recursive: true, force: true });
cpSync(web, appDir, { recursive: true });

console.log("Built dist/challengers.html, dist/artifact.html and extension/app/");
