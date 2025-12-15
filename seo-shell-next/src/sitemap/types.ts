export type SitemapUrl = {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
};

export type SitemapEntry = string | SitemapUrl;

export type SitemapProviderResult = {
  name: string;
  urls: SitemapEntry[];
};

export type SitemapProvider = () =>
  | SitemapProviderResult
  | Promise<SitemapProviderResult>;

export type SitemapGroupConfig = {
  name: string;
  provider: SitemapProvider;
  pageSize?: number;
};

export type RobotsRule = {
  userAgent: string;
  allow?: string[];
  disallow?: string[];
};

export type RobotsConfig = {
  rules?: RobotsRule[];
  sitemapUrl?: string;
  additionalSitemaps?: string[];
  custom?: string;
};

export type SitemapGeneratorConfig = {
  baseUrl: string;
  outputDir: string;
  sitemapGroups: SitemapGroupConfig[];
  robots?: RobotsConfig | boolean;
  defaultPageSize?: number;
  sitemapIndexPath?: string;
  sitemapSubdir?: string;
  staleTimeMs?: number;
};

export type GeneratedSitemap = {
  name: string;
  path: string;
  urlCount: number;
};

export type SitemapGeneratorResult = {
  sitemaps: GeneratedSitemap[];
  sitemapIndexPath: string | null;
  robotsPath: string | null;
  skipped: boolean;
};
