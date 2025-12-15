export { generateSitemaps } from "./generator";
export { buildRobotsTxt } from "./robots";
export { buildUrlSetXml, buildSitemapIndexXml } from "./xml";
export {
  createStaticProvider,
  createAsyncProvider,
  createPaginatedProvider,
  combineUrls,
  slugify,
} from "./helpers";
export { createGraphQLFetcher, createJsonFetcher } from "./fetcher";
export { ensureSitemaps } from "./ensureSitemaps";

export type {
  SitemapUrl,
  SitemapEntry,
  SitemapProviderResult,
  SitemapProvider,
  SitemapGroupConfig,
  RobotsRule,
  RobotsConfig,
  SitemapGeneratorConfig,
  GeneratedSitemap,
  SitemapGeneratorResult,
} from "./types";

export type { GraphQLFetcherConfig, JsonFetcherConfig } from "./fetcher";

export type {
  EnsureSitemapsConfig,
  SitemapGroupDefinition,
  SitemapSource,
  StaticUrlsSource,
  JsonFileSource,
  GraphQLSource,
  GraphQLPaginatedSource,
  AsyncFetcherSource,
  CompositeSource,
} from "./ensureSitemaps";
