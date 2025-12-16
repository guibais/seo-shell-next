import { describe, it, expect, vi, beforeEach } from "vitest";
import { withSeoShell } from "./withSeoShell";

vi.mock("./runtime", () => ({
  getPageAssets: vi.fn().mockResolvedValue({
    assets: { cssHrefs: [], jsSrcs: [], faviconHref: null },
    noIndex: false,
  }),
}));

vi.mock("./sitemap", () => ({
  ensureSitemaps: vi.fn().mockResolvedValue({}),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("withSeoShell", () => {
  const mockConfig = {
    cdn: { baseUrl: "https://cdn.example.com" },
    defaults: { defaultNoIndex: false },
  };

  const mockGetDefaultSeo = vi.fn().mockReturnValue({
    canonicalUrl: "https://example.com/page",
    ogSiteName: "Test Site",
  });

  const createMockCtx = () => ({
    req: { headers: { host: "example.com" } },
    res: {},
    query: {},
    resolvedUrl: "/page",
  });

  it("wraps handler and injects seoShell props", async () => {
    const handler = vi.fn().mockResolvedValue({ props: { custom: "data" } });
    const wrapped = withSeoShell(handler, {
      seoShellConfig: mockConfig,
      getDefaultSeo: mockGetDefaultSeo,
    });

    const result = await wrapped(createMockCtx() as never);

    expect(result).toHaveProperty("props");
    const props = (result as { props: Record<string, unknown> }).props;
    expect(props.custom).toBe("data");
    expect(props.__seoShell).toBeDefined();
  });

  it("includes assets in injected props", async () => {
    const { getPageAssets } = await import("./runtime");
    vi.mocked(getPageAssets).mockResolvedValue({
      assets: {
        cssHrefs: ["/styles.css"],
        jsSrcs: ["/app.js"],
        faviconHref: "/favicon.ico",
      },
      noIndex: true,
    });

    const handler = vi.fn().mockResolvedValue({ props: {} });
    const wrapped = withSeoShell(handler, {
      seoShellConfig: mockConfig,
      getDefaultSeo: mockGetDefaultSeo,
    });

    const result = await wrapped(createMockCtx() as never);
    const props = (
      result as {
        props: {
          __seoShell: { assets: { cssHrefs: string[] }; noIndex: boolean };
        };
      }
    ).props;

    expect(props.__seoShell.assets.cssHrefs).toEqual(["/styles.css"]);
    expect(props.__seoShell.noIndex).toBe(true);
  });

  it("includes defaultSeo from getDefaultSeo", async () => {
    const handler = vi.fn().mockResolvedValue({ props: {} });
    const wrapped = withSeoShell(handler, {
      seoShellConfig: mockConfig,
      getDefaultSeo: mockGetDefaultSeo,
    });

    const result = await wrapped(createMockCtx() as never);
    const props = (
      result as {
        props: { __seoShell: { defaultSeo: { canonicalUrl: string } } };
      }
    ).props;

    expect(props.__seoShell.defaultSeo.canonicalUrl).toBe(
      "https://example.com/page"
    );
  });

  it("returns redirect as-is", async () => {
    const handler = vi.fn().mockResolvedValue({
      redirect: { destination: "/other", permanent: false },
    });
    const wrapped = withSeoShell(handler, {
      seoShellConfig: mockConfig,
      getDefaultSeo: mockGetDefaultSeo,
    });

    const result = await wrapped(createMockCtx() as never);

    expect(result).toHaveProperty("redirect");
    expect(result).not.toHaveProperty("props");
  });

  it("returns notFound as-is", async () => {
    const handler = vi.fn().mockResolvedValue({ notFound: true });
    const wrapped = withSeoShell(handler, {
      seoShellConfig: mockConfig,
      getDefaultSeo: mockGetDefaultSeo,
    });

    const result = await wrapped(createMockCtx() as never);

    expect(result).toHaveProperty("notFound");
    expect(result).not.toHaveProperty("props");
  });

  it("calls ensureSitemaps when enabled with config", async () => {
    const { ensureSitemaps } = await import("./sitemap");
    const mockEnsureSitemaps = vi.mocked(ensureSitemaps);

    const handler = vi.fn().mockResolvedValue({ props: {} });
    const wrapped = withSeoShell(handler, {
      seoShellConfig: mockConfig,
      getDefaultSeo: mockGetDefaultSeo,
      options: {
        ensureSitemaps: true,
        sitemapConfig: {
          baseUrl: "https://example.com",
          outputDir: "/output",
          groups: [],
        },
      },
    });

    await wrapped(createMockCtx() as never);

    expect(mockEnsureSitemaps).toHaveBeenCalled();
  });

  it("calls getSitemapConfig when provided", async () => {
    const { ensureSitemaps } = await import("./sitemap");
    const mockEnsureSitemaps = vi.mocked(ensureSitemaps);

    const getSitemapConfig = vi.fn().mockResolvedValue({
      baseUrl: "https://example.com",
      outputDir: "/output",
      groups: [],
    });

    const handler = vi.fn().mockResolvedValue({ props: {} });
    const wrapped = withSeoShell(handler, {
      seoShellConfig: mockConfig,
      getDefaultSeo: mockGetDefaultSeo,
      options: {
        ensureSitemaps: true,
        getSitemapConfig,
      },
    });

    await wrapped(createMockCtx() as never);

    expect(getSitemapConfig).toHaveBeenCalled();
    expect(mockEnsureSitemaps).toHaveBeenCalled();
  });

  it("does not call ensureSitemaps when disabled", async () => {
    const { ensureSitemaps } = await import("./sitemap");
    const mockEnsureSitemaps = vi.mocked(ensureSitemaps);

    const handler = vi.fn().mockResolvedValue({ props: {} });
    const wrapped = withSeoShell(handler, {
      seoShellConfig: mockConfig,
      getDefaultSeo: mockGetDefaultSeo,
      options: {
        ensureSitemaps: false,
      },
    });

    await wrapped(createMockCtx() as never);

    expect(mockEnsureSitemaps).not.toHaveBeenCalled();
  });

  it("does not call ensureSitemaps when no config provided", async () => {
    const { ensureSitemaps } = await import("./sitemap");
    const mockEnsureSitemaps = vi.mocked(ensureSitemaps);

    const handler = vi.fn().mockResolvedValue({ props: {} });
    const wrapped = withSeoShell(handler, {
      seoShellConfig: mockConfig,
      getDefaultSeo: mockGetDefaultSeo,
      options: {
        ensureSitemaps: true,
      },
    });

    await wrapped(createMockCtx() as never);

    expect(mockEnsureSitemaps).not.toHaveBeenCalled();
  });

  it("handles handler with no props", async () => {
    const handler = vi.fn().mockResolvedValue({});
    const wrapped = withSeoShell(handler, {
      seoShellConfig: mockConfig,
      getDefaultSeo: mockGetDefaultSeo,
    });

    const result = await wrapped(createMockCtx() as never);
    const props = (result as { props: Record<string, unknown> }).props;

    expect(props.__seoShell).toBeDefined();
  });
});
