import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSeoShellApp } from "./createSeoShellApp";

vi.mock("./runtime", () => ({
  getPageAssets: vi.fn().mockResolvedValue({
    assets: { cssHrefs: [], jsSrcs: [], faviconHref: null },
    noIndex: false,
  }),
}));

vi.mock("./sitemap", () => ({
  ensureSitemaps: vi.fn().mockResolvedValue({}),
}));

vi.mock("./defaultNext", () => ({
  getCanonicalUrlFromCtx: vi.fn().mockReturnValue("https://example.com/page"),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createSeoShellApp", () => {
  it("creates app with config", () => {
    const app = createSeoShellApp({
      cdn: {
        baseUrl: "https://cdn.example.com",
        version: "v1",
      },
    });

    expect(app.config).toBeDefined();
    expect(app.config.cdn.baseUrl).toBe("https://cdn.example.com");
    expect(app.config.cdn.version).toBe("v1");
  });

  it("sets default noIndex to false", () => {
    const app = createSeoShellApp({
      cdn: {},
    });

    expect(app.config.defaults?.defaultNoIndex).toBe(false);
  });

  it("uses provided defaultNoIndex", () => {
    const app = createSeoShellApp({
      cdn: {},
      defaults: {
        defaultNoIndex: true,
      },
    });

    expect(app.config.defaults?.defaultNoIndex).toBe(true);
  });

  it("provides withSeoShell function", () => {
    const app = createSeoShellApp({ cdn: {} });

    expect(typeof app.withSeoShell).toBe("function");
  });
});

describe("withSeoShell from createSeoShellApp", () => {
  it("wraps handler and injects seoShell props", async () => {
    const app = createSeoShellApp({ cdn: {} });
    const handler = vi.fn().mockResolvedValue({ props: { custom: "data" } });
    const wrapped = app.withSeoShell(handler);

    const mockCtx = {
      req: { headers: { host: "example.com" } },
      res: {},
      query: {},
      resolvedUrl: "/page",
    };

    const result = await wrapped(mockCtx as never);

    expect(result).toHaveProperty("props");
    const props = (result as { props: Record<string, unknown> }).props;
    expect(props.custom).toBe("data");
    expect(props.__seoShell).toBeDefined();
  });

  it("returns redirect as-is", async () => {
    const app = createSeoShellApp({ cdn: {} });
    const handler = vi.fn().mockResolvedValue({
      redirect: { destination: "/other", permanent: false },
    });
    const wrapped = app.withSeoShell(handler);

    const mockCtx = {
      req: { headers: { host: "example.com" } },
      res: {},
      query: {},
      resolvedUrl: "/page",
    };

    const result = await wrapped(mockCtx as never);

    expect(result).toHaveProperty("redirect");
  });

  it("returns notFound as-is", async () => {
    const app = createSeoShellApp({ cdn: {} });
    const handler = vi.fn().mockResolvedValue({ notFound: true });
    const wrapped = app.withSeoShell(handler);

    const mockCtx = {
      req: { headers: { host: "example.com" } },
      res: {},
      query: {},
      resolvedUrl: "/page",
    };

    const result = await wrapped(mockCtx as never);

    expect(result).toHaveProperty("notFound");
  });

  it("calls ensureSitemaps when enabled with config", async () => {
    const { ensureSitemaps } = await import("./sitemap");
    const mockEnsureSitemaps = vi.mocked(ensureSitemaps);

    const app = createSeoShellApp({ cdn: {} });
    const handler = vi.fn().mockResolvedValue({ props: {} });
    const wrapped = app.withSeoShell(handler, {
      ensureSitemaps: true,
      sitemapConfig: {
        baseUrl: "https://example.com",
        outputDir: "/output",
        groups: [],
      },
    });

    const mockCtx = {
      req: { headers: { host: "example.com" } },
      res: {},
      query: {},
      resolvedUrl: "/page",
    };

    await wrapped(mockCtx as never);

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

    const app = createSeoShellApp({ cdn: {} });
    const handler = vi.fn().mockResolvedValue({ props: {} });
    const wrapped = app.withSeoShell(handler, {
      ensureSitemaps: true,
      getSitemapConfig,
    });

    const mockCtx = {
      req: { headers: { host: "example.com" } },
      res: {},
      query: {},
      resolvedUrl: "/page",
    };

    await wrapped(mockCtx as never);

    expect(getSitemapConfig).toHaveBeenCalled();
    expect(mockEnsureSitemaps).toHaveBeenCalled();
  });

  it("does not call ensureSitemaps when no config", async () => {
    const { ensureSitemaps } = await import("./sitemap");
    const mockEnsureSitemaps = vi.mocked(ensureSitemaps);

    const app = createSeoShellApp({ cdn: {} });
    const handler = vi.fn().mockResolvedValue({ props: {} });
    const wrapped = app.withSeoShell(handler, {
      ensureSitemaps: true,
    });

    const mockCtx = {
      req: { headers: { host: "example.com" } },
      res: {},
      query: {},
      resolvedUrl: "/page",
    };

    await wrapped(mockCtx as never);

    expect(mockEnsureSitemaps).not.toHaveBeenCalled();
  });

  it("includes default seo with canonical url", async () => {
    const app = createSeoShellApp({
      cdn: {},
      defaults: {
        seo: {
          ogSiteName: "My Site",
        },
      },
    });
    const handler = vi.fn().mockResolvedValue({ props: {} });
    const wrapped = app.withSeoShell(handler);

    const mockCtx = {
      req: { headers: { host: "example.com" } },
      res: {},
      query: {},
      resolvedUrl: "/page",
    };

    const result = await wrapped(mockCtx as never);
    const props = (
      result as {
        props: {
          __seoShell: {
            defaultSeo: { canonicalUrl: string; ogSiteName: string };
          };
        };
      }
    ).props;

    expect(props.__seoShell.defaultSeo.canonicalUrl).toBe(
      "https://example.com/page"
    );
    expect(props.__seoShell.defaultSeo.ogSiteName).toBe("My Site");
  });

  it("handles handler with no props", async () => {
    const app = createSeoShellApp({ cdn: {} });
    const handler = vi.fn().mockResolvedValue({});
    const wrapped = app.withSeoShell(handler);

    const mockCtx = {
      req: { headers: { host: "example.com" } },
      res: {},
      query: {},
      resolvedUrl: "/page",
    };

    const result = await wrapped(mockCtx as never);
    const props = (result as { props: Record<string, unknown> }).props;

    expect(props.__seoShell).toBeDefined();
  });
});
