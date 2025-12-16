import {
  buildCdnIndexUrl,
  resolveCdnAssetsFromHtml,
  type CdnAssets,
} from "./cdn";

export type SeoShellDefaults = {
  defaultNoIndex: boolean;
};

export type SeoShellCdnConfig = {
  baseUrl?: string;
  version?: string;
  indexUrl?: string;
  indexFileName?: string;
};

export type SeoShellConfig = {
  cdn?: SeoShellCdnConfig;
  defaults?: SeoShellDefaults;
};

const mergeConfig = (
  base: SeoShellConfig,
  override: SeoShellConfig
): SeoShellConfig => {
  return {
    cdn: {
      ...base.cdn,
      ...override.cdn,
    },
    defaults: override.defaults ?? base.defaults,
  };
};

const resolveConfig = (config: SeoShellConfig | undefined): SeoShellConfig => {
  if (!config) {
    return {};
  }
  return {
    cdn: config.cdn ? { ...config.cdn } : undefined,
    defaults: config.defaults ? { ...config.defaults } : undefined,
  };
};

export const getSeoShellConfigFromEnv = (
  configOverride?: SeoShellConfig
): SeoShellConfig => {
  const indexUrlFromEnv = process.env.APP_CDN_INDEX_URL?.trim();

  const envConfig: SeoShellConfig = indexUrlFromEnv
    ? { cdn: { indexUrl: indexUrlFromEnv } }
    : {};

  const merged = mergeConfig(resolveConfig(configOverride), envConfig);

  return {
    cdn: {
      baseUrl: merged.cdn?.baseUrl?.trim() || undefined,
      version: merged.cdn?.version?.trim() || undefined,
      indexUrl: merged.cdn?.indexUrl?.trim() || undefined,
      indexFileName: merged.cdn?.indexFileName?.trim() || undefined,
    },
    defaults: {
      defaultNoIndex: merged.defaults?.defaultNoIndex ?? true,
    },
  };
};

export const getSeoShellDefaultsFromEnv = (
  configOverride?: SeoShellConfig
): SeoShellDefaults => {
  const config = getSeoShellConfigFromEnv(configOverride);
  return config.defaults ?? { defaultNoIndex: true };
};

export const getCdnAssetsFromEnv = async (
  configOverride?: SeoShellConfig
): Promise<CdnAssets> => {
  const config = getSeoShellConfigFromEnv(configOverride);
  const baseUrl = config.cdn?.baseUrl;
  const version = config.cdn?.version;
  const indexUrlFromEnv = config.cdn?.indexUrl;
  const indexFileName = config.cdn?.indexFileName;

  const indexUrl =
    indexUrlFromEnv ||
    buildCdnIndexUrl({ baseUrl, version, indexFileName }) ||
    null;

  if (typeof window === "undefined" && indexUrl) {
    try {
      return await resolveCdnAssetsFromHtml({ indexUrl, baseUrl });
    } catch {
      // ignore
    }
  }

  return {
    cssHrefs: [],
    jsSrcs: [],
    faviconHref: undefined,
  };
};

export type SeoShellInstance = {
  getAssets: () => Promise<CdnAssets>;
  getDefaults: () => SeoShellDefaults;
};

export const createSeoShell = (config: SeoShellConfig): SeoShellInstance => {
  const resolved = resolveConfig(config);
  return {
    getAssets: () => getCdnAssetsFromEnv(resolved),
    getDefaults: () => getSeoShellDefaultsFromEnv(resolved),
  };
};

export type PageAssetsResult = {
  assets: CdnAssets;
  noIndex: boolean;
};

export const getPageAssets = async (
  config?: SeoShellConfig
): Promise<PageAssetsResult> => {
  const assets = await getCdnAssetsFromEnv(config);
  const defaults = getSeoShellDefaultsFromEnv(config);
  return {
    assets,
    noIndex: defaults.defaultNoIndex,
  };
};
