import fs from "fs";
import path from "path";
import type { SitemapEntry, SitemapGeneratorResult } from "./types";
import { generateSitemaps } from "./generator";
import { slugify, combineUrls } from "./helpers";
import { createGraphQLFetcher } from "./fetcher";

export type StaticUrlsSource = {
  type: "static";
  urls: string[];
};

export type JsonFileSource = {
  type: "jsonFile";
  path: string;
  mapToUrls: (data: unknown) => string[];
};

export type GraphQLSource = {
  type: "graphql";
  query: string;
  variables?: Record<string, unknown>;
  mapToUrls: (data: unknown) => string[];
};

export type GraphQLPaginatedSource = {
  type: "graphqlPaginated";
  query: string;
  pageSize: number;
  buildVariables: (page: number, pageSize: number) => Record<string, unknown>;
  mapPage: (data: unknown) => { urls: string[]; hasMore: boolean };
};

export type AsyncFetcherSource = {
  type: "asyncFetcher";
  fetcher: () => Promise<string[]>;
};

export type CompositeSource = {
  type: "composite";
  sources: SitemapSource[];
  combine: (results: string[][]) => string[];
};

export type SitemapSource =
  | StaticUrlsSource
  | JsonFileSource
  | GraphQLSource
  | GraphQLPaginatedSource
  | AsyncFetcherSource
  | CompositeSource;

export type SitemapGroupDefinition = {
  name: string;
  source: SitemapSource;
  pageSize?: number;
};

export type EnsureSitemapsConfig = {
  baseUrl: string;
  outputDir: string;
  graphqlUrl?: string;
  graphqlHeaders?: Record<string, string>;
  groups: SitemapGroupDefinition[];
  staleTimeMs?: number;
  sitemapSubdir?: string;
  sitemapIndexPath?: string;
  defaultPageSize?: number;
  robots?: boolean;
};

const resolveSource = async (
  source: SitemapSource,
  graphqlFetcher?: ReturnType<typeof createGraphQLFetcher>
): Promise<SitemapEntry[]> => {
  const sourceHandlers: Record<string, () => Promise<SitemapEntry[]>> = {
    static: async () => (source as StaticUrlsSource).urls,

    jsonFile: async () => {
      const src = source as JsonFileSource;
      if (!fs.existsSync(src.path)) {
        return [];
      }
      const data = JSON.parse(fs.readFileSync(src.path, "utf8"));
      return src.mapToUrls(data);
    },

    graphql: async () => {
      if (!graphqlFetcher) {
        return [];
      }
      const src = source as GraphQLSource;
      const data = await graphqlFetcher(src.query, src.variables);
      if (!data) {
        return [];
      }
      return src.mapToUrls(data);
    },

    graphqlPaginated: async () => {
      if (!graphqlFetcher) {
        return [];
      }
      const src = source as GraphQLPaginatedSource;
      const allUrls: string[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const variables = src.buildVariables(page, src.pageSize);
        const data = await graphqlFetcher(src.query, variables);
        if (!data) {
          break;
        }
        const result = src.mapPage(data);
        allUrls.push(...result.urls);
        hasMore = result.hasMore;
        page += 1;
      }

      return allUrls;
    },

    asyncFetcher: async () => {
      const src = source as AsyncFetcherSource;
      return src.fetcher();
    },

    composite: async () => {
      const src = source as CompositeSource;
      const results = await Promise.all(
        src.sources.map((s) => resolveSource(s, graphqlFetcher))
      );
      return src.combine(results.map((r) => r as string[]));
    },
  };

  const handler = sourceHandlers[source.type];
  if (!handler) {
    return [];
  }
  return handler();
};

export const ensureSitemaps = async (
  config: EnsureSitemapsConfig
): Promise<SitemapGeneratorResult> => {
  const graphqlFetcher = config.graphqlUrl
    ? createGraphQLFetcher({
        url: config.graphqlUrl,
        headers: config.graphqlHeaders,
      })
    : undefined;

  const sitemapGroups = config.groups.map((group) => ({
    name: group.name,
    pageSize: group.pageSize,
    provider: async () => {
      const urls = await resolveSource(group.source, graphqlFetcher);
      return { name: group.name, urls };
    },
  }));

  return generateSitemaps({
    baseUrl: config.baseUrl,
    outputDir: config.outputDir,
    sitemapGroups,
    staleTimeMs: config.staleTimeMs,
    sitemapSubdir: config.sitemapSubdir ?? "seo",
    sitemapIndexPath: config.sitemapIndexPath ?? "sitemap.xml",
    defaultPageSize: config.defaultPageSize ?? 40000,
    robots: config.robots ?? true,
  });
};

export { slugify, combineUrls };
