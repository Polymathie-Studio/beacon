/*
 * BEACON - the framework-agnostic core. Zero dependencies.
 *
 * Findability: a build and SSR-time generator that takes a page-metadata
 * object and returns the correct <head> tags as a string, so the metadata
 * lands in the server-returned HTML where search engines and the non-JS
 * social and AI scrapers can read it. It does not inject tags at runtime,
 * because runtime injection is invisible to the consumers that matter most.
 *
 * Tier 1: the head essentials (charset, viewport, title, description,
 * canonical, robots) plus Open Graph and Twitter cards. Tiers 2 and 3 (schema,
 * sitemap, robots.txt, favicon, the auditor) follow.
 *
 * License: Apache-2.0.
 */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ESC[c]);

const nameMeta = (n, c) => `<meta name="${n}" content="${esc(c)}">`;
const propMeta = (p, c) => `<meta property="${p}" content="${esc(c)}">`;

// Build the findability <head> tags from a flat metadata object. Returns a
// string of tags (no surrounding <head>), newline-joined, for the consumer to
// place inside <head> at SSR or build time. Minimal input works; every field is
// optional except that a title and description are what make a page legible.
export function head(data = {}) {
  const t = [];

  // Charset first: it is the precondition for the correctness of every text
  // field below, so it leads the head.
  t.push('<meta charset="utf-8">');
  t.push(nameMeta('viewport', data.viewport || 'width=device-width, initial-scale=1'));

  if (data.title) t.push(`<title>${esc(data.title)}</title>`);
  if (data.description) t.push(nameMeta('description', data.description));
  if (data.canonical) t.push(`<link rel="canonical" href="${esc(data.canonical)}">`);
  if (data.robots) t.push(nameMeta('robots', data.robots));

  // Open Graph. og:url defaults to the canonical so the two agree (invariant:
  // canonical, og:url, and the sitemap entry should name the same absolute URL).
  const ogUrl = data.url || data.canonical;
  const ogTitle = data.ogTitle || data.title;
  const ogDesc = data.ogDescription || data.description;
  if (ogTitle) t.push(propMeta('og:title', ogTitle));
  t.push(propMeta('og:type', data.type || 'website'));
  if (ogUrl) t.push(propMeta('og:url', ogUrl));
  if (ogDesc) t.push(propMeta('og:description', ogDesc));
  if (data.siteName) t.push(propMeta('og:site_name', data.siteName));
  if (data.locale) t.push(propMeta('og:locale', data.locale));
  if (data.image) {
    t.push(propMeta('og:image', data.image));
    if (data.imageAlt) t.push(propMeta('og:image:alt', data.imageAlt));
    if (data.imageWidth) t.push(propMeta('og:image:width', data.imageWidth));
    if (data.imageHeight) t.push(propMeta('og:image:height', data.imageHeight));
    if (data.imageType) t.push(propMeta('og:image:type', data.imageType));
  }

  // Twitter card. A large-image card when an image is present, else summary.
  // X reads the Open Graph tags as fallback, so title, description, and image
  // need not be repeated here; only the card declaration is required.
  t.push(nameMeta('twitter:card', data.twitterCard || (data.image ? 'summary_large_image' : 'summary')));
  if (data.twitterSite) t.push(nameMeta('twitter:site', data.twitterSite));
  if (data.twitterCreator) t.push(nameMeta('twitter:creator', data.twitterCreator));
  if (data.twitterImageAlt || data.imageAlt) t.push(nameMeta('twitter:image:alt', data.twitterImageAlt || data.imageAlt));

  return t.join('\n');
}

// The lang declaration belongs on <html>, not in <head>. This returns the
// attribute string for the consumer to apply, for example:
//   `<html ${htmlAttrs(data)}>`
export function htmlAttrs(data = {}) {
  return data.lang ? `lang="${esc(data.lang)}"` : '';
}

// --- Tier 2: structured data, site files, and icons ---

const prune = (o) => {
  const out = {};
  for (const k in o) if (o[k] != null) out[k] = o[k];
  return out;
};
const toArr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

// Escape a string for safe inclusion inside a <script> block: the sequence
// "</script>" (and stray < > &) must not break out of the element.
const jsonLdEsc = (s) => s.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

// Serialize one schema.org object, or several, as a JSON-LD <script> tag. A
// single object gets @context; several are combined under @graph. Pass the
// output of the builders below, e.g. jsonLd([organization({...}), website({...})]).
export function jsonLdInner(schema) {
  const arr = toArr(schema);
  const payload = arr.length === 1
    ? { '@context': 'https://schema.org', ...arr[0] }
    : { '@context': 'https://schema.org', '@graph': arr };
  return jsonLdEsc(JSON.stringify(payload));
}

