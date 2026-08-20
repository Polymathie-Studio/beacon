import type { ReactElement } from 'react'

export interface BeaconMeta {
  /** Document title. One per page, descriptive of the specific page. */
  title?: string
  /** Meta description. Unique per page; the SERP snippet candidate. */
  description?: string
  /** Absolute canonical URL. og:url defaults to this so the two agree. */
  canonical?: string
  /** Robots directive, e.g. 'index, follow' or 'noindex'. Omit to leave default (index). */
  robots?: string
  /** BCP 47 language tag for <html lang>. Applied via htmlAttrs, not a head tag. */
  lang?: string
  /** Viewport content. Defaults to 'width=device-width, initial-scale=1'. */
  viewport?: string
  /** og:type. Defaults to 'website'. */
  type?: string
  /** og:url. Defaults to canonical. */
  url?: string
  /** og:image and the Twitter card image (X falls back to og:image). Absolute URL. */
  image?: string
  imageAlt?: string
  imageWidth?: number | string
  imageHeight?: number | string
  imageType?: string
  /** og:site_name. */
  siteName?: string
  /** og:locale, e.g. 'en_US'. */
  locale?: string
  /** Override og:title if it should differ from title. */
  ogTitle?: string
  /** Override og:description if it should differ from description. */
  ogDescription?: string
  /** twitter:card. Defaults to summary_large_image when an image is set, else summary. */
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  twitterSite?: string
  twitterCreator?: string
  twitterImageAlt?: string
}

/** Render the findability head tags as elements. React 19 hoists them to <head>. */
export function Head(data?: BeaconMeta): ReactElement
