import {
  buildCdnIndexUrl,
  resolveCdnAssetsFromHtml,
  type CdnAssets,
} from "./cdn";

export type SeoShellCdnConfig = {
  baseUrl?: string;
  version?: string;
  indexUrl?: string;
  indexFileName?: string;
};

export type SeoShellDefaults = {
  defaultNoIndex?: boolean;
};

export type SeoShellConfig = {
  cdn: SeoShellCdnConfig;
  defaults?: SeoShellDefaults;
};

export const getCdnAssets = async (
  config: SeoShellConfig
): Promise<CdnAssets> => {
  const { cdn } = config;
  const indexUrl =
    cdn.indexUrl ||
    buildCdnIndexUrl({
      baseUrl: cdn.baseUrl,
      version: cdn.version,
      indexFileName: cdn.indexFileName,
    });

  if (!indexUrl) {
    return {
      cssHrefs: [],
      jsSrcs: [],
      faviconHref: null,
    };
  }

  try {
    return await resolveCdnAssetsFromHtml({
      indexUrl,
      baseUrl: cdn.baseUrl,
    });
  } catch {
    return {
      cssHrefs: [],
      jsSrcs: [],
      faviconHref: null,
    };
  }
};

export type PageAssetsResult = {
  assets: CdnAssets;
  noIndex: boolean;
};

export const getPageAssets = async (
  config: SeoShellConfig
): Promise<PageAssetsResult> => {
  const assets = await getCdnAssets(config);
  return {
    assets,
    noIndex: config.defaults?.defaultNoIndex ?? false,
  };
};
