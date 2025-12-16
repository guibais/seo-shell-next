import { describe, it, expect } from "vitest";
import { buildRobotsTxt } from "./robots";

describe("buildRobotsTxt", () => {
  it("builds default robots.txt with no rules", () => {
    const result = buildRobotsTxt({});

    expect(result).toBe("User-agent: *\nAllow: /\n");
  });

  it("builds robots.txt with sitemap url", () => {
    const result = buildRobotsTxt({
      sitemapUrl: "https://example.com/sitemap.xml",
    });

    expect(result).toContain("Sitemap: https://example.com/sitemap.xml");
  });

  it("builds robots.txt with custom rules", () => {
    const result = buildRobotsTxt({
      rules: [
        {
          userAgent: "Googlebot",
          allow: ["/public"],
          disallow: ["/private"],
        },
      ],
    });

    expect(result).toContain("User-agent: Googlebot");
    expect(result).toContain("Allow: /public");
    expect(result).toContain("Disallow: /private");
  });

  it("builds robots.txt with multiple rules", () => {
    const result = buildRobotsTxt({
      rules: [
        { userAgent: "Googlebot", allow: ["/"] },
        { userAgent: "Bingbot", disallow: ["/admin"] },
      ],
    });

    expect(result).toContain("User-agent: Googlebot");
    expect(result).toContain("User-agent: Bingbot");
    expect(result).toContain("Allow: /");
    expect(result).toContain("Disallow: /admin");
  });

  it("builds robots.txt with additional sitemaps", () => {
    const result = buildRobotsTxt({
      additionalSitemaps: [
        "https://example.com/sitemap1.xml",
        "https://example.com/sitemap2.xml",
      ],
    });

    expect(result).toContain("Sitemap: https://example.com/sitemap1.xml");
    expect(result).toContain("Sitemap: https://example.com/sitemap2.xml");
  });

  it("builds robots.txt with custom content", () => {
    const result = buildRobotsTxt({
      custom: "Crawl-delay: 10",
    });

    expect(result).toContain("Crawl-delay: 10");
  });

  it("builds robots.txt with all options", () => {
    const result = buildRobotsTxt({
      rules: [{ userAgent: "*", allow: ["/"] }],
      sitemapUrl: "https://example.com/sitemap.xml",
      additionalSitemaps: ["https://example.com/sitemap2.xml"],
      custom: "Crawl-delay: 5",
    });

    expect(result).toContain("User-agent: *");
    expect(result).toContain("Allow: /");
    expect(result).toContain("Sitemap: https://example.com/sitemap.xml");
    expect(result).toContain("Sitemap: https://example.com/sitemap2.xml");
    expect(result).toContain("Crawl-delay: 5");
  });

  it("builds robots.txt with multiple allow paths", () => {
    const result = buildRobotsTxt({
      rules: [
        {
          userAgent: "*",
          allow: ["/public", "/api", "/docs"],
        },
      ],
    });

    expect(result).toContain("Allow: /public");
    expect(result).toContain("Allow: /api");
    expect(result).toContain("Allow: /docs");
  });

  it("builds robots.txt with multiple disallow paths", () => {
    const result = buildRobotsTxt({
      rules: [
        {
          userAgent: "*",
          disallow: ["/admin", "/private", "/secret"],
        },
      ],
    });

    expect(result).toContain("Disallow: /admin");
    expect(result).toContain("Disallow: /private");
    expect(result).toContain("Disallow: /secret");
  });

  it("ends with newline", () => {
    const result = buildRobotsTxt({});
    expect(result.endsWith("\n")).toBe(true);
  });
});