export function jsonLd(schema) {
  return `<script type="application/ld+json">${jsonLdInner(schema)}</script>`;
}

// Builders return plain schema.org objects (no @context; jsonLd adds it), so
// they compose. Undefined fields are pruned.
export function organization(d = {}) {
  return prune({ '@type': 'Organization', name: d.name, url: d.url, logo: d.logo, sameAs: d.sameAs });
}

export function website(d = {}) {
  const o = { '@type': 'WebSite', name: d.name, url: d.url };
  if (d.searchUrl) o.potentialAction = {
    '@type': 'SearchAction',
    target: d.searchUrl + '{search_term_string}',
    'query-input': 'required name=search_term_string',
  };
  return prune(o);
}

export function article(d = {}) {
  const author = d.author == null ? undefined
    : typeof d.author === 'string' ? { '@type': 'Person', name: d.author } : d.author;
  return prune({
    '@type': d.type || 'Article',
    headline: d.headline || d.title,
    image: d.image,
    datePublished: d.datePublished,
    dateModified: d.dateModified || d.datePublished,
    author,
    publisher: d.publisher,
  });
}

export function product(d = {}) {
  const o = { '@type': 'Product', name: d.name, image: d.image, description: d.description };
  if (d.price != null) o.offers = prune({
    '@type': 'Offer',
    price: String(d.price),
    priceCurrency: d.currency,
    availability: d.availability,
  });
  return prune(o);
}

export function breadcrumb(items = []) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => prune({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

// Serialize a sitemap.xml from a list of URLs (strings, or objects with loc,
// lastmod, changefreq, priority). List only canonical, indexable URLs. The
// protocol caps a single file at 50,000 URLs and 50 MB; split beyond that.
export function sitemap(urls = []) {
  const entries = urls.map((u) => {
    const e = typeof u === 'string' ? { loc: u } : u;
    let s = `  <url>\n    <loc>${esc(e.loc)}</loc>\n`;
    if (e.lastmod) s += `    <lastmod>${esc(e.lastmod)}</lastmod>\n`;
    if (e.changefreq) s += `    <changefreq>${esc(e.changefreq)}</changefreq>\n`;
    if (e.priority != null) s += `    <priority>${esc(String(e.priority))}</priority>\n`;
    return s + '  </url>';
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

// Serialize a robots.txt. This is crawl control only; keeping a page out of the
// index is the robots meta directive's job (see head), not a Disallow here.
// Pass allow/disallow (string or array) for a single "*" group, or a groups
// array of { userAgent, allow, disallow }, plus one or more sitemap URLs.
export function robots(opts = {}) {
  const groups = opts.groups || [{ userAgent: '*', allow: opts.allow, disallow: opts.disallow }];
  const lines = [];
  for (const g of groups) {
    for (const ua of toArr(g.userAgent).length ? toArr(g.userAgent) : ['*']) lines.push(`User-agent: ${ua}`);
    for (const a of toArr(g.allow)) lines.push(`Allow: ${a}`);
    const dis = toArr(g.disallow);
    if (dis.length) for (const d of dis) lines.push(`Disallow: ${d}`);
    else if (!toArr(g.allow).length) lines.push('Disallow:');
    lines.push('');
  }
  for (const s of toArr(opts.sitemap)) lines.push(`Sitemap: ${s}`);
  return lines.join('\n').replace(/\n*$/, '\n');
}

// The favicon and icon <link> tags for <head>. Pass icon (any format), svg,
// appleTouchIcon, manifest (URL), and themeColor.
export function icons(d = {}) {
  const t = [];
  if (d.svg) t.push(`<link rel="icon" href="${esc(d.svg)}" type="image/svg+xml">`);
  if (d.icon) t.push(`<link rel="icon" href="${esc(d.icon)}"${d.iconType ? ` type="${esc(d.iconType)}"` : ''}>`);
  if (d.appleTouchIcon) t.push(`<link rel="apple-touch-icon" href="${esc(d.appleTouchIcon)}">`);
  if (d.manifest) t.push(`<link rel="manifest" href="${esc(d.manifest)}">`);
  if (d.themeColor) t.push(nameMeta('theme-color', d.themeColor));
  return t.join('\n');
}

// Serialize a Web App Manifest (site.webmanifest) as a JSON string. Pass name,
// shortName, icons (an array of { src, sizes, type }), themeColor, backgroundColor.
export function manifest(d = {}) {
  return JSON.stringify(prune({
    name: d.name,
    short_name: d.shortName,
    start_url: d.startUrl || '/',
    display: d.display || 'standalone',
    background_color: d.backgroundColor,
    theme_color: d.themeColor,
    icons: d.icons,
  }), null, 2);
}
