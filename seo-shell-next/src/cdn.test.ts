import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  resolveCdnAssets,
  resolveCdnAssetsFromHtml,
  buildCdnManifestUrl,
  buildCdnIndexUrl,
} from "./cdn";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("resolveCdnAssets", () => {
  it("fetches and parses manifest", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cssHrefs: ["/styles.css"],
        jsSrcs: ["/app.js"],
        faviconHref: "/favicon.ico",
      }),
    });

    const result = await resolveCdnAssets({
      manifestUrl: "https://cdn.example.com/manifest.json",
    });

    expect(result).toEqual({
      cssHrefs: ["/styles.css"],
      jsSrcs: ["/app.js"],
      faviconHref: "/favicon.ico",
    });
  });

  it("applies baseUrl to relative paths", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cssHrefs: ["/styles.css"],
        jsSrcs: ["app.js"],
        faviconHref: "/favicon.ico",
      }),
    });

    const result = await resolveCdnAssets({
      manifestUrl: "https://cdn.example.com/manifest.json",
      baseUrl: "https://cdn.example.com",
    });

    expect(result.cssHrefs).toEqual(["https://cdn.example.com/styles.css"]);
    expect(result.jsSrcs).toEqual(["https://cdn.example.com/app.js"]);
    expect(result.faviconHref).toBe("https://cdn.example.com/favicon.ico");
  });

  it("does not modify absolute urls", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cssHrefs: ["https://other.com/styles.css"],
        jsSrcs: ["http://other.com/app.js"],
      }),
    });

    const result = await resolveCdnAssets({
      manifestUrl: "https://cdn.example.com/manifest.json",
      baseUrl: "https://cdn.example.com",
    });

    expect(result.cssHrefs).toEqual(["https://other.com/styles.css"]);
    expect(result.jsSrcs).toEqual(["http://other.com/app.js"]);
  });

  it("throws on fetch error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(
      resolveCdnAssets({ manifestUrl: "https://cdn.example.com/manifest.json" })
    ).rejects.toThrow("cdn_manifest_fetch_failed:404");
  });

  it("handles empty manifest", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await resolveCdnAssets({
      manifestUrl: "https://cdn.example.com/manifest.json",
    });

    expect(result).toEqual({
      cssHrefs: [],
      jsSrcs: [],
      faviconHref: null,
    });
  });

  it("removes duplicate urls", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cssHrefs: ["/styles.css", "/styles.css"],
        jsSrcs: ["/app.js", "/app.js"],
      }),
    });

    const result = await resolveCdnAssets({
      manifestUrl: "https://cdn.example.com/manifest.json",
    });

    expect(result.cssHrefs).toEqual(["/styles.css"]);
    expect(result.jsSrcs).toEqual(["/app.js"]);
  });

  it("passes fetchInit options", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await resolveCdnAssets({
      manifestUrl: "https://cdn.example.com/manifest.json",
      fetchInit: { cache: "no-store" },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://cdn.example.com/manifest.json",
      expect.objectContaining({ cache: "no-store" })
    );
  });
});

