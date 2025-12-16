# Examples

These are example files simulating a Next.js project using `@seo-shell/seo-shell`.

> **Note:** These are not complete Next.js projects. They are simulations of key files to demonstrate how to use the library.

## Examples

| Example                                | Description                        |
| -------------------------------------- | ---------------------------------- |
| [01-basic](./01-basic)                 | Minimal setup with just SEO tags   |
| [02-with-seo-data](./02-with-seo-data) | Dynamic SEO with data fetching     |
| [03-with-events](./03-with-events)     | Passing data to SPA via Web Events |
| [04-with-sitemap](./04-with-sitemap)   | Full setup with sitemap generation |

## File Structure

Each example contains simulated Next.js files:

```
example/
├── lib/
│   └── seoShell.ts       # SEO Shell configuration
├── pages/
│   ├── _app.tsx          # App wrapper with SeoShellProvider
│   └── index.tsx         # Page with getServerSideProps
└── (spa)/
    └── App.tsx           # Example SPA code (for events examples)
```

## How to Use

1. Copy the relevant files to your Next.js project
2. Adjust the `indexUrl` in `lib/seoShell.ts` to point to your CDN
3. Deploy your SPA to a static file storage (R2, S3, etc.)
4. Deploy your Next.js project with SSR enabled
