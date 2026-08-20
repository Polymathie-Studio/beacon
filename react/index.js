// BEACON - the React binding. Same fields and output as the core, rendered as
// elements rather than a string. React 19 hoists title, meta, and link tags to
// <head> from wherever they render, so <Head {...meta} /> can sit in a page or
// layout. On React 18, place it where head content belongs or use a head
// manager, since 18 does not hoist. No build step.

import { createElement as h, Fragment } from 'react'
import { jsonLdInner } from '../beacon.js'

// The schema.org builders are re-exported so a React app can import them and the
// components from one place: `import { JsonLd, article } from 'beacon-ui/react'`.
export { organization, website, article, product, breadcrumb } from '../beacon.js'

export function Head(data = {}) {
  const el = []
  el.push(h('meta', { charSet: 'utf-8', key: 'charset' }))
  el.push(h('meta', { name: 'viewport', content: data.viewport || 'width=device-width, initial-scale=1', key: 'vp' }))

  if (data.title) el.push(h('title', { key: 'title' }, data.title))
  if (data.description) el.push(h('meta', { name: 'description', content: data.description, key: 'desc' }))
  if (data.canonical) el.push(h('link', { rel: 'canonical', href: data.canonical, key: 'canon' }))
  if (data.robots) el.push(h('meta', { name: 'robots', content: data.robots, key: 'robots' }))

  const ogUrl = data.url || data.canonical
  const ogTitle = data.ogTitle || data.title
  const ogDesc = data.ogDescription || data.description
  if (ogTitle) el.push(h('meta', { property: 'og:title', content: ogTitle, key: 'ogt' }))
  el.push(h('meta', { property: 'og:type', content: data.type || 'website', key: 'ogtype' }))
  if (ogUrl) el.push(h('meta', { property: 'og:url', content: ogUrl, key: 'ogurl' }))
  if (ogDesc) el.push(h('meta', { property: 'og:description', content: ogDesc, key: 'ogd' }))
  if (data.siteName) el.push(h('meta', { property: 'og:site_name', content: data.siteName, key: 'ogsn' }))
  if (data.locale) el.push(h('meta', { property: 'og:locale', content: data.locale, key: 'ogl' }))
  if (data.image) {
    el.push(h('meta', { property: 'og:image', content: data.image, key: 'ogi' }))
    if (data.imageAlt) el.push(h('meta', { property: 'og:image:alt', content: data.imageAlt, key: 'ogia' }))
    if (data.imageWidth) el.push(h('meta', { property: 'og:image:width', content: String(data.imageWidth), key: 'ogiw' }))
    if (data.imageHeight) el.push(h('meta', { property: 'og:image:height', content: String(data.imageHeight), key: 'ogih' }))
    if (data.imageType) el.push(h('meta', { property: 'og:image:type', content: data.imageType, key: 'ogit' }))
  }

  el.push(h('meta', { name: 'twitter:card', content: data.twitterCard || (data.image ? 'summary_large_image' : 'summary'), key: 'twc' }))
  if (data.twitterSite) el.push(h('meta', { name: 'twitter:site', content: data.twitterSite, key: 'tws' }))
  if (data.twitterCreator) el.push(h('meta', { name: 'twitter:creator', content: data.twitterCreator, key: 'twcr' }))
  if (data.twitterImageAlt || data.imageAlt) el.push(h('meta', { name: 'twitter:image:alt', content: data.twitterImageAlt || data.imageAlt, key: 'twia' }))

  return h(Fragment, null, ...el)
}

// Render a JSON-LD script from one schema.org object or an array. Uses the core
// serialization (with the </script> escaping), injected raw, because React would
// HTML-escape text children and break the JSON.
export function JsonLd({ schema }) {
  return h('script', { type: 'application/ld+json', dangerouslySetInnerHTML: { __html: jsonLdInner(schema) } })
}

// Render the favicon and icon link tags. React 19 hoists them to <head>.
export function Icons(data = {}) {
  const el = []
  if (data.svg) el.push(h('link', { rel: 'icon', href: data.svg, type: 'image/svg+xml', key: 'svg' }))
  if (data.icon) el.push(h('link', { rel: 'icon', href: data.icon, ...(data.iconType ? { type: data.iconType } : {}), key: 'icon' }))
  if (data.appleTouchIcon) el.push(h('link', { rel: 'apple-touch-icon', href: data.appleTouchIcon, key: 'ati' }))
  if (data.manifest) el.push(h('link', { rel: 'manifest', href: data.manifest, key: 'mani' }))
  if (data.themeColor) el.push(h('meta', { name: 'theme-color', content: data.themeColor, key: 'tc' }))
  return h(Fragment, null, ...el)
}
