import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCdnAssets, getPageAssets } from "./runtime";

vi.mock("./cdn", () => ({
  buildCdnIndexUrl: vi.fn(),
  resolveCdnAssetsFromHtml: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCdnAssets", () => {
  it("uses indexUrl when provided", async () => {
    const { resolveCdnAssetsFromHtml } = await import("./cdn");
    vi.mocked(resolveCdnAssetsFromHtml).mockResolvedValue({
      cssHrefs: ["/styles.css"],
      jsSrcs: ["/app.js"],
      faviconHref: "/favicon.ico",
    });

    const result = await getCdnAssets({
      cdn: {
        indexUrl: "https://cdn.example.com/index.html",
        baseUrl: "https://cdn.example.com",
      },
    });

    expect(resolveCdnAssetsFromHtml).toHaveBeenCalledWith({
      indexUrl: "https://cdn.example.com/index.html",
      baseUrl: "https://cdn.example.com",
    });
    expect(result.cssHrefs).toEqual(["/styles.css"]);
  });

  it("builds indexUrl from config when not provided", async () => {
    const { buildCdnIndexUrl, resolveCdnAssetsFromHtml } = await import(
      "./cdn"
    );
    vi.mocked(buildCdnIndexUrl).mockReturnValue(
      "https://cdn.example.com/v1/index.html"
    );
    vi.mocked(resolveCdnAssetsFromHtml).mockResolvedValue({
      cssHrefs: [],
      jsSrcs: [],
      faviconHref: null,
    });

    await getCdnAssets({
      cdn: {
        baseUrl: "https://cdn.example.com",
        version: "v1",
      },
    });

    expect(buildCdnIndexUrl).toHaveBeenCalledWith({
      baseUrl: "https://cdn.example.com",
      version: "v1",
      indexFileName: undefined,
    });
  });

  it("returns empty assets when no indexUrl", async () => {
    const { buildCdnIndexUrl } = await import("./cdn");
    vi.mocked(buildCdnIndexUrl).mockReturnValue(null);

    const result = await getCdnAssets({
      cdn: {},
    });

    expect(result).toEqual({
      cssHrefs: [],
      jsSrcs: [],
      faviconHref: null,
    });
  });

  it("returns empty assets on fetch error", async () => {
    const { resolveCdnAssetsFromHtml } = await import("./cdn");
    vi.mocked(resolveCdnAssetsFromHtml).mockRejectedValue(
      new Error("Fetch failed")
    );

    const result = await getCdnAssets({
      cdn: {
        indexUrl: "https://cdn.example.com/index.html",
      },
    });

    expect(result).toEqual({
      cssHrefs: [],
      jsSrcs: [],
      faviconHref: null,
    });
  });
});

describe("getPageAssets", () => {
  it("returns assets and noIndex from config", async () => {
    const { resolveCdnAssetsFromHtml } = await import("./cdn");
    vi.mocked(resolveCdnAssetsFromHtml).mockResolvedValue({
      cssHrefs: ["/styles.css"],
      jsSrcs: ["/app.js"],
      faviconHref: "/favicon.ico",
    });

    const result = await getPageAssets({
      cdn: {
        indexUrl: "https://cdn.example.com/index.html",
      },
      defaults: {
        defaultNoIndex: true,
      },
    });

    expect(result.assets.cssHrefs).toEqual(["/styles.css"]);
    expect(result.noIndex).toBe(true);
  });

  it("defaults noIndex to false", async () => {
    const { buildCdnIndexUrl } = await import("./cdn");
    vi.mocked(buildCdnIndexUrl).mockReturnValue(null);

    const result = await getPageAssets({
      cdn: {},
    });

    expect(result.noIndex).toBe(false);
  });

  it("defaults noIndex to false when defaults is undefined", async () => {
    const { buildCdnIndexUrl } = await import("./cdn");
    vi.mocked(buildCdnIndexUrl).mockReturnValue(null);

    const result = await getPageAssets({
      cdn: {},
      defaults: undefined,
    });

    expect(result.noIndex).toBe(false);
  });
});
