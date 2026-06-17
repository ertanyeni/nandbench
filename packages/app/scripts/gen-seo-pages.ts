/**
 * SEO content-page generator.
 *
 * Reads the real lesson + glossary data (and the Turkish i18n strings) and
 * emits static, indexable HTML pages into `public/` so Google has genuine
 * content to rank — without bloating the SPA bundle. Pages are grouped
 * (one per glossary category, one per lesson unit) so each page is
 * substantial (many real definitions / lessons), not thin.
 *
 * Each page gets: canonical, Open Graph (+ the 1200x630 social card),
 * Twitter card, Article + BreadcrumbList JSON-LD.
 *
 * Run from packages/app:
 *   pnpm dlx tsx scripts/gen-seo-pages.ts
 *
 * It overwrites the generated *.html files and prints the URL list.
 * Re-run whenever lesson/glossary content changes. (Hand-written articles
 * like mantik-kapilari.html are NOT touched.)
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { GLOSSARY, GLOSSARY_CATEGORIES, type GlossaryCategory } from '../src/glossary.js';
import { LESSONS, type LessonUnit } from '../src/lessons.js';
import { EN } from '../src/i18n/en.js';
import { TR } from '../src/i18n/tr.js';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const ORIGIN = 'https://nandbench.com.tr';
const OG_IMAGE = `${ORIGIN}/og-cover.png`;
const TODAY = '2026-06-17';

const t = (key: string): string =>
  (TR as Record<string, string>)[key] ?? (EN as Record<string, string>)[key] ?? key;

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CATEGORY_TR: Record<GlossaryCategory, string> = {
  foundations: 'Temeller',
  gates: 'Mantık Kapıları',
  combinational: 'Kombinasyonel Devreler',
  sequential: 'Ardışıl Devreler',
  timing: 'Zamanlama',
  memory: 'Bellek',
  fsm: 'Sonlu Durum Makineleri',
  tooling: 'Araçlar',
};

const UNIT_TR: Record<LessonUnit, string> = {
  foundations: 'Temeller',
  gates: 'Kapılar ve Sadeleştirme',
  combinational: 'Kombinasyonel Devreler',
  sequential: 'Ardışıl Devreler',
  registers: 'Yazmaçlar ve Sayaçlar',
  memory: 'Bellek',
  fsm: 'Sonlu Durum Makineleri',
  datapath: 'Veri Yolu ve İşlemci',
  beyond: 'İleri Konular',
};

const STYLE = `
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;background:#0f1115;color:#cdd2da;font:16px/1.7 ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Inter,sans-serif}
a{color:#6cc6ff}
header,main,footer{max-width:820px;margin:0 auto;padding:0 22px}
header{display:flex;align-items:center;gap:12px;padding-top:26px;padding-bottom:8px}
header img{width:34px;height:34px}header .brand{font-weight:800;color:#fff;text-decoration:none}
h1{color:#fff;font-size:clamp(1.7rem,4.5vw,2.6rem);letter-spacing:-.02em;line-height:1.15;margin:1.1em 0 .3em}
h2{color:#eef1f5;margin-top:1.6em;font-size:1.25rem}
p,li{color:#aab0ba}.lead{font-size:1.12rem;color:#c4cad3}
.term{border-top:1px solid #1c2029;padding-top:14px;margin-top:18px}
.term h2{margin:0 0 .2em}
ol{padding-left:1.2em}ol li{margin:4px 0}
.cta{display:inline-block;margin:14px 0 2px;padding:11px 18px;border-radius:10px;background:#1b6fe0;color:#fff;font-weight:700;text-decoration:none}
nav.crumbs{font-size:.85rem;color:#6b7280;padding-top:16px}nav.crumbs a{color:#8a93a0}
.cards{display:grid;gap:10px;grid-template-columns:1fr 1fr;margin:18px 0}
.card{display:block;border:1px solid #232733;border-radius:12px;padding:14px 16px;text-decoration:none;background:#13161d}
.card b{color:#eef1f5}.card span{color:#8a93a0;font-size:.9rem}
footer{color:#6b7280;font-size:.9rem;padding:40px 22px 60px;border-top:1px solid #1c2029;margin-top:40px}
`;

interface Crumb {
  name: string;
  slug: string;
}

function page(opts: {
  slug: string;
  title: string;
  description: string;
  body: string;
  breadcrumb: Crumb[];
}): void {
  const url = `${ORIGIN}/${opts.slug}`;
  const trail = [{ name: 'Ana sayfa', slug: '' }, ...opts.breadcrumb];
  const crumbHtml = trail
    .map((c, i) =>
      i < trail.length - 1
        ? `<a href="/${c.slug}">${esc(c.name)}</a>`
        : `<span>${esc(c.name)}</span>`,
    )
    .join(' › ');
  const breadcrumbLd = {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${ORIGIN}/${c.slug}`,
    })),
  };
  const articleLd = {
    '@type': 'Article',
    headline: opts.title,
    inLanguage: 'tr',
    datePublished: TODAY,
    dateModified: TODAY,
    author: { '@type': 'Organization', name: 'nandbench' },
    publisher: {
      '@type': 'Organization',
      name: 'nandbench',
      logo: { '@type': 'ImageObject', url: `${ORIGIN}/logo-mark.png` },
    },
    mainEntityOfPage: url,
    image: OG_IMAGE,
  };
  const html = `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(opts.title)}</title>
    <meta name="description" content="${esc(opts.description)}" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="nandbench" />
    <meta property="og:title" content="${esc(opts.title)}" />
    <meta property="og:description" content="${esc(opts.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(opts.title)}" />
    <meta name="twitter:description" content="${esc(opts.description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    <link rel="icon" type="image/png" sizes="128x128" href="/favicon-128.png" />
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [articleLd, breadcrumbLd],
    })}</script>
    <style>${STYLE}</style>
  </head>
  <body>
    <header><a href="/"><img src="/logo-mark.png" alt="nandbench logosu" /></a><a href="/" class="brand">nandbench</a></header>
    <main>
      <nav class="crumbs">${crumbHtml}</nav>
${opts.body}
      <p><a class="cta" href="/">nandbench'i ücretsiz aç →</a></p>
    </main>
    <footer>© nandbench — tarayıcıda çalışan ücretsiz sayısal mantık devre simülatörü · <a href="/sozluk.html">Sözlük</a> · <a href="/dersler.html">Dersler</a> · <a href="/">Simülatör</a></footer>
  </body>
</html>
`;
  writeFileSync(join(PUBLIC, opts.slug), html, 'utf8');
}

const urls: string[] = [];
const add = (slug: string) => urls.push(`${ORIGIN}/${slug}`);

/* ---------- Glossary: one page per category ---------- */
for (const cat of GLOSSARY_CATEGORIES) {
  const terms = GLOSSARY.filter((g) => g.category === cat);
  if (terms.length === 0) continue;
  const catName = CATEGORY_TR[cat] ?? cat;
  const slug = `sozluk-${cat}.html`;
  const body =
    `      <h1>${esc(catName)} — Sözlük</h1>\n` +
    `      <p class="lead">Sayısal mantıkta <strong>${esc(catName.toLowerCase())}</strong> ile ilgili ${terms.length} temel terim ve tanımları. Her terimi <a href="/">nandbench</a> simülatöründe canlı görebilirsin.</p>\n` +
    terms
      .map(
        (term) =>
          `      <div class="term"><h2>${esc(t(term.nameKey))}</h2><p>${esc(t(term.descKey))}</p></div>`,
      )
      .join('\n') +
    `\n      <p style="margin-top:24px"><a href="/sozluk.html">← Tüm sözlük kategorileri</a></p>`;
  page({
    slug,
    title: `${catName} — Sayısal Mantık Sözlüğü | nandbench`,
    description: `Sayısal mantıkta ${catName.toLowerCase()} terimleri ve tanımları (${terms.length} terim). Tarayıcıda ücretsiz simüle et.`,
    breadcrumb: [
      { name: 'Sözlük', slug: 'sozluk.html' },
      { name: catName, slug },
    ],
    body,
  });
  add(slug);
}

