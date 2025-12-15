import fs from "fs";
import path from "path";

import {
  buildCdnManifestUrl,
  resolveCdnAssets,
  type CdnAssets,
  type CdnAssetsManifest,
} from "./cdn";

export type SeoShellDefaults = {
  defaultNoIndex: boolean;
};

export type SeoShellCdnConfig = {
  baseUrl?: string;
  version?: string;
  manifestUrl?: string;
  manifestFileName?: string;
};

export type SeoShellConfig = {
  cdn?: SeoShellCdnConfig;
  defaults?: SeoShellDefaults;
};

const uniqueStrings = (values: string[]) => Array.from(new Set(values));

const parseLocalManifest = (parsed: CdnAssetsManifest): CdnAssets => ({
  cssHrefs: uniqueStrings(parsed.cssHrefs ?? []),
  jsSrcs: uniqueStrings(parsed.jsSrcs ?? []),
  faviconHref: parsed.faviconHref,
});

const safeJsonParse = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const readConfigFileIfExists = (filePath: string) => {
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(resolved)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(resolved, "utf8");
    return safeJsonParse(raw);
  } catch {
    return null;
  }
};

const normalizeBool = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string") return undefined;
  const raw = value.trim().toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return undefined;
};

const normalizeConfig = (input: unknown): SeoShellConfig => {
  if (!input || typeof input !== "object") {
    return {};
  }

  const obj = input as Record<string, unknown>;
  const cdnRaw = obj.cdn;
  const defaultsRaw = obj.defaults;

  const cdn: SeoShellCdnConfig | undefined =
    cdnRaw && typeof cdnRaw === "object"
      ? {
          baseUrl: (cdnRaw as Record<string, unknown>).baseUrl as
            | string
            | undefined,
          version: (cdnRaw as Record<string, unknown>).version as
            | string
            | undefined,
          manifestUrl: (cdnRaw as Record<string, unknown>).manifestUrl as
            | string
            | undefined,
          manifestFileName: (cdnRaw as Record<string, unknown>)
            .manifestFileName as string | undefined,
        }
      : undefined;

  const defaultNoIndex =
    defaultsRaw && typeof defaultsRaw === "object"
      ? normalizeBool((defaultsRaw as Record<string, unknown>).defaultNoIndex)
      : undefined;

  const defaults: SeoShellDefaults | undefined =
    typeof defaultNoIndex === "boolean" ? { defaultNoIndex } : undefined;

  return { cdn, defaults };
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
  const configFromString = process.env.SEO_SHELL_CONFIG?.trim();
  const configFromPath = process.env.SEO_SHELL_CONFIG_PATH?.trim();

  const parsedFromString = configFromString
    ? normalizeConfig(safeJsonParse(configFromString))
    : {};

  const parsedFromPath = configFromPath
    ? normalizeConfig(readConfigFileIfExists(configFromPath))
    : {};

  const defaultNoIndexEnv = normalizeBool(
    process.env.SEO_SHELL_DEFAULT_NO_INDEX
  );
  const defaultsEnv: SeoShellConfig =
    typeof defaultNoIndexEnv === "boolean"
      ? { defaults: { defaultNoIndex: defaultNoIndexEnv } }
      : {};

  const envConfig: SeoShellConfig = {
    cdn: {
      baseUrl: process.env.APP_CDN_BASE_URL?.trim() || undefined,
      version: process.env.APP_CDN_VERSION?.trim() || undefined,
      manifestUrl: process.env.APP_CDN_MANIFEST_URL?.trim() || undefined,
      manifestFileName: process.env.APP_CDN_MANIFEST_FILE?.trim() || undefined,
    },
  };

  const mergedOverride = mergeConfig(
    resolveConfig(configOverride),
    parsedFromPath
  );
  const mergedOverrideWithString = mergeConfig(
    mergedOverride,
    parsedFromString
  );
  const mergedWithEnv = mergeConfig(mergedOverrideWithString, envConfig);
  const mergedWithDefaults = mergeConfig(mergedWithEnv, defaultsEnv);

  const finalDefaults: SeoShellDefaults = {
    defaultNoIndex: mergedWithDefaults.defaults?.defaultNoIndex ?? true,
  };
  const finalCdn = mergedWithDefaults.cdn ?? {};

  return {
    cdn: {
      baseUrl: finalCdn.baseUrl?.trim() || undefined,
      version: finalCdn.version?.trim() || undefined,
      manifestUrl: finalCdn.manifestUrl?.trim() || undefined,
      manifestFileName: finalCdn.manifestFileName?.trim() || undefined,
    },
    defaults: finalDefaults,
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
  const manifestUrlFromEnv = config.cdn?.manifestUrl;
  const manifestFileName = config.cdn?.manifestFileName;

  const manifestUrl =
    manifestUrlFromEnv ||
    buildCdnManifestUrl({ baseUrl, version, manifestFileName }) ||
    null;

  if (typeof window === "undefined" && manifestUrl) {
    try {
      return await resolveCdnAssets({ manifestUrl, baseUrl });
    } catch {
      // ignore
    }
  }

  if (typeof window === "undefined") {
    try {
      const localPath = path.resolve(
        process.cwd(),
        "public",
        "web-assets.json"
      );
      if (fs.existsSync(localPath)) {
        const raw = fs.readFileSync(localPath, "utf8");
        const parsed = JSON.parse(raw) as CdnAssetsManifest;
        return parseLocalManifest(parsed);
      }
    } catch {
      // ignore
    }
  }

  const cssHrefs = (process.env.EXPO_WEB_CSS_HREFS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const jsSrcs = (process.env.EXPO_WEB_JS_SRCS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const faviconHref = process.env.EXPO_WEB_FAVICON_HREF?.trim() || undefined;

  return {
    cssHrefs: uniqueStrings(cssHrefs),
    jsSrcs: uniqueStrings(jsSrcs),
    faviconHref,
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
