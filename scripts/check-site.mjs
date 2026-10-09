#!/usr/bin/env node
/*
  Comprobaciones estáticas de index.html. Sin dependencias: solo Node >= 18.

    node scripts/check-site.mjs

  Falla (código de salida 1) si:
    - hay ids duplicados;
    - un enlace #ancla, aria-controls o aria-labelledby apunta a un id que no existe;
    - un href/src local apunta a un archivo que no existe;
    - hay distinto número de textos data-i18n-es y data-i18n-en;
    - queda algún atributo style="" en línea (el CSP no los permite);
    - la política CSP de <meta> no incluye el hash de cada script en línea.
      Si editas el script de <head>, ejecuta con --print-hash y actualiza el meta CSP.
*/
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8').replace(/\r\n/g, '\n');

// Scripts en línea ejecutables: sin src y sin type (JSON-LD y similares no cuentan).
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*\btype=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const hashOf = (text) => 'sha256-' + createHash('sha256').update(text, 'utf8').digest('base64');

if (process.argv.includes('--print-hash')) {
  inlineScripts.forEach((s) => console.log(`'${hashOf(s)}'`));
  process.exit(0);
}

const errors = [];
const checks = [];
const check = (name, problems) => {
  checks.push({ name, ok: problems.length === 0 });
  problems.forEach((p) => errors.push(`${name}: ${p}`));
};

// 1. ids únicos
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const seen = new Set();
const dupes = ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
check('ids únicos', dupes.map((d) => `id duplicado "${d}"`));

// 2. anclas y referencias ARIA
const idSet = new Set(ids);
const anchors = [...html.matchAll(/\shref="#([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
check('anclas internas', [...new Set(anchors)].filter((a) => !idSet.has(a)).map((a) => `#${a} no existe`));
const refs = [...html.matchAll(/\saria-(?:controls|labelledby)="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/));
check('referencias ARIA', refs.filter((r) => !idSet.has(r)).map((r) => `id "${r}" no existe`));

// 3. recursos locales (href/src que no son http(s), mailto, tel, data, ancla ni //)
const local = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((u) => !/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(u))
  .map((u) => u.split(/[?#]/)[0])
  .filter(Boolean);
check('recursos locales', [...new Set(local)].filter((f) => !existsSync(join(root, f))).map((f) => `falta ${f}`));

// 4. og:image / twitter:image absolutas que apuntan a un archivo propio
const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const socialImages = [...html.matchAll(/<meta (?:property="og:image"|name="twitter:image") content="([^"]+)"/g)].map((m) => m[1]);
check(
  'imágenes sociales',
  socialImages
    .filter((u) => canonical && u.startsWith(canonical))
    .map((u) => u.slice(canonical.length))
    .filter((f) => !existsSync(join(root, f)))
    .map((f) => `falta ${f}`)
);

// 5. pares de idioma
const es = (html.match(/\sdata-i18n-es(?=[\s>])/g) || []).length;
const en = (html.match(/\sdata-i18n-en(?=[\s>])/g) || []).length;
check('pares ES/EN', es === en ? [] : [`${es} textos ES frente a ${en} EN`]);

// 6. sin estilos en línea
const inlineStyles = (html.match(/\sstyle="/g) || []).length;
check('sin style="" en línea', inlineStyles === 0 ? [] : [`${inlineStyles} atributos style=""`]);

// 6b. fuentes autoalojadas: ninguna referencia a Google Fonts en HTML ni CSS
const cssFiles = ['tokens', 'base', 'animations', 'components', 'layout', 'fonts'].map((n) => `css/${n}.css`).filter((f) => existsSync(join(root, f)));
const externalFonts = [['index.html', html], ...cssFiles.map((f) => [f, readFileSync(join(root, f), 'utf8')])]
  .filter(([, text]) => /fonts\.(googleapis|gstatic)\.com/.test(text))
  .map(([f]) => `${f} referencia Google Fonts`);
check('fuentes autoalojadas', externalFonts);

// 7. CSP: cada script en línea debe estar permitido por hash
const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/)?.[1];
const cspProblems = [];
if (!csp) {
  cspProblems.push('falta <meta http-equiv="Content-Security-Policy">');
} else {
  const scriptSrc = csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('script-src ')) || '';
  inlineScripts.forEach((s, i) => {
    const h = hashOf(s);
    if (!scriptSrc.includes(`'${h}'`)) cspProblems.push(`script en línea #${i + 1} sin hash en script-src (esperado '${h}')`);
  });
  if (/unsafe-inline/.test(scriptSrc)) cspProblems.push("script-src no debe usar 'unsafe-inline'");
}
check('CSP', cspProblems);

checks.forEach((c) => console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name}`));
if (errors.length) {
  console.error('\n' + errors.map((e) => ` - ${e}`).join('\n'));
  process.exit(1);
}
console.log(`\n${checks.length} comprobaciones superadas.`);
