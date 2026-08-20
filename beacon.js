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