/* Glossary index */
{
  const body =
    `      <h1>Sayısal Mantık Sözlüğü</h1>\n` +
    `      <p class="lead">Lojik kapılardan sonlu durum makinelerine kadar ${GLOSSARY.length} terimlik etkileşimli sözlük, kategorilere ayrılmış.</p>\n` +
    `      <div class="cards">\n` +
    GLOSSARY_CATEGORIES.filter((c) => GLOSSARY.some((g) => g.category === c))
      .map((c) => {
        const n = GLOSSARY.filter((g) => g.category === c).length;
        return `        <a class="card" href="/sozluk-${c}.html"><b>${esc(CATEGORY_TR[c] ?? c)}</b><br/><span>${n} terim</span></a>`;
      })
      .join('\n') +
    `\n      </div>`;
  page({
    slug: 'sozluk.html',
    title: `Sayısal Mantık Sözlüğü — ${GLOSSARY.length} Terim | nandbench`,
    description: `Sayısal mantık ve dijital tasarım sözlüğü: ${GLOSSARY.length} terim, kategorilere ayrılmış tanımlar. Tarayıcıda ücretsiz simüle et.`,
    breadcrumb: [{ name: 'Sözlük', slug: 'sozluk.html' }],
    body,
  });
  add('sozluk.html');
}

