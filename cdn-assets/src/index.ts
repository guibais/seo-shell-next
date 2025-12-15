export type CdnAssets = {
  cssHrefs: string[];
  jsSrcs: string[];
  faviconHref?: string;
};

export type CdnAssetsManifest = {
  cssHrefs?: string[];
  jsSrcs?: string[];
  faviconHref?: string;
};

export type ResolveCdnAssetsOptions = {
  manifestUrl: string;
  baseUrl?: string;
  fetchInit?: RequestInit;
};

const uniqueStrings = (values: string[]) => Array.from(new Set(values));

const prefixIfRelative = (baseUrl: string, value: string) => {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const trimmedValue = value.startsWith("/") ? value : `/${value}`;
  return `${trimmedBase}${trimmedValue}`;
};

const applyBaseUrl = (
  baseUrl: string | undefined,
  assets: CdnAssets
): CdnAssets => {
  if (!baseUrl) {
    return assets;
  }

  return {
    cssHrefs: assets.cssHrefs.map((href) => prefixIfRelative(baseUrl, href)),
    jsSrcs: assets.jsSrcs.map((src) => prefixIfRelative(baseUrl, src)),
    faviconHref: assets.faviconHref
      ? prefixIfRelative(baseUrl, assets.faviconHref)
      : undefined,
  };
};

const parseManifest = (manifest: CdnAssetsManifest): CdnAssets => ({
  cssHrefs: uniqueStrings(manifest.cssHrefs ?? []),
  jsSrcs: uniqueStrings(manifest.jsSrcs ?? []),
  faviconHref: manifest.faviconHref,
});

export const resolveCdnAssets = async (
  options: ResolveCdnAssetsOptions
): Promise<CdnAssets> => {
  const response = await fetch(options.manifestUrl, {
    headers: { Accept: "application/json" },
    ...options.fetchInit,
  });

  if (!response.ok) {
    throw new Error(`cdn_manifest_fetch_failed:${response.status}`);
  }

  const json = (await response.json()) as CdnAssetsManifest;
  return applyBaseUrl(options.baseUrl, parseManifest(json));
};

export type CdnEnvConfig = {
  baseUrl?: string;
  version?: string;
  manifestFileName?: string;
};

export const buildCdnManifestUrl = (config: CdnEnvConfig): string | null => {
  const baseUrl = config.baseUrl?.trim();
  if (!baseUrl) {
    return null;
  }

  const version = config.version?.trim();
  const manifestFileName = (
    config.manifestFileName || "web-assets.json"
  ).trim();

  const trimmedBase = baseUrl.replace(/\/+$/, "");
  if (!version) {
    return `${trimmedBase}/${manifestFileName}`;
  }

  const trimmedVersion = version.replace(/^\/+/, "").replace(/\/+$/, "");
  return `${trimmedBase}/${trimmedVersion}/${manifestFileName}`;
};
