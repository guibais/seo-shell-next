# @seo-shell/seo-shell

**Portuguese / Português:** see [Português](#português).

**Use your favorite SPA framework. Get Next.js-level SEO.**

> 🎯 For developers who already have a SPA (Expo, Vite, CRA, etc.) and want to be found on Google — without rewriting their entire app.

> **Tested with:** Expo Web, Vite (React/Angular). Should be compatible with most modern bundlers (CRA, Parcel, Webpack, etc.).

Your SPA can be Angular, Vue, Svelte, React, or anything that outputs static files. SEO Shell does not require your SPA codebase to use Next.js.

## The Problem

You built your app with Expo, Vite, Ionic, or Create React App. It works great. But Google can't see it.

Traditional solutions say: "Rewrite everything in Next.js." But:

- **You already have a working SPA** — rewriting is months of work
- **Next.js is overkill** — you just need SEO, not a full framework migration
- **You're building a native-first app** — Expo Web or Ionic are just the web version of your mobile app, you want to focus on the app, not on web infrastructure
- **Your team knows React/Vue/Angular** — not Next.js

## The Solution

**SEO Shell** adds SEO to your existing SPA without changing it:

- ✅ **Dynamic titles, descriptions, Open Graph** — per page
- ✅ **JSON-LD structured data** — for rich search results
- ✅ **Sitemaps** — auto-generated
- ✅ **Canonical URLs** — no duplicate content
- ✅ **Zero changes to your SPA** — it runs exactly as before
- ✅ **Any dist/build output** — the SPA build folder can be whatever your framework produces

```
Your SPA (unchanged) + SEO Shell = Google-friendly app
```

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [How It Works](#how-it-works)
- [What Runs Where](#what-runs-where)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Important Requirements](#important-requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Catch-All Route (Required)](#catch-all-route-required)
- [Two-Way Communication (Optional)](#two-way-communication-optional)
- [Smart Dist Detection](#smart-dist-detection)
- [Next.js Configuration](#nextjs-configuration)
- [Sitemap](#sitemap)
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

## What Runs Where

SEO Shell is designed to be plug-and-play, but it helps to think in two clearly separated parts.

- **Your SPA (Angular/Vue/React/Svelte/etc.)**

  - You keep your SPA exactly as it is.
  - You build it as static files (your dist/build folder).
  - You host those files on static storage (R2/S3/etc.).
  - SEO Shell does not require your SPA to use Next.js, React, or `getServerSideProps`.
  - There is no conflict with an Angular app, because Angular is not running inside Next.js. Next.js only serves the generated static files.

- **Your Next.js “SEO host” app**
  - This is a small Next.js app whose job is to serve your SPA HTML and inject SEO server-side.
  - This is where `getServerSideProps`, `pages/[...path].tsx`, and `createSeoShellApp` live.
  - This app is the thing crawlers hit.

In other words: `getServerSideProps` is not a requirement for your SPA. It is only used in the Next.js wrapper app.

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

## Important Requirements

Before you start, make sure you understand these **required** steps:

1. **Create `pages/[...path].tsx`** — Required to avoid 404 errors on SPA routes. [See details](#catch-all-route-required)

2. **Configure once in `lib/seoShell.ts`** — All config is centralized:

   ```ts
   export const seoShellApp = createSeoShellApp({
     cdn: {
       indexUrl: "https://cdn.example.com/app/index.html",
       baseUrl: "https://cdn.example.com/app",
     },
     defaults: { seo: { title: "My App", description: "..." } },
   });
   ```

3. **Add `SeoShellProvider` in `_app.tsx`** — Wraps your app with SEO capabilities. [See details](#3-add-the-provider-in-_apptsx)

---

## Installation

```bash
npm i @seo-shell/seo-shell@next
```

## Quick Start

Everything in this section is implemented in your Next.js “SEO host” app (not in your SPA project).

### 1. Configure the shell (once)

```ts
import { createSeoShellApp } from "@seo-shell/seo-shell/server";

export const seoShellApp = createSeoShellApp({
  cdn: {
    indexUrl: "https://cdn.example.com/app/index.html",
    baseUrl: "https://cdn.example.com/app",
  },
});
```

### 2. Wrap your pages (no config needed per page)

```tsx
import { seoShellApp } from "../lib/seoShell";

export const getServerSideProps = seoShellApp.withSeoShell(async () => ({
  props: {
    seo: {
      title: "Home",
      description: "Welcome to my app",
    },
  },
}));

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
      noIndex={shell.noIndex}
      seo={{ ...shell.defaultSeo, ...pageProps.seo }}
    >
      <Component {...pageProps} />
    </SeoShellProvider>
  );
}
```

That's it! Your SPA now has full SEO support.

---

## Smart Dist Detection

SEO Shell automatically detects your SPA's build output directory across multiple frameworks. It searches common dist paths and identifies the framework being used.

### Supported Frameworks

- **Expo** - `dist`, `web-build`
- **Vite** - `dist`, `build`
- **Create React App** - `build`
- **Next.js** - `.next`, `out`
- **Nuxt** - `.output/public`, `dist`, `.nuxt`
- **Angular** - `dist`, `dist/browser`
- **Vue CLI** - `dist`
- **Parcel** - `dist`, `build`
- **Remix** - `public/build`, `build/client`
- **Astro** - `dist`
- **Gatsby** - `public`
- **SvelteKit** - `build`, `dist`, `public/build`
- **Webpack/Rollup/esbuild** - `dist`, `build`, `out`

### Auto-Detection

The detector reads your `package.json` to identify the framework and searches the appropriate directories:

```ts
import { detectDistDirectory } from "@seo-shell/seo-shell/server";

const result = detectDistDirectory();

console.log(result);
// {
//   distPath: "/path/to/your/project/dist",
//   framework: "vite",
//   indexPath: "/path/to/your/project/dist/index.html",
//   hasHashedAssets: true
// }
```

### Custom Dist Path

If your dist directory is in a non-standard location, specify it explicitly:

```ts
import { detectDistDirectory } from "@seo-shell/seo-shell/server";

const result = detectDistDirectory({
  customDistPath: "./my-custom-output",
});
```

### Hashed Assets Detection

By default, SEO Shell detects if your assets have content hashes (e.g., `main.a1b2c3d4.js`). You can explicitly set expectations:

```ts
import { detectDistDirectory } from "@seo-shell/seo-shell/server";

const result = detectDistDirectory({
  expectHashedAssets: true,
});

if (!result.hasHashedAssets) {
  console.warn("Assets are not hashed - caching may not work optimally");
}
```

### Generate Web Assets Manifest

Generate a manifest file from your build output with smart detection:

```ts
import { writeWebAssetsManifestFromBuild } from "@seo-shell/seo-shell/server";

const result = writeWebAssetsManifestFromBuild({
  projectPath: "./my-spa",
  expectHashedAssets: true,
});

console.log(result);
// {
//   outputPath: "/path/to/dist/web-assets.json",
//   manifest: { cssHrefs: [...], jsSrcs: [...], faviconHref: "..." },
//   detection: { distPath: "...", framework: "expo", hasHashedAssets: true }
// }
```

### Options

| Option               | Type      | Default         | Description                            |
| -------------------- | --------- | --------------- | -------------------------------------- |
| `projectPath`        | `string`  | `process.cwd()` | Root path of your project              |
| `customDistPath`     | `string`  | auto-detected   | Custom path to your dist directory     |
| `expectHashedAssets` | `boolean` | `undefined`     | Warn if hash expectation doesn't match |

---

## Catch-All Route (Required)

> ⚠️ **This file is required!** Without it, any route not explicitly defined in Next.js will return a 404 error.

Your SPA has its own client-side routing (React Router, Expo Router, etc.). Next.js doesn't know about these routes. Without a catch-all route, users navigating directly to `/profile` or `/settings` will see a 404 page.

**Create `pages/[...path].tsx`:**

```tsx
import { seoShellApp } from "~/lib/seoShell";

export const getServerSideProps = seoShellApp.withSeoShell(async () => {
  return { props: {} };
});

export default function SpaFallbackPage() {
  return null;
}
```

**What this does:**

- Catches ALL routes not explicitly defined in Next.js
- Serves your SPA with the default SEO configured in `createSeoShellApp`
- Allows your SPA's client-side router to handle the actual navigation

**Example:** If your SPA has routes like `/profile`, `/settings`, `/dashboard`:

- Without `[...path].tsx`: User gets 404
- With `[...path].tsx`: User sees your SPA with default SEO tags

---

## Next.js Configuration

### `next.config.js`

```js
import { withSeoShellSitemap } from "@seo-shell/seo-shell/server";

const nextConfig = withSeoShellSitemap(
  {
    reactStrictMode: true,
    transpilePackages: ["@seo-shell/seo-shell"],
  },
  {
    publicSitemapSubdir: "/seo",
    sitemapsRouteBasePath: "/sitemaps",
    sitemapIndexRoute: "/sitemap.xml",
    sitemapIndexPath: "/seo/sitemap.xml",
    groups: ["cities", "professionals"],
  }
);

export default nextConfig;
```

If you prefer manual control, see the [Sitemap](#sitemap) section.

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
  return <SeoShellDocument lang="pt-BR"></SeoShellDocument>;
}
```

---

## Two-Way Communication (Optional)

SEO Shell includes a tiny event layer built on browser `CustomEvent`. It lets you communicate:

- **Next.js -> SPA** (inject data already fetched on SSR, so your SPA can reuse it)
- **SPA -> Next.js** (listen to SPA events inside Next client components)

It also emits lifecycle events:

- **`seo-shell:ready`** — fired before the SPA scripts run
- **`seo-shell:hydrated`** — fired after the SPA mounts into `#root`

### Install `@seo-shell/events` in your SPA project

```bash
npm i @seo-shell/events@next
```

### Next.js -> SPA (avoid duplicate fetch)

In Next.js, collect events during SSR:

```tsx
import { createEventBridge } from "@seo-shell/seo-shell/server";
import { seoShellApp } from "~/lib/seoShell";

export const getServerSideProps = seoShellApp.withSeoShell(async () => {
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
});
```

Then dispatch those events on the client (e.g. in `_app.tsx`):

```tsx
import { sendEvent } from "@seo-shell/seo-shell";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const events = pageProps.__events ?? [];
    events.forEach((e) => sendEvent(e.name, e.payload));
  }, [pageProps.__events]);

  return <Component {...pageProps} />;
}
```

In your SPA, listen:

```ts
import { watchEvent } from "@seo-shell/events";

watchEvent("professional", (professional) => {
  console.log("Received:", professional);
});
```

### SPA -> Next.js

In your SPA, send events:

```ts
import { sendEvent } from "@seo-shell/events";

sendEvent("spa:navigation", { path: "/profile" });
```

In Next.js (client-side), listen:

```ts
import { watchEvent } from "@seo-shell/seo-shell";
import { useEffect } from "react";

export const useSpaNavigationEvents = () => {
  useEffect(() => {
    return watchEvent("spa:navigation", (payload) => {
      console.log("SPA navigation:", payload);
    });
  }, []);
};
```

---

## Sitemap

SEO Shell includes a complete sitemap generation system with automatic fallback handling. You can use it in two ways:

### Option 1: Using the Next.js Config Plugin (Recommended)

The `withSeoShellSitemap` plugin automatically configures `rewrites` and `headers` for your sitemaps:

```ts
import { withSeoShellSitemap } from "@seo-shell/seo-shell/server";

const nextConfig = withSeoShellSitemap(
  {
    reactStrictMode: true,
    transpilePackages: ["@seo-shell/seo-shell"],
    images: {
      domains: ["cdn.example.com"],
    },
  },
  {
    publicSitemapSubdir: "/seo",
    sitemapIndexRoute: "/sitemap.xml",
    sitemapIndexPath: "/sitemap.xml",
    sitemapsRouteBasePath: "/sitemaps",
    groups: ["cities", "professionals", "categories"],
  }
);

export default nextConfig;
```

**What the plugin does:**

- Creates rewrites from `/sitemaps/{group}/:page.xml` to `/seo/{group}-:page.xml`
- Creates rewrite for sitemap index if `sitemapIndexRoute !== sitemapIndexPath`
- Adds `Content-Type: application/xml` and `Cache-Control` headers for all sitemap files
- Adds headers for `robots.txt`

**Plugin Options:**

| Option                  | Type       | Default        | Description                                      |
| ----------------------- | ---------- | -------------- | ------------------------------------------------ |
| `publicSitemapSubdir`   | `string`   | `/seo`         | Directory in `public/` where sitemaps are stored |
| `sitemapIndexRoute`     | `string`   | `/sitemap.xml` | Public URL for the sitemap index                 |
| `sitemapIndexPath`      | `string`   | `sitemap.xml`  | File path in `public/` for the sitemap index     |
| `sitemapsRouteBasePath` | `string`   | `/sitemaps`    | Base path for paginated sitemap routes           |
| `groups`                | `string[]` | `[]`           | Sitemap group names (e.g., `["cities", "pros"]`) |
| `includeRobotsHeaders`  | `boolean`  | `true`         | Add headers for `robots.txt`                     |
| `includeSitemapHeaders` | `boolean`  | `true`         | Add headers for sitemap files                    |

### Option 2: Manual Configuration (Without Plugin)

If you prefer manual control, configure rewrites yourself:

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

### Generating Sitemaps

Use `ensureSitemaps` in your `getServerSideProps` to generate sitemaps on-demand:

```ts
import type { EnsureSitemapsConfig } from "@seo-shell/seo-shell/server";

export const sitemapConfig: EnsureSitemapsConfig = {
  baseUrl: "https://myapp.com",
  outputDir: "./public",
  sitemapSubdir: "seo",
  sitemapIndexPath: "sitemap.xml",
  staleTimeMs: 1000 * 60 * 60,
  groups: [
    {
      name: "static",
      source: {
        type: "static",
        urls: [
          "https://myapp.com",
          "https://myapp.com/about",
          "https://myapp.com/contact",
        ],
      },
    },
    {
      name: "cities",
      source: {
        type: "graphqlPaginated",
        query: `query Cities($page: Int!, $pageSize: Int!) {
          cities(page: $page, pageSize: $pageSize) {
            items { slug }
            hasMore
          }
        }`,
        pageSize: 1000,
        buildVariables: (page, pageSize) => ({ page, pageSize }),
        mapPage: (data: any) => ({
          urls: data.cities.items.map(
            (c: any) => `https://myapp.com/cidade/${c.slug}`
          ),
          hasMore: data.cities.hasMore,
        }),
      },
    },
  ],
  graphqlUrl: process.env.GRAPHQL_URL,
};
```

Then trigger generation in a page:

```tsx
import { seoShellApp } from "~/lib/seoShell";
import { sitemapConfig } from "~/lib/sitemapConfig";

export const getServerSideProps = seoShellApp.withSeoShell(
  async () => ({ props: {} }),
  {
    ensureSitemaps: true,
    sitemapConfig,
  }
);

export default function HomePage() {
  return null;
}
```

### Sitemap Source Types

| Type               | Description                          |
| ------------------ | ------------------------------------ |
| `static`           | Fixed list of URLs                   |
| `jsonFile`         | Read URLs from a JSON file           |
| `graphql`          | Single GraphQL query                 |
| `graphqlPaginated` | Paginated GraphQL queries            |
| `asyncFetcher`     | Custom async function returning URLs |
| `composite`        | Combine multiple sources             |

### Automatic Fallback (Error Handling)

If sitemap providers fail, SEO Shell automatically:

1. **Logs the error** to the server console
2. **Generates a fallback sitemap** with at least the homepage URL
3. **Creates an error sitemap** (`__errors.xml`) listing which providers failed
4. **Always writes `sitemap.xml`** so your site never returns 404 for sitemaps

This ensures Google and other crawlers always receive a valid sitemap, even during partial failures.

---

## Real-World Example

Complete example from a production app with GraphQL, sitemaps, and full SEO:

### `pages/profissional/[slug].tsx`

```tsx
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import {
  buildBreadcrumbListJsonLd,
  buildLocalBusinessJsonLd,
} from "@seo-shell/seo-shell";
import type { SeoHeadProps } from "@seo-shell/seo-shell";
import { seoShellApp } from "~/lib/seoShell";
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

export const getServerSideProps = seoShellApp.withSeoShell(
  async ({ params, req }: GetServerSidePropsContext) => {
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

  }
);

export default function ProfissionalSlugPage() {
  return null;
}
```

### `pages/index.tsx` (with sitemap generation)

```tsx
import { seoShellApp } from "~/lib/seoShell";
import { sitemapConfig } from "~/lib/sitemapConfig";

export const getServerSideProps = seoShellApp.withSeoShell(
  async () => ({ props: {} }),
  {
    ensureSitemaps: true,
    sitemapConfig,
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
import { SeoShellProvider } from "@seo-shell/seo-shell";

export default function App({ Component, pageProps }: AppProps) {
  const shell = pageProps.__seoShell;

  if (!shell) {
    return <Component {...pageProps} />;
  }

  return (
    <SeoShellProvider
      assets={shell.assets}
      noIndex={shell.noIndex}
      seo={{ ...shell.defaultSeo, ...pageProps.seo }}
    >
      <Component {...pageProps} />
    </SeoShellProvider>
  );
}
```

---

## API Reference

### `createSeoShellApp(config)`

Creates a configured SEO Shell app with pre-bound methods.

```ts
const seoShellApp = createSeoShellApp({
  cdn: {
    indexUrl: string, // URL to your SPA's index.html
    baseUrl: string, // Base URL for relative assets
    version: string, // Version folder (e.g., "v1.2.3")
  },
  defaults: {
    defaultNoIndex: boolean, // Default noindex behavior (default: true)
  },
  getDefaultSeo: (ctx) => SeoHeadProps, // Custom default SEO function
});

// Returns:
// {
//   config: SeoShellConfig,
//   getDefaultSeo: (ctx) => SeoHeadProps,
//   withSeoShell: (handler, options?) => GetServerSideProps,
// }
```

### `seoShellApp.withSeoShell(handler, options?)`

Wraps `getServerSideProps` to inject SEO data. No config needed per page.

```ts
export const getServerSideProps = seoShellApp.withSeoShell(
  async (ctx) => ({ props: { seo: { title: "Page" } } }),
  {
    ensureSitemaps: boolean,
    sitemapConfig: EnsureSitemapsConfig,
    getDefaultSeo: (ctx) => SeoHeadProps, // Override default SEO for this page
  }
);
```

### `sendEvent(name, payload)`

Send data from Next.js to your SPA.

### `watchEvent(name, callback)`

Listen for events in your SPA. Returns an unsubscribe function.

### `createEventBridge()`

Queue events server-side to be sent when the page loads.

### `detectDistDirectory(options?)`

Detects the dist directory for your SPA build.

```ts
detectDistDirectory({
  projectPath: string, // Root path of your project (default: cwd)
  customDistPath: string, // Custom dist path (skips auto-detection)
  expectHashedAssets: boolean, // Warn if hash expectation doesn't match
});
// Returns: DistDetectorResult | null
// {
//   distPath: string,
//   framework: FrameworkType,
//   indexPath: string,
//   hasHashedAssets: boolean
// }
```

### `getDistPath(options?)`

Returns the dist path or throws if not found.

### `getSupportedFrameworks()`

Returns list of supported framework types.

### `writeWebAssetsManifestFromBuild(options)`

Generates and writes a web assets manifest from your build.

```ts
writeWebAssetsManifestFromBuild({
  projectPath: string,
  customDistPath: string,
  expectHashedAssets: boolean,
  outputDir: string, // Where to write manifest (default: distPath)
  manifestFileName: string, // Manifest filename (default: "web-assets.json")
  indexFileName: string, // Index file to parse (default: "index.html")
});
```

---

## License

MIT

---

## Português

**Use seu framework SPA favorito. Ganhe SEO nível Next.js.**

Para quem já tem uma SPA (Expo, Vite, CRA, etc.) e quer ser encontrado no Google sem reescrever o app inteiro.

Testado com: Expo Web, Vite (React/Angular). Deve funcionar com a maioria dos bundlers modernos (CRA, Parcel, Webpack, etc.).

Sua SPA pode ser Angular, Vue, Svelte, React ou qualquer coisa que gere arquivos estáticos. O SEO Shell não exige que sua SPA use Next.js.

Eu fiz isso com o intuito principal de **atribuir SEO SSR para o Expo Web**, mantendo a aplicação como SPA e usando o Next apenas como camada de SEO/SSR.

### A ideia principal

Essa lib faz o Next.js funcionar como uma **casca (shell)** em cima da sua aplicação.

Você não precisa reescrever sua aplicação em Next.js.

Você só precisa:

- Hospedar o Next.js (como app SSR)
- Apontar ele para sua aplicação (SPA) hospedada como arquivos estáticos (CDN / storage)
- Configurar o SEO como desejar (title, meta, OG, JSON-LD, canonical, sitemap etc.)

O Next.js intercepta as requisições, busca o `index.html` da sua SPA (no CDN), injeta SEO server-side e entrega a página já otimizada para crawlers. Para o usuário final, sua SPA roda normal.

---

## Índice (Português)

- [O Problema](#o-problema)
- [A Solução](#a-solução)
- [Como Funciona](#como-funciona)
- [O Que Roda Onde](#o-que-roda-onde)
- [Arquitetura](#arquitetura-1)
- [Requisitos](#requisitos-1)
- [Requisitos Importantes](#requisitos-importantes)
- [Instalação](#instalação)
- [Quick Start](#quick-start-1)
- [Rota Catch-All (Obrigatória)](#rota-catch-all-obrigatória)
- [Comunicação em Duas Vias (Opcional)](#comunicação-em-duas-vias-opcional)
- [Detecção Inteligente do Dist](#detecção-inteligente-do-dist)
- [Configuração do Next.js](#configuração-do-nextjs)
- [Sitemap](#sitemap-1)
- [Exemplo Real](#exemplo-real)
- [Referência de API](#referência-de-api)

---

## O Problema

Você construiu seu app com Expo, Vite, Ionic ou Create React App. Funciona muito bem. Mas o Google não consegue enxergar direito.

As soluções tradicionais falam: "Reescreva tudo em Next.js". Só que:

- Você já tem uma SPA funcionando e reescrever leva meses
- Next.js pode ser overkill, você só quer SEO, não uma migração de framework
- Você está construindo um app mobile-first: Expo Web ou Ionic são só o “web” do seu app
- Seu time conhece React/Vue/Angular, não necessariamente Next.js

## A Solução

O SEO Shell adiciona SEO na sua SPA existente sem mudar o código dela:

- Títulos, descrições e Open Graph dinâmicos por página
- JSON-LD (dados estruturados)
- Sitemaps gerados automaticamente
- Canonical URLs para evitar conteúdo duplicado
- Zero mudanças na sua SPA
- Funciona com qualquer pasta de build/dist

```
Sua SPA (sem mudar) + SEO Shell = App amigável para o Google
```

---

## Como Funciona

1. Sua SPA continua exatamente como é
2. Você faz upload do build da sua SPA para um storage/CDN (Cloudflare R2, AWS S3 etc.)
3. Você faz deploy de um app Next.js que usa o SEO Shell
4. O Next.js intercepta as requisições, busca sua SPA do CDN, injeta tags de SEO e entrega
5. Usuários e crawlers recebem uma página já otimizada e a SPA sobe normalmente

O usuário final não percebe que existe Next.js envolvido. Sua SPA roda como sempre.

---

## O Que Roda Onde

O SEO Shell é plug-and-play, mas ajuda pensar em duas partes separadas.

- Sua SPA (Angular/Vue/React/Svelte/etc.)

  - Você mantém sua SPA como está.
  - Você builda como arquivos estáticos (sua pasta dist/build).
  - Você hospeda esses arquivos em um storage/CDN (R2/S3/etc.).
  - O SEO Shell não exige Next.js, React ou `getServerSideProps` dentro do projeto da SPA.
  - Não existe conflito com Angular/Vue etc., porque o Next só serve os arquivos gerados.

- Seu app Next.js como “host de SEO”
  - Um app Next pequeno que serve o HTML da sua SPA e injeta SEO via SSR.
  - É onde `getServerSideProps`, `pages/[...path].tsx` e `createSeoShellApp` vivem.
  - É isso que os crawlers acessam.

Em outras palavras: `getServerSideProps` não é requisito da sua SPA. Ele só existe no app Next.js wrapper.

---

## Arquitetura

Inspirado em microserviços: cada parte faz uma coisa bem.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SUA INFRAESTRUTURA                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────┐         ┌─────────────────────────────────┐   │
│   │  Storage de Arquivos     │         │      Servidor Next.js SSR       │   │
│   │   (CDN / Object Store)   │         │   (Serverless ou Servidor)      │   │
│   ├─────────────────────────┤         ├─────────────────────────────────┤   │
│   │                         │         │                                 │   │
│   │  • Cloudflare R2        │◄────────│  • Vercel (SSR)                  │   │
│   │  • AWS S3               │  fetch  │  • AWS Lambda                    │   │
│   │  • Google Cloud Storage │ index   │  • Docker container              │   │
│   │  • Qualquer host estático│ .html  │  • Qualquer servidor Node.js     │   │
│   │                         │         │                                 │   │
│   │  Guarda o build da SPA  │         │  Injeta SEO + serve a SPA        │   │
│   │  (index.html, JS, CSS)  │         │  (title, meta, JSON-LD, sitemap) │   │
│   │                         │         │                                 │   │
│   └─────────────────────────┘         └─────────────────────────────────┘   │
│              ▲                                       ▲                      │
│              │                                       │                      │
│              │         Usuário nunca acessa          │                      │
│              │         o CDN diretamente             │                      │
│              │                                       │                      │
│              └───────────────────────────────────────┘                      │
│                                 │                                           │
│                                 ▼                                           │
│                    ┌─────────────────────────┐                              │
│                    │   Navegador do Usuário  │                              │
│                    │  (recebe SEO + SPA)     │                              │
│                    └─────────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Por que funciona

1. Sua SPA é buildada normalmente e enviada para um storage/CDN (arquivos estáticos)
2. O Next.js roda como servidor SSR e intercepta as requisições
3. O Next.js busca o `index.html` no CDN, injeta SEO e serve para o usuário
4. O usuário recebe a página otimizada e a SPA sobe normalmente

---

## Requisitos

### Sua SPA (dist)

Precisa estar hospedada em um storage/CDN de arquivos estáticos (não uma plataforma que “interpreta” HTML):

- Cloudflare R2
- AWS S3
- Google Cloud Storage
- DigitalOcean Spaces
- Qualquer servidor de arquivos estáticos

### Servidor Next.js

Precisa rodar em modo SSR (não static export):

- Vercel (SSR padrão)
- AWS Lambda / Serverless
- Docker
- Qualquer servidor Node.js
- Não: `next export`

---

## Requisitos Importantes

1. Criar `pages/[...path].tsx` para não dar 404 em rotas da SPA

2. Centralizar config em `lib/seoShell.ts`:

```ts
export const seoShellApp = createSeoShellApp({
  cdn: {
    indexUrl: "https://cdn.example.com/app/index.html",
    baseUrl: "https://cdn.example.com/app",
  },
  defaults: { seo: { title: "My App", description: "..." } },
});
```

3. Adicionar `SeoShellProvider` no `_app.tsx`

---

## Instalação

```bash
npm i @seo-shell/seo-shell@next
```

## Quick Start

Tudo nessa seção é implementado no seu app Next.js “host de SEO” (não no projeto da sua SPA).

### 1. Configure o shell (uma vez)

```ts
import { createSeoShellApp } from "@seo-shell/seo-shell/server";

export const seoShellApp = createSeoShellApp({
  cdn: {
    indexUrl: "https://cdn.example.com/app/index.html",
    baseUrl: "https://cdn.example.com/app",
  },
});
```

### 2. Envolva suas páginas

```tsx
import { seoShellApp } from "../lib/seoShell";

export const getServerSideProps = seoShellApp.withSeoShell(async () => ({
  props: {
    seo: {
      title: "Home",
      description: "Welcome to my app",
    },
  },
}));

export default function Page() {
  return null;
}
```

### 3. Adicione o provider no `_app.tsx`

```tsx
import { SeoShellProvider } from "@seo-shell/seo-shell";

export default function App({ Component, pageProps }) {
  const shell = pageProps.__seoShell;
  if (!shell) return <Component {...pageProps} />;

  return (
    <SeoShellProvider
      assets={shell.assets}
      noIndex={shell.noIndex}
      seo={{ ...shell.defaultSeo, ...pageProps.seo }}
    >
      <Component {...pageProps} />
    </SeoShellProvider>
  );
}
```

---

## Rota Catch-All (Obrigatória)

Esse arquivo é obrigatório. Sem ele, qualquer rota que não exista no Next vai retornar 404.

Crie `pages/[...path].tsx`:

```tsx
import { seoShellApp } from "~/lib/seoShell";

export const getServerSideProps = seoShellApp.withSeoShell(async () => {
  return { props: {} };
});

export default function SpaFallbackPage() {
  return null;
}
```

---

## Comunicação em Duas Vias (Opcional)

O SEO Shell inclui uma camada de eventos baseada em `CustomEvent` para comunicar:

- Next.js -> SPA (reaproveitar dados buscados no SSR)
- SPA -> Next.js (escutar eventos no client do Next)

Também emite eventos de ciclo de vida:

- `seo-shell:ready`
- `seo-shell:hydrated`

### Instale `@seo-shell/events` no seu projeto SPA

```bash
npm i @seo-shell/events@next
```

### Next.js -> SPA

No Next.js, colete eventos no SSR:

```tsx
import { createEventBridge } from "@seo-shell/seo-shell/server";
import { seoShellApp } from "~/lib/seoShell";

export const getServerSideProps = seoShellApp.withSeoShell(async () => {
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
});
```

Depois dispare os eventos no client (por exemplo no `_app.tsx`):

```tsx
import { sendEvent } from "@seo-shell/seo-shell";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const events = pageProps.__events ?? [];
    events.forEach((e) => sendEvent(e.name, e.payload));
  }, [pageProps.__events]);

  return <Component {...pageProps} />;
}
```

Na sua SPA, escute:

```ts
import { watchEvent } from "@seo-shell/events";

watchEvent("professional", (professional) => {
  console.log("Received:", professional);
});
```

### SPA -> Next.js

Na sua SPA, envie eventos:

```ts
import { sendEvent } from "@seo-shell/events";

sendEvent("spa:navigation", { path: "/profile" });
```

No Next.js (client-side), escute:

```ts
import { watchEvent } from "@seo-shell/seo-shell";
import { useEffect } from "react";

export const useSpaNavigationEvents = () => {
  useEffect(() => {
    return watchEvent("spa:navigation", (payload) => {
      console.log("SPA navigation:", payload);
    });
  }, []);
};
```

---

## Detecção Inteligente do Dist

O SEO Shell tenta detectar automaticamente a pasta de build da sua SPA.

### Frameworks suportados

- Expo
- Vite
- Create React App
- Next.js
- Nuxt
- Angular
- Vue CLI
- Parcel
- Remix
- Astro
- Gatsby
- SvelteKit
- Webpack/Rollup/esbuild

### Auto-detecção

```ts
import { detectDistDirectory } from "@seo-shell/seo-shell/server";

const result = detectDistDirectory();

console.log(result);
```

### Dist customizado

```ts
import { detectDistDirectory } from "@seo-shell/seo-shell/server";

const result = detectDistDirectory({
  customDistPath: "./my-custom-output",
});
```

---

## Configuração do Next.js

### `next.config.js`

```js
import { withSeoShellSitemap } from "@seo-shell/seo-shell/server";

const nextConfig = withSeoShellSitemap(
  {
    reactStrictMode: true,
    transpilePackages: ["@seo-shell/seo-shell"],
  },
  {
    publicSitemapSubdir: "/seo",
    sitemapsRouteBasePath: "/sitemaps",
    sitemapIndexRoute: "/sitemap.xml",
    sitemapIndexPath: "/seo/sitemap.xml",
    groups: ["cities", "professionals"],
  }
);

export default nextConfig;
```

### `pages/_document.tsx`

```tsx
import { createSeoShellDocument } from "@seo-shell/seo-shell";

export default createSeoShellDocument({
  lang: "pt-BR",
});
```

---

## Sitemap

O SEO Shell inclui um sistema completo de geração de sitemaps com fallback automático.

### Opção 1: plugin no `next.config.js` (recomendado)

O plugin configura automaticamente:

- Rewrites para rotas paginadas `/sitemaps/{group}/:page.xml`
- Rewrite do sitemap index quando `sitemapIndexRoute !== sitemapIndexPath`
- Headers `Content-Type` e `Cache-Control` para sitemap(s)
- Headers para `robots.txt`

### Opção 2: configuração manual

Se preferir, você pode configurar rewrites manualmente no Next:

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

### Gerando sitemaps

Use `ensureSitemaps` no `getServerSideProps` para gerar sob demanda:

```ts
import type { EnsureSitemapsConfig } from "@seo-shell/seo-shell/server";

export const sitemapConfig: EnsureSitemapsConfig = {
  baseUrl: "https://myapp.com",
  outputDir: "./public",
  sitemapSubdir: "seo",
  sitemapIndexPath: "sitemap.xml",
  staleTimeMs: 1000 * 60 * 60,
  groups: [
    {
      name: "static",
      source: {
        type: "static",
        urls: [
          "https://myapp.com",
          "https://myapp.com/about",
          "https://myapp.com/contact",
        ],
      },
    },
  ],
  graphqlUrl: process.env.GRAPHQL_URL,
};
```

### Tipos de source

| Tipo               | Descrição                                 |
| ------------------ | ----------------------------------------- |
| `static`           | Lista fixa de URLs                        |
| `jsonFile`         | Lê URLs de um arquivo JSON                |
| `graphql`          | Uma query GraphQL única                   |
| `graphqlPaginated` | Queries GraphQL paginadas                 |
| `asyncFetcher`     | Função async customizada que retorna URLs |
| `composite`        | Combina múltiplas fontes                  |

### Fallback automático (erro)

Se algum provider falhar, o SEO Shell:

1. Loga o erro
2. Gera um sitemap fallback com pelo menos a home
3. Cria um sitemap de erros (`__errors.xml`) listando quais grupos falharam
4. Sempre escreve `sitemap.xml` para não retornar 404

---

## Referência de API

As mesmas APIs descritas na seção em inglês se aplicam aqui:

- `createSeoShellApp(config)`
- `seoShellApp.withSeoShell(handler, options?)`
- `sendEvent(name, payload)`
- `watchEvent(name, callback)`
- `createEventBridge()`
- `detectDistDirectory(options?)`
- `getDistPath(options?)`
- `getSupportedFrameworks()`
- `writeWebAssetsManifestFromBuild(options)`

### `detectDistDirectory(options?)`

Detecta a pasta de build/dist do seu projeto SPA.

```ts
detectDistDirectory({
  projectPath: string,
  customDistPath: string,
  expectHashedAssets: boolean,
});
```

Retorna `DistDetectorResult | null`:

```ts
// {
//   distPath: string,
//   framework: FrameworkType,
//   indexPath: string,
//   hasHashedAssets: boolean
// }
```

### `getDistPath(options?)`

Retorna o dist path detectado ou lança erro se não encontrar.

### `getSupportedFrameworks()`

Retorna a lista de frameworks suportados pelo detector.

### `writeWebAssetsManifestFromBuild(options)`

Gera e escreve um manifesto de assets web a partir do seu build.

```ts
writeWebAssetsManifestFromBuild({
  projectPath: string,
  customDistPath: string,
  expectHashedAssets: boolean,
  outputDir: string,
  manifestFileName: string,
  indexFileName: string,
});
```

---

## Exemplo Real

O fluxo é o mesmo descrito no inglês: usar o Next como camada SSR/SEO, servindo a SPA sem alterar o projeto dela.

### `pages/index.tsx` (com geração de sitemap)

```tsx
import { seoShellApp } from "~/lib/seoShell";
import { sitemapConfig } from "~/lib/sitemapConfig";

export const getServerSideProps = seoShellApp.withSeoShell(
  async () => ({ props: {} }),
  {
    ensureSitemaps: true,
    sitemapConfig,
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
import { SeoShellProvider } from "@seo-shell/seo-shell";

export default function App({ Component, pageProps }: AppProps) {
  const shell = pageProps.__seoShell;

  if (!shell) {
    return <Component {...pageProps} />;
  }

  return (
    <SeoShellProvider
      assets={shell.assets}
      noIndex={shell.noIndex}
      seo={{ ...shell.defaultSeo, ...pageProps.seo }}
    >
      <Component {...pageProps} />
    </SeoShellProvider>
  );
}
```
