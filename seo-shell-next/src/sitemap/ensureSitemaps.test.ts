import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import { ensureSitemaps } from "./ensureSitemaps";

vi.mock("fs");
vi.mock("./generator", () => ({
  generateSitemaps: vi.fn().mockResolvedValue({
    sitemaps: [],
    sitemapIndexPath: "sitemap.xml",
    robotsPath: "robots.txt",
    skipped: false,
  }),
}));
vi.mock("./fetcher", () => ({
  createGraphQLFetcher: vi.fn().mockReturnValue(vi.fn()),
}));

const mockFs = vi.mocked(fs);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ensureSitemaps", () => {
  it("resolves static source", async () => {
    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      groups: [
        {
          name: "static",
          source: {
            type: "static",
            urls: ["https://example.com/page1", "https://example.com/page2"],
          },
        },
      ],
    });

    expect(mockGenerateSitemaps).toHaveBeenCalled();
    const config = mockGenerateSitemaps.mock.calls[0][0];
    const result = await config.sitemapGroups[0].provider();
    expect(result.urls).toEqual([
      "https://example.com/page1",
      "https://example.com/page2",
    ]);
  });

  it("resolves jsonFile source", async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ urls: ["url1", "url2"] })
    );

    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      groups: [
        {
          name: "json",
          source: {
            type: "jsonFile",
            path: "/data.json",
            mapToUrls: (data: unknown) => (data as { urls: string[] }).urls,
          },
        },
      ],
    });

    const config = mockGenerateSitemaps.mock.calls[0][0];
    const result = await config.sitemapGroups[0].provider();
    expect(result.urls).toEqual(["url1", "url2"]);
  });

  it("returns empty for missing jsonFile", async () => {
    mockFs.existsSync.mockReturnValue(false);

    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      groups: [
        {
          name: "json",
          source: {
            type: "jsonFile",
            path: "/missing.json",
            mapToUrls: () => [],
          },
        },
      ],
    });

    const config = mockGenerateSitemaps.mock.calls[0][0];
    const result = await config.sitemapGroups[0].provider();
    expect(result.urls).toEqual([]);
  });

  it("resolves graphql source", async () => {
    const mockFetcher = vi.fn().mockResolvedValue({ items: [{ url: "url1" }] });
    const { createGraphQLFetcher } = await import("./fetcher");
    vi.mocked(createGraphQLFetcher).mockReturnValue(mockFetcher);

    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      graphqlUrl: "https://api.example.com/graphql",
      groups: [
        {
          name: "graphql",
          source: {
            type: "graphql",
            query: "query { items { url } }",
            variables: { limit: 10 },
            mapToUrls: (data: unknown) =>
              (data as { items: { url: string }[] }).items.map((i) => i.url),
          },
        },
      ],
    });

    const config = mockGenerateSitemaps.mock.calls[0][0];
    const result = await config.sitemapGroups[0].provider();
    expect(result.urls).toEqual(["url1"]);
  });

  it("returns empty for graphql without fetcher", async () => {
    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      groups: [
        {
          name: "graphql",
          source: {
            type: "graphql",
            query: "query { items { url } }",
            mapToUrls: () => [],
          },
        },
      ],
    });

    const config = mockGenerateSitemaps.mock.calls[0][0];
    const result = await config.sitemapGroups[0].provider();
    expect(result.urls).toEqual([]);
  });

  it("returns empty for graphql when data is null", async () => {
    const mockFetcher = vi.fn().mockResolvedValue(null);
    const { createGraphQLFetcher } = await import("./fetcher");
    vi.mocked(createGraphQLFetcher).mockReturnValue(mockFetcher);

    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      graphqlUrl: "https://api.example.com/graphql",
      groups: [
        {
          name: "graphql",
          source: {
            type: "graphql",
            query: "query { items { url } }",
            mapToUrls: () => ["should-not-be-called"],
          },
        },
      ],
    });

    const config = mockGenerateSitemaps.mock.calls[0][0];
    const result = await config.sitemapGroups[0].provider();
    expect(result.urls).toEqual([]);
  });

  it("resolves graphqlPaginated source", async () => {
    let callCount = 0;
    const mockFetcher = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1)
        return Promise.resolve({ items: ["url1"], hasMore: true });
      return Promise.resolve({ items: ["url2"], hasMore: false });
    });
    const { createGraphQLFetcher } = await import("./fetcher");
    vi.mocked(createGraphQLFetcher).mockReturnValue(mockFetcher);

    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      graphqlUrl: "https://api.example.com/graphql",
      groups: [
        {
          name: "paginated",
          source: {
            type: "graphqlPaginated",
            query: "query($page: Int) { items }",
            pageSize: 10,
            buildVariables: (page, pageSize) => ({ page, pageSize }),
            mapPage: (data: unknown) => {
              const d = data as { items: string[]; hasMore: boolean };
              return { urls: d.items, hasMore: d.hasMore };
            },
          },
        },
      ],
    });

    const config = mockGenerateSitemaps.mock.calls[0][0];
    const result = await config.sitemapGroups[0].provider();
    expect(result.urls).toEqual(["url1", "url2"]);
  });

  it("returns empty for graphqlPaginated without fetcher", async () => {
    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      groups: [
        {
          name: "paginated",
          source: {
            type: "graphqlPaginated",
            query: "query { items }",
            pageSize: 10,
            buildVariables: () => ({}),
            mapPage: () => ({ urls: [], hasMore: false }),
          },
        },
      ],
    });

    const config = mockGenerateSitemaps.mock.calls[0][0];
    const result = await config.sitemapGroups[0].provider();
    expect(result.urls).toEqual([]);
  });

  it("stops graphqlPaginated when data is null", async () => {
    const mockFetcher = vi.fn().mockResolvedValue(null);
    const { createGraphQLFetcher } = await import("./fetcher");
    vi.mocked(createGraphQLFetcher).mockReturnValue(mockFetcher);

    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      graphqlUrl: "https://api.example.com/graphql",
      groups: [
        {
          name: "paginated",
          source: {
            type: "graphqlPaginated",
            query: "query { items }",
            pageSize: 10,
            buildVariables: () => ({}),
            mapPage: () => ({ urls: ["should-not-be-called"], hasMore: true }),
          },
        },
      ],
    });

    const config = mockGenerateSitemaps.mock.calls[0][0];
    const result = await config.sitemapGroups[0].provider();
    expect(result.urls).toEqual([]);
  });

  it("resolves asyncFetcher source", async () => {
    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      groups: [
        {
          name: "async",
          source: {
            type: "asyncFetcher",
            fetcher: async () => ["async-url1", "async-url2"],
          },
        },
      ],
    });

    const config = mockGenerateSitemaps.mock.calls[0][0];
    const result = await config.sitemapGroups[0].provider();
    expect(result.urls).toEqual(["async-url1", "async-url2"]);
  });

  it("resolves composite source", async () => {
    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      groups: [
        {
          name: "composite",
          source: {
            type: "composite",
            sources: [
              { type: "static", urls: ["url1", "url2"] },
              { type: "static", urls: ["url3"] },
            ],
            combine: (results) => results.flat(),
          },
        },
      ],
    });

    const config = mockGenerateSitemaps.mock.calls[0][0];
    const result = await config.sitemapGroups[0].provider();
    expect(result.urls).toEqual(["url1", "url2", "url3"]);
  });

  it("returns empty for unknown source type", async () => {
    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      groups: [
        {
          name: "unknown",
          source: {
            type: "unknown" as "static",
            urls: [],
          },
        },
      ],
    });

    const config = mockGenerateSitemaps.mock.calls[0][0];
    const result = await config.sitemapGroups[0].provider();
    expect(result.urls).toEqual([]);
  });

  it("uses default config values", async () => {
    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      groups: [],
    });

    expect(mockGenerateSitemaps).toHaveBeenCalledWith(
      expect.objectContaining({
        sitemapSubdir: "seo",
        sitemapIndexPath: "sitemap.xml",
        defaultPageSize: 40000,
        robots: true,
      })
    );
  });

  it("uses custom config values", async () => {
    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      groups: [],
      sitemapSubdir: "custom-seo",
      sitemapIndexPath: "custom-sitemap.xml",
      defaultPageSize: 10000,
      robots: false,
      staleTimeMs: 60000,
    });

    expect(mockGenerateSitemaps).toHaveBeenCalledWith(
      expect.objectContaining({
        sitemapSubdir: "custom-seo",
        sitemapIndexPath: "custom-sitemap.xml",
        defaultPageSize: 10000,
        robots: false,
        staleTimeMs: 60000,
      })
    );
  });

  it("passes graphql headers", async () => {
    const { createGraphQLFetcher } = await import("./fetcher");
    const mockCreateFetcher = vi.mocked(createGraphQLFetcher);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      graphqlUrl: "https://api.example.com/graphql",
      graphqlHeaders: { Authorization: "Bearer token" },
      groups: [],
    });

    expect(mockCreateFetcher).toHaveBeenCalledWith({
      url: "https://api.example.com/graphql",
      headers: { Authorization: "Bearer token" },
    });
  });

  it("passes pageSize from group", async () => {
    const { generateSitemaps } = await import("./generator");
    const mockGenerateSitemaps = vi.mocked(generateSitemaps);

    await ensureSitemaps({
      baseUrl: "https://example.com",
      outputDir: "/output",
      groups: [
        {
          name: "test",
          source: { type: "static", urls: [] },
          pageSize: 5000,
        },
      ],
    });

    const config = mockGenerateSitemaps.mock.calls[0][0];
    expect(config.sitemapGroups[0].pageSize).toBe(5000);
  });
});
