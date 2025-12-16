import fs from "fs";
import path from "path";

import type {
  SitemapGeneratorConfig,
  SitemapGeneratorResult,
  GeneratedSitemap,
  SitemapEntry,
  RobotsConfig,
} from "./types";
import { buildUrlSetXml, buildSitemapIndexXml } from "./xml";
import { buildRobotsTxt } from "./robots";

type ProviderError = {
  groupName: string;
  message: string;
};

const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const writeFile = (filePath: string, content: string) => {
  fs.writeFileSync(filePath, content);
};

const isStale = (filePath: string, staleTimeMs: number): boolean => {
  if (!fs.existsSync(filePath)) {
    return true;
  }
  const stats = fs.statSync(filePath);
  const age = Date.now() - stats.mtimeMs;
  return age > staleTimeMs;
};

export const generateSitemaps = async (
  config: SitemapGeneratorConfig
): Promise<SitemapGeneratorResult> => {
  const {
    baseUrl,
    outputDir,
    sitemapGroups,
    robots = true,
    defaultPageSize = 30000,
    sitemapIndexPath = "sitemap.xml",
    sitemapSubdir = "seo",
    staleTimeMs,
  } = config;

  const sitemapIndexFullPath = path.resolve(outputDir, sitemapIndexPath);

  if (
    staleTimeMs !== undefined &&
    !isStale(sitemapIndexFullPath, staleTimeMs)
  ) {
    return {
      sitemaps: [],
      sitemapIndexPath,
      robotsPath: fs.existsSync(path.resolve(outputDir, "robots.txt"))
        ? "robots.txt"
        : null,
      skipped: true,
    };
  }

  const trimmedBaseUrl = baseUrl.replace(/\/+$/, "");
  const seoDir = path.resolve(outputDir, sitemapSubdir);
  ensureDir(seoDir);

  const generatedSitemaps: GeneratedSitemap[] = [];
  const sitemapIndexUrls: string[] = [];
  const providerErrors: ProviderError[] = [];

  for (const group of sitemapGroups) {
    const pageSize = group.pageSize ?? defaultPageSize;
    let result: { name: string; urls: SitemapEntry[] } | null = null;

    try {
      result = await group.provider();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      providerErrors.push({ groupName: group.name, message });
      continue;
    }

    const urls: SitemapEntry[] = result.urls;

    if (urls.length === 0) {
      continue;
    }

    const chunks = chunk(urls, pageSize);

    chunks.forEach((chunkUrls, idx) => {
      const fileName =
        chunks.length === 1
          ? `${result.name}.xml`
          : `${result.name}-${idx + 1}.xml`;

      const filePath = path.resolve(seoDir, fileName);
      const relativePath = `${sitemapSubdir}/${fileName}`;
      const publicUrl = `${trimmedBaseUrl}/${relativePath}`;

      writeFile(filePath, buildUrlSetXml(chunkUrls));

      generatedSitemaps.push({
        name: fileName,
        path: relativePath,
        urlCount: chunkUrls.length,
      });

      sitemapIndexUrls.push(publicUrl);
    });
  }

  if (providerErrors.length > 0) {
    const seoDir = path.resolve(outputDir, sitemapSubdir);
    const fileName = "__errors.xml";
    const filePath = path.resolve(seoDir, fileName);
    const relativePath = `${sitemapSubdir}/${fileName}`;
    const publicUrl = `${trimmedBaseUrl}/${relativePath}`;

    const now = new Date().toISOString();
    const urls: SitemapEntry[] = [
      { loc: trimmedBaseUrl, lastmod: now },
      ...providerErrors.map((e) => ({
        loc: `${trimmedBaseUrl}/__seo_shell_sitemap_error/${encodeURIComponent(
          `${e.groupName}:${e.message}`
        )}`,
        lastmod: now,
      })),
    ];

    writeFile(filePath, buildUrlSetXml(urls));

    generatedSitemaps.push({
      name: fileName,
      path: relativePath,
      urlCount: urls.length,
    });

    sitemapIndexUrls.push(publicUrl);

    console.error("[seo-shell] sitemap providers failed", providerErrors);
  }

  let finalSitemapIndexPath: string | null = null;
  const indexFullPath = path.resolve(outputDir, sitemapIndexPath);

  if (sitemapIndexUrls.length > 0) {
    writeFile(indexFullPath, buildSitemapIndexXml(sitemapIndexUrls));
    finalSitemapIndexPath = sitemapIndexPath;
  } else {
    const now = new Date().toISOString();
    const fallbackUrls: SitemapEntry[] = [
      { loc: trimmedBaseUrl, lastmod: now },
      ...providerErrors.map((e) => ({
        loc: `${trimmedBaseUrl}/__seo_shell_sitemap_error/${encodeURIComponent(
          `${e.groupName}:${e.message}`
        )}`,
        lastmod: now,
      })),
    ];

    writeFile(indexFullPath, buildUrlSetXml(fallbackUrls));
    finalSitemapIndexPath = sitemapIndexPath;
  }

  let robotsFullPath: string | null = null;
  if (robots) {
    const robotsConfig: RobotsConfig =
      typeof robots === "boolean"
        ? {
            sitemapUrl:
              sitemapIndexUrls.length > 0
                ? `${trimmedBaseUrl}/${sitemapIndexPath}`
                : undefined,
          }
        : {
            ...robots,
            sitemapUrl:
              robots.sitemapUrl ??
              (sitemapIndexUrls.length > 0
                ? `${trimmedBaseUrl}/${sitemapIndexPath}`
                : undefined),
          };

    robotsFullPath = path.resolve(outputDir, "robots.txt");
    writeFile(robotsFullPath, buildRobotsTxt(robotsConfig));
  }

  return {
    sitemaps: generatedSitemaps,
    sitemapIndexPath: finalSitemapIndexPath,
    robotsPath: robotsFullPath ? "robots.txt" : null,
    skipped: false,
  };
};
