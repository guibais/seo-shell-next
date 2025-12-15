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

  for (const group of sitemapGroups) {
    const pageSize = group.pageSize ?? defaultPageSize;
    const result = await group.provider();
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

  let finalSitemapIndexPath: string | null = null;
  if (sitemapIndexUrls.length > 0) {
    const indexFullPath = path.resolve(outputDir, sitemapIndexPath);
    writeFile(indexFullPath, buildSitemapIndexXml(sitemapIndexUrls));
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
