# @seo-shell/seo-shell

**Use your favorite SPA framework. Get Next.js-level SEO.**

> 🎯 For developers who already have a SPA (Expo, Vite, CRA, etc.) and want to be found on Google — without rewriting their entire app.

---

## The Problem

You built your app with Expo, Vite, or Create React App. It works great. But Google can't see it.

Traditional solutions say: "Rewrite everything in Next.js." That's months of work.

## The Solution

**SEO Shell** wraps your existing SPA with an invisible Next.js layer that handles SEO:

- ✅ **Dynamic titles, descriptions, Open Graph** — per page
- ✅ **JSON-LD structured data** — for rich search results
- ✅ **Sitemaps** — auto-generated
- ✅ **Canonical URLs** — no duplicate content
- ✅ **Zero changes to your SPA** — it runs exactly as before

```
Your SPA (unchanged) + SEO Shell = Google-friendly app
```

---

## Table of Contents

- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Catch-All Route (Important)](#catch-all-route-important)
- [Next.js Configuration](#nextjs-configuration)
- [Web Events (Optional)](#web-events-optional)
- [Real-World Example](#real-world-example)
- [API Reference](#api-reference)

---

## How It Works

1. **Your SPA** stays exactly as it is — built with Expo, Vite, CRA, whatever
2. **Upload your SPA build** to static storage (Cloudflare R2, AWS S3, etc.)
3. **Deploy a Next.js app** that uses SEO Shell
4. **Next.js intercepts requests**, fetches your SPA from the CDN, injects SEO tags, and serves it
5. **Users and crawlers** see a fully SEO-optimized page that boots your SPA normally

The user never knows Next.js is involved. Your SPA runs exactly as before.

---

## Architecture

Inspired by **microservices**: each part does one thing well.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              YOUR INFRASTRUCTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────┐         ┌─────────────────────────────────┐   │
│   │   Static File Storage   │         │      Next.js SSR Server         │   │
│   │   (CDN / Object Store)  │         │      (Serverless or Server)     │   │
│   ├─────────────────────────┤         ├─────────────────────────────────┤   │
│   │                         │         │                                 │   │
│   │  • Cloudflare R2        │◄────────│  • Vercel (SSR mode)            │   │
│   │  • AWS S3               │  fetch  │  • AWS Lambda                   │   │
│   │  • Google Cloud Storage │ index   │  • Docker container             │   │
│   │  • Any static host      │  .html  │  • Any Node.js server           │   │
│   │                         │         │                                 │   │
│   │  Stores your SPA build  │         │  Handles SEO + serves SPA       │   │
│   │  (index.html, JS, CSS)  │         │  (title, meta, JSON-LD, sitemap)│   │
│   │                         │         │                                 │   │
│   └─────────────────────────┘         └─────────────────────────────────┘   │
│              ▲                                       ▲                      │
│              │                                       │                      │
│              │         User never accesses           │                      │
│              │         CDN directly                  │                      │
│              │                                       │                      │
│              └───────────────────────────────────────┘                      │
│                                 │                                           │
│                                 ▼                                           │
│                    ┌─────────────────────────┐                              │
│                    │      User Browser       │                              │
│                    │  (receives SEO + SPA)   │                              │
│                    └─────────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Differences from Traditional SPA Hosting

| Traditional SPA                                             | SEO Shell                                                 |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| SPA hosted on Vercel/Netlify/Cloudflare Pages (interpreted) | SPA stored as **static files** on CDN (R2, S3, etc.)      |
| No SEO (client-side rendering)                              | Full SEO via Next.js SSR                                  |
| Direct access to `index.html`                               | Next.js fetches and serves `index.html` with SEO injected |

### Why This Works

1. **Your SPA** is built normally (Expo, Vite, CRA, etc.) and uploaded to a **static file storage** (not a hosting platform that interprets `index.html`)
2. **Next.js** runs as an **SSR server** (serverless or traditional) and intercepts all requests
3. Next.js fetches your SPA's `index.html` from the CDN, injects SEO tags, and serves it to the user
4. The user sees a fully SEO-optimized page that boots your SPA normally

### Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Request                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js (SEO Shell)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  1. Intercepts the request                                │  │
│  │  2. Fetches data for SEO (title, description, JSON-LD)    │  │
│  │  3. Fetches your SPA's index.html from CDN                │  │
│  │  4. Parses CSS/JS assets from index.html                  │  │
│  │  5. Injects SEO tags into <head>                          │  │
│  │  6. Serves the complete page to the user                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • Receives page with SEO tags already in <head>          │  │
│  │  • Loads JS/CSS from CDN                                  │  │
│  │  • SPA boots and takes over                               │  │
│  │  • No changes needed to your SPA code                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Requirements

### Your SPA (dist)

- Must be hosted on a **static file storage** (not a platform that interprets HTML):
  - ✅ Cloudflare R2
  - ✅ AWS S3
  - ✅ Google Cloud Storage
  - ✅ DigitalOcean Spaces
  - ✅ Any static file server
  - ❌ Vercel (as static host)
  - ❌ Netlify (as static host)
  - ❌ Cloudflare Pages

### Next.js Server

- Must run in **SSR mode** (not static export):
  - ✅ Vercel (default SSR)
  - ✅ AWS Lambda / Serverless
  - ✅ Docker container
  - ✅ Any Node.js server
  - ❌ `next export` (static)

---

## Installation

```bash
npm i @seo-shell/seo-shell@next
```

## Quick Start

### 1. Configure the shell

```ts
import { createSeoShell } from "@seo-shell/seo-shell/server";

export const seoShell = createSeoShell({
  cdn: {
    indexUrl: "https://cdn.example.com/app/index.html",
  },
});
```

### 2. Wrap your pages

```tsx
import { withSeoShell } from "@seo-shell/seo-shell/server";
import { seoShell } from "../lib/seoShell";

export const getServerSideProps = withSeoShell(
  async () => ({
    props: {
      seo: {
        title: "Home",
        description: "Welcome to my app",
      },
    },
  }),
  { seoShell }
);

export default function Page() {
  return null;
}
```

### 3. Add the provider in `_app.tsx`

```tsx
import { SeoShellProvider } from "@seo-shell/seo-shell";

export default function App({ Component, pageProps }) {
  const shell = pageProps.__seoShell;
  if (!shell) return <Component {...pageProps} />;

  return (
    <SeoShellProvider
      assets={shell.assets}
      seo={{ ...shell.defaultSeo, ...pageProps.seo }}
    >
      <Component {...pageProps} />
    </SeoShellProvider>
  );
}
```

That's it! Your SPA now has full SEO support.

---

## Catch-All Route (Important)

Your SPA likely has client-side routing (React Router, Expo Router, etc.). To prevent Next.js from returning 404 for routes that only exist in your SPA, you need a **catch-all route**.

Create `pages/[...path].tsx`:

```tsx
import {
  getDefaultSeoFromEnv,
  getSeoShellConfigFromEnv,
  withSeoShell,
} from "@seo-shell/seo-shell/server";

export const getServerSideProps = withSeoShell(
  async () => {
    return { props: {} };
  },
  {
    seoShellConfig: getSeoShellConfigFromEnv(),
    getDefaultSeo: getDefaultSeoFromEnv,
  }
);

export default function SpaFallbackPage() {
  return null;
}
```

This route catches all paths that don't have a specific Next.js page and serves your SPA with default SEO.

---

## Next.js Configuration

### `next.config.js`

```js
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@seo-shell/seo-shell"],
  async rewrites() {
    return [
      {
        source: "/sitemaps/cities/:page.xml",
        destination: "/seo/cities-:page.xml",
      },
      {
        source: "/sitemaps/professionals/:page.xml",
        destination: "/seo/professionals-:page.xml",
      },
    ];
  },
};

export default nextConfig;
```

### `pages/_document.tsx`

Use the built-in `SeoShellDocument` or `createSeoShellDocument`:

```tsx
import { createSeoShellDocument } from "@seo-shell/seo-shell";

export default createSeoShellDocument({
  lang: "pt-BR",
});
```

Or customize it:

```tsx
import { SeoShellDocument } from "@seo-shell/seo-shell";

export default function Document() {
  return (
    <SeoShellDocument lang="pt-BR">
      {/* Additional head elements */}
    </SeoShellDocument>
  );
}
```

---

## Web Events (Optional)

> **This section is optional.** You only need Web Events if you want to pass data from Next.js to your SPA to avoid duplicate API calls.

If you fetch data in Next.js for SEO purposes (e.g., a professional's name and bio), you can send that same data to your SPA so it doesn't need to fetch it again.

**When to use:**

- ✅ You fetch data in Next.js and want to reuse it in your SPA
- ✅ You want to avoid duplicate API calls
- ❌ You don't need this if your SPA fetches its own data independently

### Step 1: Install `@seo-shell/events` in your SPA project

This is a **separate, lightweight package** (~1KB) that only contains the event functions. Install it in your SPA project (Expo, Vite, React, etc.):

```bash
npm i @seo-shell/events@next
```

### Step 2: Send data from Next.js

```tsx
import { withSeoShell, createEventBridge } from "@seo-shell/seo-shell/server";

export const getServerSideProps = withSeoShell(
  async () => {
    const professional = await fetchProfessional("john-doe");
    const events = createEventBridge();
    events.queue("professional", professional);

    return {
      props: {
        seo: {
          title: professional.name,
          description: professional.bio,
        },
        __events: events.pendingEvents,
      },
    };
  },
  { seoShell }
);
```

### Step 3: Receive data in your SPA

```ts
import { watchEvent } from "@seo-shell/events";

watchEvent("professional", (professional) => {
  console.log("Received:", professional);
});
```

---

## Real-World Example

Complete example from a production app with GraphQL, sitemaps, and full SEO:

### `pages/profissional/[slug].tsx`

```tsx
import type { GetServerSideProps } from "next";
import {
  buildBreadcrumbListJsonLd,
  buildLocalBusinessJsonLd,
} from "@seo-shell/seo-shell";
import type { SeoHeadProps } from "@seo-shell/seo-shell";
import {
  getDefaultSeoFromEnv,
  getSeoShellConfigFromEnv,
  withSeoShell,
} from "@seo-shell/seo-shell/server";

import { getBaseUrl } from "~/lib/absoluteUrl";
import { fetchGraphQL } from "~/lib/graphqlFetch";
import { COMPANY_BY_SLUG_QUERY } from "~/lib/seoQueries";
import type { CompanyDetails } from "~/lib/types";

type PageProps = {
  baseUrl: string;
  canonicalUrl: string;
  company: CompanyDetails | null;
  seo?: SeoHeadProps;
};

const handler: GetServerSideProps<PageProps> = async ({ params, req }) => {
  const slug = String(params?.slug ?? "");
  if (!slug) return { notFound: true };

  const baseUrl = getBaseUrl(req);
  const canonicalUrl = `${baseUrl}/profissional/${slug}`;

  try {
    const data = await fetchGraphQL<{ company: CompanyDetails | null }>(
      COMPANY_BY_SLUG_QUERY,
      { slug }
    );

    if (!data.company) return { notFound: true };

    const company = data.company;
    const title = `${company.name} | My App`;
    const description =
      company.description?.slice(0, 160) ??
      `Professional services with ${company.name}.`;

    const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
      { name: "Home", url: baseUrl },
      { name: "Professionals", url: `${baseUrl}/profissionais` },
      { name: company.name, url: canonicalUrl },
    ]);

    const localBusinessJsonLd = buildLocalBusinessJsonLd({
      name: company.name,
      description: company.description ?? undefined,
      url: canonicalUrl,
      telephone: company.phone ?? undefined,
      image: company.logo ? [company.logo] : undefined,
      addressLocality: company.address?.city ?? undefined,
      addressRegion: company.address?.state ?? undefined,
      addressCountry: "BR",
      aggregateRating:
        company.averageRating && company.ratingCount
          ? {
              ratingValue: String(company.averageRating),
              reviewCount: company.ratingCount,
            }
          : undefined,
    });

    return {
      props: {
        baseUrl,
        canonicalUrl,
        company,
        seo: {
          title,
          description,
          canonicalUrl,
          ogType: "profile",
          ogSiteName: "My App",
          ogLocale: "pt_BR",
          ogImage: {
            url: company.logo ?? `${baseUrl}/default-og.png`,
            alt: company.name,
          },
          keywords: [
            company.name,
            company.categories?.[0]?.name,
            company.address?.city,
          ].filter(Boolean),
          jsonLd: [breadcrumbJsonLd, localBusinessJsonLd],
        },
      },
    };
  } catch {
    return {
      props: {
        baseUrl,
        canonicalUrl,
        company: null,
        seo: {
          title: "Not Found | My App",
          description: "Page not found.",
          canonicalUrl,
          noIndex: true,
        },
      },
    };
  }
};

export const getServerSideProps = withSeoShell(handler, {
  seoShellConfig: getSeoShellConfigFromEnv(),
  getDefaultSeo: getDefaultSeoFromEnv,
});

export default function ProfissionalSlugPage() {
  return null;
}
```

### `pages/index.tsx` (with sitemap generation)

```tsx
import {
  getDefaultSeoFromEnv,
  getSeoShellConfigFromEnv,
  withSeoShell,
} from "@seo-shell/seo-shell/server";
import { sitemapConfig } from "~/lib/sitemapConfig";

export const getServerSideProps = withSeoShell(
  async () => {
    return { props: {} };
  },
  {
    seoShellConfig: getSeoShellConfigFromEnv(),
    getDefaultSeo: getDefaultSeoFromEnv,
    options: {
      ensureSitemaps: true,
      sitemapConfig,
    },
  }
);

export default function HomePage() {
  return null;
}
```

### `pages/_app.tsx`

```tsx
import "~/styles/globals.css";
import type { AppProps } from "next/app";
import type { SeoHeadProps, CdnAssets } from "@seo-shell/seo-shell";
import { SeoShellProvider } from "@seo-shell/seo-shell";

type PagePropsWithSeoShell = {
  seo?: SeoHeadProps;
  __seoShell?: {
    assets: CdnAssets;
    noIndex: boolean;
    defaultSeo: SeoHeadProps;
  };
};

export default function App({
  Component,
  pageProps,
}: AppProps<PagePropsWithSeoShell>) {
  const shell = pageProps.__seoShell;

  if (!shell) {
    return <Component {...pageProps} />;
  }

  return (
    <SeoShellProvider
      assets={shell.assets}
      noIndex={shell.noIndex}
      seo={{
        ...shell.defaultSeo,
        ...pageProps.seo,
      }}
    >
      <Component {...pageProps} />
    </SeoShellProvider>
  );
}
```

---

## API Reference

### `createSeoShell(config)`

Creates a configured SEO Shell instance.

```ts
createSeoShell({
  cdn: {
    indexUrl: string, // URL to your SPA's index.html
    baseUrl: string, // Base URL for relative assets
    version: string, // Version folder (e.g., "v1.2.3")
  },
  defaults: {
    defaultNoIndex: boolean, // Default noindex behavior (default: true)
  },
});
```

### `withSeoShell(handler, options)`

Wraps `getServerSideProps` to inject SEO data.

### `sendEvent(name, payload)`

Send data from Next.js to your SPA.

### `watchEvent(name, callback)`

Listen for events in your SPA. Returns an unsubscribe function.

### `createEventBridge()`

Queue events server-side to be sent when the page loads.

---

## License

MIT
