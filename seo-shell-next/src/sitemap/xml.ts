import type { SitemapEntry, SitemapUrl } from "./types";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const normalizeEntry = (entry: SitemapEntry): SitemapUrl => {
  if (typeof entry === "string") {
    return { loc: entry };
  }
  return entry;
};

const urlToXml = (entry: SitemapEntry) => {
  const url = normalizeEntry(entry);
  const parts = [`<loc>${escapeXml(url.loc)}</loc>`];

  if (url.lastmod) {
    parts.push(`<lastmod>${escapeXml(url.lastmod)}</lastmod>`);
  }
  if (url.changefreq) {
    parts.push(`<changefreq>${escapeXml(url.changefreq)}</changefreq>`);
  }
  if (url.priority !== undefined) {
    parts.push(`<priority>${url.priority.toFixed(1)}</priority>`);
  }

  return `<url>${parts.join("")}</url>`;
};

export const buildUrlSetXml = (urls: SitemapEntry[]) => {
  const body = urls.map(urlToXml).join("");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
  );
};

export const buildSitemapIndexXml = (sitemapUrls: string[]) => {
  const body = sitemapUrls
    .map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`)
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`
  );
};
