import { describe, it, expect } from "vitest";
import { buildUrlSetXml, buildSitemapIndexXml } from "./xml";

describe("buildUrlSetXml", () => {
  it("builds xml for string urls", () => {
    const result = buildUrlSetXml([
      "https://example.com",
      "https://example.com/page",
    ]);

    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    );
    expect(result).toContain("<loc>https://example.com</loc>");
    expect(result).toContain("<loc>https://example.com/page</loc>");
    expect(result).toContain("</urlset>");
  });

  it("builds xml for url objects with lastmod", () => {
    const result = buildUrlSetXml([
      { loc: "https://example.com", lastmod: "2024-01-01" },
    ]);

    expect(result).toContain("<loc>https://example.com</loc>");
    expect(result).toContain("<lastmod>2024-01-01</lastmod>");
  });

  it("builds xml for url objects with changefreq", () => {
    const result = buildUrlSetXml([
      { loc: "https://example.com", changefreq: "daily" },
    ]);

    expect(result).toContain("<changefreq>daily</changefreq>");
  });

  it("builds xml for url objects with priority", () => {
    const result = buildUrlSetXml([
      { loc: "https://example.com", priority: 0.8 },
    ]);

    expect(result).toContain("<priority>0.8</priority>");
  });

  it("builds xml for url objects with all fields", () => {
    const result = buildUrlSetXml([
      {
        loc: "https://example.com",
        lastmod: "2024-01-01",
        changefreq: "weekly",
        priority: 1.0,
      },
    ]);

    expect(result).toContain("<loc>https://example.com</loc>");
    expect(result).toContain("<lastmod>2024-01-01</lastmod>");
    expect(result).toContain("<changefreq>weekly</changefreq>");
    expect(result).toContain("<priority>1.0</priority>");
  });

  it("escapes special xml characters", () => {
    const result = buildUrlSetXml(["https://example.com?foo=1&bar=2"]);

    expect(result).toContain("<loc>https://example.com?foo=1&amp;bar=2</loc>");
  });

  it("escapes all special characters", () => {
    const result = buildUrlSetXml(["https://example.com/<test>\"'value"]);

    expect(result).toContain("&lt;test&gt;");
    expect(result).toContain("&quot;");
    expect(result).toContain("&apos;");
  });

  it("builds empty urlset for empty array", () => {
    const result = buildUrlSetXml([]);

    expect(result).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
    );
  });
});

describe("buildSitemapIndexXml", () => {
  it("builds sitemap index xml", () => {
    const result = buildSitemapIndexXml([
      "https://example.com/sitemap1.xml",
      "https://example.com/sitemap2.xml",
    ]);

    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain(
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    );
    expect(result).toContain(
      "<sitemap><loc>https://example.com/sitemap1.xml</loc></sitemap>"
    );
    expect(result).toContain(
      "<sitemap><loc>https://example.com/sitemap2.xml</loc></sitemap>"
    );
    expect(result).toContain("</sitemapindex>");
  });

  it("escapes special characters in sitemap urls", () => {
    const result = buildSitemapIndexXml([
      "https://example.com/sitemap?v=1&t=2",
    ]);

    expect(result).toContain("https://example.com/sitemap?v=1&amp;t=2");
  });

  it("builds empty sitemapindex for empty array", () => {
    const result = buildSitemapIndexXml([]);

    expect(result).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>'
    );
  });
});
