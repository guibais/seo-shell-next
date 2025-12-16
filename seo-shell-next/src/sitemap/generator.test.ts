import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { generateSitemaps } from "./generator";

vi.mock("fs");
vi.mock("path", async () => {
  const actual = await vi.importActual<typeof path>("path");
  return {
    ...actual,
    resolve: (...args: string[]) => args.join("/"),
  };
});

const mockFs = vi.mocked(fs);

beforeEach(() => {
  vi.clearAllMocks();
  mockFs.existsSync.mockReturnValue(false);
  mockFs.mkdirSync.mockReturnValue(undefined);
  mockFs.writeFileSync.mockReturnValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateSitemaps", () => {
  it("generates sitemap for single group", async () => {
    const result = await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "pages",
          provider: () => ({
            name: "pages",
            urls: ["https://example.com/page1", "https://example.com/page2"],
          }),
        },
      ],
    });

    expect(result.sitemaps).toHaveLength(1);
    expect(result.sitemaps[0].name).toBe("pages.xml");
    expect(result.sitemaps[0].urlCount).toBe(2);
    expect(result.skipped).toBe(false);
  });

  it("generates sitemap index", async () => {
    await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "pages",
          provider: () => ({
            name: "pages",
            urls: ["https://example.com/page1"],
          }),
        },
      ],
    });

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("sitemap.xml"),
      expect.stringContaining("sitemapindex")
    );
  });

  it("generates robots.txt by default", async () => {
    const result = await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "pages",
          provider: () => ({
            name: "pages",
            urls: ["https://example.com/page1"],
          }),
        },
      ],
    });

    expect(result.robotsPath).toBe("robots.txt");
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("robots.txt"),
      expect.stringContaining("User-agent")
    );
  });

  it("skips robots.txt when robots is false", async () => {
    const result = await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "pages",
          provider: () => ({
            name: "pages",
            urls: ["https://example.com/page1"],
          }),
        },
      ],
      robots: false,
    });

    expect(result.robotsPath).toBeNull();
  });

  it("uses custom robots config", async () => {
    await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "pages",
          provider: () => ({
            name: "pages",
            urls: ["https://example.com/page1"],
          }),
        },
      ],
      robots: {
        rules: [{ userAgent: "Googlebot", allow: ["/"] }],
      },
    });

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("robots.txt"),
      expect.stringContaining("Googlebot")
    );
  });

  it("chunks large sitemaps", async () => {
    const urls = Array.from(
      { length: 5 },
      (_, i) => `https://example.com/page${i}`
    );

    const result = await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "pages",
          provider: () => ({ name: "pages", urls }),
          pageSize: 2,
        },
      ],
      defaultPageSize: 2,
    });

    expect(result.sitemaps.length).toBeGreaterThan(1);
    expect(result.sitemaps[0].name).toBe("pages-1.xml");
    expect(result.sitemaps[1].name).toBe("pages-2.xml");
  });

  it("returns true from isStale when file does not exist", async () => {
    mockFs.existsSync.mockReturnValue(false);

    const result = await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "pages",
          provider: () => ({
            name: "pages",
            urls: ["https://example.com/page1"],
          }),
        },
      ],
      staleTimeMs: 60000,
    });

    expect(result.skipped).toBe(false);
  });

  it("skips generation when not stale", async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({
      mtimeMs: Date.now() - 1000,
    } as fs.Stats);

    const result = await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "pages",
          provider: () => ({
            name: "pages",
            urls: ["https://example.com/page1"],
          }),
        },
      ],
      staleTimeMs: 60000,
    });

    expect(result.skipped).toBe(true);
    expect(result.sitemaps).toEqual([]);
  });

  it("regenerates when stale", async () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      if (String(p).includes("sitemap.xml")) return true;
      return false;
    });
    mockFs.statSync.mockReturnValue({
      mtimeMs: Date.now() - 120000,
    } as fs.Stats);

    const result = await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "pages",
          provider: () => ({
            name: "pages",
            urls: ["https://example.com/page1"],
          }),
        },
      ],
      staleTimeMs: 60000,
    });

    expect(result.skipped).toBe(false);
  });

  it("handles provider errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "failing",
          provider: () => {
            throw new Error("Provider failed");
          },
        },
      ],
    });

    expect(result.sitemaps.some((s) => s.name === "__errors.xml")).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("skips empty groups", async () => {
    const result = await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "empty",
          provider: () => ({ name: "empty", urls: [] }),
        },
      ],
    });

    expect(result.sitemaps).toHaveLength(0);
  });

  it("uses custom sitemapSubdir", async () => {
    await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "pages",
          provider: () => ({
            name: "pages",
            urls: ["https://example.com/page1"],
          }),
        },
      ],
      sitemapSubdir: "custom-seo",
    });

    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining("custom-seo"),
      expect.any(Object)
    );
  });

  it("uses custom sitemapIndexPath", async () => {
    const result = await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "pages",
          provider: () => ({
            name: "pages",
            urls: ["https://example.com/page1"],
          }),
        },
      ],
      sitemapIndexPath: "custom-sitemap.xml",
    });

    expect(result.sitemapIndexPath).toBe("custom-sitemap.xml");
  });

  it("trims trailing slashes from baseUrl", async () => {
    await generateSitemaps({
      baseUrl: "https://example.com///",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "pages",
          provider: () => ({
            name: "pages",
            urls: ["https://example.com/page1"],
          }),
        },
      ],
    });

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("https://example.com/seo/pages.xml")
    );
  });

  it("creates fallback sitemap when no urls", async () => {
    const result = await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [],
    });

    expect(result.sitemapIndexPath).toBe("sitemap.xml");
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("sitemap.xml"),
      expect.stringContaining("<urlset")
    );
  });

  it("generates fallback sitemap with provider errors when no urls", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "failing",
          provider: () => {
            throw new Error("Provider failed");
          },
        },
      ],
      robots: false,
    });

    expect(result.sitemapIndexPath).toBe("sitemap.xml");
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("__errors.xml"),
      expect.stringContaining("<urlset")
    );
    consoleSpy.mockRestore();
  });

  it("uses robots config without sitemapUrl when no urls generated", async () => {
    await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [],
      robots: {
        rules: [{ userAgent: "*", allow: ["/"] }],
      },
    });

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("robots.txt"),
      expect.not.stringContaining("Sitemap:")
    );
  });

  it("uses robots config sitemapUrl when provided", async () => {
    await generateSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      sitemapGroups: [
        {
          name: "pages",
          provider: () => ({
            name: "pages",
            urls: ["https://example.com/page1"],
          }),
        },
      ],
      robots: {
        sitemapUrl: "https://custom.com/sitemap.xml",
      },
    });

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("robots.txt"),
      expect.stringContaining("https://custom.com/sitemap.xml")
    );
  });
});
