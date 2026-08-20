# BEACON

BEACON is findability: the metadata a shipped page must carry so it represents itself correctly to search engines, social shares, and machines. A page with no title tag, no canonical, and no Open Graph tags renders fine for a person and is nearly invisible to everything else. When a link to it is shared, the preview is a bare URL with no title and no image; when a crawler or an AI agent reads it, there is nothing to read. BEACON gives you that metadata, correct and complete, themed to your content.

It is **in progress** toward the full findability set (see the scope note). This is Tier 1: the head essentials (title, description, canonical, robots, viewport, charset) plus Open Graph and Twitter cards. Structured data, sitemap, robots.txt, favicon, and a findability auditor follow.

## Why it generates a string, not runtime tags

BEACON breaks the shape of its sibling primitives on purpose. The single most damaging findability failure in fast, client-rendered builds is metadata injected by JavaScript after the page loads: the social and AI scrapers that matter most (`facebookexternalhit`, `Twitterbot`, `LinkedInBot`, Slack) do not run JavaScript, so they fetch the raw HTML and see none of it. A runtime tag injector reproduces the exact failure it should prevent. So BEACON produces its output at build or server-render time, as a string of tags that lands in the server-returned HTML, where every consumer can read it.

## Quickstart

### Any site, no framework

Call `head()` with a plain metadata object and place the result inside your `<head>` when you render the page on the server or at build time.

```js
import { head, htmlAttrs } from 'beacon-ui'

const tags = head({
  title: 'Pricing that scales with you',
  description: 'Simple per-seat pricing, no hidden tiers.',
  canonical: 'https://example.com/pricing',
  siteName: 'Example',
  image: 'https://example.com/og/pricing.png',
  imageAlt: 'The Example pricing table',
  locale: 'en_US',
  twitterSite: '@example',
})

// tags is a string of <meta>, <title>, and <link> elements. Insert it in <head>:
// `<html ${htmlAttrs({ lang: 'en' })}><head>${tags}</head> ...`
```

### React

`Head` renders the same tags as elements. React 19 hoists `title`, `meta`, and `link` to `<head>` from wherever they render, so you can put it in a page or layout.

```tsx
import { Head } from 'beacon-ui/react'

export default function PricingPage() {
  return (
    <>
      <Head
        title="Pricing that scales with you"
        description="Simple per-seat pricing, no hidden tiers."
        canonical="https://example.com/pricing"
        siteName="Example"
        image="https://example.com/og/pricing.png"
      />
      <main>...</main>
    </>
  )
}
```

On React 18, which does not hoist, place `Head` where head content belongs or use a head manager.

## What it generates

From one flat object, `head()` emits, in order: a UTF-8 charset (first, so every text field below is decoded correctly), a viewport, the `<title>`, the meta description, the canonical link, an optional robots directive, the Open Graph tags (`og:title`, `og:type`, `og:url`, `og:description`, `og:site_name`, `og:locale`, and the image with its sub-properties), and the Twitter card (which falls back to the Open Graph tags, so only the card type is required). Every value is HTML-escaped.

## Two invariants it helps you hold

- **Agreement.** The canonical URL, `og:url`, and (later) the sitemap entry for a page should name the same absolute URL. BEACON defaults `og:url` to your canonical so they cannot drift.
- **Separation.** Keeping a page out of the index is the `robots` directive's job (`noindex`), not robots.txt. BEACON puts index control where it belongs, in the head.

## Part of the Polymathie family

BEACON is one of the [Polymathie](https://github.com/Polymathie-Studio) primitives: small, dependency-free pieces for building websites, dashboards, and tools, where each protects one posture that fast, AI-assisted building tends to drop. Its siblings are [TEMPER](https://github.com/Polymathie-Studio/temper) (legibility and design tokens), [LUCID](https://github.com/Polymathie-Studio/lucid) (honest disclosure), [HASP](https://github.com/Polymathie-Studio/hasp) (bring-your-own-key privacy), [GRACE](https://github.com/Polymathie-Studio/grace) (off-happy-path states), and [GRASP](https://github.com/Polymathie-Studio/grasp) (operable interaction components). Where the others are runtime pieces, BEACON is a build and SSR-time generator, because findability metadata has to be in the served HTML.

## License

Apache-2.0. Copyright 2026 Regis Lloyd Chapman. See `LICENSE` and `NOTICE`.
