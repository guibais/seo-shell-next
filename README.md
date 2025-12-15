# @seo-shell/seo-shell

A framework-friendly SEO + sitemap “shell” for React/Next.js applications that render (or bootstrap) a client app (Expo Web, Vite, etc.) while keeping SEO-critical metadata and sitemaps under server control.

This package provides:

- A Next.js `getServerSideProps` wrapper (`withSeoShell`) that injects SEO Shell data into `pageProps`.
- A React provider (`SeoShellProvider`) that renders your app bootstrap with the resolved web assets + SEO.
- A sitemap generator with a **default limit of 30,000 URLs per sitemap file** (overridable).
- Utilities and a CLI to generate a `web-assets.json` manifest from a static build output (Expo Web / Vite).

## Concepts

### The “shell” model

Your Next.js pages typically render nothing (or a minimal layout). The “shell” is responsible for:

- Resolving JS/CSS/favicon assets (`web-assets.json` or a CDN manifest URL)
- Injecting SEO metadata (title/description/canonical/OpenGraph/JSON-LD)
- Ensuring sitemaps exist (optionally)

This is meant to keep application code minimal: pages only provide page-specific data and optional SEO overrides.

## Package name

This repository currently contains the package as `@severinos/seo-shell-next`.

The intended published name is `@seo-shell/seo-shell`.

All examples below use `@seo-shell/seo-shell` to describe the final public API.

## Installation

```bash
pnpm add @seo-shell/seo-shell
```

## Quick start (Next.js)

### 1) Configure `web-assets.json`

You have two common approaches:

- **CDN-first (recommended)**
  - Host your built web assets somewhere (CDN/object storage).
  - Point the server to the manifest URL via env.

- **Local manifest**
  - Place `web-assets.json` into `public/web-assets.json` of the Next.js server.

This lib will resolve assets in this order:

1. `APP_CDN_MANIFEST_URL` (or `APP_CDN_BASE_URL` + `APP_CDN_VERSION` + `APP_CDN_MANIFEST_FILE`)
2. `public/web-assets.json`
3. `EXPO_WEB_CSS_HREFS` / `EXPO_WEB_JS_SRCS` / `EXPO_WEB_FAVICON_HREF`

### 2) Add the provider in `_app.tsx`

```tsx
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

### 3) Wrap `getServerSideProps`

```tsx
import type { GetServerSideProps } from "next";
import type { SeoHeadProps } from "@seo-shell/seo-shell";
import {
  withSeoShell,
  getSeoShellConfigFromEnv,
  getDefaultSeoFromEnv,
} from "@seo-shell/seo-shell/server";

type PageProps = {
  seo?: SeoHeadProps;
};

const handler: GetServerSideProps<PageProps> = async () => {
  return {
    props: {
      seo: {
        title: "Home",
        description: "My site",
      },
    },
  };
};

export const getServerSideProps = withSeoShell(handler, {
  seoShellConfig: getSeoShellConfigFromEnv(),
  getDefaultSeo: getDefaultSeoFromEnv,
});

export default function Page() {
  return null;
}
```

## Advanced usage

### Ensuring sitemaps from SSR

If you want a page request to also ensure sitemaps exist (cached via `staleTimeMs`), pass:

```ts
import {
  withSeoShell,
  getSeoShellConfigFromEnv,
  getDefaultSeoFromEnv,
} from "@seo-shell/seo-shell/server";
import { sitemapConfig } from "./sitemapConfig";

export const getServerSideProps = withSeoShell(async () => ({ props: {} }), {
  seoShellConfig: getSeoShellConfigFromEnv(),
  getDefaultSeo: getDefaultSeoFromEnv,
  options: {
    ensureSitemaps: true,
    sitemapConfig,
  },
});
```

### Sitemap page size (30,000 default)

The generator defaults to **30,000 URLs per sitemap file**.

Override globally:

```ts
generateSitemaps({
  baseUrl,
  outputDir,
  defaultPageSize: 10000,
  sitemapGroups,
});
```

Override per group:

```ts
{
  name: "professionals",
  pageSize: 2000,
  provider: async () => ({ name: "professionals", urls: [...] }),
}
```

## CLI: generating `web-assets.json`

This repository exposes a CLI that parses a built `index.html` and writes a `web-assets.json` manifest.

In this monorepo right now, the binary name is:

```bash
seo-shell-next-web-assets
```

### Expo Web example

In your Expo project:

```json
{
  "scripts": {
    "build:web:export": "expo export --platform web",
    "build:web": "seo-shell-next-web-assets --build \"pnpm build:web:export\" --dist ./dist --public ./public"
  }
}
```

- `--build` runs the build command.
- `--dist` points to the build output directory.
- `--public` points to the directory where `web-assets.json` should be written.

### Vite example

```json
{
  "scripts": {
    "build": "vite build",
    "build:web": "seo-shell-next-web-assets --build \"pnpm build\" --dist ./dist --public ./public"
  }
}
```

Note: the CLI only generates the manifest; it does not change your bundler configuration.

## Next.js configuration

### transpilePackages

If your Next app consumes this package as source in a monorepo, ensure:

```js
transpilePackages: ["@seo-shell/seo-shell"],
```

### Sitemap rewrites

If your sitemaps are written to `public/seo/*.xml` but you want a nicer public structure:

```js
async rewrites() {
  return [
    { source: "/sitemaps/cities/:page.xml", destination: "/seo/cities-:page.xml" },
    { source: "/sitemaps/city-categories/:page.xml", destination: "/seo/city-categories-:page.xml" },
    { source: "/sitemaps/professionals/:page.xml", destination: "/seo/professionals-:page.xml" },
  ];
}
```

## Do you still need a “sync dist into Next public” script?

Usually **no**.

You only need a script that copies a built client app into the Next server’s `public/` if:

- You want Next to _serve_ the built client assets from its own filesystem, AND
- Those assets are not hosted on a CDN / separate static host.

If you host assets separately (recommended), configure one of:

- `APP_CDN_MANIFEST_URL`
- or `APP_CDN_BASE_URL` + `APP_CDN_VERSION` (+ optional `APP_CDN_MANIFEST_FILE`)

Then the Next server does not need to copy `dist/` at all.

If you are currently using a `sync-expo-dist` script, it is typically a sign that your Next server is acting as the static host for the Expo/Vite build output. In that scenario the copy step is still required, but it should be treated as an app-level deployment concern.

## Environment variables

- `APP_CDN_BASE_URL`
- `APP_CDN_VERSION`
- `APP_CDN_MANIFEST_URL`
- `APP_CDN_MANIFEST_FILE`
- `SEO_SHELL_DEFAULT_NO_INDEX`
- `SEO_SHELL_DEFAULT_TITLE`
- `SEO_SHELL_DEFAULT_DESCRIPTION`

## License

MIT