describe("resolveCdnAssetsFromHtml", () => {
  it("extracts assets from html", async () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="/styles.css">
          <link rel="icon" href="/favicon.ico">
        </head>
        <body>
          <script src="/app.js"></script>
        </body>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });

    const result = await resolveCdnAssetsFromHtml({
      indexUrl: "https://cdn.example.com/index.html",
    });

    expect(result.cssHrefs).toContain("/styles.css");
    expect(result.jsSrcs).toContain("/app.js");
    expect(result.faviconHref).toBe("/favicon.ico");
  });

  it("extracts stylesheet with href before rel", async () => {
    const html = `<link href="/styles.css" rel="stylesheet">`;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });

    const result = await resolveCdnAssetsFromHtml({
      indexUrl: "https://cdn.example.com/index.html",
    });

    expect(result.cssHrefs).toContain("/styles.css");
  });

  it("extracts modulepreload links", async () => {
    const html = `
      <link rel="modulepreload" href="/module.js">
      <link href="/module2.js" rel="modulepreload">
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });

    const result = await resolveCdnAssetsFromHtml({
      indexUrl: "https://cdn.example.com/index.html",
    });

    expect(result.jsSrcs).toContain("/module.js");
    expect(result.jsSrcs).toContain("/module2.js");
  });

  it("extracts shortcut icon", async () => {
    const html = `<link rel="shortcut icon" href="/favicon.ico">`;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });

    const result = await resolveCdnAssetsFromHtml({
      indexUrl: "https://cdn.example.com/index.html",
    });

    expect(result.faviconHref).toBe("/favicon.ico");
  });

  it("extracts favicon with href before rel", async () => {
    const html = `<link href="/favicon.ico" rel="icon">`;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });

    const result = await resolveCdnAssetsFromHtml({
      indexUrl: "https://cdn.example.com/index.html",
    });

    expect(result.faviconHref).toBe("/favicon.ico");
  });

  it("applies baseUrl", async () => {
    const html = `<link rel="stylesheet" href="/styles.css">`;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });

    const result = await resolveCdnAssetsFromHtml({
      indexUrl: "https://cdn.example.com/index.html",
      baseUrl: "https://cdn.example.com",
    });

    expect(result.cssHrefs).toContain("https://cdn.example.com/styles.css");
  });

  it("throws on fetch error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(
      resolveCdnAssetsFromHtml({
        indexUrl: "https://cdn.example.com/index.html",
      })
    ).rejects.toThrow("cdn_index_fetch_failed:500");
  });

  it("handles html with no assets", async () => {
    const html = `<!DOCTYPE html><html><body></body></html>`;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });

    const result = await resolveCdnAssetsFromHtml({
      indexUrl: "https://cdn.example.com/index.html",
    });

    expect(result.cssHrefs).toEqual([]);
    expect(result.jsSrcs).toEqual([]);
    expect(result.faviconHref).toBeNull();
  });
});

describe("buildCdnManifestUrl", () => {
  it("builds url without version", () => {
    const result = buildCdnManifestUrl({
      baseUrl: "https://cdn.example.com",
    });

    expect(result).toBe("https://cdn.example.com/web-assets.json");
  });

  it("builds url with version", () => {
    const result = buildCdnManifestUrl({
      baseUrl: "https://cdn.example.com",
      version: "v1.0.0",
    });

    expect(result).toBe("https://cdn.example.com/v1.0.0/web-assets.json");
  });

  it("builds url with custom manifest filename", () => {
    const result = buildCdnManifestUrl({
      baseUrl: "https://cdn.example.com",
      manifestFileName: "assets.json",
    });

    expect(result).toBe("https://cdn.example.com/assets.json");
  });

  it("returns null when baseUrl is empty", () => {
    const result = buildCdnManifestUrl({});
    expect(result).toBeNull();
  });

  it("returns null when baseUrl is whitespace", () => {
    const result = buildCdnManifestUrl({ baseUrl: "   " });
    expect(result).toBeNull();
  });

  it("trims trailing slashes from baseUrl", () => {
    const result = buildCdnManifestUrl({
      baseUrl: "https://cdn.example.com///",
    });

    expect(result).toBe("https://cdn.example.com/web-assets.json");
  });

  it("trims slashes from version", () => {
    const result = buildCdnManifestUrl({
      baseUrl: "https://cdn.example.com",
      version: "/v1.0.0/",
    });

    expect(result).toBe("https://cdn.example.com/v1.0.0/web-assets.json");
  });
});

describe("buildCdnIndexUrl", () => {
  it("builds url without version", () => {
    const result = buildCdnIndexUrl({
      baseUrl: "https://cdn.example.com",
    });

    expect(result).toBe("https://cdn.example.com/index.html");
  });

  it("builds url with version", () => {
    const result = buildCdnIndexUrl({
      baseUrl: "https://cdn.example.com",
      version: "v1.0.0",
    });

    expect(result).toBe("https://cdn.example.com/v1.0.0/index.html");
  });

  it("builds url with custom index filename", () => {
    const result = buildCdnIndexUrl({
      baseUrl: "https://cdn.example.com",
      indexFileName: "app.html",
    });

    expect(result).toBe("https://cdn.example.com/app.html");
  });

  it("returns null when baseUrl is empty", () => {
    const result = buildCdnIndexUrl({});
    expect(result).toBeNull();
  });

  it("returns null when baseUrl is whitespace", () => {
    const result = buildCdnIndexUrl({ baseUrl: "   " });
    expect(result).toBeNull();
  });

  it("trims trailing slashes from baseUrl", () => {
    const result = buildCdnIndexUrl({
      baseUrl: "https://cdn.example.com///",
    });

    expect(result).toBe("https://cdn.example.com/index.html");
  });

  it("trims slashes from version", () => {
    const result = buildCdnIndexUrl({
      baseUrl: "https://cdn.example.com",
      version: "/v1.0.0/",
    });

    expect(result).toBe("https://cdn.example.com/v1.0.0/index.html");
  });
});
