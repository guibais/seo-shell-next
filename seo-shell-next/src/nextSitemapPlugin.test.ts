import { describe, it, expect } from "vitest";
import { withSeoShellSitemap } from "./nextSitemapPlugin";
import type { NextConfigLike } from "./nextSitemapPlugin";

describe("toArrayRewrites helper", () => {
  it("converts object rewrites to array", async () => {
    const config: NextConfigLike = {
      rewrites: async () => ({
        beforeFiles: [{ source: "/before", destination: "/dest" }],
        afterFiles: [{ source: "/after", destination: "/dest" }],
        fallback: [{ source: "/fallback", destination: "/dest" }],
      }),
    };
    const result = withSeoShellSitemap(config);
    const rewrites = await result.rewrites!();
    expect(typeof rewrites === "object" && !Array.isArray(rewrites)).toBe(true);
  });
});

describe("withSeoShellSitemap", () => {
  it("adds rewrites function", async () => {
    const config: NextConfigLike = {};
    const result = withSeoShellSitemap(config);

    expect(result.rewrites).toBeDefined();
    const rewrites = await result.rewrites!();
    expect(Array.isArray(rewrites) || typeof rewrites === "object").toBe(true);
  });

  it("adds headers function", async () => {
    const config: NextConfigLike = {};
    const result = withSeoShellSitemap(config);

    expect(result.headers).toBeDefined();
    const headers = await result.headers!();
    expect(Array.isArray(headers)).toBe(true);
  });

  it("merges with existing rewrites array", async () => {
    const config: NextConfigLike = {
      rewrites: async () => [{ source: "/old", destination: "/new" }],
    };
    const result = withSeoShellSitemap(config);

    const rewrites = await result.rewrites!();
    expect(Array.isArray(rewrites)).toBe(true);
    expect(
      (rewrites as { source: string }[]).some((r) => r.source === "/old")
    ).toBe(true);
  });

  it("merges with existing rewrites object", async () => {
    const config: NextConfigLike = {
      rewrites: async () => ({
        beforeFiles: [{ source: "/before", destination: "/dest" }],
        afterFiles: [{ source: "/after", destination: "/dest" }],
        fallback: [{ source: "/fallback", destination: "/dest" }],
      }),
    };
    const result = withSeoShellSitemap(config);

    const rewrites = await result.rewrites!();
    expect(typeof rewrites === "object" && !Array.isArray(rewrites)).toBe(true);
    const obj = rewrites as {
      beforeFiles: unknown[];
      afterFiles: unknown[];
      fallback: unknown[];
    };
    expect(obj.beforeFiles.length).toBeGreaterThan(0);
    expect(obj.afterFiles.length).toBeGreaterThan(0);
    expect(obj.fallback.length).toBeGreaterThan(0);
  });

  it("merges with existing headers", async () => {
    const config: NextConfigLike = {
      headers: async () => [
        { source: "/custom", headers: [{ key: "X-Custom", value: "test" }] },
      ],
    };
    const result = withSeoShellSitemap(config);

    const headers = await result.headers!();
    expect(headers.some((h) => h.source === "/custom")).toBe(true);
  });

  it("adds sitemap index rewrite when route differs from path", async () => {
    const config: NextConfigLike = {};
    const result = withSeoShellSitemap(config, {
      sitemapIndexRoute: "/sitemap.xml",
      sitemapIndexPath: "/seo/sitemap.xml",
    });

    const rewrites = await result.rewrites!();
    const arr = Array.isArray(rewrites) ? rewrites : rewrites.beforeFiles || [];
    expect(arr.some((r) => r.source === "/sitemap.xml")).toBe(true);
  });

  it("does not add sitemap index rewrite when route equals path", async () => {
    const config: NextConfigLike = {};
    const result = withSeoShellSitemap(config, {
      sitemapIndexRoute: "/sitemap.xml",
      sitemapIndexPath: "/sitemap.xml",
    });

    const rewrites = await result.rewrites!();
    const arr = Array.isArray(rewrites) ? rewrites : rewrites.beforeFiles || [];
    expect(
      arr.some(
        (r) => r.source === "/sitemap.xml" && r.destination === "/sitemap.xml"
      )
    ).toBe(false);
  });

  it("adds group rewrites", async () => {
    const config: NextConfigLike = {};
    const result = withSeoShellSitemap(config, {
      groups: ["pages", "products"],
    });

    const rewrites = await result.rewrites!();
    const arr = Array.isArray(rewrites) ? rewrites : rewrites.beforeFiles || [];
    expect(arr.some((r) => r.source.includes("pages"))).toBe(true);
    expect(arr.some((r) => r.source.includes("products"))).toBe(true);
  });

  it("adds sitemap headers when enabled", async () => {
    const config: NextConfigLike = {};
    const result = withSeoShellSitemap(config, {
      includeSitemapHeaders: true,
    });

    const headers = await result.headers!();
    expect(
      headers.some((h) =>
        h.headers.some((hh) => hh.value === "application/xml")
      )
    ).toBe(true);
  });

  it("skips sitemap headers when disabled", async () => {
    const config: NextConfigLike = {};
    const result = withSeoShellSitemap(config, {
      includeSitemapHeaders: false,
    });

    const headers = await result.headers!();
    const sitemapHeaders = headers.filter((h) =>
      h.headers.some((hh) => hh.value === "application/xml")
    );
    expect(sitemapHeaders.length).toBe(0);
  });

  it("adds robots headers when enabled", async () => {
    const config: NextConfigLike = {};
    const result = withSeoShellSitemap(config, {
      includeRobotsHeaders: true,
    });

    const headers = await result.headers!();
    expect(headers.some((h) => h.source === "/robots.txt")).toBe(true);
  });

  it("skips robots headers when disabled", async () => {
    const config: NextConfigLike = {};
    const result = withSeoShellSitemap(config, {
      includeRobotsHeaders: false,
    });

    const headers = await result.headers!();
    expect(headers.some((h) => h.source === "/robots.txt")).toBe(false);
  });

  it("uses custom publicSitemapSubdir", async () => {
    const config: NextConfigLike = {};
    const result = withSeoShellSitemap(config, {
      publicSitemapSubdir: "/custom-seo",
      groups: ["test"],
    });

    const rewrites = await result.rewrites!();
    const arr = Array.isArray(rewrites) ? rewrites : rewrites.beforeFiles || [];
    expect(arr.some((r) => r.destination.includes("custom-seo"))).toBe(true);
  });

  it("uses custom sitemapsRouteBasePath", async () => {
    const config: NextConfigLike = {};
    const result = withSeoShellSitemap(config, {
      sitemapsRouteBasePath: "/custom-sitemaps",
      groups: ["test"],
    });

    const rewrites = await result.rewrites!();
    const arr = Array.isArray(rewrites) ? rewrites : rewrites.beforeFiles || [];
    expect(arr.some((r) => r.source.includes("custom-sitemaps"))).toBe(true);
  });

  it("preserves other config properties", () => {
    const config: NextConfigLike = {
      reactStrictMode: true,
      images: { domains: ["example.com"] },
    };
    const result = withSeoShellSitemap(config);

    expect(result.reactStrictMode).toBe(true);
    expect(result.images).toEqual({ domains: ["example.com"] });
  });
});