/* ---------- Lessons: one page per unit ---------- */
const units: LessonUnit[] = [];
for (const l of LESSONS) if (!units.includes(l.unit)) units.push(l.unit);

for (const unit of units) {
  const lessons = LESSONS.filter((l) => l.unit === unit);
  const unitName = UNIT_TR[unit] ?? unit;
  const slug = `dersler-${unit}.html`;
  const body =
    `      <h1>${esc(unitName)} — Dersler</h1>\n` +
    `      <p class="lead"><strong>${esc(unitName)}</strong> ünitesindeki ${lessons.length} ders. Her ders kısa bir anlatım ve adım adım bir yürüyüştür; çoğu nandbench'te açıp denemek için bir şablonla gelir.</p>\n` +
    lessons
      .map((lesson) => {
        const steps = lesson.stepKeys.map((k) => `        <li>${esc(t(k))}</li>`).join('\n');
        return (
          `      <div class="term"><h2>${esc(t(lesson.titleKey))}</h2>` +
          `<p>${esc(t(lesson.summaryKey))}</p>` +
          (steps ? `<ol>\n${steps}\n      </ol>` : '') +
          `</div>`
        );
      })
      .join('\n') +
    `\n      <p style="margin-top:24px"><a href="/dersler.html">← Tüm üniteler</a></p>`;
  page({
    slug,
    title: `${unitName} — Sayısal Mantık Dersleri | nandbench`,
    description: `${unitName}: ${lessons.length} adımlı ders, anlatım ve örneklerle. Tarayıcıda ücretsiz uygulamalı öğren — nandbench.`,
    breadcrumb: [
      { name: 'Dersler', slug: 'dersler.html' },
      { name: unitName, slug },
    ],
    body,
  });
  add(slug);
}

/* Lessons index */
{
  const body =
    `      <h1>Sayısal Mantık Dersleri (Müfredat)</h1>\n` +
    `      <p class="lead">Bir dönemlik sayısal mantık tasarımı müfredatı: sayı sistemlerinden başlayıp basit bir işlemci veri yoluna kadar ${LESSONS.length} ders, ${units.length} ünitede.</p>\n` +
    `      <div class="cards">\n` +
    units
      .map((u) => {
        const n = LESSONS.filter((l) => l.unit === u).length;
        return `        <a class="card" href="/dersler-${u}.html"><b>${esc(UNIT_TR[u] ?? u)}</b><br/><span>${n} ders</span></a>`;
      })
      .join('\n') +
    `\n      </div>`;
  page({
    slug: 'dersler.html',
    title: `Sayısal Mantık Dersleri — ${LESSONS.length} Ders Müfredat | nandbench`,
    description: `Sayısal mantık / lojik devreler müfredatı: ${LESSONS.length} ders, ${units.length} ünite. Tarayıcıda uygulamalı, ücretsiz öğren.`,
    breadcrumb: [{ name: 'Dersler', slug: 'dersler.html' }],
    body,
  });
  add('dersler.html');
}

console.log(`Generated ${urls.length} pages into public/.`);
for (const u of urls) console.log('  ' + u);
