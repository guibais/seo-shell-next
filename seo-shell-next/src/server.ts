export {
  createSeoShell,
  getCdnAssetsFromEnv,
  getSeoShellConfigFromEnv,
  getSeoShellDefaultsFromEnv,
  getPageAssets,
  type SeoShellConfig,
  type SeoShellDefaults,
  type PageAssetsResult,
} from "./runtime";

export {
  extractExpoWebAssetsManifestFromHtml,
  generateExpoWebAssetsManifestFromBuild,
  generateWebAssetsManifestFromBuild,
  writeExpoWebAssetsManifest,
  writeExpoWebAssetsManifestFromBuild,
  writeWebAssetsManifestFromBuild,
  type ExpoWebAssetsManifest,
  type ExpoWebAssetsManifestBuildInput,
  type ExpoWebAssetsManifestWriteInput,
  type ExpoWebAssetsManifestWriteResult,
  type WebAssetsManifest,
  type WebAssetsManifestBuildInput,
  type WebAssetsManifestBuildResult,
  type WriteWebAssetsManifestFromBuildInput,
  type WriteWebAssetsManifestFromBuildResult,
} from "./expoWebAssetsManifest";

export {
  detectDistDirectory,
  getDistPath,
  getSupportedFrameworks,
  getCommonDistPaths,
  type FrameworkType,
  type DistDetectorResult,
  type DistDetectorOptions,
} from "./distDetector";

export {
  generateSitemaps,
  ensureSitemaps,
  buildRobotsTxt,
  buildUrlSetXml,
  buildSitemapIndexXml,
  createStaticProvider,
  createAsyncProvider,
  createPaginatedProvider,
  createGraphQLFetcher,
  createJsonFetcher,
  combineUrls,
  slugify,
} from "./sitemap";

export {
  withSeoShell,
  type SeoShellInjectedProps,
  type WithSeoShellOptions,
  type WithSeoShellParams,
} from "./withSeoShell";

export { getDefaultSeoFromEnv, getCanonicalUrlFromCtx } from "./defaultNext";

export { sendEvent, watchEvent, createEventBridge } from "./events";
export type { SeoShellEventPayload, SeoShellEventHandler } from "./events";

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
  EnsureSitemapsConfig,
  SitemapGroupDefinition,
  SitemapSource,
  StaticUrlsSource,
  JsonFileSource,
  GraphQLSource,
  GraphQLPaginatedSource,
  AsyncFetcherSource,
  CompositeSource,
  GraphQLFetcherConfig,
  JsonFetcherConfig,
} from "./sitemap";
